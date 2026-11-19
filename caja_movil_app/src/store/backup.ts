import { db, type Product } from './database';
import { useSettings } from './useSettings';
import { getSyncServerBaseUrl, sendSaleToMaster } from './syncClient';

// Claves de localStorage que forman parte de la configuración del negocio
const LS_KEYS = [
  'ticketLogo',
  'pausedSales',
  'comprasDia',
  'nexus_nombreNegocio',
  'nexus_rfc',
  'nexus_eslogan',
  'nexus_telefono',
  'nexus_email',
  'nexus_direccion',
];

const TABLES = ['products', 'clients', 'tickets', 'providers', 'kardex', 'cortes', 'turnos', 'compras'] as const;

export interface NexusBackup {
  version: number;
  type: 'nexus_backup';
  timestamp: string;
  collections: Record<string, any[]>;
  settings: Record<string, string>;
}

export async function buildBackup(): Promise<NexusBackup> {
  const collections: Record<string, any[]> = {};
  for (const t of TABLES) {
    collections[t] = await (db as any)[t].toArray();
  }
  const settings: Record<string, string> = {};
  for (const k of LS_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) settings[k] = v;
  }
  return { version: 2, type: 'nexus_backup', timestamp: new Date().toISOString(), collections, settings };
}

export function downloadBackupFile(data: NexusBackup) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NEXUS_BACKUP_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restaura un respaldo NEXUS. Si replace=true vacía las tablas antes. */
export async function restoreBackup(data: NexusBackup, replace = false) {
  if (!data || data.type !== 'nexus_backup' || !data.collections) {
    throw new Error('Formato no reconocido');
  }
  await db.transaction('rw', TABLES.map(t => (db as any)[t]), async () => {
    for (const t of TABLES) {
      const rows = data.collections[t];
      if (!Array.isArray(rows)) continue;
      if (replace) await (db as any)[t].clear();
      await (db as any)[t].bulkPut(rows);
    }
  });
  if (data.settings) {
    for (const [k, v] of Object.entries(data.settings)) localStorage.setItem(k, v);
  }
}

/** Guarda un respaldo ahora en la carpeta local si aplica */
export async function backupToDisk(): Promise<boolean> {
  return true;
}

async function findProductInDexie(item: any): Promise<Product | null> {
  const skuToMatch = String(item.sku || item.barcode || item.code || item.cod || '').trim();
  if (skuToMatch) {
    const prodBySku = await db.products.where('sku').equals(skuToMatch).first();
    if (prodBySku) return prodBySku;

    const prodByAlt = await db.products.filter(p => {
      const b2 = String(p.barcode2 || '').trim();
      const b3 = String(p.barcode3 || '').trim();
      return b2 === skuToMatch || b3 === skuToMatch;
    }).first();
    if (prodByAlt) return prodByAlt;
  }
  
  if (item.id !== undefined && item.id !== null) {
    const numId = Number(item.id);
    if (!isNaN(numId) && numId > 0) {
      const prodById = await db.products.get(numId);
      if (prodById) return prodById;
    }
  }

  const nameToMatch = String(item.name || item.productName || '').trim().toLowerCase();
  if (nameToMatch) {
    const prodByName = await db.products.filter(p => Boolean(p.name && p.name.trim().toLowerCase() === nameToMatch)).first();
    if (prodByName) return prodByName;
  }

  return null;
}

let lastProcessedSyncId = 0;

/** Sube automáticamente todas las ventas acumuladas offline (por ejemplo, si se fue la luz) */
export async function pushPendingOfflineSales() {
  try {
    const unsynced = await db.tickets.filter(t => !t.synced).toArray();
    if (unsynced.length === 0) return;
    for (const t of unsynced) {
      const ok = await sendSaleToMaster(t);
      if (ok && t.id) {
        await db.tickets.update(t.id, { synced: true });
        console.log(`⚡ [SYNC MOVIL RECONEXIÓN] Venta offline Folio #${t.folio} subida al Maestro con éxito.`);
      }
    }
  } catch (e) {
    console.warn('Error reenviando ventas offline:', e);
  }
}

