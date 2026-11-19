import { db } from './database';
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

async function postBackup(data: NexusBackup): Promise<boolean> {
  try {
    // 1. Guardar localmente en servidor Express o fallback
    await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});

    // 2. Guardar en Servidor Maestro de Sincronización Móvil (Puerto 3008) solo si es la Caja Principal
    const { rolCaja } = useSettings.getState();
    if (rolCaja === 'PRINCIPAL') {
      const prods = data.collections?.products || [];
      const r3008 = await fetch('http://127.0.0.1:3008/api/save-master-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: prods,
          tickets: data.collections?.tickets || [],
          kardex: data.collections?.kardex || [],
          providers: data.collections?.providers || [],
          clients: data.collections?.clients || [],
          compras: data.collections?.compras || [],
          cortes: data.collections?.cortes || [],
          turnos: data.collections?.turnos || [],
        }),
      }).catch(() => null);

      return !!(r3008 && r3008.ok);
    }
    return true;
  } catch {
    return false;
  }
}

/** Guarda un respaldo ahora en la carpeta Documentos\NEXUS RESPALDOS. */
export async function backupToDisk(): Promise<boolean> {
  return postBackup(await buildBackup());
}

async function findProductInDexie(item: any) {
  if (!item) return null;

  // 1. Por SKU exacto o alternos indexados (Prioridad #1 en red multi-caja)
  const rawSku = String(item.sku || item.barcode || item.cod || '').trim();
  if (rawSku) {
    const prodByExactSku = await db.products.where('sku').equals(rawSku).first();
    if (prodByExactSku) return prodByExactSku;

    const lower = rawSku.toLowerCase();
    const prodByFilter = await db.products.filter(p => {
      const s = String(p.sku || '').trim().toLowerCase();
      const b2 = String(p.barcode2 || '').trim().toLowerCase();
      const b3 = String(p.barcode3 || '').trim().toLowerCase();
      return s === lower || Boolean(b2 && b2.includes(lower)) || Boolean(b3 && b3.includes(lower));
    }).first();
    if (prodByFilter) return prodByFilter;
  }

  // 2. Por Nombre del producto
  const nameToMatch = String(item.name || item.productName || '').trim().toLowerCase();
  if (nameToMatch) {
    const prodByName = await db.products.filter(p => Boolean(p.name && p.name.trim().toLowerCase() === nameToMatch)).first();
    if (prodByName) return prodByName;
  }

  // 3. Fallback por ID numérico local
  if (item.id !== undefined && item.id !== null) {
    const numId = Number(item.id);
    if (!isNaN(numId) && numId > 0) {
      const prodById = await db.products.get(numId);
      if (prodById) return prodById;
    }
  }

  return null;
}

let lastProcessedEventId = 0;

/** Sube automáticamente todas las ventas acumuladas offline (por ejemplo, si se fue la luz en la red) */
export async function pushPendingOfflineSales() {
  try {
    const { rolCaja } = useSettings.getState();
    if (rolCaja === 'PRINCIPAL') return; // En Caja 1 las ventas son locales del servidor maestro
    const unsynced = await db.tickets.filter(t => !t.synced).toArray();
    if (unsynced.length === 0) return;
    for (const t of unsynced) {
      const ok = await sendSaleToMaster(t);
      if (ok && t.id) {
        await db.tickets.update(t.id, { synced: true });
        console.log(`⚡ [SYNC SATELITE RECONEXIÓN] Venta offline Folio #${t.folio} subida al Maestro.`);
      }
    }
  } catch (e) {
    console.warn('Error reenviando ventas offline en satélite:', e);
  }
}

