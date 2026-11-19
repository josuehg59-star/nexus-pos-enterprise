import { create } from 'zustand';
import { db, type Product, type Ticket } from './database';
import { useSettings } from './useSettings';
import { notifyDataMutation } from './backup';
import { sendSaleToMaster } from './syncClient';
import { productIndex } from './productIndex';

export interface CartItem extends Product {
  cartQty: number;
}

/** Total de una línea del carrito aplicando la promoción del producto (si existe). */
export function lineTotal(item: { price: number; cartQty: number; promo_qty?: number; promo_price?: number }): number {
  const { price, cartQty, promo_qty, promo_price } = item;
  if (promo_qty && promo_qty > 0 && promo_price && promo_price > 0 && cartQty >= promo_qty) {
    if (promo_price >= price) {
      // Paquete: cada `promo_qty` piezas cuestan `promo_price` en total
      const bundles = Math.floor(cartQty / promo_qty);
      return bundles * promo_price + (cartQty - bundles * promo_qty) * price;
    }
    // Precio unitario de mayoreo al llegar a `promo_qty` piezas
    return promo_price * cartQty;
  }
  return price * cartQty;
}

/** Obtiene el prefijo de terminal para folios (C1, C2, C3, MOV...) */
export function getCajaPrefix(cajaNombre: string): string {
  const c = String(cajaNombre || '').toUpperCase();
  if (c.includes('MOVIL') || c.includes('MÓVIL') || c.includes('CELULAR') || c.includes('ANDROID')) return 'MOV';
  const m = c.match(/CAJA\s*(\d+)/);
  if (m) return `C${m[1]}`;
  if (c.includes('PRINCIPAL')) return 'C1';
  return 'C1';
}

/** Comprueba si el nombre de caja de un ticket coincide con la terminal objetivo */
export function matchCaja(ticketCaja: string | undefined, targetCaja: string): boolean {
  if (!targetCaja || targetCaja === 'TODAS' || targetCaja === 'TODAS LAS CAJAS' || targetCaja === 'GLOBAL') return true;
  const t = String(ticketCaja || '').trim().toUpperCase();
  const target = String(targetCaja).trim().toUpperCase();

  if (target.includes('PRINCIPAL') || target === 'CAJA 1') {
    if (!t) return true;
    return t.includes('PRINCIPAL') || /CAJA\s*1(?!\d)/.test(t) || t.startsWith('C1-');
  }

  if (target.includes('MOVIL') || target.includes('MÓVIL') || target.includes('CELULAR') || target.includes('ANDROID')) {
    return t.includes('MOVIL') || t.includes('MÓVIL') || t.includes('CELULAR') || t.includes('ANDROID');
  }

  const m = target.match(/CAJA\s*(\d+)/);
  if (m) {
    const num = m[1];
    return new RegExp(`CAJA\\s*${num}(?!\\d)`).test(t) || t.startsWith(`C${num}-`);
  }

  return t === target || t.includes(target);
}

const folioCache = new Map<string, number>();

