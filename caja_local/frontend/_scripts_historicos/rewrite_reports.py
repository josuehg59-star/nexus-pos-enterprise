import os

content = """import React, { useState, useMemo } from 'react';
import { db } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, Filter, Download, MessageCircle, FileSpreadsheet, RotateCcw, X, Printer, BarChart3, TrendingUp, CreditCard } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('VENTAS');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [ventasView, setVentasView] = useState('DETALLADO'); // DETALLADO o CONSOLIDADO
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');

  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const kardex = useLiveQuery(() => db.kardex.toArray(), []) || [];
  const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const uniqueProviders = useMemo(() => {
    const s = new Set<string>();
    s.add('TODOS');
    products.forEach(p => {
      if(p.category) s.add(p.category);
    });
    return Array.from(s).sort();
  }, [products]);

  // DATE FILTERS
  const filteredTickets = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return tickets.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [tickets, startDate, endDate]);

  const filteredKardex = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return kardex.filter(k => {
      if(!k.fecha) return true;
      const tTime = new Date(k.fecha).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [kardex, startDate, endDate]);

  const filteredCortes = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return cortes.filter(c => {
      const tTime = new Date(c.date).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [cortes, startDate, endDate]);

  // EXPORT EXCEL MASTER
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];
      
      // Encabezado
      wsData.push(["NEXUS POS - REPORTE DE SUCURSAL"]);
      wsData.push(["FECHA INICIO:", startDate, "FECHA FIN:", endDate]);
      wsData.push(["REPORTE GENERADO:", new Date().toLocaleString()]);
      wsData.push([]); // Espacio
      
      if (activeTab === 'VENTAS') {
        wsData.push(["FOLIO", "FECHA", "PRODUCTO", "CANTIDAD", "PRECIO", "TOTAL", "METODO PAGO", "ESTATUS"]);
        filteredTickets.forEach(t => {
          t.items?.forEach((item: any) => {
            wsData.push([
              t.id?.substring(0,8).toUpperCase(),
              new Date(t.date).toLocaleString(),
              item.name,
              item.cartQty,
              item.price,
              item.cartQty * item.price,
              t.paymentMethod,
              t.status || 'PAGADO'
            ]);
          });
        });
      } else if (activeTab === 'CRÉDITOS') {
        wsData.push(["CLIENTE", "TELÉFONO", "SALDO PENDIENTE"]);
        clients.filter(c => (c.credito || 0) > 0).forEach(c => {
          wsData.push([c.name, c.phone || 'N/A', c.credito]);
        });
      } else if (activeTab === 'ENTRADAS' || activeTab === 'MERMAS') {
        wsData.push(["FECHA", "SKU", "PRODUCTO", "TIPO", "PROVEEDOR", "CANTIDAD", "COSTO", "TOTAL"]);
        filteredKardex.filter(k => activeTab === 'ENTRADAS' ? k.tipo === 'ENTRADA' : k.tipo === 'MERMA').forEach(k => {
          wsData.push([
            k.fecha,
            k.sku,
            k.productName,
            k.tipo,
            k.proveedor || 'N/A',
            k.cantidad,
            k.costo,
            k.total
          ]);
        });
      }
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Estilos bsicos en sheet (anchos)
      ws['!cols'] = [{wch: 15}, {wch: 20}, {wch: 35}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}];
      
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      XLSX.writeFile(wb, `Reporte_${activeTab}_${startDate}_al_${endDate}.xlsx`);
    } catch(e) {
      alert("Error al exportar a Excel. Verifique que haya datos.");
    }
  };

  const handleDevolverParcial = async (ticket: any, itemIndex: number) => {
    try {
      const item = ticket.items[itemIndex];
      const returned = item.returnedQty || 0;
      const available = item.cartQty - returned;
      
      if (available <= 0) return alert('Ya se han devuelto todas las piezas.');
      
      const qtyStr = prompt(`¿Cuántas piezas de ${item.name} deseas devolver? (Máximo: ${available})`, '1');
      if(!qtyStr) return;
      const qty = parseInt(qtyStr);
      if (isNaN(qty) || qty <= 0 || qty > available) return alert('Cantidad inválida.');
      
      if(!window.confirm(`¿Confirmas la devolución de ${qty}pz de ${item.name}?`)) return;
      
      const newItems = [...ticket.items];
      newItems[itemIndex].returnedQty = (newItems[itemIndex].returnedQty || 0) + qty;
      
      const amountRefunded = item.price * qty;
      const newTotal = ticket.total - amountRefunded;
      const newStatus = newItems.every(i => (i.returnedQty || 0) >= i.cartQty) ? 'DEVOLUCION' : ticket.status;
      
      await db.tickets.update(ticket.id, { items: newItems, total: newTotal, status: newStatus });
      
      await db.kardex.add({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'DEVOLUCION',
        sku: item.sku,
        productName: item.name,
        cantidad: qty,
        costo: item.cost || 0,
        precio: item.price,
        total: amountRefunded,
        folio: ticket.id,
        proveedor: 'CLIENTE'
      });
      
      const p = await db.products.where('sku').equals(item.sku).first();
      if (p && p.id) await db.products.update(p.id, { stock: Number(p.stock) + qty });
      
      alert(`Devolución parcial aplicada: ${qty}pz por $${amountRefunded.toFixed(2)}.`);
      setSelectedTicket(await db.tickets.get(ticket.id));
    } catch(e) {
      alert("Error al procesar devolución");
    }
  };

  const renderModal = () => {
    if (!selectedTicket) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0b1120] border border-nexus-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">TICKET #{selectedTicket.id?.substring(0,8).toUpperCase()}</h2>
              <p className="text-xs text-slate-500 font-bold mt-1">MÉTODO: {selectedTicket.paymentMethod}</p>
            </div>
            <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white bg-nexus-800 p-2 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-nexus-800 text-slate-500">
                <tr><th className="pb-2">PRODUCTO</th><th className="pb-2 text-center">CANT</th><th className="pb-2 text-right">PRECIO</th><th className="pb-2 text-right">TOTAL</th></tr>
              </thead>
              <tbody className="text-white divide-y divide-nexus-800/50">
                {selectedTicket.items?.map((item: any, i: number) => {
                  const ret = item.returnedQty || 0;
                  const av = item.cartQty - ret;
                  return (
                    <tr key={i} className={ret > 0 ? "opacity-75" : ""}>
                      <td className="py-3 font-bold">{item.name} {ret > 0 && <span className="text-red-400 text-[9px] ml-2">(-{ret} DEV)</span>}</td>
                      <td className="py-3 font-black text-center">{item.cartQty}</td>
                      <td className="py-3 text-right">${item.price?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 font-black text-emerald-400 text-right flex items-center justify-end gap-2">
                        ${(item.cartQty * item.price).toFixed(2)}
                        {av > 0 && <button onClick={() => handleDevolverParcial(selectedTicket, i)} className="bg-red-900/30 text-red-500 text-[9px] px-2 py-1 rounded">RETORNAR</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-nexus-800 bg-nexus-900 flex justify-between items-center">
            <div className="text-right ml-auto">
              <p className="text-[10px] text-slate-500 font-black tracking-widest">TOTAL FINAL</p>
              <p className="text-3xl font-black text-emerald-400">${(selectedTicket.total || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleAbonarCredito = async () => {
    if(!selectedClientAbono) return;
    const a = parseFloat(abonoAmount);
    if(isNaN(a) || a <= 0) return alert('Cantidad inválida');
    if(a > (selectedClientAbono.credito||0)) return alert('El abono es mayor a la deuda');
    try {
      await db.clients.update(selectedClientAbono.id, { credito: selectedClientAbono.credito - a });
      alert('Abono registrado');
      setShowAbonoModal(false); setAbonoAmount(''); setSelectedClientAbono(null);
    } catch(e) { alert('Error al guardar abono'); }
  };

  // DATOS PARA ESTADÍSTICAS
  const statsData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const d = new Date(t.date).toLocaleDateString();
      days[d] = (days[d] || 0) + (t.total || 0);
    });
    return Object.entries(days).map(([name, total]) => ({ name, total }));
  }, [filteredTickets]);

  const topProducts = useMemo(() => {
    const p: Record<string, number> = {};
    filteredTickets.forEach(t => {
      t.items?.forEach((i:any) => {
        p[i.name] = (p[i.name] || 0) + i.cartQty;
      });
    });
    return Object.entries(p).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name, qty]) => ({ name, qty }));
  }, [filteredTickets]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200">
      {renderModal()}
      
      {showAbonoModal && selectedClientAbono && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-900 border border-nexus-700 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="text-xl font-black text-white mb-4">LIQUIDAR DEUDA</h3>
            <p className="text-sm text-slate-400 mb-4">Cliente: <span className="text-white font-bold">{selectedClientAbono.name}</span></p>
            <p className="text-xl font-black text-red-400 mb-6">Deuda: ${selectedClientAbono.credito?.toFixed(2)}</p>
            <input type="number" value={abonoAmount} onChange={e=>setAbonoAmount(e.target.value)} placeholder="Monto a abonar..." className="w-full bg-[#0b1120] border border-nexus-700 p-4 rounded-xl text-white font-bold text-lg mb-4" />
            <div className="flex gap-2">
              <button onClick={()=>setShowAbonoModal(false)} className="flex-1 bg-nexus-800 py-3 rounded-xl font-bold">CANCELAR</button>
              <button onClick={handleAbonarCredito} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold text-white">GUARDAR ABONO</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-6 bg-nexus-900/50 border-b border-nexus-800 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-blue-500" />
          CENTRO DE REPORTES
        </h1>
        <div className="flex gap-4 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-500 block mb-1">INICIO</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-lg font-mono text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 block mb-1">FIN</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-lg font-mono text-xs" />
          </div>
          <button onClick={handleExportExcel} className="bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-6 py-2 rounded-lg font-black text-xs h-[38px] flex items-center gap-2">
            <Download className="w-4 h-4" /> EXPORTAR
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-4 bg-nexus-900/30 overflow-x-auto custom-scrollbar shrink-0 border-b border-nexus-800">
        {['VENTAS', 'ESTADÍSTICAS', 'CRÉDITOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-3 rounded-xl font-black text-[10px] tracking-widest whitespace-nowrap transition-all ${activeTab === t ? 'bg-[#2a68ff] text-white shadow-lg shadow-blue-600/20' : 'bg-nexus-800/50 text-slate-400 hover:bg-nexus-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {activeTab === 'VENTAS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-nexus-900 p-4 rounded-xl border border-nexus-800">
              <div className="flex gap-4">
                <select value={ventasView} onChange={e=>setVentasView(e.target.value)} className="bg-[#0b1120] border border-nexus-700 text-white px-4 py-2 rounded-lg font-bold text-xs">
                  <option value="CONSOLIDADO">VISTA CONSOLIDADA (FOLIOS)</option>
                  <option value="DETALLADO">VISTA DETALLADA (POR PRODUCTO)</option>
                </select>
                <select value={providerFilter} onChange={e=>setProviderFilter(e.target.value)} className="bg-[#0b1120] border border-nexus-700 text-white px-4 py-2 rounded-lg font-bold text-xs">
                  {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase">Total Periodo</p>
                <p className="text-2xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0), 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  {ventasView === 'CONSOLIDADO' ? (
                    <tr><th className="p-4">FOLIO</th><th className="p-4">FECHA</th><th className="p-4">MÉTODO</th><th className="p-4">ARTÍCULOS</th><th className="p-4 text-right">TOTAL</th><th className="p-4 text-center">ACCIÓN</th></tr>
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
                        <td className="p-4">{t.items?.reduce((acc:number, it:any)=>acc+it.cartQty, 0)} pz</td>
                        <td className="p-4 text-right font-black text-emerald-400">${(t.total||0).toFixed(2)}</td>
                        <td className="p-4 text-center"><button onClick={()=>setSelectedTicket(t)} className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded text-[10px] font-bold">VER DETALLE</button></td>
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
                  {filteredTickets.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
                </tbody>
              </table>
            </div>
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

      </div>
    </div>
  );
}
"""
with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reports.tsx completely rebuilt.")
