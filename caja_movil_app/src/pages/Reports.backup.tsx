import { useState } from 'react';
import { 
  Filter, Printer, FileSpreadsheet, MessageCircle, 
  RefreshCcw, Eye, X, Receipt
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('FOLIOS');
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    'MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 
    'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 
    'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 
    'PEDIDOS', 'CRÉDITOS'
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      
      {/* NAVEGACIÓN DE REPORTES (Pills) */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-nexus-800 overflow-x-auto custom-scrollbar shrink-0 bg-nexus-900/50">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border ${
              activeTab === tab 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : tab === 'MÁS VENDIDOS' ? 'bg-fuchsia-900/30 border-fuchsia-800 text-fuchsia-400' 
                : tab === 'TOP VENDIDOS' ? 'bg-purple-900/30 border-purple-800 text-purple-400'
                : tab === 'CRÉDITOS' ? 'bg-amber-900/30 border-amber-800 text-amber-400'
                : 'bg-nexus-800/50 border-nexus-700 text-slate-400 hover:text-white hover:bg-nexus-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* FILTROS */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-6 rounded-3xl">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Vista</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option>DETALLADO</option>
                <option>RESUMIDO</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proveedor</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option>TODOS LOS PROVEEDORES</option>
                <option>BIMBO SA DE CV</option>
                <option>LA GARDENIA</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Método Pago</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option>TODOS</option>
                <option>EFECTIVO</option>
                <option>TRANSFERENCIA</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Rango Rápido</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option>HOY (DIARIO)</option>
                <option>AYER</option>
                <option>ESTA SEMANA</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fecha Inicio</label>
              <input type="date" defaultValue="2026-09-27" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fecha Fin</label>
              <input type="date" defaultValue="2026-09-27" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <Filter className="w-4 h-4" /> FILTRAR
            </button>
            <button className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <Printer className="w-4 h-4" /> IMPRIMIR / PDF
            </button>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">REPORTE DE FOLIOS</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">2026-09-27 AL 2026-09-27</p>
              
              <div className="mt-4 inline-block bg-nexus-900 border border-nexus-700 p-4 rounded-2xl shadow-lg border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Venta Bruta Total</p>
                <p className="text-2xl font-black text-emerald-400">$2166.50</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> EXCEL
              </button>
              <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> WHATSAPP
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-nexus-800 bg-nexus-900/50">
            <table className="w-full text-left">
              <thead className="bg-nexus-900 border-b border-nexus-800">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Folio</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50">
                {[
                  { id: '#80998', time: '08:36:33', method: 'TRANSFERENCIA', total: 67.50 },
                  { id: '#80999', time: '08:51:53', method: 'EFECTIVO', total: 73.00 },
                  { id: '#81000', time: '08:58:16', method: 'EFECTIVO', total: 16.00 },
                  { id: '#81001', time: '08:59:23', method: 'EFECTIVO', total: 16.00 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                    <td className="p-4 font-black text-blue-400 text-xs">{row.id}</td>
                    <td className="p-4 font-bold text-white text-xs">27/9/2026</td>
                    <td className="p-4 font-bold text-white text-xs">{row.time}</td>
                    <td className="p-4">
                      <span className="bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded text-[10px] font-black uppercase">{row.method}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-emerald-400 font-black text-[10px] uppercase">PAID</span>
                    </td>
                    <td className="p-4 font-black text-emerald-400 text-xs">${row.total.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setShowModal(true)} className="text-blue-400 hover:text-white transition-colors">
                        <Eye className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL DETALLE VENTA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">DETALLE VENTA #80998</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <span>FECHA: 27/9/2026, 08:36:33</span>
                <span>METODO: TRANSFERENCIA</span>
                <span className="text-emerald-400">LIQUIDADO</span>
              </div>

              <table className="w-full text-left mb-6">
                <thead className="border-b border-nexus-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="pb-3">Producto</th>
                    <th className="pb-3 text-center">Cant</th>
                    <th className="pb-3 text-right">Precio</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800 text-xs font-bold text-white">
                  <tr>
                    <td className="py-4">QUESILLO BOLSA 1/4 GRS</td>
                    <td className="py-4 text-center">1</td>
                    <td className="py-4 text-right text-slate-400">$31.00</td>
                    <td className="py-4 text-right">$31.00</td>
                  </tr>
                  <tr>
                    <td className="py-4">TIA ROSA TORTILLINA C/15</td>
                    <td className="py-4 text-center">1</td>
                    <td className="py-4 text-right text-slate-400">$24.00</td>
                    <td className="py-4 text-right">$24.00</td>
                  </tr>
                  <tr>
                    <td className="py-4">GALLETAS MARIANITAS SABOR COCO 185 GR</td>
                    <td className="py-4 text-center">1</td>
                    <td className="py-4 text-right text-slate-400">$12.50</td>
                    <td className="py-4 text-right">$12.50</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-end mb-8">
                <div className="flex gap-2">
                  <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-3 h-3" /> DEVOLVER
                  </button>
                  <button className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" /> WHATSAPP
                  </button>
                  <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <Receipt className="w-3 h-3" /> TICKET
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Final</p>
                  <p className="text-5xl font-black text-emerald-400 tracking-tighter">$67.50</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase transition-colors">
                  NUEVA VENTA (ENTER)
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-xl font-black text-sm uppercase transition-colors">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
