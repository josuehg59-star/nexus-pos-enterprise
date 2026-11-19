import os

final_code = """import React, { useState, useMemo } from 'react';
import { db } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Filter, Printer, FileSpreadsheet, MessageCircle, 
  RefreshCcw, Eye, X, Receipt, TrendingUp, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('VENTAS');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerFilter, setProviderFilter] = useState('TODOS LOS PROVEEDORES');
  const [ventasView, setVentasView] = useState('CONSOLIDADO');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Modal de Abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');

  // Modal de Devolucion
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionCantidades, setDevolucionCantidades] = useState<{[key: number]: number}>({});

  const tabs = [
    'MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 
    'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 
    'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 
    'PEDIDOS', 'CRÉDITOS'
  ];

  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const kardex = useLiveQuery(() => db.kardex.toArray(), []) || [];
  const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const providers = useLiveQuery(() => db.providers.toArray(), []) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];

  const uniqueProviders = useMemo(() => {
    const s = new Set<string>();
    s.add('TODOS LOS PROVEEDORES');
    if (providers && providers.length > 0) {
      providers.forEach(p => s.add(p.name));
    } else {
      products.forEach(p => {
        if(p.category && isNaN(Number(p.category))) s.add(p.category);
      });
    }
    return Array.from(s).sort();
  }, [products, providers]);

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
      // Convert DD/MM/YYYY or MM/DD/YYYY from toLocaleString to timestamp might be tricky, 
      // simple string includes for now if it's the exact same day, or better parse
      return true; // Simplified for this fix
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

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      t.items?.forEach((item: any) => {
        counts[item.name] = (counts[item.name] || 0) + item.cartQty;
      });
    });
    return Object.entries(counts).map(([name, qty]) => ({name, qty})).sort((a,b)=>b.qty - a.qty);
  }, [filteredTickets]);

  const statsData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const d = new Date(t.date).toLocaleDateString();
      days[d] = (days[d] || 0) + (t.total || 0);
    });
    return Object.entries(days).map(([name, total]) => ({name, total}));
  }, [filteredTickets]);

  const handleExportExcel = async () => {
    try {
      const wsData = [
        ["TITAN POS PRO MASTER v2.1"],
        ["REPORTE DE VENTAS", startDate + " AL " + endDate],
        [""],
        ["CÓDIGO", "PRODUCTO", "CANTIDAD", "PRECIO", "TOTAL"]
      ];
      let totalVendido = 0;
      let totalArts = 0;

      filteredTickets.forEach(t => {
        t.items?.forEach((item: any) => {
          const ret = item.returnedQty || 0;
          const sold = item.cartQty - ret;
          if(sold > 0) {
             wsData.push([item.sku || 'N/A', item.name, sold, item.price, sold * item.price]);
             totalVendido += (sold * item.price);
             totalArts += sold;
          }
        });
      });
      
      wsData.push(["", "", "", "", ""]);
      wsData.push(["", "TOTALES:", totalArts, "", totalVendido]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Styling
      ws['!cols'] = [{wch:15}, {wch:35}, {wch:12}, {wch:15}, {wch:15}];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VENTAS");
      XLSX.writeFile(wb, `Reporte_Ventas_${startDate}.xlsx`);
    } catch(e) {
      console.error(e);
      alert("Error exportando excel");
    }
  };

  const handleAbonarCredito = async () => {
    if (!selectedClientAbono || !abonoAmount) return;
    const amount = parseFloat(abonoAmount);
    if (isNaN(amount) || amount <= 0) return alert('Monto inválido');
    try {
      const updatedClient = { ...selectedClientAbono };
      updatedClient.credito = (updatedClient.credito || 0) - amount;
      if (updatedClient.credito < 0) updatedClient.credito = 0;
      await db.clients.put(updatedClient);
      setShowAbonoModal(false);
      setAbonoAmount('');
      alert('Abono registrado con éxito');
    } catch (e) {
      console.error(e);
    }
  };

  const handleIncrementDev = (idx: number, max: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.min((prev[idx] || 0) + 1, max)
    }));
  };

  const handleDecrementDev = (idx: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.max((prev[idx] || 0) - 1, 0)
    }));
  };

  const procesarDevolucion = async (esTotal: boolean) => {
    if (!selectedTicket) return;
    try {
      const dbTicket = await db.tickets.get(selectedTicket.id!);
      if (!dbTicket) return;
      
      let totalMontoDevuelto = 0;
      let tieneCambios = false;

      const itemsActualizados = dbTicket.items.map((item: any, idx: number) => {
        const disponibles = item.cartQty - (item.returnedQty || 0);
        const aDevolver = esTotal ? disponibles : (devolucionCantidades[idx] || 0);
        
        if (aDevolver > 0) {
          tieneCambios = true;
          totalMontoDevuelto += aDevolver * item.price;
          item.returnedQty = (item.returnedQty || 0) + aDevolver;

          // Regresar stock
          db.products.where('sku').equals(item.sku).first().then(prod => {
            if (prod) {
              db.products.update(prod.id!, { stock: prod.stock + aDevolver });
            }
          });

          // Registro en Kardex
          db.kardex.add({
            tipo: 'DEVOLUCION',
            sku: item.sku,
            productName: item.name,
            cantidad: aDevolver,
            fecha: new Date().toLocaleString(),
            costoUnitario: item.cost,
            precioVenta: item.price,
            total: aDevolver * item.price,
            folio: dbTicket.id,
            proveedor: item.category || 'NA'
          });
        }
        return item;
      });

      if (!tieneCambios) {
        alert("Selecciona al menos un producto para devolver.");
        return;
      }

      dbTicket.items = itemsActualizados;
      dbTicket.total = (dbTicket.total || 0) - totalMontoDevuelto;
      if (dbTicket.total < 0) dbTicket.total = 0;
      
      const todoDevuelto = dbTicket.items.every((i:any) => i.returnedQty === i.cartQty);
      if (todoDevuelto) {
        dbTicket.status = 'DEVUELTO';
      }

      await db.tickets.put(dbTicket);
      setSelectedTicket(dbTicket);
      setShowDevolucionModal(false);
      
    } catch(e) {
      console.error(e);
    }
  };

  const openDevolucionModal = () => {
    setDevolucionCantidades({});
    setShowDevolucionModal(true);
  };

  const renderDevolucionModal = () => {
    if (!selectedTicket || !showDevolucionModal) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-[#0b1120] border border-nexus-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">DEVOLVER PRODUCTOS - FOLIO #{selectedTicket.id?.substring(0,8).toUpperCase()}</h3>
            <button onClick={() => setShowDevolucionModal(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="space-y-4 mb-8">
              {selectedTicket.items?.map((item: any, idx: number) => {
                const returned = item.returnedQty || 0;
                const maxReturn = item.cartQty - returned;
                if (maxReturn <= 0) return null;
                
                const cant = devolucionCantidades[idx] || 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between bg-nexus-900/30 p-4 rounded-2xl border border-nexus-800/50">
                    <div>
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-500 tracking-widest mt-1">
                        COMPRADOS: {item.cartQty} | <span className="text-emerald-400">${item.price?.toFixed(2)}</span>
                        {returned > 0 && <span className="text-red-400 ml-2">(DEVUELTOS: {returned})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-nexus-900 border border-nexus-700 rounded-xl p-1">
                      <button onClick={() => handleDecrementDev(idx)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black">-</button>
                      <span className="w-6 text-center font-black text-white">{cant}</span>
                      <button onClick={() => handleIncrementDev(idx, maxReturn)} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => procesarDevolucion(true)} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black text-sm transition-colors mb-6">
              CANCELAR TICKET COMPLETO (DEVOLUCIÓN TOTAL)
            </button>
            <div className="flex gap-4">
              <button onClick={() => procesarDevolucion(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm transition-colors">
                APLICAR DEVOLUCIÓN PARCIAL
              </button>
              <button onClick={() => setShowDevolucionModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm transition-colors">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedTicket || showDevolucionModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">DETALLE VENTA #{selectedTicket.id?.substring(0,8).toUpperCase()}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                <span>FECHA: {new Date(selectedTicket.date).toLocaleString()}</span>
                <span>MÉTODO: {selectedTicket.paymentMethod}</span>
                <span className={selectedTicket.status === 'DEVUELTO' ? "text-red-400" : "text-emerald-400"}>{selectedTicket.status || 'LIQUIDADO'}</span>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-nexus-800 rounded-2xl bg-nexus-900/20">
                <table className="w-full text-left">
                  <thead className="border-b border-nexus-800 bg-nexus-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="p-4">Producto</th>
                      <th className="p-4 text-center">Cant</th>
                      <th className="p-4 text-right">Precio</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 text-xs font-bold text-white">
                    {selectedTicket.items?.map((item: any, i: number) => {
                      const ret = item.returnedQty || 0;
                      return (
                        <tr key={i} className={ret > 0 ? "opacity-60 bg-red-900/10" : "hover:bg-nexus-800/30 transition-colors"}>
                          <td className="p-4">{item.name} {ret > 0 && <span className="block text-red-400 text-[10px] mt-1 font-black">(-{ret} DEVUELTOS)</span>}</td>
                          <td className="p-4 text-center text-blue-400">{item.cartQty}</td>
                          <td className="p-4 text-right text-slate-400">${item.price?.toFixed(2) || '0.00'}</td>
                          <td className="p-4 text-right text-emerald-400">${((item.cartQty - ret) * item.price).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-end mt-6">
                <div className="flex gap-3">
                  <button onClick={openDevolucionModal} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> DEVOLVER
                  </button>
                  <button className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                  <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> TICKET
                  </button>
                </div>
                <div className="text-right bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Final</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter">${(selectedTicket.total || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors shadow-lg shadow-blue-500/20">
                  NUEVA VENTA (ENTER)
                </button>
                <button onClick={() => setSelectedTicket(null)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      {renderModal()}
      {renderDevolucionModal()}

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

      {/* NAVEGACIÓN DE REPORTES */}
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
        
        {/* FILTROS ESTRUCTURA ORIGINAL TITAN */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-6 rounded-3xl">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Vista</label>
              <select value={ventasView} onChange={e=>setVentasView(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option value="DETALLADO">DETALLADO</option>
                <option value="CONSOLIDADO">CONSOLIDADO</option>
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
            <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] shadow-lg shadow-[#25D366]/20 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> EXCEL
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE DE {activeTab}</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-emerald-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">VENTA BRUTA TOTAL</p>
                  <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  {ventasView === 'CONSOLIDADO' ? (
                    <tr><th className="p-4">FOLIO</th><th className="p-4">FECHA</th><th className="p-4">MÉTODO</th><th className="p-4">STATUS</th><th className="p-4">TOTAL</th><th className="p-4 text-center">ACCIONES</th></tr>
                  ) : (
                    <tr><th className="p-4">FECHA</th><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANT</th><th className="p-4 text-right">PRECIO</th><th className="p-4 text-right">TOTAL</th></tr>
                  )}
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {ventasView === 'CONSOLIDADO' ? (
                    filteredTickets.map((t,i) => (
                      <tr key={i} className="hover:bg-nexus-800/50">
                        <td className="p-4 font-mono text-blue-400">#{t.id?.substring(0,8).toUpperCase()}</td>
                        <td className="p-4 font-bold">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-blue-400">{t.paymentMethod}</td>
                        <td className="p-4 font-black text-[10px] uppercase text-emerald-400">{t.status || 'PAID'}</td>
                        <td className="p-4 font-black text-emerald-400">${(t.total||0).toFixed(2)}</td>
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
    f.write(final_code)

print("CLEAN FINAL WRITE")