/** Obtiene el siguiente folio consecutivo de forma ultra instantánea (< 1ms) sin bloquear la base de datos */
export async function getNextFolio(prefix: string, currentCaja: string): Promise<string> {
  let maxNum = folioCache.get(prefix) || 0;

  if (maxNum <= 0) {
    const lsVal = parseInt(localStorage.getItem(`nexus_max_folio_${prefix}`) || '0', 10);
    if (!isNaN(lsVal) && lsVal > 0) {
      maxNum = lsVal;
    }
  }

  // Comprobar con los últimos tickets recientes (máx 50) para verificar folios concurrentes
  try {
    const recent = await db.tickets.orderBy('date').reverse().limit(50).toArray();
    for (const t of recent) {
      const tFolio = String(t.folio || '').toUpperCase();
      if (tFolio.startsWith(`${prefix}-`) || matchCaja(t.caja, currentCaja)) {
        const raw = String(t.folio || '');
        const match = raw.match(/(\d+)$/);
        const n = match ? parseInt(match[1], 10) : (typeof t.folio === 'number' ? t.folio : 0);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    }
  } catch (e) {
    console.warn('Error leyendo folios recientes:', e);
  }

  // Fallback si maxNum es 0 (primera ejecución del sistema)
  if (maxNum === 0) {
    try {
      const recentAll = await db.tickets.orderBy('date').reverse().limit(300).toArray();
      for (const t of recentAll) {
        const raw = String(t.folio || '');
        const match = raw.match(/(\d+)$/);
        const n = match ? parseInt(match[1], 10) : (typeof t.folio === 'number' ? t.folio : 0);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    } catch {}
  }

  const nextNum = maxNum + 1;
  folioCache.set(prefix, nextNum);
  try {
    localStorage.setItem(`nexus_max_folio_${prefix}`, String(nextNum));
  } catch {}

  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

const sumCart = (cart: CartItem[]) => cart.reduce((s, i) => s + lineTotal(i), 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

interface PosState {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  restoreCart: (cart: CartItem[], total: number) => void;
  /** Devuelve el ticket creado, o null si falló (el motivo queda en lastError). */
  processSale: (
    paymentMethod: string, 
    clientName: string, 
    recibidoAmount?: number,
    mixtoDetails?: { efectivo: number; secundario: number; metodoSecundario: string }
  ) => Promise<Ticket | null>;
  lastError: string;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  sidebarOpen: false,
  lastError: '',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find(item => item.id === product.id);
    const newCart = existing
      ? cart.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item)
      : [...cart, { ...product, cartQty: 1 }];
    const subtotal = round2(sumCart(newCart));
    set({ cart: newCart, subtotal, total: subtotal });
  },

  removeFromCart: (productId) => {
    const newCart = get().cart.filter(item => item.id !== productId);
    const subtotal = round2(sumCart(newCart));
    set({ cart: newCart, subtotal, total: subtotal });
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const newCart = get().cart.map(item => item.id === productId ? { ...item, cartQty: qty } : item);
    const subtotal = round2(sumCart(newCart));
    set({ cart: newCart, subtotal, total: subtotal });
  },

  clearCart: () => set({ cart: [], subtotal: 0, tax: 0, total: 0 }),

  restoreCart: (cart) => {
    const subtotal = round2(sumCart(cart));
    set({ cart, subtotal, tax: 0, total: subtotal });
  },

  processSale: async (paymentMethod, clientName, recibidoAmount, mixtoDetails) => {
    const { cart, total, clearCart } = get();
    set({ lastError: '' });
    if (cart.length === 0) return null;

    try {
      let newTicket: Ticket | null = null;

      await db.transaction('rw', [db.tickets, db.products, db.kardex, db.clients], async () => {
        let clientObj = null;
        if (clientName !== 'PUBLICO GENERAL') {
          clientObj = await db.clients.where('name').equals(clientName).first();
        }

        if (paymentMethod === 'MONEDERO') {
          if (!clientObj) throw new Error('Selecciona un cliente para pagar con monedero.');
          if ((clientObj.monedero || 0) < total) {
            throw new Error(`Saldo de monedero insuficiente ($${(clientObj.monedero || 0).toFixed(2)}).`);
          }
        }
        if (paymentMethod === 'CRÉDITO' && !clientObj) {
          throw new Error('Selecciona un cliente para vender a crédito.');
        }

        const settingsState = useSettings.getState();
        const currentCaja = settingsState.cajaNombre || 'CAJA 1 - PRINCIPAL';
        const currentCajero = settingsState.activeUser?.name || 'ADMINISTRADOR';
        const prefix = getCajaPrefix(currentCaja);

        // Folio consecutivo individual por terminal en < 1ms
        const folio = await getNextFolio(prefix, currentCaja);

        const earned = paymentMethod === 'MONEDERO' || !clientObj ? 0 : round2(total * 0.01);
        const fechaISO = new Date().toISOString();
        
        let recVal = total;
        let camVal = 0;
        let mEfectivo: number | undefined = undefined;
        let mTarjeta: number | undefined = undefined;
        let mTransferencia: number | undefined = undefined;
        let mSecundario: string | undefined = undefined;

        if (paymentMethod === 'EFECTIVO') {
          recVal = (recibidoAmount !== undefined && !isNaN(recibidoAmount) && recibidoAmount > 0) ? recibidoAmount : total;
          camVal = Math.max(0, recVal - total);
        } else if (paymentMethod === 'MIXTO') {
          const efec = mixtoDetails ? round2(mixtoDetails.efectivo) : 0;
          const sec = mixtoDetails ? round2(mixtoDetails.secundario) : round2(total - efec);
          mSecundario = mixtoDetails?.metodoSecundario || 'TARJETA';
          mEfectivo = efec;
          if (mSecundario === 'TRANSFERENCIA') {
            mTransferencia = sec;
          } else {
            mTarjeta = sec;
          }
          // El recibidoAmount aquí representa lo que entregó el cliente en efectivo para pagar su parte en efectivo
          recVal = (recibidoAmount !== undefined && !isNaN(recibidoAmount) && recibidoAmount >= efec) ? recibidoAmount : efec;
          camVal = Math.max(0, recVal - efec);
        }

        newTicket = {
          id: crypto.randomUUID(),
          folio,
          date: fechaISO,
          total,
          recibido: recVal,
          cambio: camVal,
          monedero_earned: earned,
          paymentMethod,
          montoEfectivo: mEfectivo,
          montoTarjeta: mTarjeta,
          montoTransferencia: mTransferencia,
          metodoMixtoSecundario: mSecundario,
          items: cart.map(i => ({ ...i, lineTotal: lineTotal(i) })),
          synced: false,
          clientName,
          status: 'COMPLETADO',
          caja: currentCaja,
          cajero: currentCajero,
        };
        await db.tickets.add(newTicket);

        for (const item of cart) {
          if (!item.id || item.id < 0) continue; // recargas / servicios no llevan inventario
          const product = await db.products.get(item.id);
          if (!product) continue;

          let newStock = (product.stock || 0) - item.cartQty;

          // Auto-Conversión (Caja Padre -> Hijo) si el stock del hijo queda por debajo de 0
          const parentTarget = String(product.parent_sku || product.caja_padre || '').trim();
          const pzPerBox = Number(product.piezas_x_caja) || 0;
          if (newStock < 0 && parentTarget && pzPerBox > 0) {
            const targetUp = parentTarget.toUpperCase();
            const matchCode = (code: any) => String(code ?? '').toUpperCase().split(',').map(s => s.trim()).includes(targetUp);
            // El SKU puede estar guardado como texto o como número (importaciones de Excel)
            let parentProd = await db.products.where('sku').anyOf([parentTarget, ...(isNaN(Number(parentTarget)) ? [] : [Number(parentTarget)])] as any).first();
            if (!parentProd) {
              parentProd = await db.products.filter(p =>
                p.id !== product.id && (
                  String(p.sku ?? '').trim().toUpperCase() === targetUp ||
                  matchCode(p.barcode2) || matchCode(p.barcode3) ||
                  String(p.name || '').trim().toUpperCase() === targetUp
                )
              ).first();
            }

            const parentStock = Number(parentProd?.stock) || 0;
            if (parentProd && parentProd.id && parentProd.id !== product.id && parentStock > 0) {
              const neededPiezas = Math.abs(newStock);
              const boxesToBreak = Math.ceil(neededPiezas / pzPerBox);
              const actualBoxesToBreak = Math.min(Math.floor(parentStock), boxesToBreak);

              if (actualBoxesToBreak > 0) {
                // Descontar cajas del padre
                await db.products.update(parentProd.id, { stock: parentStock - actualBoxesToBreak });

                // Sumar piezas al hijo
                const addedPieces = actualBoxesToBreak * pzPerBox;
                newStock += addedPieces;

                // Registrar salida de la caja padre en Kardex
                await db.kardex.add({
                  tipo: 'SALIDA',
                  sku: parentProd.sku,
                  productName: parentProd.name,
                  cantidad: actualBoxesToBreak,
                  fecha: new Date().toLocaleString('es-MX'),
                  costo: parentProd.cost || 0,
                  precio: parentProd.price,
                  costoUnitario: parentProd.cost || 0,
                  precioVenta: parentProd.price,
                  total: (parentProd.cost || 0) * actualBoxesToBreak,
                  folio: `AUTO-CONV-${folio}`,
                  proveedor: `AUTO-CONVERSIÓN → ${product.name}`,
                  stockAnterior: parentStock,
                  stockNuevo: parentStock - actualBoxesToBreak,
                  detalles: `Se abrieron ${actualBoxesToBreak} caja(s) para ${product.name}`
                });

                // Registrar entrada de piezas al hijo en Kardex
                await db.kardex.add({
                  tipo: 'ENTRADA',
                  sku: product.sku,
                  productName: product.name,
                  cantidad: addedPieces,
                  fecha: new Date().toLocaleString('es-MX'),
                  costo: product.cost || 0,
                  precio: product.price,
                  costoUnitario: product.cost || 0,
                  precioVenta: product.price,
                  total: (product.cost || 0) * addedPieces,
                  folio: `AUTO-CONV-${folio}`,
                  proveedor: `AUTO-CONVERSIÓN (${parentProd.name})`
                });
              }
            }
          }

          const activeUser = useSettings.getState().activeUser?.name || 'ADMINISTRADOR';
          const cajaNombre = useSettings.getState().cajaNombre || 'CAJA 1 - PRINCIPAL';
          const oldStock = product.stock || 0;
          // Descontar inventario exactamente; si el stock estaba en 0 o menor, queda negativo para que al recibir entradas se compense con exactitud
          const finalStock = newStock;

          await db.products.update(item.id, { stock: finalStock });
          productIndex.updateStockInCache(item.id, finalStock);
          await db.kardex.add({
            tipo: 'SALIDA',
            sku: item.sku,
            productName: item.name,
            cantidad: item.cartQty,
            fecha: new Date().toLocaleString('es-MX'),
            costo: item.cost || 0,
            precio: item.price,
            costoUnitario: item.cost || 0,
            precioVenta: item.price,
            total: lineTotal(item),
            folio: `VTA-${folio}`,
            proveedor: String(item.supplier_id || (item as any).supplier || item.category || 'VENTA POS'),
            usuario: activeUser,
            caja: cajaNombre,
            stockAnterior: oldStock,
            stockNuevo: finalStock,
            detalles: `Venta Ticket #${folio} en ${cajaNombre}`
          });
        }

        if (clientObj?.id) {
          const monedero = (clientObj.monedero || 0) - (paymentMethod === 'MONEDERO' ? total : 0) + earned;
          const credito = (clientObj.credito || 0) + (paymentMethod === 'CRÉDITO' ? total : 0);
          await db.clients.update(clientObj.id, { monedero: round2(monedero), credito: round2(credito) });
        }
      });

      clearCart();
      notifyDataMutation();
      if (newTicket) {
        sendSaleToMaster(newTicket).catch(console.warn);
      }
      return newTicket;
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      set({ lastError: (error as Error).message || 'No se pudo procesar la venta.' });
      return null;
    }
  },
}));
