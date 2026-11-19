import { useSettings } from './useSettings';
import { db } from './database';

export function getSyncServerBaseUrl(): string {
  // 1. Verificar si hay URL guardada en localStorage
  const savedUrl = localStorage.getItem('nexus_server_url');
  if (savedUrl && savedUrl.trim()) {
    let clean = savedUrl.trim();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean.startsWith('http') ? clean : `http://${clean}`;
  }

  // 2. Verificar servidorIp en useSettings
  const { servidorIp } = useSettings.getState();
  const ip = (servidorIp || '').trim();
  if (ip) {
    let clean = ip.endsWith('/') ? ip.slice(0, -1) : ip;
    if (!clean.includes(':')) clean = `${clean}:3008`;
    return clean.startsWith('http') ? clean : `http://${clean}`;
  }

  // 3. Si está en navegador con IP local
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3008`;
  }

  return 'http://192.168.100.38:3008';
}

/** Descarga catálogo completo desde el Servidor Maestro y actualiza la base de datos local db.products */
export async function downloadProductsFromMaster(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    console.log(`📡 [SYNC MOVIL] Conectando a ${baseUrl}/api/get-master-db...`);
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    
    let res = await fetch(`${baseUrl}/api/get-master-db`, { 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal 
    });
    clearTimeout(timer);

    if (!res.ok) {
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 8000);
      res = await fetch(`${baseUrl}/api/products`, { 
        headers: { 'Accept': 'application/json' },
        signal: controller2.signal 
      });
      clearTimeout(timer2);
    }

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const data = await res.json();

    const rawList = Array.isArray(data) ? data : (data.products || data.data || []);
    if (!Array.isArray(rawList)) throw new Error('Formato de datos no reconocido');

    if (rawList.length > 0) {
      await db.products.clear();
      await db.products.bulkPut(rawList.map((p: any) => ({
        ...p,
        id: p.id ? Number(p.id) : undefined,
        stock: p.stock !== undefined ? Number(p.stock) : 0,
        price: Number(p.price) || 0,
        cost: Number(p.cost) || 0
      })));
    }

    console.log(`✅ [SYNC MOVIL] Catálogo sincronizado: ${rawList.length} productos en db.products.`);
    return { success: true, count: rawList.length };
  } catch (err: any) {
    console.error('❌ [SYNC MOVIL] Error descargando productos:', err);
    return { success: false, count: 0, error: err.message || 'No se pudo conectar al Servidor Maestro' };
  }
}

/** Envía una venta realizada en el celular al Servidor Maestro para descontar stock en red */
export async function sendSaleToMaster(ticket: any): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, activeUser } = useSettings.getState();
    const payload = {
      ...ticket,
      caja: ticket.caja || cajaNombre || 'MÓVIL / CELULAR',
      cajero: ticket.cajero || activeUser?.name || 'ADMINISTRADOR',
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${baseUrl}/api/sync-sale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    console.log(`📤 [SYNC MOVIL] Venta enviada al Maestro (Folio: ${ticket.folio}): ${res.ok ? 'EXITO' : 'FALLO'}`);
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar venta al Maestro en vivo (modo offline activo):', e);
    return false;
  }
}

/** Envía un movimiento de inventario (Entrada/Compra, Merma, Devolución a proveedor) */
export async function sendMovementToMaster(movement: {
  tipo: 'ENTRADA' | 'SALIDA' | 'MERMA' | 'DEVOLUCION';
  folio: string;
  proveedor?: string;
  detalles?: string;
  items: Array<{
    id?: number;
    sku: string;
    name: string;
    qty: number;
    cost?: number;
    price?: number;
    ieps?: number;
    iva?: number;
  }>;
}): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, activeUser } = useSettings.getState();
    const payload = {
      ...movement,
      caja: cajaNombre || 'MÓVIL / CELULAR',
      usuario: activeUser?.name || 'ADMINISTRADOR',
      date: new Date().toISOString()
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${baseUrl}/api/sync-movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    console.log(`📤 [SYNC MOVIL] Movimiento enviado al Maestro (Tipo: ${movement.tipo}, Folio: ${movement.folio}): ${res.ok ? 'EXITO' : 'FALLO'}`);
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar movimiento al Maestro (modo offline activo):', e);
    return false;
  }
}

/** Envía un ajuste de conteo físico o auditoría al Servidor Maestro */
export async function sendAuditToMaster(audit: {
  folio: string;
  mode?: string;
  items: Array<{
    id?: number;
    sku: string;
    name: string;
    countedQty: number;
    stock: number;
  }>;
}): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, activeUser } = useSettings.getState();
    const payload = {
      ...audit,
      caja: cajaNombre || 'MÓVIL / CELULAR',
      usuario: activeUser?.name || 'ADMINISTRADOR',
      date: new Date().toISOString()
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${baseUrl}/api/sync-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    console.log(`📤 [SYNC MOVIL] Auditoría enviada al Maestro (Folio: ${audit.folio}): ${res.ok ? 'EXITO' : 'FALLO'}`);
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar auditoría al Maestro:', e);
    return false;
  }
}

/** Envía una devolución de venta / cancelación de ticket al Servidor Maestro para reintegrar stock */
export async function sendReturnToMaster(returnPayload: {
  ticketFolio?: string | number;
  esTotal: boolean;
  items: Array<{
    sku: string;
    name: string;
    qty: number;
    price?: number;
  }>;
}): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, activeUser } = useSettings.getState();
    const payload = {
      ...returnPayload,
      caja: cajaNombre || 'MÓVIL / CELULAR',
      usuario: activeUser?.name || 'ADMINISTRADOR'
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${baseUrl}/api/sync-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    console.log(`📤 [SYNC MOVIL] Devolución enviada al Maestro: ${res.ok ? 'EXITO' : 'FALLO'}`);
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar devolución al Maestro:', e);
    return false;
  }
}
