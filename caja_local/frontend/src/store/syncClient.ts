import { useSettings } from './useSettings';

export function getSyncServerBaseUrl(): string {
  const { rolCaja, servidorIp } = useSettings.getState();
  if (rolCaja === 'PRINCIPAL') {
    return 'http://127.0.0.1:3008';
  }
  let ip = (servidorIp || '').trim();
  if (!ip) return 'http://127.0.0.1:3008';
  if (ip.endsWith('/')) ip = ip.slice(0, -1);
  if (!ip.includes(':')) ip = `${ip}:3008`;
  return ip.startsWith('http') ? ip : `http://${ip}`;
}

/** Envía una venta realizada en esta caja al Servidor Maestro para descontar stock en red */
export async function sendSaleToMaster(ticket: any): Promise<boolean> {
  try {
    const baseUrl = getSyncServerBaseUrl();
    const { cajaNombre, activeUser } = useSettings.getState();
    const payload = {
      ...ticket,
      caja: ticket.caja || cajaNombre || 'CAJA 1 - PRINCIPAL',
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
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar venta al Maestro en vivo (modo offline local activo):', e);
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
      caja: cajaNombre || 'CAJA 1 - PRINCIPAL',
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
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar movimiento al Maestro (modo offline local activo):', e);
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
      caja: cajaNombre || 'CAJA 1 - PRINCIPAL',
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
      caja: cajaNombre || 'CAJA 1 - PRINCIPAL',
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
    return res.ok;
  } catch (e) {
    console.warn('⚠️ No se pudo enviar devolución al Maestro:', e);
    return false;
  }
}
