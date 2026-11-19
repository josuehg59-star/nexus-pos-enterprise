import { useState, useMemo } from 'react';
import { ShoppingCart, Phone, ArrowDownToLine, Package, Users, Wallet, Activity, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { parseUniversalTimestamp } from '../utils/dateUtils';

export default function DashboardBI({ onNavigate }: { onNavigate?: (modId: string, subItem: string) => void } = {}) {
  const [timeFilter, setTimeFilter] = useState('Hoy');

  // Load Data
  const tickets = useLiveQuery(() => db.tickets.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const cortes = useLiveQuery(() => db.cortes.toArray()) || [];
  const turnos = useLiveQuery(() => db.turnos.toArray()) || [];

  const getTicketTs = (dStr: any): number => {
    return parseUniversalTimestamp(dStr);
  };

  const getTicketItems = (t: any): any[] => {
    if (!t || !t.items) return [];
    if (Array.isArray(t.items)) return t.items;
    if (typeof t.items === 'string') {
      try {
        const parsed = JSON.parse(t.items);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Cálculos de tiempo
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const ticketsHoy = tickets.filter(t => getTicketTs(t.date) >= startOfDay);

  const ventasHoyCount = ticketsHoy.length;
  const ingresosHoy = ticketsHoy.reduce((sum, t) => sum + (t.total || 0), 0);
  
  // Utilidad real (Precio - Costo)
  const utilidadHoy = ticketsHoy.reduce((sum, t) => {
    const items = getTicketItems(t);
    const gananciaTicket = items.reduce((acc: number, item: any) => {
      const qty = item.cartQty || item.qty || 1;
      const price = item.price || 0;
      const cost = item.cost || (price * 0.7);
      return acc + ((price - cost) * qty);
    }, 0);
    return sum + gananciaTicket;
  }, 0);

  const totalProductos = products.length;
  const totalClientes = clients.length;

  // Obtener último corte Z de caja
  const lastCorteTime = useMemo(() => {
    if (!cortes || cortes.length === 0) return 0;
    let maxTs = 0;
    cortes.forEach(c => {
      const ts = getTicketTs(c.date);
      if (ts > maxTs) maxTs = ts;
    });
    return maxTs;
  }, [cortes]);

  // Turno activo
  const activeTurno = useMemo(() => {
    if (!turnos || turnos.length === 0) return null;
    return turnos.find(t => t.estado === 'ACTIVO') || null;
  }, [turnos]);

  // CAJA ACTUAL: dinero en caja efectivo generado en el turno activo DESPUÉS del último corte Z
  const cajaActual = useMemo(() => {
    // Si no hay turno activo, la caja queda en 0 tras el corte
    if (!activeTurno) return 0;

    const shiftStart = getTicketTs(activeTurno.fechaApertura);
    const cutoffTime = Math.max(shiftStart, lastCorteTime);

    // Filtrar tickets realizados tras la apertura de turno o último corte Z
    const ticketsTurnoActual = tickets.filter(t => {
      const tTs = getTicketTs(t.date);
      return tTs > cutoffTime;
    });

    // Sumar ventas en efectivo registradas en este turno tras el corte
    const ventasEfectivo = ticketsTurnoActual
      .filter(t => !t.paymentMethod || t.paymentMethod === 'EFECTIVO' || t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return ventasEfectivo;
  }, [tickets, activeTurno, lastCorteTime]);

  const valorInventario = products.reduce((sum, p) => sum + ((p.cost || p.price * 0.7) * Math.max(0, p.stock || 0)), 0);

  // Top 5 Productos seguro
  const productosVendidos = new Map<string, number>();
  tickets.forEach(ticket => {
    const items = getTicketItems(ticket);
    items.forEach((item: any) => {
      if (item && item.name) {
        const current = productosVendidos.get(item.name) || 0;
        productosVendidos.set(item.name, current + (item.cartQty || item.qty || 1));
      }
    });
  });

  const topProductos = Array.from(productosVendidos.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Stock Crítico
  const stockCritico = products
    .filter(p => p.stock <= (p as any).min_stock || p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  // Gráfica de últimos 6 meses (Simulada/Calculada si hay data vieja)
  const chartData = useMemo(() => {
    // Generate the last 6 months dynamically based on the current date and tickets
    const data: {name: string, ventas: number}[] = [];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[d.getMonth()];
      
      // Calculate real sales for this month
      const monthStart = d.getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime();
      
      const realSales = tickets.filter(t => {
        const time = getTicketTs(t.date);
        return time >= monthStart && time <= monthEnd;
      }).reduce((sum, t) => sum + (Number(t.total) || 0), 0);

      data.push({
        name: monthName,
        ventas: realSales > 0 ? realSales : 0 // Remove hardcoded mock if they want real DB data
      });
    }
    return data;
  }, [tickets]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-y-auto custom-scrollbar p-3 sm:p-6">
      
      {/* HEADER TIPO TITAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 shrink-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase">NEXUS BI DASHBOARD</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">SERVIDOR LOCAL ACTIVO</span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            {now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <select 
            value={timeFilter} 
            onChange={e => setTimeFilter(e.target.value)}
            className="bg-[#111827] border border-nexus-800 text-blue-400 font-bold px-3 py-1.5 rounded-lg outline-none text-xs uppercase tracking-widest w-full sm:w-auto"
          >
            <option value="Hoy">Ventas de Hoy</option>
            <option value="Historico">Histórico Total</option>
          </select>
        </div>
      </div>

      {/* METRICAS SUPERIORES (NEON CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 mb-4 sm:mb-6 shrink-0">
        {[
          { title: timeFilter === 'Hoy' ? 'VENTAS HOY' : 'VENTAS TOTAL', value: ventasHoyCount.toString(), color: 'border-blue-500/60', text: 'text-white' },
          { title: timeFilter === 'Hoy' ? 'INGRESOS HOY' : 'INGRESOS TOTAL', value: `$${ingresosHoy.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-emerald-500/60', text: 'text-emerald-400' },
          { title: timeFilter === 'Hoy' ? 'UTILIDAD HOY' : 'UTILIDAD TOTAL', value: `$${utilidadHoy.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-orange-500/60', text: 'text-orange-400' },
          { title: 'PRODUCTOS', value: totalProductos.toString(), color: 'border-purple-500/60', text: 'text-purple-400' },
          { title: 'CLIENTES', value: totalClientes.toString(), color: 'border-pink-500/60', text: 'text-pink-400' },
          { title: 'CAJA ACTUAL', value: `$${cajaActual.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-cyan-500/60', text: 'text-cyan-400' },
          { title: 'VAL. INV.', value: `$${valorInventario.toLocaleString('es-MX', {minimumFractionDigits: 0})}`, color: 'border-yellow-500/60', text: 'text-yellow-400' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-[#111827] border ${kpi.color} rounded-xl p-2.5 sm:p-3 shadow-md`}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.title}</p>
            <p className={`text-base sm:text-lg font-black ${kpi.text} tracking-tight truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ACCESOS RAPIDOS */}
      <div className="bg-[#111827] border border-nexus-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-xl shrink-0">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">ACCESOS RÁPIDOS</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <button 
            onClick={() => onNavigate?.('operacion', 'Terminal POS')}
            className="bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> PUNTO DE VENTA
          </button>
          <button 
            onClick={() => onNavigate?.('operacion', 'Recargas y Servicios')}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" /> RECARGAS/SERV.
          </button>
          <button 
            onClick={() => onNavigate?.('inventario', 'Entradas')}
            className="bg-[#10b981] hover:bg-[#059669] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" /> ENTRADAS
          </button>
          <button 
            onClick={() => onNavigate?.('inventario', 'Catálogo Maestro')}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Package className="w-3.5 h-3.5" /> CATÁLOGO
          </button>
          <button 
            onClick={() => onNavigate?.('crm', 'Padrón de Clientes')}
            className="bg-[#ec4899] hover:bg-[#db2777] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Users className="w-3.5 h-3.5" /> CLIENTES
          </button>
          <button 
            onClick={() => onNavigate?.('operacion', 'Arqueos y Caja Z')}
            className="bg-[#f97316] hover:bg-[#ea580c] text-white py-2.5 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5" /> CORTE DE CAJA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        
        {/* IZQUIERDA: HISTORIAL DE VENTAS */}
        <div className="lg:col-span-2 bg-[#111827] border border-nexus-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="text-blue-500 w-5 h-5" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">HISTORIAL DE VENTAS</h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">COMPARATIVA DE LOS ÚLTIMOS 6 MESES</p>
          
          <div className="flex-1 min-h-[240px] sm:min-h-[300px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 20, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: '#1f2937' }}
                  contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Bar dataKey="ventas" fill="#047857" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DERECHA: PANELES */}
        <div className="space-y-6">
          
          {/* ACTIVIDAD RECIENTE */}
          <div className="bg-[#111827] border border-nexus-800 rounded-2xl p-4 shadow-xl h-64 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4" /> ACTIVIDAD RECIENTE
            </h3>
            <div className="space-y-4">
              {tickets.slice(0, 10).map((t, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-[10px] font-black text-blue-500 mt-1">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <div>
                    <p className="text-xs font-black text-white uppercase">VENTA FINALIZADA</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TICKET #{t.id?.slice(0,5) || i}, TOTAL: ${t.total.toFixed(2)}, MÉTODO: {t.paymentMethod}</p>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <p className="text-xs font-bold text-slate-500">Sin actividad hoy</p>}
            </div>
          </div>

          {/* TOP 5 PRODUCTOS */}
          <div className="bg-[#111827] border border-nexus-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Trophy className="w-4 h-4" /> TOP 5 PRODUCTOS
            </h3>
            <div className="space-y-3">
              {topProductos.length > 0 ? topProductos.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-[#0b1120] p-3 rounded-xl border border-nexus-800">
                  <span className="text-xs font-black text-white uppercase truncate pr-4">{p[0]}</span>
                  <span className="text-xs font-black text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md">{p[1]} u.</span>
                </div>
              )) : (
                <p className="text-xs font-bold text-slate-500">No hay ventas registradas</p>
              )}
            </div>
          </div>

          {/* STOCK CRITICO */}
          <div className="bg-[#111827] border border-nexus-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4" /> STOCK CRÍTICO (FALTANTES)
            </h3>
            <div className="space-y-3">
              {stockCritico.length > 0 ? stockCritico.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-[#0b1120] p-3 rounded-xl border border-nexus-800">
                  <div className="truncate pr-4">
                    <p className="text-xs font-black text-white uppercase truncate">{p.name}</p>
                    <p className="text-[9px] font-bold text-slate-500">{p.sku}</p>
                  </div>
                  <span className="text-xs font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-md">{p.stock}</span>
                </div>
              )) : (
                <p className="text-xs font-bold text-slate-500">Inventario sano</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
