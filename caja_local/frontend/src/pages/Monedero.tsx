import { useState } from 'react';
import { CreditCard, Search, PlusCircle, Wallet, History, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import type { Client } from '../store/database';

export default function Monedero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Modals state
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [showAjustarModal, setShowAjustarModal] = useState(false);
  
  // Form state
  const [monederoCode, setMonederoCode] = useState('');
  const [ajusteMonto, setAjusteMonto] = useState('');

  const clients = useLiveQuery(() => {
    let q = db.clients.toCollection();
    return q.toArray().then(arr => {
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        arr = arr.filter(c => 
          c.name.toLowerCase().includes(s) || 
          (c.monederoCode && c.monederoCode.toLowerCase().includes(s))
        );
      }
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [searchQuery]) || [];

  const handleOpenVincular = (client: Client) => {
    setSelectedClient(client);
    setMonederoCode(client.monederoCode || '');
    setShowVincularModal(true);
  };

  const handleSaveVincular = async () => {
    if (!selectedClient?.id) return;
    
    // Si est vaco, genera uno automtico
    const finalCode = monederoCode.trim() || `NEXUS-${Date.now().toString().slice(-6)}`;
    
    // Check if code is already in use by someone else
    const existing = await db.clients.where('monederoCode').equals(finalCode).first();
    if (existing && existing.id !== selectedClient.id) {
      alert('Esta tarjeta monedero ya est asignada a otro cliente.');
      return;
    }

    await db.clients.update(selectedClient.id, { monederoCode: finalCode });
    setShowVincularModal(false);
    setSelectedClient(null);
  };

  const handleOpenAjustar = (client: Client) => {
    setSelectedClient(client);
    setAjusteMonto('');
    setShowAjustarModal(true);
  };

  const handleSaveAjustar = async () => {
    if (!selectedClient?.id) return;
    const monto = parseFloat(ajusteMonto);
    if (isNaN(monto)) return;

    await db.clients.update(selectedClient.id, {
      monedero: Math.max(0, (selectedClient.monedero || 0) + monto)
    });
    
    setShowAjustarModal(false);
    setSelectedClient(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-fuchsia-500" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">MONEDERO <span className="text-fuchsia-500">ELECTRÓNICO</span></h2>
            <p className="text-slate-400 text-sm">VINCULACIÓN Y GESTIÓN DE SALDOS POR CLIENTE</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Buscar cliente por nombre o tarjeta..." 
            className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-10 pr-4 py-3 rounded-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-colors" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client: Client) => (
            <div key={client.id} className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6 relative overflow-hidden group hover:border-fuchsia-500/50 transition-colors">
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h3 className="font-black text-white text-lg truncate pr-4">{client.name}</h3>
                  <p className="text-slate-400 text-sm">{client.phone || 'Sin telfono'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SALDO ACTUAL</p>
                  <p className="text-2xl font-black text-emerald-400">${(client.monedero || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-nexus-950 rounded-xl p-4 mb-6 border border-nexus-800/50 relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TARJETA VINCULADA</p>
                {client.monederoCode ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-fuchsia-400 font-bold tracking-widest">{client.monederoCode}</span>
                    <button onClick={() => handleOpenVincular(client)} className="text-xs text-slate-400 hover:text-white underline decoration-dashed underline-offset-4">Cambiar</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 italic text-sm">No tiene monedero</span>
                    <button 
                      onClick={() => handleOpenVincular(client)}
                      className="bg-fuchsia-600/20 text-fuchsia-400 hover:bg-fuchsia-600 hover:text-white px-3 py-1 rounded-lg text-xs font-black transition-colors"
                    >
                      CREAR MONEDERO
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => handleOpenAjustar(client)}
                  disabled={!client.monederoCode}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-colors ${client.monederoCode ? 'bg-nexus-800 text-white hover:bg-nexus-700' : 'bg-nexus-900/50 text-slate-600 cursor-not-allowed'}`}
                >
                  <Wallet className="w-4 h-4" /> RECARGAR SALDO
                </button>
              </div>
              
              {/* Decorative background element */}
              <CreditCard className="absolute -bottom-6 -right-6 w-32 h-32 text-nexus-800/30 -z-0 rotate-12 group-hover:text-fuchsia-900/20 transition-colors" />
            </div>
          ))}

          {clients.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 font-bold">
              Sin resultados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL VINCULAR */}
      {showVincularModal && selectedClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl p-8 w-[480px] shadow-2xl">
            <h3 className="font-black text-xl text-white mb-2">VINCULAR MONEDERO</h3>
            <p className="text-slate-400 text-sm mb-6">Asignando tarjeta a: <span className="text-fuchsia-400 font-bold">{selectedClient.name}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">CÓDIGO DE TARJETA (ESCANEA O INGRESA)</label>
                <input 
                  type="text" 
                  value={monederoCode} 
                  onChange={e => setMonederoCode(e.target.value)} 
                  placeholder="Si lo dejas en blanco, se generar uno automtico" 
                  className="w-full bg-nexus-800 border border-fuchsia-900/50 text-fuchsia-400 px-4 py-3 rounded-xl font-mono focus:border-fuchsia-500 outline-none" 
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowVincularModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">CANCELAR</button>
              <button onClick={handleSaveVincular} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">ASIGNAR TARJETA</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJUSTAR SALDO */}
      {showAjustarModal && selectedClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl p-8 w-[400px] shadow-2xl">
            <h3 className="font-black text-xl text-white mb-2">RECARGAR / AJUSTAR SALDO</h3>
            <p className="text-slate-400 text-sm mb-6">Cliente: <span className="text-white font-bold">{selectedClient.name}</span></p>
            
            <div className="space-y-4">
              <div className="bg-nexus-950 p-4 rounded-xl flex justify-between items-center border border-nexus-800">
                <span className="text-xs font-bold text-slate-400">SALDO ACTUAL</span>
                <span className="text-xl font-black text-emerald-400">${(selectedClient.monedero || 0).toFixed(2)}</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MONTO A AGREGAR O RESTAR (+ / -)</label>
                <input 
                  type="number" 
                  value={ajusteMonto} 
                  onChange={e => setAjusteMonto(e.target.value)} 
                  placeholder="Ej. 100 para sumar, -50 para restar" 
                  className="w-full bg-nexus-800 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-fuchsia-500 outline-none text-center text-xl" 
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAjustarModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">CANCELAR</button>
              <button onClick={handleSaveAjustar} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">APLICAR AJUSTE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