async function pollMobileSync() {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre } = useSettings.getState();
    const excludeParam = encodeURIComponent(cajaNombre || '');
    const url = `${baseUrl}/api/get-pending-mobile-sync?since=${lastProcessedEventId}&excludeCaja=${excludeParam}`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) return;

    // Al haber conexión activa con el Maestro, sincronizar inmediatamente ventas offline pendientes
    await pushPendingOfflineSales();

    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) return;

    for (const evt of events) {
      if (evt.id && evt.id > lastProcessedEventId) {
        lastProcessedEventId = evt.id;
      }

      if (evt.type === 'SALE' && evt.payload) {
        const sale = evt.payload;
        const cartItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.cart || sale.items || []);
        const ticketFolio = evt.folio || sale.folio || ('VTA-MOV-' + Date.now().toString().slice(-6));
        
        // Verificar si este ticket ya fue procesado en la PC para evitar duplicar descuentos (lookup indexado < 1ms)
        const existingTicket = sale.id 
          ? await db.tickets.get(String(sale.id))
          : await db.tickets.where('folio').equals(ticketFolio).first();
        if (existingTicket) {
          continue;
        }

        await db.transaction('rw', [db.tickets, db.products, db.kardex], async () => {
          const normalizedItems: any[] = [];
          
          for (const item of cartItems) {
            const prod = await findProductInDexie(item);
            const qty = Number(item.cartQty || item.qty || item.cantidad || 1);
            const price = Number(item.price || (prod ? prod.price : 0));
            const sku = prod ? prod.sku : String(item.sku || item.barcode || item.cod || 'N/A');
            const name = prod ? prod.name : String(item.name || item.productName || 'PRODUCTO EN RED');
            const cost = Number(item.cost || (prod ? prod.cost : price * 0.7));
            const supplier = String(prod ? ((prod as any).supplier || (prod as any).proveedor || prod.supplier_id || 'VENTA EN RED') : (item.supplier || 'VENTA EN RED'));

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

            await db.kardex.add({
              fecha: sale.date ? new Date(sale.date).toLocaleString('es-MX') : new Date().toLocaleString('es-MX'),
              tipo: 'SALIDA',
              sku: sku,
              productName: `${name} (VENTA ${evt.sourceCaja || 'RED'})`,
              cantidad: qty,
              costo: cost,
              precio: price,
              total: price * qty,
              folio: ticketFolio,
              proveedor: supplier,
              stockAnterior: oldStock,
              stockNuevo: newStock,
              detalles: `Venta sincronizada desde ${evt.sourceCaja || 'otra terminal'} (Folio #${ticketFolio})`
            });

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
            synced: true,
            caja: evt.sourceCaja || sale.caja || 'CAJA REMOTA',
            cajero: sale.cajero || 'CAJERO REMOTO'
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
            const sku = prod ? prod.sku : String(item.sku || item.barcode || 'N/A');
            const name = prod ? prod.name : String(item.name || item.productName || 'PRODUCTO EN RED');
            const oldStock = prod ? (prod.stock || 0) : 0;
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : Number(item.countedQty !== undefined ? item.countedQty : (item.counted !== undefined ? item.counted : item.stock));
            const diff = newStock - oldStock;
            
            if (prod && prod.id) {
              await db.products.update(prod.id, { stock: newStock });
            } else if (item.sku) {
              await db.products.put({
                id: item.id || Date.now() + Math.floor(Math.random() * 1000),
                sku: item.sku,
                name: item.name || 'PRODUCTO EN RED',
                price: Number(item.price || 0),
                cost: Number(item.cost || 0),
                stock: newStock,
                category: 'General',
                status: 'ACTIVO'
              });
            }

            if (diff !== 0) {
              await db.kardex.add({
                fecha: audit.date ? new Date(audit.date).toLocaleString('es-MX') : new Date().toLocaleString('es-MX'),
                tipo: diff > 0 ? 'ENTRADA' : 'MERMA',
                sku: sku,
                productName: `${name} (${diff > 0 ? 'ALTA' : 'BAJA'} AUDITORÍA ${evt.sourceCaja || 'RED'})`,
                cantidad: Math.abs(diff),
                costo: prod ? prod.cost || 0 : 0,
                precio: prod ? prod.price || 0 : 0,
                total: Math.abs(diff) * (prod ? prod.cost || 0 : 0),
                folio: auditFolio,
                proveedor: 'CONTEO FÍSICO AUDITORÍA',
                stockAnterior: oldStock,
                stockNuevo: newStock,
                detalles: `Auditoría sincronizada desde ${evt.sourceCaja || 'otra terminal'}`
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

            await db.kardex.add({
              fecha: mov.date ? new Date(mov.date).toLocaleString('es-MX') : new Date().toLocaleString('es-MX'),
              tipo: tipo,
              sku: item.sku || (prod ? prod.sku : 'N/A'),
              productName: `${item.name || (prod ? prod.name : 'PRODUCTO')} (${tipo} DESDE ${evt.sourceCaja || 'RED'})`,
              cantidad: qty,
              costo: item.cost || (prod ? prod.cost : 0) || 0,
              precio: item.price || (prod ? prod.price : 0) || 0,
              total: qty * (item.cost || (prod ? prod.cost : 0) || 0),
              folio: movFolio,
              proveedor: mov.proveedor || 'RED LOCAL',
              stockAnterior: oldStock,
              stockNuevo: newStock,
              detalles: mov.detalles || `${tipo} sincronizado desde ${evt.sourceCaja || 'otra terminal'}`
            });
          }
        });
      } else if (evt.type === 'RETURN' && evt.payload) {
        const ret = evt.payload;
        const retItems = ret.items || [];
        const retFolio = evt.folio || (`DEV-${ret.ticketFolio || Date.now()}`);

        const existingKardex = await db.kardex.filter(k => 
          k.folio !== undefined && String(k.folio) === String(retFolio)
        ).first();
        if (existingKardex) continue;

        await db.transaction('rw', [db.products, db.kardex, db.tickets], async () => {
          for (const item of retItems) {
            const prod = await findProductInDexie(item);
            const qty = Number(item.qty || item.returnedQty || 1);
            const oldStock = prod ? (prod.stock || 0) : 0;
            const newStock = item.resultingStock !== undefined
              ? Number(item.resultingStock)
              : (oldStock + qty);

            if (prod && prod.id) {
              await db.products.update(prod.id, { stock: newStock });

              await db.kardex.add({
                fecha: new Date().toLocaleString('es-MX'),
                tipo: 'DEVOLUCION',
                sku: prod.sku,
                productName: `${prod.name} (DEVOLUCIÓN ${evt.sourceCaja || 'RED'})`,
                cantidad: qty,
                costo: prod.cost || 0,
                precio: item.price || prod.price || 0,
                total: qty * (item.price || prod.price || 0),
                folio: retFolio,
                proveedor: 'DEVOLUCIÓN DE CLIENTE',
                stockAnterior: oldStock,
                stockNuevo: newStock,
                detalles: `Devolución de ticket #${ret.ticketFolio} sincronizada desde ${evt.sourceCaja || 'otra terminal'}`
              });
            }
          }
          if (ret.ticketFolio) {
            const tk = await db.tickets.filter(t => 
              t.folio !== undefined && String(t.folio) === String(ret.ticketFolio)
            ).first();
            if (tk && tk.id !== undefined) {
              await db.tickets.update(tk.id, { status: ret.esTotal ? 'DEVUELTO' : 'DEV. PARCIAL' });
            }
          }
        });
      } else if (evt.type === 'CATALOG_UPDATE') {
        await syncCatalogFromMaster(true);
      }
    }
  } catch (e) {
    console.error('Error procesando sincronización en red:', e);
  }
}

