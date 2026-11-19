import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, Phone, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { getLicenseInfo, activateLicense, type LicenseInfo } from '../utils/licenseManager';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onActivated }) => {
  const [license, setLicense] = useState<LicenseInfo>(getLicenseInfo());
  const [keyInput, setKeyInput] = useState('');
  const [clientInput, setClientInput] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLicense(getLicenseInfo());
      setMsg(null);
    }
  }, [isOpen]);

  if (!isOpen && license.status !== 'EXPIRED_BLOCKED') return null;

  const handleActivate = () => {
    if (!keyInput.trim()) {
      setMsg({ text: 'Por favor ingresa tu clave de licencia o PIN maestro.', ok: false });
      return;
    }
    const result = activateLicense(keyInput, clientInput);
    if (result.success) {
      setMsg({ text: result.message, ok: true });
      const updated = getLicenseInfo();
      setLicense(updated);
      setTimeout(() => {
        if (onActivated) onActivated();
        if (license.status !== 'EXPIRED_BLOCKED') onClose();
      }, 1500);
    } else {
      setMsg({ text: result.message, ok: false });
    }
  };

  const isBlocked = license.status === 'EXPIRED_BLOCKED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-nexus-900 border-2 border-amber-500/50 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col">
        {/* ENCABEZADO */}
        <div className="p-5 bg-gradient-to-r from-amber-600/30 to-amber-900/30 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {isBlocked ? <Lock className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-white font-black text-base uppercase tracking-wider">
                {isBlocked ? 'LICENCIA EXPIRADA - ACTIVACIÓN REQUERIDA' : 'SISTEMA DE LICENCIAMIENTO'}
              </h3>
              <p className="text-slate-400 text-xs font-bold">NEXUS POS MÓVIL • EDICIÓN OFICIAL</p>
            </div>
          </div>
          {!isBlocked && (
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white bg-nexus-800 hover:bg-nexus-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CONTENIDO */}
        <div className="p-6 space-y-5">
          {/* ESTADO ACTUAL */}
          <div className="p-4 rounded-2xl bg-[#070d18] border border-nexus-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider">ESTADO DE LA LICENCIA:</span>
              <span className={`font-black px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase border ${
                license.status === 'LIFETIME_DEV' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                license.status === 'ACTIVE_CLIENT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                license.status === 'TRIAL_ACTIVE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-red-500/20 text-red-300 border-red-500/40'
              }`}>
                {license.status === 'LIFETIME_DEV' ? '👑 VITALICIA (DESARROLLADOR)' :
                 license.status === 'ACTIVE_CLIENT' ? '✅ ACTIVA PERMANENTE' :
                 license.status === 'TRIAL_ACTIVE' ? `⏳ PRUEBA (${license.daysRemaining} DÍAS RESTANTES)` :
                 '❌ EXPIRADA (BLOQUEADA)'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-nexus-800 pt-2">
              <span className="text-slate-400 font-bold">TITULAR / REGISTRO:</span>
              <span className="text-white font-mono font-bold text-right truncate max-w-[220px]">{license.holder}</span>
            </div>

            {license.isJosueFreePC && (
              <p className="text-[11px] text-emerald-400 font-bold mt-1 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                🎉 Modo Desarrollador Personal Activo: Tu PC cuenta con licencia ilimitada gratuita de por vida.
              </p>
            )}
          </div>

          {/* MENSAJE DE RESULTADO */}
          {msg && (
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              msg.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}>
              {msg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* FORMULARIO DE ACTIVACIÓN */}
          {license.status !== 'LIFETIME_DEV' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider block mb-1">
                  CLAVE DE LICENCIA O PIN MAESTRO
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  <input 
                    type="text"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    placeholder="Ej: NEXUS-PRO-XXXX o PIN 9612"
                    className="w-full bg-[#070d18] border border-nexus-700 text-white font-mono text-sm pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  NOMBRE DEL COMERCIO O CLIENTE (OPCIONAL)
                </label>
                <input 
                  type="text"
                  value={clientInput}
                  onChange={e => setClientInput(e.target.value)}
                  placeholder="Ej: Miscelánea Brittany"
                  className="w-full bg-[#070d18] border border-nexus-700 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={handleActivate}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> ACTIVAR SISTEMA AHORA
              </button>
            </div>
          )}

          {/* CONTACTO CON JOSUE HERNANDEZ */}
          <div className="p-4 rounded-2xl bg-nexus-950/80 border border-nexus-800 text-center space-y-2.5">
            <p className="text-[11px] font-bold text-slate-300">
              ¿Necesitas una licencia para tu negocio o renovar tu sistema?
            </p>
            <a 
              href="https://wa.me/529612765041?text=Hola%20Josue%2C%20deseo%20activar%20mi%20licencia%20de%20Nexus%20POS"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" /> SOLICITAR LICENCIA POR WHATSAPP (961 276 5041)
            </a>
            <div className="text-[10px] text-slate-500 font-bold pt-1">
              Desarrollado y Distribuido por <span className="text-amber-400">Josue Hernandez</span> • Tuxtla Gutiérrez, Chiapas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
