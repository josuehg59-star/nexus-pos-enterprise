import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, RefreshCw, X, Sparkles, CheckCircle } from 'lucide-react';

export const CURRENT_APP_VERSION = '2.0.1';
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/josuehg59-star/nexus-pos-enterprise/main/version.json';

interface VersionInfo {
  version: string;
  notes: string;
  releaseDate: string;
  mobile?: { downloadUrl: string };
  pc?: { downloadUrl: string };
}

export function AutoUpdater({ mode = 'mobile' }: { mode?: 'mobile' | 'pc' }) {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [checking, setChecking] = useState(false);

  const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  };

  const checkForUpdates = async (isManual = false) => {
    try {
      setChecking(true);
      const res = await fetch(`${UPDATE_CHECK_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();
      if (data && data.version && compareVersions(data.version, CURRENT_APP_VERSION) > 0) {
        setUpdateInfo(data);
        setShowBanner(true);
      } else if (isManual) {
        alert(`✅ El sistema ya cuenta con la versión más reciente (v${CURRENT_APP_VERSION}).`);
      }
    } catch {
      if (isManual) {
        alert('No se pudo verificar la actualización. Revisa la conexión a internet.');
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Verificación inicial silenciosa
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 4000);

    // Verificación periódica cada 30 minutos
    const interval = setInterval(() => {
      checkForUpdates(false);
    }, 30 * 60 * 1000);

    // Event listener para comprobación manual desde Ajustes
    const handleManualCheck = () => checkForUpdates(true);
    window.addEventListener('check-nexus-pos-update', handleManualCheck);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('check-nexus-pos-update', handleManualCheck);
    };
  }, []);

  if (!showBanner || !updateInfo) return null;

  const downloadUrl = mode === 'mobile' 
    ? (updateInfo.mobile?.downloadUrl || 'https://github.com/josuehg59-star/nexus-pos-enterprise/releases/latest')
    : (updateInfo.pc?.downloadUrl || 'https://github.com/josuehg59-star/nexus-pos-enterprise/releases/latest');

  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-[999] max-w-md bg-gradient-to-r from-blue-900 to-indigo-900 border-2 border-blue-400 text-white rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>NUEVA VERSIÓN v{updateInfo.version}</span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1 rounded">DISPONIBLE</span>
            </h4>
            <p className="text-[10px] text-slate-300 font-medium line-clamp-2 mt-0.5">
              {updateInfo.notes}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowBanner(false)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>ACTUALIZAR AHORA</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="py-2 px-3 bg-nexus-800 hover:bg-nexus-700 text-slate-300 font-bold text-xs rounded-xl"
        >
          MÁS TARDE
        </button>
      </div>
    </div>
  );
}
