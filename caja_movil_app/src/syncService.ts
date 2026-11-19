import { db } from './store/database';
import { getSyncServerBaseUrl, downloadProductsFromMaster, sendSaleToMaster } from './store/syncClient';

// Lee la IP del servidor guardada o por defecto
export function getServerUrl(): string {
  return getSyncServerBaseUrl();
}

export function setServerUrl(url: string) {
  let clean = url.trim();
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  if (!clean.startsWith('http')) clean = `http://${clean}`;
  localStorage.setItem('nexus_server_url', clean);
  localStorage.setItem('nexus_servidorIp', clean.replace(/^https?:\/\//, ''));
}

// Sincroniza productos desde el servidor PC hacia el Móvil (directo a db.products)
export async function syncProductsFromPC(): Promise<{ success: boolean; count: number; error?: string }> {
  return await downloadProductsFromMaster();
}

// Envía ventas pendientes hechas en el celular hacia la PC
export async function pushSalesToPC(): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const allTickets = await db.tickets.toArray();
    const pendingSales = allTickets.filter(t => !t.synced);
    if (pendingSales.length === 0) return { success: true, synced: 0 };

    let count = 0;
    for (const ticket of pendingSales) {
      const ok = await sendSaleToMaster(ticket);
      if (ok) {
        if (ticket.id) {
          await db.tickets.update(ticket.id, { synced: true });
        }
        count++;
      }
    }

    return { success: true, synced: count };
  } catch (err: any) {
    console.error('Error enviando ventas a PC:', err);
    return { success: false, synced: 0, error: err.message };
  }
}