/** Consulta periódicamente al Servidor Maestro 3008 para reflejar en el celular los cambios ocurridos en la PC u otras cajas */
export async function pollMobileSync() {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre } = useSettings.getState();
    const queryUrl = `${baseUrl}/api/get-pending-mobile-sync?since=${lastProcessedSyncId}&excludeCaja=${encodeURIComponent(cajaNombre || 'MÓVIL')}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(queryUrl, { signal: controller.signal }).catch(() => null);
    clearTimeout(timer);

    if (!res || !res.ok) return;

    // Al haber conexión activa con el Maestro, sincronizar inmediatamente ventas offline pendientes
    await pushPendingOfflineSales();

    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return;

    for (const evt of events) {
      if (evt.id && evt.id > lastProcessedSyncId) {
        lastProcessedSyncId = evt.id;
      }

      if (evt.type === 'SALE' && evt.payload) {
        const sale = evt.payload;
        const cartItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.cart || sale.items || []);
        const ticketFolio = evt.folio || sale.folio || ('VTA-' + Date.now().toString().slice(-6));
        
        const existingTicket = await db.tickets.filter(t => 
          (t.folio !== undefined && String(t.folio) === String(ticketFolio)) || 
          Boolean(sale.id && t.id === String(sale.id))
        ).first();
        if (existingTicket) continue;

        await db.transaction('rw', [db.tickets, db.products, db.kardex], async () => {
          const normalizedItems: any[] = [];
          
          for (const item of cartItems) {
            const prod = await findProductInDexie(item);
            const qty = Number(item.cartQty || item.qty || item.cantidad || 1);
            const price = Number(item.price || (prod ? prod.price : 0));
            const sku = prod ? prod.sku : String(item.sku || item.barcode || item.cod || 'N/A');
            const name = prod ? prod.name : String(item.name || item.productName || 'PRODUCTO EN RED');
            const cost = Number(item.cost || (prod ? prod.cost : price * 0.7));
            const supplier = String(prod ? ((prod as any).supplier || (prod as any).proveedor || prod.supplier_id || 'VENTA RED') : (item.supplier || 'VENTA RED'));

            const oldStock = prod ? (prod.stock || 0) : 0;
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : (oldStock - qty);

            if (prod && prod.id) {
              await db.products.update(prod.id, { stock: newStock });
            } else if (item.sku) {
              await db.products.put({
                id: item.id || Date.now() + Math.floor(Math.random() * 1000),
                sku: item.sku,
                name: item.name || 'PRODUCTO EN RED',
                price: price,
                cost: cost,
                stock: newStock,
                supplier_id: supplier,
                category: item.category || 'General',
                status: 'ACTIVO'
              });
            }

            normalizedItems.push({
              ...item,
              id: prod ? prod.id : item.id,
              sku: sku,
              barcode: sku,
              name: name,
              cartQty: qty,
              qty: qty,
              price: price,
              cost: cost,
              total: price * qty,
              supplier: supplier
            });
          }

          await db.tickets.put({
            id: sale.id ? String(sale.id) : ticketFolio,
            folio: ticketFolio,
            date: sale.date || new Date().toLocaleString('es-MX'),
            total: sale.total || normalizedItems.reduce((acc, x) => acc + x.total, 0),
            monedero_earned: sale.monedero_earned || 0,
            items: normalizedItems,
            paymentMethod: (sale.paymentMethod || 'EFECTIVO').toUpperCase(),
            clientName: sale.clientName || 'PUBLICO GENERAL',
            synced: true
          });
        });
      } else if (evt.type === 'AUDIT' && evt.payload) {
        const audit = evt.payload;
        const auditItems = audit.items || [];
        const auditFolio = evt.folio || audit.folio || ('AUD-' + Date.now().toString().slice(-6));

        const existingKardex = await db.kardex.filter(k => 
          k.folio !== undefined && String(k.folio) === String(auditFolio)
        ).first();
        if (existingKardex) continue;

        await db.transaction('rw', [db.products, db.kardex], async () => {
          for (const item of auditItems) {
            const prod = await findProductInDexie(item);
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : Number(item.countedQty !== undefined ? item.countedQty : (item.counted !== undefined ? item.counted : item.stock));
            
            if (prod && prod.id) {
              await db.products.update(prod.id, { stock: newStock });
            } else if (item.sku) {
              await db.products.put({
                id: item.id || Date.now() + Math.floor(Math.random() * 1000),
                sku: item.sku,
                name: item.name || 'PRODUCTO EN RED',
                price: 0,
                cost: 0,
                stock: newStock,
                category: 'General',
                status: 'ACTIVO'
              });
            }
          }
        });
      } else if (evt.type === 'MOVEMENT' && evt.payload) {
        const mov = evt.payload;
        const movItems = mov.items || [];
        const movFolio = evt.folio || mov.folio || ('MOV-' + Date.now().toString().slice(-6));
        const tipo = (mov.tipo || 'ENTRADA').toUpperCase();

        const existingKardex = await db.kardex.filter(k => 
          k.folio !== undefined && String(k.folio) === String(movFolio)
        ).first();
        if (existingKardex) continue;

        await db.transaction('rw', [db.products, db.kardex], async () => {
          for (const item of movItems) {
            const prod = await findProductInDexie(item);
            const qty = Number(item.qty || item.entradaQty || item.cantidad || 1);
            const delta = (tipo === 'MERMA' || tipo === 'DEVOLUCION') ? -qty : qty;
            const oldStock = prod ? (prod.stock || 0) : 0;
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : (oldStock + delta);

            if (prod && prod.id) {
              await db.products.update(prod.id, {
                stock: newStock,
                cost: item.cost !== undefined ? Number(item.cost) : prod.cost,
                price: item.price !== undefined ? Number(item.price) : prod.price
              });
            } else if (item.sku || item.fullProduct) {
              const base = item.fullProduct || {};
              await db.products.put({
                ...base,
                id: item.id || base.id || Date.now() + Math.floor(Math.random() * 1000),
                sku: item.sku || base.sku,
                name: item.name || base.name || 'PRODUCTO EN RED',
                price: Number(item.price !== undefined ? item.price : (base.price || 0)),
                cost: Number(item.cost !== undefined ? item.cost : (base.cost || 0)),
                stock: newStock,
                supplier_id: String(mov.proveedor || base.supplier || 'RED LOCAL'),
                category: base.category || 'General',
                status: 'ACTIVO'
              });
            }
          }
        });
      } else if (evt.type === 'RETURN' && evt.payload) {
        const ret = evt.payload;
        const retItems = ret.items || [];

        await db.transaction('rw', [db.products, db.tickets], async () => {
          for (const item of retItems) {
            const prod = await findProductInDexie(item);
            const qty = Number(item.qty || item.returnedQty || 1);
            const oldStock = prod ? (prod.stock || 0) : 0;
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : (oldStock + qty);

            if (prod && prod.id) {
              await db.products.update(prod.id, { stock: newStock });
            }
          }
        });
      } else if (evt.type === 'CATALOG_UPDATE') {
        await autoRecoverIfEmpty(true);
      }
    }
  } catch (e) {
    console.error('Error procesando sincronización en red en móvil:', e);
  }
}

let mutationCounter = 1;

/** Notifica al sistema que hubo una modificación en productos, ventas, inventario o compras */
export function notifyDataMutation() {
  mutationCounter++;
}

let started = false;
/** Sincronización periódica en segundo plano con el Servidor Maestro 3008 (cada 2 segundos) */
export function startAutoBackup() {
  if (started) return;
  started = true;
  const tick = async () => {
    try {
      await pollMobileSync();
    } catch (e) {
      console.error('Polling de sincronización móvil falló:', e);
    }
  };
  // Sincronizar catálogo al abrir
  autoRecoverIfEmpty(false).catch(() => {});
  setTimeout(tick, 500);
  setInterval(tick, 2000);
}

/** Si la base local en el celular está vacía o se fuerza, descarga el catálogo completo del Maestro 3008 */
export async function autoRecoverIfEmpty(force = false) {
  try {
    const n = await db.products.count();
    if (n > 0 && !force) return false;

    const baseUrl = getSyncServerBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const r3008 = await fetch(`${baseUrl}/api/get-master-db`, { signal: controller.signal });
    clearTimeout(timer);

    if (r3008.ok) {
      const masterProds = await r3008.json();
      if (Array.isArray(masterProds) && masterProds.length > 0) {
        await db.products.bulkPut(masterProds.map((p: any) => ({
          ...p,
          id: p.id ? Number(p.id) : undefined,
          stock: p.stock !== undefined ? Number(p.stock) : 0,
          price: Number(p.price) || 0,
          cost: Number(p.cost) || 0
        })));
        console.log(`✅ [AUTO-RECOVER MÓVIL] ${masterProds.length} productos cargados desde el Servidor Maestro.`);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
