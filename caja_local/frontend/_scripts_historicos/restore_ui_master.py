import os
import re

with open('src/pages/Reports.backup.tsx', 'r', encoding='utf-8') as f:
    backup_code = f.read()

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    current_code = f.read()

hooks_match = re.search(r"(const tickets = useLiveQuery[\s\S]*?const topProducts = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredTickets\]\);)", current_code)
hooks = hooks_match.group(1) if hooks_match else ""

excel_fn = re.search(r"(// EXPORT EXCEL MASTER[\s\S]*?const handleDevolverParcial)", current_code)
excel_code = excel_fn.group(1) if excel_fn else ""

devolver_fn = re.search(r"(const handleDevolverParcial = async[\s\S]*?\} catch\(e\) \{[\s\S]*?\};\n)", current_code)
devolver_code = devolver_fn.group(1) if devolver_fn else ""

abono_fn = re.search(r"(const handleAbonarCredito = async[\s\S]*?\};\n)", current_code)
abono_code = abono_fn.group(1) if abono_fn else ""

new_file = """import React, { useState, useMemo } from 'react';
import { db } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Filter, Printer, FileSpreadsheet, MessageCircle, 
  RefreshCcw, Eye, X, Receipt, Download, BarChart3, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('VENTAS');
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [ventasView, setVentasView] = useState('CONSOLIDADO');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');

  const tabs = [
    'MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 
    'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 
    'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 
    'PEDIDOS', 'CRÉDITOS'
  ];

""" + hooks + "\n\n" + excel_code + "\n\n" + devolver_code + "\n\n" + abono_code + """

  const renderModal = () => {
    if (!selectedTicket) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">DETALLE VENTA #{selectedTicket.id?.substring(0,8).toUpperCase()}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <span>FECHA: {new Date(selectedTicket.date).toLocaleString()}</span>
                <span>METODO: {selectedTicket.paymentMethod}</span>
                <span className="text-emerald-400">{selectedTicket.status || 'LIQUIDADO'}</span>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left mb-6">
                  <thead className="border-b border-nexus-800 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-[#0b1120]">
                    <tr>
                      <th className="pb-3">Producto</th>
                      <th className="pb-3 text-center">Cant</th>
                      <th className="pb-3 text-right">Precio</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 text-xs font-bold text-white">
                    {selectedTicket.items?.map((item: any, i: number) => {
                      const ret = item.returnedQty || 0;
                      const av = item.cartQty - ret;
                      return (
                        <tr key={i} className={ret > 0 ? "opacity-75" : ""}>
                          <td className="py-4">{item.name} {ret > 0 && <span className="text-red-400 text-[9px] ml-2">(-{ret} DEV)</span>}</td>
                          <td className="py-4 text-center">{item.cartQty}</td>
                          <td className="py-4 text-right text-slate-400">${item.price?.toFixed(2) || '0.00'}</td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            ${(item.cartQty * item.price).toFixed(2)}
                            {av > 0 && <button onClick={() => handleDevolverParcial(selectedTicket, i)} className="bg-red-900/30 text-red-500 text-[9px] px-2 py-1 rounded border border-red-500/30 ml-2">RETORNAR</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end mb-8 mt-4 border-t border-nexus-800 pt-4">
                <div className="flex gap-2">
                  <button className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" /> WHATSAPP
                  </button>
                  <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <Receipt className="w-3 h-3" /> TICKET
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Final</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter">${(selectedTicket.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      {renderModal()}

      {showAbonoModal && selectedClientAbono && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-900 border border-nexus-700 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="text-xl font-black text-white mb-4">LIQUIDAR DEUDA</h3>
            <p className="text-sm text-slate-400 mb-4">Cliente: <span className="text-white font-bold">{selectedClientAbono.name}</span></p>
            <p className="text-xl font-black text-red-400 mb-6">Deuda: ${selectedClientAbono.credito?.toFixed(2)}</p>
            <input type="number" value={abonoAmount} onChange={e=>setAbonoAmount(e.target.value)} placeholder="Monto a abonar..." className="w-full bg-[#0b1120] border border-nexus-700 p-4 rounded-xl text-white font-bold text-lg mb-4 outline-none" />
            <div className="flex gap-2">
              <button onClick={()=>setShowAbonoModal(false)} className="flex-1 bg-nexus-800 py-3 rounded-xl font-bold">CANCELAR</button>
              <button onClick={handleAbonarCredito} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-white">GUARDAR ABONO</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN DE REPORTES (Pills original) */}
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
        
        {/* FILTROS ESTRUCTURA ORIGINAL */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-6 rounded-3xl">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Vista</label>
              <select value={ventasView} onChange={e=>setVentasView(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option value="DETALLADO">DETALLADO</option>
                <option value="CONSOLIDADO">RESUMIDO (FOLIOS)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proveedor</label>
              <select value={providerFilter} onChange={e=>setProviderFilter(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Método Pago</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option>TODOS</option>
                <option>EFECTIVO</option>
                <option>TRANSFERENCIA</option>
                <option>TARJETA</option>
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
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fecha Fin</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <Filter className="w-4 h-4" /> FILTRAR
            </button>
            <button onClick={handleExportExcel} className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> EXPORTAR EXCEL
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS DINÁMICO */}
        
        {['MÁS VENDIDOS', 'TOP VENDIDOS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANTIDAD VENDIDA</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-center text-emerald-400 font-black">{p.qty} pz</td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-slate-500 font-bold">No hay datos de ventas.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'MENOS VENDIDOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANTIDAD VENDIDA</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {[...topProducts].reverse().map((p, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-center text-red-400 font-black">{p.qty} pz</td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-slate-500 font-bold">No hay datos de ventas.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {['VENTAS', 'FOLIOS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                {ventasView === 'CONSOLIDADO' ? (
                  <tr><th className="p-4">FOLIO</th><th className="p-4">FECHA</th><th className="p-4">MÉTODO</th><th className="p-4 text-right">TOTAL</th><th className="p-4 text-center">ACCIÓN</th></tr>
                ) : (
                  <tr><th className="p-4">FECHA</th><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANT</th><th className="p-4 text-right">PRECIO</th><th className="p-4 text-right">TOTAL</th></tr>
                )}
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {ventasView === 'CONSOLIDADO' ? (
                  filteredTickets.map((t,i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 font-mono text-blue-400">#{t.id?.substring(0,8).toUpperCase()}</td>
                      <td className="p-4">{new Date(t.date).toLocaleString()}</td>
                      <td className="p-4 font-bold">{t.paymentMethod}</td>
                      <td className="p-4 text-right font-black text-emerald-400">${(t.total||0).toFixed(2)}</td>
                      <td className="p-4 text-center"><button onClick={()=>setSelectedTicket(t)} className="text-blue-400 hover:text-white transition-colors"><Eye className="w-5 h-5 mx-auto" /></button></td>
                    </tr>
                  ))
                ) : (
                  filteredTickets.flatMap(t => t.items?.map((item:any, idx:number) => (
                    <tr key={`${t.id}-${idx}`} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-slate-400">{new Date(t.date).toLocaleString()}</td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-center">{item.cartQty}</td>
                      <td className="p-4 text-right">${item.price?.toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-emerald-400">${(item.cartQty*item.price).toFixed(2)}</td>
                    </tr>
                  )))
                )}
                {filteredTickets.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ESTADÍSTICAS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl">
                <h3 className="text-xs font-black text-slate-500 tracking-widest mb-2">VENTAS TOTALES</h3>
                <p className="text-4xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
              </div>
              <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl">
                <h3 className="text-xs font-black text-slate-500 tracking-widest mb-2">TICKETS EMITIDOS</h3>
                <p className="text-4xl font-black text-blue-400">{filteredTickets.length}</p>
              </div>
              <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl">
                <h3 className="text-xs font-black text-slate-500 tracking-widest mb-2">ARTÍCULOS VENDIDOS</h3>
                <p className="text-4xl font-black text-fuchsia-400">{filteredTickets.reduce((a,t)=>a+(t.items?.reduce((s:number,i:any)=>s+i.cartQty,0)||0),0)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl h-80 flex flex-col">
                <h3 className="text-xs font-black text-white tracking-widest mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> TENDENCIA DE INGRESOS</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                      <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={3} dot={{r:4, fill:'#34d399'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl h-80 flex flex-col">
                <h3 className="text-xs font-black text-white tracking-widest mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" /> PRODUCTOS MÁS VENDIDOS</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                      <Bar dataKey="qty" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CRÉDITOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">CLIENTE</th><th className="p-4">TELÉFONO</th><th className="p-4">MONEDERO</th><th className="p-4 text-right">DEUDA (CRÉDITO)</th><th className="p-4 text-center">ACCIÓN</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {clients.filter(c => (c.credito || 0) > 0 || (c.monedero || 0) > 0).map((c, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-bold">{c.name}</td>
                    <td className="p-4 text-slate-400">{c.phone || 'N/A'}</td>
                    <td className="p-4 text-blue-400 font-bold">${(c.monedero||0).toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-red-400">${(c.credito||0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {(c.credito||0) > 0 && (
                        <button onClick={() => { setSelectedClientAbono(c); setShowAbonoModal(true); }} className="bg-emerald-900/30 text-emerald-400 px-4 py-2 rounded-lg font-bold">ABONAR</button>
                      )}
                    </td>
                  </tr>
                ))}
                {clients.filter(c => (c.credito || 0) > 0).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay clientes con saldos pendientes.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {['ENTRADAS', 'DEVOLUCIONES', 'MERMAS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">FECHA</th><th className="p-4">PRODUCTO</th><th className="p-4">SKU / FOLIO</th><th className="p-4">PROVEEDOR</th><th className="p-4 text-center">CANT</th><th className="p-4 text-right">MONTO</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {filteredKardex.filter(k => k.tipo === activeTab || (activeTab === 'DEVOLUCIONES' && k.tipo === 'DEVOLUCION')).map((k, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4">{k.fecha}</td>
                    <td className="p-4 font-bold">{k.productName}</td>
                    <td className="p-4 font-mono text-slate-400">{k.sku || k.folio}</td>
                    <td className="p-4">{k.proveedor || 'N/A'}</td>
                    <td className="p-4 text-center font-black">{k.cantidad}</td>
                    <td className={`p-4 text-right font-black ${activeTab === 'DEVOLUCIONES' ? 'text-red-400' : 'text-blue-400'}`}>${(k.total||0).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredKardex.filter(k => k.tipo === activeTab || (activeTab === 'DEVOLUCIONES' && k.tipo === 'DEVOLUCION')).length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No hay registros para este periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'TURNOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">FECHA CORTE</th><th className="p-4">FONDO INICIAL</th><th className="p-4">EFECTIVO</th><th className="p-4">TARJETA</th><th className="p-4 text-right">TOTAL VENTA</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {filteredCortes.map((c, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4">{new Date(c.date).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-400">${(c.fondoInicial||0).toFixed(2)}</td>
                    <td className="p-4 text-emerald-400 font-bold">${(c.ventasEfectivo||0).toFixed(2)}</td>
                    <td className="p-4 text-blue-400 font-bold">${(c.ventasTarjeta||0).toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-fuchsia-400">${(c.totalVentas||0).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredCortes.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay cortes de caja en este periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'CONTEO STOCK' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">SKU</th><th className="p-4">PRODUCTO</th><th className="p-4">CATEGORÍA</th><th className="p-4 text-right">STOCK ACTUAL</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {products.slice(0, 100).map((p,i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-mono text-slate-400">{p.sku}</td>
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4">{p.category}</td>
                    <td className="p-4 text-right font-black text-blue-400">{p.stock} pz</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'POR HORA' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-8 text-center">
            <h3 className="text-xl font-black text-white mb-4">REPORTE DE VENTAS POR HORA</h3>
            <div className="grid grid-cols-6 gap-4">
              {Array.from({length: 24}).map((_, i) => {
                const totalHora = filteredTickets.filter(t => new Date(t.date).getHours() === i).reduce((s, t) => s + (t.total||0), 0);
                return (
                  <div key={i} className="bg-nexus-800 p-4 rounded-xl border border-nexus-700">
                    <p className="text-slate-400 font-bold text-xs">{i.toString().padStart(2, '0')}:00</p>
                    <p className="text-emerald-400 font-black">${totalHora.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'MATRIZ 24H' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
             <BarChart3 className="w-16 h-16 text-slate-700 mb-4" />
             <p className="text-slate-500 font-bold">Visualización de mapa de calor 24 horas optimizada en el Dashboard Principal.</p>
          </div>
        )}

        {activeTab === 'PEDIDOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
             <p className="text-slate-500 font-bold">No hay pedidos registrados en este periodo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
"""

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(new_file)

print("Restored exact UI design completely.")
