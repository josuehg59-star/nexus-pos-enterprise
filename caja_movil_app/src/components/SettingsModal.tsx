import React, { useState, useRef } from 'react';
import { getServerUrl, setServerUrl, syncProductsFromPC, pushSalesToPC } from '../syncService';
import { X, RefreshCw, Server, Check, AlertCircle, Camera } from 'lucide-react';
import { useSettings } from '../store/useSettings';
import { compressImageFile } from '../utils/imageCompressor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSyncCompleted }) => {
  const [url, setUrl] = useState(getServerUrl());
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const { logo, setSettings } = useSettings();
  const [currentLogo, setCurrentLogo] = useState(logo);
  const [logoMsg, setLogoMsg] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 350, 350, 0.85);
        setCurrentLogo(compressed);
        setSettings({ logo: compressed });
        setLogoMsg('✅ ¡Logo guardado!');
        setTimeout(() => setLogoMsg(''), 3000);
      } catch (err: any) {
        alert('Error con la imagen: ' + (err.message || 'Intenta con otra imagen'));
      }
    }
    e.target.value = '';
  };

  const handleSaveAndSync = async () => {
    setServerUrl(url);
    setSyncing(true);
    setStatusMsg(null);

    // 1. Enviar ventas pendientes a la PC
    await pushSalesToPC();

    // 2. Descargar productos actualizados desde la PC
    const res = await syncProductsFromPC();
    setSyncing(false);

    if (res.success) {
      setStatusMsg({ text: `✅ ¡Sincronizado con éxito! Se descargaron ${res.count} productos.`, ok: true });
      onSyncCompleted();
    } else {
      setStatusMsg({ text: `❌ ${res.error || 'Error al conectar con la PC'}`, ok: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>AJUSTES Y ENLACE PC</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* SECCIÓN LOGO DEL NEGOCIO */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-600 overflow-hidden shrink-0">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Camera className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase">LOGO DEL NEGOCIO</p>
                <p className="text-[10px] text-slate-400">{logoMsg || 'Se muestra en tickets y ventas'}</p>
              </div>
            </div>
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoFile} />
            <button 
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              {currentLogo ? 'CAMBIAR' : 'SUBIR'}
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">IP / SERVIDOR DE LA PC PRINCIPAL</label>
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.XX:3008"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Coloca la dirección IP local de la computadora donde está la Caja Principal.
            </p>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              {statusMsg.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            onClick={handleSaveAndSync}
            disabled={syncing}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'CONECTANDO Y SINCRONIZANDO...' : 'SINCRONIZAR AHORA CON LA PC'}
          </button>
        </div>

        <div className="p-3 bg-slate-800 border-t border-slate-700 flex flex-col items-center gap-1.5">
          <button onClick={onClose} className="text-xs text-slate-300 hover:text-white font-bold px-4 py-1.5 bg-slate-700/60 rounded-lg">
            CERRAR
          </button>
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            JOSUE HERNANDEZ GUTIERREZ • TEL: 9612765041
          </div>
        </div>
      </div>
    </div>
  );
};
