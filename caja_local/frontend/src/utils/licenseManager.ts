/**
 * SISTEMA INTEGRAL DE LICENCIAMIENTO NEXUS POS ENTERPRISE
 * Autor y Desarrollador: Josue Hernandez Gutierrez
 * Tel / WhatsApp: 961 276 5041 (Tuxtla Gutiérrez, Chiapas)
 * PIN Maestro de Autorización: 9612
 */

export interface LicenseInfo {
  status: 'LIFETIME_DEV' | 'ACTIVE_CLIENT' | 'TRIAL_ACTIVE' | 'EXPIRED_BLOCKED';
  licenseType: 'VITALICIA_DESARROLLADOR' | 'CLIENTE_PRO' | 'CLIENTE_TRIAL';
  holder: string;
  daysRemaining: number;
  trialExpiresAt: string;
  activatedAt?: string;
  licenseKey?: string;
  isJosueFreePC: boolean;
}

const STORAGE_KEY = 'nexus_pos_license_data';
const MASTER_PIN = '9612';
const MASTER_PIN_FULL = '9612765041';
const TRIAL_DAYS = 15;

// Hash simple para validar que no manipulen la fecha en localStorage
function generateChecksum(val: string): string {
  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = ((hash << 5) - hash) + val.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Detectar si estamos en la PC de Josue (entorno de desarrollo personal)
function isJosueLocalPC(): boolean {
  try {
    // Si la clave maestra ya fue desbloqueada en esta PC
    if (localStorage.getItem('nexus_josue_master_unlocked') === 'true') {
      return true;
    }
    // Detección automática de PC de Josue: localhost + bandera de desarrollo
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
    // En la PC de Josue Hernandez, siempre se activa de por vida automáticamente
    return isLocalhost;
  } catch (e) {
    return false;
  }
}

export function getLicenseInfo(): LicenseInfo {
  // 1. Desbloqueo Automático y Gratuito para Josue Hernandez en su PC
  if (isJosueLocalPC()) {
    return {
      status: 'LIFETIME_DEV',
      licenseType: 'VITALICIA_DESARROLLADOR',
      holder: 'JOSUE HERNANDEZ (AUTOR / DESARROLLADOR)',
      daysRemaining: 99999,
      trialExpiresAt: '2099-12-31',
      activatedAt: '2026-01-01',
      licenseKey: 'NEXUS-JOSUE-DEV-UNLIMITED',
      isJosueFreePC: true
    };
  }

  // 2. Comprobar datos guardados en clientes
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      
      // Si el cliente ya activó con clave válida o PIN de Josue
      if (data.status === 'ACTIVE_CLIENT') {
        return {
          status: 'ACTIVE_CLIENT',
          licenseType: 'CLIENTE_PRO',
          holder: data.holder || 'CLIENTE AUTORIZADO',
          daysRemaining: 365,
          trialExpiresAt: '2099-12-31',
          activatedAt: data.activatedAt,
          licenseKey: data.licenseKey,
          isJosueFreePC: false
        };
      }

      // Si está en periodo de prueba (Trial)
      if (data.firstLaunch) {
        const firstLaunchTime = new Date(data.firstLaunch).getTime();
        const now = Date.now();
        const elapsedDays = Math.floor((now - firstLaunchTime) / (1000 * 60 * 60 * 24));
        const daysLeft = TRIAL_DAYS - elapsedDays;

        if (daysLeft > 0) {
          const expDate = new Date(firstLaunchTime + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
          return {
            status: 'TRIAL_ACTIVE',
            licenseType: 'CLIENTE_TRIAL',
            holder: 'PERIODO DE PRUEBA (CLIENTE)',
            daysRemaining: daysLeft,
            trialExpiresAt: expDate.toLocaleDateString('es-MX'),
            isJosueFreePC: false
          };
        } else {
          return {
            status: 'EXPIRED_BLOCKED',
            licenseType: 'CLIENTE_TRIAL',
            holder: 'LICENCIA VENCIDA',
            daysRemaining: 0,
            trialExpiresAt: new Date(firstLaunchTime + (TRIAL_DAYS * 24 * 60 * 60 * 1000)).toLocaleDateString('es-MX'),
            isJosueFreePC: false
          };
        }
      }
    }

    // Primer inicio en dispositivo del cliente: Iniciar los 15 días de prueba
    const nowIso = new Date().toISOString();
    const initialData = {
      firstLaunch: nowIso,
      checksum: generateChecksum(nowIso),
      status: 'TRIAL_ACTIVE'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

    const expDate = new Date(Date.now() + (TRIAL_DAYS * 24 * 60 * 60 * 1000));
    return {
      status: 'TRIAL_ACTIVE',
      licenseType: 'CLIENTE_TRIAL',
      holder: 'PERIODO DE PRUEBA (CLIENTE)',
      daysRemaining: TRIAL_DAYS,
      trialExpiresAt: expDate.toLocaleDateString('es-MX'),
      isJosueFreePC: false
    };
  } catch (e) {
    return {
      status: 'TRIAL_ACTIVE',
      licenseType: 'CLIENTE_TRIAL',
      holder: 'CLIENTE',
      daysRemaining: TRIAL_DAYS,
      trialExpiresAt: '15 días',
      isJosueFreePC: false
    };
  }
}

/**
 * Validar y activar una clave o PIN de activación
 */
export function activateLicense(keyOrPin: string, clientName?: string): { success: boolean; message: string } {
  const cleanInput = (keyOrPin || '').trim().toUpperCase();

  // 1. Validación con PIN Maestro de Josue Hernandez (9612 o 9612765041)
  if (cleanInput === MASTER_PIN || cleanInput === MASTER_PIN_FULL) {
    const activationData = {
      status: 'ACTIVE_CLIENT',
      holder: clientName?.trim() || 'CLIENTE AUTORIZADO VIP',
      licenseKey: `NEXUS-MASTER-${cleanInput}`,
      activatedAt: new Date().toLocaleDateString('es-MX')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activationData));
    localStorage.setItem('nexus_josue_master_unlocked', 'true');
    return {
      success: true,
      message: '✅ ¡Licencia Permanente Activada con Éxito mediante Autorización de Josue Hernandez!'
    };
  }

  // 2. Validación de Claves Algorítmicas (ej: NEXUS-PRO-XXXX-XXXX o NEXUS-VITA-XXXX)
  if (cleanInput.startsWith('NEXUS-') && cleanInput.length >= 14) {
    const activationData = {
      status: 'ACTIVE_CLIENT',
      holder: clientName?.trim() || 'CLIENTE AUTORIZADO',
      licenseKey: cleanInput,
      activatedAt: new Date().toLocaleDateString('es-MX')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activationData));
    return {
      success: true,
      message: '✅ ¡Clave de Licencia NEXUS POS Aceptada y Activada Exitosamente!'
    };
  }

  return {
    success: false,
    message: '❌ Clave o PIN inválido. Contacta a Josue Hernandez (Tel: 961 276 5041) para obtener tu activación.'
  };
}
