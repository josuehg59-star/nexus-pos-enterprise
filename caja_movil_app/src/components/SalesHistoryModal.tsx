import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { mobileDb, type MobileSale } from '../db';
import { pushSalesToPC } from '../syncService';
import { X, RefreshCw, CheckCircle2, Clock, Calendar, DollarSign, Package } from 'lucide-react';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({ isOpen, onClose }) => {
  const [syncing, setSyncing] = useState(false);
  const sales: MobileSale[] = useLiveQuery(() => mobileDb.sales.orderBy('timestamp').reverse().toArray(), []) || [];

  if (!isOpen) return null;

  const totalVendido = sales.reduce((acc: number, s: MobileSale) => acc + s.total, 0);
  const totalArticulos = sales.reduce((acc: number, s: MobileSale) => acc + s.items.reduce((sAcc: number, it) => sAcc + it.quantity, 0), 0);
  const pendientesSync = sales.filter((s: MobileSale) => s.syncStatus === 'PENDING_SYNC').length;

  const handleSyncAll = async () => {
    setSyncing(true);
    await pushSalesToPC();
    setSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div>
            <h2 className="text-white font-black text-sm">HISTORIAL DE VENTAS MÓVIL</h2>
            <p className="text-[11px] text-slate-400">Resumen y estado de sincronización</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div className="p-4 grid grid-cols-3 gap-2 bg-slate-800/40 border-b border-slate-800">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> TOTAL
            </span>
            <span className="text-base font-black text-emerald-400">${totalVendido.toFixed(2)}</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
              <Package className="w-3 h-3 text-sky-400" /> PIEZAS
            </span>
            <span className="text-base font-black text-sky-400">{totalArticulos}</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" /> POR ENVIAR
            </span>
            <span className="text-base font-black text-amber-400">{pendientesSync}</span>
          </div>
        </div>

        {/* Botón sincronizar */}
        {pendientesSync > 0 && (
          <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">Tienes {pendientesSync} venta(s) sin enviar a la PC</span>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Enviar a PC
            </button>
          </div>
        )}

        {/* Lista de ventas */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {sales.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No hay ventas registradas en este dispositivo todavía.
            </div>
          ) : (
            sales.map((sale: MobileSale) => (
              <div 
                key={sale.id || sale.folio} 
                className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">#{sale.folio}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {sale.paymentMethod}
                    </span>
                    {sale.syncStatus === 'SYNCED' ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> En PC
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>{sale.items.length} productos</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {sale.date}
                    </span>
                  </div>
                  {sale.clientName && sale.clientName !== 'PUBLICO GENERAL' && (
                    <div className="text-[10px] text-emerald-400/90 font-bold mt-0.5">
                      Cliente: {sale.clientName}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 block">${sale.total.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-800 border-t border-slate-700 text-center">
          <button onClick={onClose} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold">
            CERRAR
          </button>
        </div>

      </div>
    </div>
  );
};
