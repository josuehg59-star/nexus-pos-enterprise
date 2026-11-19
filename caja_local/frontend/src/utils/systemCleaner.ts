/**
 * UTILIDAD DE LIMPIEZA Y PREPARACIÓN DE ENTREGA AL CLIENTE
 * NEXUS POS ENTERPRISE (PC y Móvil)
 * Desarrollado por Josue Hernandez Gutierrez (Tel: 961 276 5041)
 */

import { db } from '../store/database';
import { productIndex } from '../store/productIndex';

export interface CleanOptions {
  preserveCatalog: boolean; // Si es true, conserva los productos para el cliente
  resetLicenseForNewCustomer?: boolean; // Reinicia el periodo de prueba para el nuevo cliente
}

export async function cleanSystemForDelivery(options: CleanOptions = { preserveCatalog: true, resetLicenseForNewCustomer: true }): Promise<{ success: boolean; message: string; countCleared: number }> {
  try {
    let countCleared = 0;

    // 1. Limpiar historial de ventas y transacciones
    if (db.tickets) {
      countCleared += await db.tickets.count();
      await db.tickets.clear();
    }
    if (db.cortes) {
      await db.cortes.clear();
    }
    if (db.turnos) {
      await db.turnos.clear();
    }
    if (db.kardex) {
      await db.kardex.clear();
    }
    if (db.compras) {
      await db.compras.clear();
    }
    if (db.dailyCashEntries) {
      await db.dailyCashEntries.clear();
    }

    // 2. Limpiar ventas pausadas en localStorage
    localStorage.removeItem('pausedSales');
    localStorage.removeItem('nexus_last_folio');

    // 3. Si se solicita borrar catálogo por completo
    if (!options.preserveCatalog) {
      if (db.products) {
        await db.products.clear();
        await productIndex.init();
      }
      if (db.clients) {
        await db.clients.clear();
      }
      if (db.providers) {
        await db.providers.clear();
      }
    } else {
      // Si se conservan productos, restablecer saldos y monederos de clientes de prueba
      if (db.clients) {
        try {
          await db.clients.toCollection().modify((c: any) => {
            c.monedero = 0;
            if (c.balance !== undefined) c.balance = 0;
            if (c.debt !== undefined) c.debt = 0;
          });
        } catch (e) {
          // ignore
        }
      }
    }

    // 4. Reiniciar licencia para nuevo cliente (Inicia prueba de 15 días limpios)
    if (options.resetLicenseForNewCustomer) {
      localStorage.removeItem('nexus_pos_license_data');
      localStorage.removeItem('nexus_license_simulation_mode');
      localStorage.removeItem('nexus_josue_master_unlocked');
    }

    const msg = options.preserveCatalog
      ? '✅ ¡Sistema preparado exitosamente para entrega al cliente! Se limpiaron las ventas, turnos y cortes de prueba, manteniendo intacto el catálogo de productos.'
      : '✨ ¡Restablecimiento completo de fábrica realizado! La base de datos y catálogo están 100% limpios como recién instalado.';

    return {
      success: true,
      message: msg,
      countCleared
    };
  } catch (error: any) {
    console.error('Error al limpiar el sistema:', error);
    return {
      success: false,
      message: `❌ Error al limpiar: ${error.message || 'Error desconocido'}`,
      countCleared: 0
    };
  }
}
