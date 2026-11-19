import os
import re

with open('src/pages/DashboardBI.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Make time filter actually work!
old_logic = """  // Cálculos de tiempo
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const ticketsHoy = tickets.filter(t => new Date(t.date).getTime() >= startOfDay);

  const ventasHoyCount = ticketsHoy.length;
  const ingresosHoy = ticketsHoy.reduce((sum, t) => sum + t.total, 0);
  
  // Utilidad real (Precio - Costo)
  const utilidadHoy = ticketsHoy.reduce((sum, t) => {
    const gananciaTicket = t.items.reduce((acc, item) => {
      const qty = item.cartQty || (item as any).qty || 1;
      const price = item.price || 0;
      const cost = item.cost || (price * 0.7); // margen estimado si no hay costo
      return acc + ((price - cost) * qty);
    }, 0);
    return sum + gananciaTicket;
  }, 0);

  const totalProductos = products.length;
  const totalClientes = clients.length;
  const cajaActual = ingresosHoy; // Simplificado para "hoy" """

new_logic = """  // Cálculos de tiempo
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Filtrar si es Hoy o Historico
  const ticketsFiltrados = timeFilter === 'Hoy' 
    ? tickets.filter(t => new Date(t.date).getTime() >= startOfDay)
    : tickets; // Historico total

  const ventasHoyCount = ticketsFiltrados.length;
  const ingresosHoy = ticketsFiltrados.reduce((sum, t) => sum + t.total, 0);
  
  // Utilidad real (Precio - Costo)
  const utilidadHoy = ticketsFiltrados.reduce((sum, t) => {
    const gananciaTicket = t.items.reduce((acc, item) => {
      const qty = item.cartQty || (item as any).qty || 1;
      const price = item.price || 0;
      const cost = item.cost || (price * 0.7); // margen estimado si no hay costo
      return acc + ((price - cost) * qty);
    }, 0);
    return sum + gananciaTicket;
  }, 0);

  const totalProductos = products.length;
  const totalClientes = clients.length;
  const cajaActual = timeFilter === 'Hoy' ? ingresosHoy : 0; // Simplificado """

c = c.replace(old_logic, new_logic)

# Replace titles logically
c = c.replace("{ title: 'VENTAS HOY'", "{ title: timeFilter === 'Hoy' ? 'VENTAS HOY' : 'VENTAS TOTALES'")
c = c.replace("{ title: 'INGRESOS HOY'", "{ title: timeFilter === 'Hoy' ? 'INGRESOS HOY' : 'INGRESOS TOTALES'")
c = c.replace("{ title: 'UTILIDAD HOY'", "{ title: timeFilter === 'Hoy' ? 'UTILIDAD HOY' : 'UTILIDAD TOTAL'")

# Add dropdown in Header
old_header = """        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} | {now.toLocaleTimeString('es-ES')}
          </p>
        </div>"""

new_header = """        <div className="text-right flex flex-col items-end gap-2">
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
        </div>"""

c = c.replace(old_header, new_header)

with open('src/pages/DashboardBI.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("DashboardBI time filter updated")
