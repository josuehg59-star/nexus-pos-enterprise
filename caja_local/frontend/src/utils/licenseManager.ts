/**
 * SISTEMA INTEGRAL DE LICENCIAMIENTO NEXUS POS ENTERPRISE (PC WINDOWS)
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
  simulationMode?: boolean;
}

const STORAGE_KEY = 'nexus_pos_license_data';
const MASTER_PIN = '9612';
const MASTER_PIN_FULL = '9612765041';
const TRIAL_DAYS = 15;

function generateChecksum(val: string): string {
  let hash = 0;
  for (let i = 0; i < val.length; i++) {
    hash = ((hash << 5) - hash) + val.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function isJosueLocalPC(): boolean {
  try {
    if (localStorage.getItem('nexus_license_simulation_mode') === 'true') {
      return false;
    }
    if (localStorage.getItem('nexus_josue_master_unlocked') === 'true') {
      return true;
    }
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '';
  } catch (e) {
    return false;
  }
}

export function getLicenseInfo(): LicenseInfo {
  if (isJosueLocalPC()) {
    return {
      status: 'LIFETIME_DEV',
      licenseType: 'VITALICIA_DESARROLLADOR',
      holder: 'JOSUE HERNANDEZ (AUTOR / DESARROLLADOR)',
      daysRemaining: 99999,
      trialExpiresAt: '2099-12-31',
      activatedAt: '2026-01-01',
      licenseKey: 'NEXUS-JOSUE-DEV-UNLIMITED',
      isJosueFreePC: true,
      simulationMode: false
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      
      if (data.status === 'ACTIVE_CLIENT') {
        return {
          status: 'ACTIVE_CLIENT',
          licenseType: 'CLIENTE_PRO',
          holder: data.holder || 'CLIENTE AUTORIZADO',
          daysRemaining: 365,
          trialExpiresAt: '2099-12-31',
          activatedAt: data.activatedAt,
          licenseKey: data.licenseKey,
          isJosueFreePC: false,
          simulationMode: localStorage.getItem('nexus_license_simulation_mode') === 'true'
        };
      }

      if (data.status === 'EXPIRED_BLOCKED') {
        return {
          status: 'EXPIRED_BLOCKED',
          licenseType: 'CLIENTE_TRIAL',
          holder: data.holder || 'LICENCIA EXPIRADA',
          daysRemaining: 0,
          trialExpiresAt: 'Vencida',
          isJosueFreePC: false,
          simulationMode: localStorage.getItem('nexus_license_simulation_mode') === 'true'
        };
      }

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
            holder: data.holder || 'PERIODO DE PRUEBA (CLIENTE)',
            daysRemaining: daysLeft,
            trialExpiresAt: expDate.toLocaleDateString('es-MX'),
            isJosueFreePC: false,
            simulationMode: localStorage.getItem('nexus_license_simulation_mode') === 'true'
          };
        } else {
          return {
            status: 'EXPIRED_BLOCKED',
            licenseType: 'CLIENTE_TRIAL',
            holder: 'LICENCIA VENCIDA',
            daysRemaining: 0,
            trialExpiresAt: new Date(firstLaunchTime + (TRIAL_DAYS * 24 * 60 * 60 * 1000)).toLocaleDateString('es-MX'),
            isJosueFreePC: false,
            simulationMode: localStorage.getItem('nexus_license_simulation_mode') === 'true'
          };
        }
      }
    }

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
      isJosueFreePC: false,
      simulationMode: localStorage.getItem('nexus_license_simulation_mode') === 'true'
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

export function activateLicense(keyOrPin: string, clientName?: string): { success: boolean; message: string } {
  const cleanInput = (keyOrPin || '').trim().toUpperCase();

  if (cleanInput === MASTER_PIN || cleanInput === MASTER_PIN_FULL) {
    const activationData = {
      status: 'ACTIVE_CLIENT',
      holder: clientName?.trim() || 'CLIENTE AUTORIZADO VIP',
      licenseKey: `NEXUS-MASTER-${cleanInput}`,
      activatedAt: new Date().toLocaleDateString('es-MX')
    };
    localStorage.removeItem('nexus_license_simulation_mode');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activationData));
    localStorage.setItem('nexus_josue_master_unlocked', 'true');
    return {
      success: true,
      message: '✅ ¡Licencia Permanente Activada con Éxito mediante PIN de Josue Hernandez!'
    };
  }

  if (cleanInput.startsWith('NEXUS-') && cleanInput.length >= 14) {
    const activationData = {
      status: 'ACTIVE_CLIENT',
      holder: clientName?.trim() || 'CLIENTE AUTORIZADO',
      licenseKey: cleanInput,
      activatedAt: new Date().toLocaleDateString('es-MX')
    };
    localStorage.removeItem('nexus_license_simulation_mode');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activationData));
    return {
      success: true,
      message: '✅ ¡Clave Oficial NEXUS POS Aceptada y Activada Exitosamente!'
    };
  }

  return {
    success: false,
    message: '❌ Clave o PIN inválido. Contacta a Josue Hernandez (Tel: 961 276 5041) para obtener tu activación.'
  };
}

export function simulateLicenseStatus(mode: 'TRIAL' | 'EXPIRED' | 'DEV'): LicenseInfo {
  if (mode === 'TRIAL') {
    localStorage.setItem('nexus_license_simulation_mode', 'true');
    localStorage.removeItem('nexus_josue_master_unlocked');
    const fiveDaysAgo = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)).toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      firstLaunch: fiveDaysAgo,
      checksum: generateChecksum(fiveDaysAgo),
      status: 'TRIAL_ACTIVE',
      holder: 'CLIENTE EN PRUEBA (SIMULACIÓN)'
    }));
  } else if (mode === 'EXPIRED') {
    localStorage.setItem('nexus_license_simulation_mode', 'true');
    localStorage.removeItem('nexus_josue_master_unlocked');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: 'EXPIRED_BLOCKED',
      holder: 'CLIENTE EXPIRADO (SIMULACIÓN)'
    }));
  } else {
    localStorage.removeItem('nexus_license_simulation_mode');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem('nexus_josue_master_unlocked', 'true');
  }
  return getLicenseInfo();
}
