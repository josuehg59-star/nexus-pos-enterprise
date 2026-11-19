const fs = require('fs');
const newContent = \import { useState, useMemo } from 'react';
import { Filter, Printer, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('VENTAS');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerFilter, setProviderFilter] = useState('TODOS');
  const [methodFilter, setMethodFilter] = useState('TODOS');

  const tabs = [
    'MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 
    'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 
    'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 
    'PEDIDOS', 'CRÉDITOS'
  ];

  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const tDate = t.date.split('T')[0];
      const matchDate = tDate >= startDate && tDate <= endDate;
      const matchMethod = methodFilter === 'TODOS' || t.paymentMethod === methodFilter;
      return matchDate && matchMethod;
    });
  }, [tickets, startDate, endDate, methodFilter]);

  const salesData = useMemo(() => {
    let sales = [];
    filteredTickets.forEach(ticket => {
      ticket.items.forEach(item => {
        const realProd = products.find(p => p.sku === item.sku);
        const proveedor = realProd ? (realProd.category || 'SIN PROVEEDOR') : 'SIN PROVEEDOR';
        if (providerFilter !== 'TODOS' && providerFilter !== 'TODOS LOS PROVEEDORES' && proveedor !== providerFilter) return;
        
        sales.push({
          folio: ticket.id?.substring(0,6).toUpperCase(),
          fecha: ticket.date,
          metodo: ticket.paymentMethod,
          sku: item.sku,
          nombre: item.name,
          proveedor: proveedor,
          cant: item.cartQty,
          costo: item.cost,
          precio: item.price,
          total: item.price * item.cartQty,
          utilidad: (item.price - item.cost) * item.cartQty
        });
      });
    });
    return sales;
  }, [filteredTickets, products, providerFilter]);

  const uniqueProviders = useMemo(() => {
    const provs = new Set(['TODOS LOS PROVEEDORES']);
    products.forEach(p => {
      if (p.category) provs.add(p.category);
    });
    return Array.from(provs);
  }, [products]);

  const ventaBrutaTotal = useMemo(() => {
    if (activeTab === 'FOLIOS') return filteredTickets.reduce((sum, t) => sum + t.total, 0);
    if (activeTab === 'VENTAS') return salesData.reduce((sum, s) => sum + s.total, 0);
    return 0;
  }, [activeTab, filteredTickets, salesData]);

  const exportToExcel = () => {
    let dataToExport = [];
    if (activeTab === 'FOLIOS') {
      dataToExport = filteredTickets.map(t => ({
        Folio: t.id?.substring(0,8),
        Fecha: new Date(t.date).toLocaleDateString(),
        Hora: new Date(t.date).toLocaleTimeString(),
        Metodo: t.paymentMethod,
        Total: t.total
      }));
    } else if (activeTab === 'VENTAS') {
      dataToExport = salesData.map(s => ({
        Folio: s.folio,
        Fecha: new Date(s.fecha).toLocaleDateString(),
        Hora: new Date(s.fecha).toLocaleTimeString(),
        Codigo: s.sku,
        Producto: s.nombre,
        Metodo: s.metodo,
        Proveedor: s.proveedor,
        Cantidad: s.cant,
        Costo: s.costo,
        Precio: s.precio,
        Total: s.total,
        Utilidad: s.utilidad
      }));
    } else {
      alert("Exportación no configurada para esta pestaña.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, \REPORTE_\_\.xlsx\);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      
      {/* NAVEGACIÓN */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-nexus-800 overflow-x-auto custom-scrollbar shrink-0 bg-nexus-900/50">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={\whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border \\}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* FILTROS CON FORMATO ORIGINAL */}
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
              <select 
                value={providerFilter} 
                onChange={e => setProviderFilter(e.target.value)} 
                className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent"
              >
                {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Método Pago</label>
              <select 
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
                className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent"
              >
                <option>TODOS</option>
                <option>EFECTIVO</option>
                <option>TARJETA</option>
                <option>TRANSFERENCIA</option>
                <option>MERCADO PAGO</option>
                <option>MONEDERO</option>
                <option>CRÉDITO</option>
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
                <option>ESTE MES</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fecha Inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Fecha Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent [color-scheme:dark]" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <Filter className="w-4 h-4" /> FILTRAR
            </button>
            <button className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <Printer className="w-4 h-4" /> IMPRIMIR / PDF
            </button>
          </div>
        </div>

        {/* TABLA RESULTADOS ORIGINAL */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">REPORTE DE {activeTab}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{startDate} AL {endDate}</p>
              
              <div className="mt-4 inline-block bg-nexus-900 border border-nexus-700 p-4 rounded-2xl shadow-lg border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Venta Bruta Total</p>
                <p className="text-2xl font-black text-emerald-400">\</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                <FileSpreadsheet className="w-4 h-4" /> EXCEL
              </button>
              <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                <MessageCircle className="w-4 h-4" /> WHATSAPP
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-nexus-800 bg-nexus-900/50">
            {activeTab === 'FOLIOS' ? (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Folio</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {filteredTickets.map((t, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                      <td className="p-4 font-black text-blue-400 text-xs">#{t.id?.substring(0,6).toUpperCase()}</td>
                      <td className="p-4 font-bold text-white text-xs">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-white text-xs">{new Date(t.date).toLocaleTimeString()}</td>
                      <td className="p-4"><span className="bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded text-[10px] font-black uppercase">{t.paymentMethod}</span></td>
                      <td className="p-4"><span className="text-emerald-400 font-black text-[10px] uppercase">PAID</span></td>
                      <td className="p-4 font-black text-emerald-400 text-xs">\</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeTab === 'VENTAS' ? (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Cant.</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Costo</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Precio</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Util.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {salesData.map((s, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                      <td className="p-4 font-bold text-white text-xs">{new Date(s.fecha).toLocaleTimeString()}</td>
                      <td className="p-4 font-bold text-blue-400 text-xs">{s.sku}</td>
                      <td className="p-4 font-bold text-white text-xs">{s.nombre}</td>
                      <td className="p-4 font-bold text-slate-300 text-[10px] uppercase">{s.metodo}</td>
                      <td className="p-4 font-bold text-blue-300 text-[10px] uppercase">{s.proveedor}</td>
                      <td className="p-4 font-black text-white text-xs text-right">{s.cant}</td>
                      <td className="p-4 font-mono text-slate-400 text-xs text-right">\</td>
                      <td className="p-4 font-mono text-white text-xs text-right">\</td>
                      <td className="p-4 font-mono font-black text-emerald-400 text-xs text-right">\</td>
                      <td className="p-4 font-mono font-black text-fuchsia-400 text-xs text-right">\</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-bold mb-4">Módulo analítico en construcción progresiva.</p>
                <p className="text-sm text-slate-500">Por favor utiliza las pestañas <strong className="text-white">VENTAS</strong> o <strong className="text-white">FOLIOS</strong> para ver los datos extraídos en tiempo real con exportación a Excel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
\;
fs.writeFileSync('src/pages/Reports.tsx', newContent);
console.log('Done restoring UI');
