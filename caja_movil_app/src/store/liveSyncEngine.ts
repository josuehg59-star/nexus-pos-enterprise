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
  lastMessage: 'Inicializando conexión...',
  setOnline: (online, msg) => set((state) => ({ 
    isOnline: online, 
    lastMessage: msg !== undefined ? msg : (online ? 'Conectado a Caja 1' : 'Modo Offline'),
    lastSyncTime: online ? Date.now() : state.lastSyncTime 
  })),
  setPendingCount: (count) => set({ pendingOfflineCount: count })
}));

let syncIntervalTimer: any = null;
let isSyncing = false;

function getLastEventId(): number {
  try {
    const val = localStorage.getItem('nexus_last_sync_event_id');
    return val ? parseInt(val, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function setLastEventId(id: number) {
  try {
    localStorage.setItem('nexus_last_sync_event_id', String(id));
  } catch (e) {}
}

/** Ejecuta un ciclo de sincronización en tiempo real */
export async function runSyncCycle(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre } = useSettings.getState();
    const currentCajaName = cajaNombre || 'CAJA MÓVIL (CELULAR)';

    // 1. PING DE SALUD AL SERVIDOR CAJA 1 (TIMEOUT CORTO 3S)
    const pingController = new AbortController();
    const pingTimer = setTimeout(() => pingController.abort(), 3000);
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
      useLiveSyncStore.getState().setOnline(false, `Sin enlace con Caja 1 (${baseUrl.replace(/^https?:\/\//, '')})`);
      isSyncing = false;
      return;
    }

    useLiveSyncStore.getState().setOnline(true, `Enlace activo con Caja 1 (${baseUrl.replace(/^https?:\/\//, '')})`);

    // 2. ENVIAR VENTAS OFFLINE PENDIENTES HECHAS EN EL CELULAR
    let unsyncedTickets: any[] = [];
    try {
      unsyncedTickets = await db.tickets.filter(t => !t.synced).toArray();
      useLiveSyncStore.getState().setPendingCount(unsyncedTickets.length);
    } catch (e) {}

    if (unsyncedTickets.length > 0) {
      for (const t of unsyncedTickets) {
        const ok = await sendSaleToMaster(t);
        if (ok && t.id) {
          await db.tickets.update(t.id, { synced: true });
        }
      }
      const remaining = await db.tickets.filter(t => !t.synced).count();
      useLiveSyncStore.getState().setPendingCount(remaining);
    }

    // 3. RECIBIR EVENTOS DE INVENTARIO DESDE CAJA 1 / OTRAS CAJAS
    let lastId = getLastEventId();
    // Si es la primera vez que se sincroniza, alinearse con el último evento del servidor
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
          const items = evt.payload.items || evt.payload.cart || [];
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
        console.log('🔄 [LIVE SYNC MOVIL] Inventario actualizado en vivo por evento de Caja 1 / Red.');
        productIndex.init().catch(console.warn);
      }
    }
  } catch (err) {
    console.warn('⚠️ [LIVE SYNC MOVIL] Error en ciclo de sincronización:', err);
  } finally {
    isSyncing = false;
  }
}

/** Inicia el motor de sincronización continua en segundo plano (cada 3.5 segundos) */
export function startLiveSyncEngine(): () => void {
  if (syncIntervalTimer) clearInterval(syncIntervalTimer);

  // Ejecutar primer ciclo inmediatamente
  runSyncCycle().catch(console.warn);

  syncIntervalTimer = setInterval(() => {
    runSyncCycle().catch(console.warn);
  }, 3500);

  // Escuchar cuando la ventana vuelve a primer plano para reconectar al instante
  const handleFocus = () => runSyncCycle().catch(console.warn);
  const handleOnline = () => runSyncCycle().catch(console.warn);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('online', handleOnline);

  return () => {
    if (syncIntervalTimer) clearInterval(syncIntervalTimer);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('online', handleOnline);
  };
}
