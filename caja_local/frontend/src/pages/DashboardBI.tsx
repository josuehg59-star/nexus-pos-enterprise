import { useState, useMemo } from 'react';
import { ShoppingCart, Phone, ArrowDownToLine, Package, Users, Wallet, Activity, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { parseUniversalTimestamp } from '../utils/dateUtils';

export default function DashboardBI() {
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

  // Cálculos de tiempo
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const ticketsHoy = tickets.filter(t => getTicketTs(t.date) >= startOfDay);

  const ventasHoyCount = ticketsHoy.length;
  const ingresosHoy = ticketsHoy.reduce((sum, t) => sum + (t.total || 0), 0);
  
  // Utilidad real (Precio - Costo)
  const utilidadHoy = ticketsHoy.reduce((sum, t) => {
    const gananciaTicket = (t.items || []).reduce((acc: number, item: any) => {
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

  // Top 5 Productos
  const productosVendidos = new Map<string, number>();
  tickets.forEach(ticket => {
    ticket.items.forEach((item: any) => {
      const current = productosVendidos.get(item.name) || 0;
      productosVendidos.set(item.name, current + (item.cartQty || item.qty || 1));
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
        const time = new Date(t.date).getTime();
        return time >= monthStart && time <= monthEnd;
      }).reduce((sum, t) => sum + t.total, 0);

      data.push({
        name: monthName,
        ventas: realSales > 0 ? realSales : 0 // Remove hardcoded mock if they want real DB data
      });
    }
    return data;
  }, [tickets]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-y-auto custom-scrollbar p-6">
      
      {/* HEADER TIPO TITAN */}
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">NEXUS BI DASHBOARD</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">MODO MAESTRA (SERVIDOR ACTIVO)</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} | {now.toLocaleTimeString('es-ES')}
          </p>
          <select 
            value={timeFilter} 
            onChange={e => setTimeFilter(e.target.value)}
            className="bg-[#111827] border border-nexus-800 text-blue-400 font-bold px-3 py-1 rounded-lg outline-none text-xs uppercase tracking-widest"
          >
            <option value="Hoy">Ventas de Hoy</option>
            <option value="Historico">Histórico Total</option>
          </select>
        </div>
      </div>

      {/* METRICAS SUPERIORES (NEON CARDS) */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6 shrink-0">
        {[
          { title: timeFilter === 'Hoy' ? 'VENTAS HOY' : 'VENTAS TOTALES', value: ventasHoyCount.toString(), color: 'border-blue-500', text: 'text-white' },
          { title: timeFilter === 'Hoy' ? 'INGRESOS HOY' : 'INGRESOS TOTALES', value: `$${ingresosHoy.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-emerald-500', text: 'text-emerald-400' },
          { title: timeFilter === 'Hoy' ? 'UTILIDAD HOY' : 'UTILIDAD TOTAL', value: `$${utilidadHoy.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-orange-500', text: 'text-orange-400' },
          { title: 'PRODUCTOS', value: totalProductos.toString(), color: 'border-purple-500', text: 'text-purple-400' },
          { title: 'CLIENTES', value: totalClientes.toString(), color: 'border-pink-500', text: 'text-pink-400' },
          { title: 'CAJA ACTUAL', value: `$${cajaActual.toLocaleString('es-MX', {minimumFractionDigits: 2})}`, color: 'border-cyan-500', text: 'text-cyan-400' },
          { title: 'VAL. INV.', value: `$${valorInventario.toLocaleString('es-MX', {minimumFractionDigits: 0})}`, color: 'border-yellow-500', text: 'text-yellow-400' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-[#111827] border ${kpi.color} rounded-xl p-3 shadow-lg shadow-black/50`}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{kpi.title}</p>
            <p className={`text-lg font-black ${kpi.text} tracking-tighter truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ACCESOS RAPIDOS */}
      <div className="bg-[#111827] border border-nexus-800 rounded-2xl p-4 mb-6 shadow-xl shrink-0">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ACCESOS RÁPIDOS</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button className="bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <ShoppingCart className="w-4 h-4" /> PUNTO DE VENTA
          </button>
          <button className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <Phone className="w-4 h-4" /> RECARGAS/SERV.
          </button>
          <button className="bg-[#10b981] hover:bg-[#059669] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <ArrowDownToLine className="w-4 h-4" /> ENTRADAS
          </button>
          <button className="bg-[#a855f7] hover:bg-[#9333ea] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <Package className="w-4 h-4" /> CATÁLOGO
          </button>
          <button className="bg-[#ec4899] hover:bg-[#db2777] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <Users className="w-4 h-4" /> CLIENTES
          </button>
          <button className="bg-[#f97316] hover:bg-[#ea580c] text-white py-2 px-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
            <Wallet className="w-4 h-4" /> CORTE DE CAJA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        
        {/* IZQUIERDA: HISTORIAL DE VENTAS */}
        <div className="lg:col-span-2 bg-[#111827] border border-nexus-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-blue-500 w-6 h-6" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">HISTORIAL DE VENTAS</h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">COMPARATIVA DE LOS ÚLTIMOS 6 MESES</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
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