/** Sincroniza el catálogo completo de productos con el Servidor Maestro 3008 para que existencias y negativos cuadren al 100% */
export async function syncCatalogFromMaster(force = false): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { rolCaja } = useSettings.getState();
    // En Caja 1 Principal, no sobreescribir su propio Dexie a menos que esté vacío o se fuerce
    if (rolCaja === 'PRINCIPAL' && !force) {
      const count = await db.products.count();
      if (count > 0) return true;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${baseUrl}/api/get-master-db`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const prods = await res.json();
    if (Array.isArray(prods) && prods.length > 0) {
      await db.products.bulkPut(prods.map((p: any) => ({
        ...p,
        id: p.id ? Number(p.id) : undefined,
        stock: p.stock !== undefined ? Number(p.stock) : 0,
        price: Number(p.price) || 0,
        cost: Number(p.cost) || 0
      })));
      console.log(`✅ [CATÁLOGO SINCRONIZADO] ${prods.length} productos alineados al 100% con Servidor Maestro.`);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('No se pudo sincronizar catálogo con Servidor Maestro:', e);
    return false;
  }
}

let mutationCounter = 1;
let backupDebounceTimer: any = null;

/** Notifica al sistema que hubo una modificación en productos, ventas, inventario o compras sin congelar la venta */
export function notifyDataMutation(immediate = false) {
  mutationCounter++;
  if (immediate) {
    backupToDisk().catch(() => {});
    return;
  }
  // Debounce para asegurar que el punto de venta y escaneo respondan al 100% de velocidad sin pausas
  if (backupDebounceTimer) clearTimeout(backupDebounceTimer);
  backupDebounceTimer = setTimeout(() => {
    backupToDisk().catch(() => {});
  }, 15000); // 15 segundos de inactividad antes de procesar el JSON pesado en disco
}

async function fingerprint(): Promise<string> {
  const parts: number[] = [mutationCounter];
  for (const t of TABLES) parts.push(await (db as any)[t].count());
  return parts.join('-') + '|' + (localStorage.getItem('nexus_nombreNegocio') ?? '');
}

let started = false;
/** Respaldo automático e integración con Servidor 3008 (polling cada 2s para sincronización instantánea). */
export function startAutoBackup() {
  if (started) return;
  started = true;
  let last = '';
  const tick = async () => {
    try {
      await pollMobileSync();
      const fp = await fingerprint();
      if (fp === last) return;
      if (await backupToDisk()) last = fp;
    } catch (e) {
      console.error('Auto-respaldo falló', e);
    }
  };
  // Alinear catálogo completo inmediatamente si es caja secundaria / satélite
  syncCatalogFromMaster().catch(() => {});
  setTimeout(tick, 500);
  setInterval(tick, 2000);
}

/** Si la base local está vacía y existe un respaldo en disco o en Servidor 3008, lo restaura automáticamente. */
export async function autoRecoverIfEmpty() {
  try {
    const n = (await db.products.count()) + (await db.tickets.count()) + (await db.clients.count());
    if (n > 0) return false;

    // 1. Intentar restaurar desde Servidor Maestro 3008 (vía IP configurada o localhost)
    try {
      const baseUrl = getSyncServerBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const r3008 = await fetch(`${baseUrl}/api/get-master-db`, { signal: controller.signal }).catch(() => null);
      clearTimeout(timer);
      if (r3008 && r3008.ok) {
        const masterProds = await r3008.json();
        if (Array.isArray(masterProds) && masterProds.length > 0) {
          await db.products.bulkPut(masterProds);
          console.log(`[RECOVER] ${masterProds.length} productos restaurados desde Servidor Maestro 3008.`);
          return true;
        }
      }
    } catch {}

    // 2. Intentar restaurar desde API de respaldo Express si existe
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const r = await fetch('/api/backup/latest', { signal: controller.signal }).catch(() => null);
      clearTimeout(timer);
      if (r && r.ok) {
        const data = await r.json();
        await restoreBackup(data, false);
        return true;
      }
    } catch {}

    return false;
  } catch {
    return false;
  }
}
