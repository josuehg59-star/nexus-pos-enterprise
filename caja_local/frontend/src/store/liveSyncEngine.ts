import { create } from 'zustand';
import { db } from './database';
import { useSettings } from './useSettings';
import { getSyncServerBaseUrl, sendSaleToMaster } from './syncClient';
import { productIndex } from './productIndex';

export interface LiveSyncState {
  isOnline: boolean;
  serverUrl: string;
  lastSyncTime: number;
  pendingOfflineCount: number;
  lastMessage: string;
  setOnline: (online: boolean, msg?: string) => void;
  setPendingCount: (count: number) => void;
}

export const useLiveSyncStore = create<LiveSyncState>((set) => ({
  isOnline: false,
  serverUrl: '',
  lastSyncTime: 0,
  pendingOfflineCount: 0,
  lastMessage: 'Inicializando red...',
  setOnline: (online, msg) => set((state) => ({ 
    isOnline: online, 
    lastMessage: msg !== undefined ? msg : (online ? 'Servidor 3008 Activo' : 'Modo Local'),
    lastSyncTime: online ? Date.now() : state.lastSyncTime 
  })),
  setPendingCount: (count) => set({ pendingOfflineCount: count })
}));

let syncIntervalTimer: any = null;
let isSyncing = false;

function getLastEventId(): number {
  try {
    const val = localStorage.getItem('nexus_pc_last_sync_event_id');
    return val ? parseInt(val, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function setLastEventId(id: number) {
  try {
    localStorage.setItem('nexus_pc_last_sync_event_id', String(id));
  } catch (e) {}
}

/** Ejecuta un ciclo de sincronización en la PC */
export async function runPcSyncCycle(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, rolCaja } = useSettings.getState();
    const currentCajaName = cajaNombre || (rolCaja === 'PRINCIPAL' ? 'CAJA 1 - PRINCIPAL' : 'CAJA SECUNDARIA');

    // 1. PING DE SALUD AL SERVIDOR (PUERTO 3008)
    const pingController = new AbortController();
    const pingTimer = setTimeout(() => pingController.abort(), 2500);
    let pingOk = false;
    let latestServerEventId = 0;

    try {
      const pingRes = await fetch(`${baseUrl}/api/ping`, { signal: pingController.signal });
      clearTimeout(pingTimer);
      if (pingRes.ok) {
        const pingData = await pingRes.json().catch(() => ({}));
        pingOk = true;
        latestServerEventId = Number(pingData.latestEventId) || 0;
      }
    } catch (e) {
      clearTimeout(pingTimer);
    }

    if (!pingOk) {
      useLiveSyncStore.getState().setOnline(false, `Servidor ${baseUrl.replace(/^https?:\/\//, '')} desconectado`);
      isSyncing = false;
      return;
    }

    useLiveSyncStore.getState().setOnline(true, `Enlace red multi-caja activo (:3008)`);

    // 2. RECIBIR EVENTOS DE VENTAS HECHAS EN CELULAR O CAJAS SECUNDARIAS
    let lastId = getLastEventId();
    if (lastId === 0 && latestServerEventId > 0) {
      setLastEventId(latestServerEventId);
      lastId = latestServerEventId;
    }

    const eventsUrl = `${baseUrl}/api/get-pending-mobile-sync?since=${lastId}&excludeCaja=${encodeURIComponent(currentCajaName)}`;
    const evtController = new AbortController();
    const evtTimer = setTimeout(() => evtController.abort(), 4000);

    let rawData: any = null;
    try {
      const evtRes = await fetch(eventsUrl, { signal: evtController.signal });
      clearTimeout(evtTimer);
      if (evtRes.ok) {
        rawData = await evtRes.json();
      }
    } catch (e) {
      clearTimeout(evtTimer);
    }

    if (rawData) {
      const eventList: any[] = Array.isArray(rawData) ? rawData : (rawData.events || []);
      let inventoryChanged = false;

      for (const evt of eventList) {
        if (!evt || !evt.type) continue;

        if (evt.type === 'SALE' && evt.payload) {
          const sale = evt.payload;
          const items = sale.items || sale.cart || [];

          // 1. Descontar stock en el inventario local de la PC
          for (const item of items) {
            const sku = item.sku || item.barcode;
            if (!sku) continue;

            const prod = await db.products.where('sku').equals(sku).first();
            if (prod && prod.id) {
              const targetStock = item.resultingStock !== undefined 
                ? Number(item.resultingStock) 
                : ((prod.stock || 0) - (Number(item.cartQty || item.qty || 1)));
              await db.products.update(prod.id, { stock: targetStock });
              inventoryChanged = true;
            }
          }

          // 2. Si la PC es la Caja Principal, registrar el ticket en el historial central si no existe
          if (rolCaja === 'PRINCIPAL' && sale.folio) {
            const existingTicket = await db.tickets.where('folio').equals(sale.folio).first();
            if (!existingTicket) {
              await db.tickets.add({
                ...sale,
                caja: evt.sourceCaja || sale.caja || 'CAJA MÓVIL (CELULAR)',
                synced: true,
              });
            }

            // Kardex salida para reportes y auditoría
            for (const item of items) {
              const kardexFolio = String(sale.folio).startsWith('VTA-') ? sale.folio : `VTA-${sale.folio}`;
              const sku = item.sku || item.barcode || 'N/A';
              const existingK = await db.kardex.where('folio').equals(kardexFolio).filter(k => k.sku === sku).first();
              if (!existingK) {
                const qty = Number(item.cartQty || item.qty || 1);
                const price = Number(item.price || 0);
                await db.kardex.add({
                  fecha: sale.date || new Date().toISOString(),
                  sku: sku,
                  productName: item.name || 'PRODUCTO MÓVIL',
                  tipo: 'SALIDA',
                  detalles: `VENTA EN ${evt.sourceCaja || 'CAJA MÓVIL'} (FOLIO #${sale.folio})`,
                  cantidad: qty,
                  folio: kardexFolio,
                  usuario: sale.cajero || sale.usuario || 'CAJERO MÓVIL',
                  caja: evt.sourceCaja || 'CAJA MÓVIL (CELULAR)',
                  stockAnterior: item.resultingStock !== undefined ? item.resultingStock + qty : 0,
                  stockNuevo: item.resultingStock !== undefined ? item.resultingStock : 0,
                  precioVenta: price,
                  total: price * qty,
                  proveedor: item.supplier || 'VENTA MÓVIL'
                });
              }
            }
          }
        } else if (evt.type === 'MOVEMENT' && evt.payload) {
          const items = evt.payload.items || [];
          for (const item of items) {
            const sku = item.sku || item.barcode;
            if (!sku) continue;
            const prod = await db.products.where('sku').equals(sku).first();
            if (prod && prod.id && item.resultingStock !== undefined) {
              await db.products.update(prod.id, { stock: Number(item.resultingStock) });
              inventoryChanged = true;
            }
          }
        } else if (evt.type === 'AUDIT' && evt.payload) {
          const items = evt.payload.items || [];
          for (const item of items) {
            const sku = item.sku;
            if (!sku) continue;
            const prod = await db.products.where('sku').equals(sku).first();
            if (prod && prod.id && item.countedQty !== undefined) {
              await db.products.update(prod.id, { stock: Number(item.countedQty) });
              inventoryChanged = true;
            }
          }
        } else if (evt.type === 'RETURN' && evt.payload) {
          const items = evt.payload.items || [];
          for (const item of items) {
            const sku = item.sku;
            if (!sku) continue;
            const prod = await db.products.where('sku').equals(sku).first();
            if (prod && prod.id) {
              const newStock = (prod.stock || 0) + Number(item.qty || 1);
              await db.products.update(prod.id, { stock: newStock });
              inventoryChanged = true;
            }
          }
        }

        if (evt.id && evt.id > lastId) {
          lastId = evt.id;
        }
      }

      setLastEventId(lastId);

      if (inventoryChanged) {
        console.log('🔄 [LIVE SYNC PC] Inventario actualizado por venta externa (Celular / Terminal Satélite).');
        productIndex.init().catch(console.warn);
      }
    }
  } catch (err) {
    console.warn('⚠️ [LIVE SYNC PC] Error en ciclo de sincronización:', err);
  } finally {
    isSyncing = false;
  }
}

/** Inicia el motor de sincronización de la PC */
export function startPcLiveSyncEngine(): () => void {
  if (syncIntervalTimer) clearInterval(syncIntervalTimer);

  runPcSyncCycle().catch(console.warn);

  syncIntervalTimer = setInterval(() => {
    runPcSyncCycle().catch(console.warn);
  }, 3000);

  const handleFocus = () => runPcSyncCycle().catch(console.warn);
  window.addEventListener('focus', handleFocus);

  return () => {
    if (syncIntervalTimer) clearInterval(syncIntervalTimer);
    window.removeEventListener('focus', handleFocus);
  };
}
