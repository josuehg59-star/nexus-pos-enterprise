import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, Phone, CheckCircle, AlertTriangle, X, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { getLicenseInfo, activateLicense, simulateLicenseStatus, type LicenseInfo } from '../utils/licenseManager';
import { cleanSystemForDelivery } from '../utils/systemCleaner';

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

  const handleSimulate = (mode: 'TRIAL' | 'EXPIRED' | 'DEV') => {
    const updated = simulateLicenseStatus(mode);
    setLicense(updated);
    setMsg({ 
      text: mode === 'DEV' ? '👑 Modo Desarrollador Vitalicio Restaurado.' : 
            mode === 'TRIAL' ? '⏳ Modo Simulación Cliente en Periodo de Prueba Activado.' :
            '🔒 Modo Simulación Cliente Bloqueado/Expirado Activado.',
      ok: true 
    });
    if (onActivated) onActivated();
  };

  const handleCleanDelivery = async (preserveCatalog: boolean) => {
    const confirmText = preserveCatalog
      ? '¿Limpiar ventas, turnos y cortes de prueba para entregar al cliente?\n\n✅ Se CONSERVARÁ el catálogo de productos.\n✅ El cliente iniciará con sus 15 días de prueba limpios.'
      : '⚠️ ATENCIÓN: ¿Restablecer TODO de fábrica?\n\n❌ Se borrarán productos, clientes y ventas.\n❌ El sistema quedará 100% vacío.';

    if (window.confirm(confirmText)) {
      const res = await cleanSystemForDelivery({ preserveCatalog, resetLicenseForNewCustomer: true });
      alert(res.message);
      window.location.reload();
    }
  };

  const isBlocked = license.status === 'EXPIRED_BLOCKED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-nexus-900 border-2 border-amber-500/50 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* ENCABEZADO */}
        <div className="p-5 bg-gradient-to-r from-amber-600/30 to-amber-900/30 border-b border-amber-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {isBlocked ? <Lock className="w-5 h-5 text-red-400" /> : <ShieldCheck className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-white font-black text-base uppercase tracking-wider">
                {isBlocked ? 'LICENCIA EXPIRADA - ACTIVACIÓN REQUERIDA' : 'SISTEMA DE LICENCIAMIENTO'}
              </h3>
              <p className="text-slate-400 text-xs font-bold">NEXUS POS • CONTROL DE ACTIVACIONES</p>
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

            {license.isJosueFreePC && !license.simulationMode && (
              <p className="text-[11px] text-emerald-400 font-bold mt-1 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                🎉 Tu equipo está reconocido como Desarrollador Oficial: Tienes uso libre y gratuito permanente.
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

          {/* FORMULARIO DE ACTIVACIÓN (SIEMPRE DISPONIBLE PARA PROBAR) */}
          <div className="space-y-3 bg-nexus-950/60 p-4 rounded-2xl border border-nexus-800">
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
                  placeholder="Escribe tu PIN: 9612 o Clave NEXUS-XXXX"
                  className="w-full bg-[#070d18] border border-nexus-700 text-white font-mono text-sm pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                💡 Puedes escribir tu PIN secreto: <strong className="text-amber-300">9612</strong> o cualquier clave generada.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                NOMBRE DEL COMERCIO O CLIENTE
              </label>
              <input 
                type="text"
                value={clientInput}
                onChange={e => setClientInput(e.target.value)}
                placeholder="Ej: Abarrotes Don Pepe"
                className="w-full bg-[#070d18] border border-nexus-700 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleActivate}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" /> ACTIVAR LICENCIA PERMANENTE
            </button>
          </div>

          {/* HERRAMIENTAS DE ENTREGA Y LIMPIEZA */}
          <div className="p-3 bg-[#070d18] rounded-2xl border border-nexus-800 space-y-2.5">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block text-center">
              🧹 LIMPIAR Y PREPARAR PARA ENTREGAR AL CLIENTE:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCleanDelivery(true)}
                className="p-2.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-black text-center transition-colors flex items-center justify-center gap-1.5"
                title="Limpia ventas y cortes pero deja los productos para el cliente"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Limpiar Ventas (Conserva Productos)</span>
              </button>
              <button
                onClick={() => handleCleanDelivery(false)}
                className="p-2.5 bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-[10px] font-black text-center transition-colors flex items-center justify-center gap-1.5"
                title="Borra absolutamente todo dejándolo como de fábrica"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Restablecer Fábrica (100% Vacío)</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center font-bold">
              💡 Reinicia el periodo de prueba de 15 días y folios para que el cliente estrene su sistema limpio.
            </p>
          </div>

          {/* BOTONES DE SIMULACIÓN PARA JOSUÉ */}
          <div className="p-3 bg-[#070d18] rounded-2xl border border-nexus-800 space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">
              🧪 HERRAMIENTAS DE PRUEBA (SOLO PARA TI):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleSimulate('TRIAL')}
                className="p-2 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold text-center transition-colors"
                title="Simular cómo ve el cliente sus 15 días"
              >
                ⏳ Ver Modo Prueba
              </button>
              <button 
                onClick={() => handleSimulate('EXPIRED')}
                className="p-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 rounded-xl text-[10px] font-bold text-center transition-colors"
                title="Simular bloqueo cuando expira"
              >
                🔒 Ver Bloqueado
              </button>
              <button 
                onClick={() => handleSimulate('DEV')}
                className="p-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 rounded-xl text-[10px] font-bold text-center transition-colors"
                title="Volver a tu modo de uso libre"
              >
                👑 Mi Modo Libre
              </button>
            </div>
          </div>

          {/* CONTACTO CON JOSUE HERNANDEZ */}
          <div className="p-3 rounded-2xl bg-nexus-950/80 border border-nexus-800 text-center space-y-2">
            <p className="text-[11px] font-bold text-slate-300">
              Autor y Soporte Técnico:
            </p>
            <a 
              href="https://wa.me/529612765041?text=Hola%20Josue%2C%20deseo%20activar%20mi%20licencia%20de%20Nexus%20POS"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" /> WHATSAPP: 961 276 5041
            </a>
            <div className="text-[10px] text-slate-500 font-bold">
              Josue Hernandez • Tuxtla Gutiérrez, Chiapas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
