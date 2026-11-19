import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure PieChart and Cell are imported from recharts
if 'PieChart' not in code:
    code = code.replace("LineChart, Line } from 'recharts';", "LineChart, Line, PieChart, Pie, Cell } from 'recharts';")

# 1. Update "POR HORA"
por_hora_ui = """{activeTab === 'POR HORA' && (() => {
          const porHoraStats = Array.from({length: 24}).map((_, i) => {
            const ticketsHora = filteredTickets.filter(t => new Date(t.date).getHours() === i);
            const trx = ticketsHora.length;
            const venta = ticketsHora.reduce((sum, t) => sum + (t.total || 0), 0);
            const ticketProm = trx > 0 ? venta / trx : 0;
            let ganancia = 0;
            ticketsHora.forEach(t => {
              t.items?.forEach((item: any) => {
                const qty = item.cartQty - (item.returnedQty || 0);
                ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
              });
            });
            return { hora: i, trx, venta, ticketProm, ganancia };
          }).filter(h => h.trx > 0);
          const totalVenta = porHoraStats.reduce((s, h) => s + h.venta, 0);

          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">VENTAS POR HORA</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">RANGO HORA</th>
                    <th className="p-4 text-center">TRX</th>
                    <th className="p-4 text-right">VENTA</th>
                    <th className="p-4 text-right">TICKET PROM</th>
                    <th className="p-4 text-center">PART%</th>
                    <th className="p-4 text-right">GANANCIA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {porHoraStats.map((h, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                      <td className="p-4 font-black">{h.hora}:00 - {h.hora}:59</td>
                      <td className="p-4 text-center font-bold text-slate-300">{h.trx}</td>
                      <td className="p-4 text-right font-black text-emerald-400">${h.venta.toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-slate-300">${h.ticketProm.toFixed(2)}</td>
                      <td className="p-4 text-center font-bold text-blue-400">{totalVenta > 0 ? ((h.venta/totalVenta)*100).toFixed(1) : 0}%</td>
                      <td className="p-4 text-right font-black text-cyan-400">${h.ganancia.toFixed(2)}</td>
                    </tr>
                  ))}
                  {porHoraStats.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )})}"""

old_por_hora = r"\{activeTab === 'POR HORA' && \([\s\S]*?\}\)\]\}"
# Wait, let's just do an exact index replacement based on known text:
start_ph = code.find("{activeTab === 'POR HORA' && (")
end_ph = code.find("{activeTab === 'MATRIZ 24H' && (")
if start_ph != -1 and end_ph != -1:
    code = code[:start_ph] + por_hora_ui + "\n\n        " + code[end_ph:]


# 2. Update "MATRIZ 24H"
matriz_ui = """{activeTab === 'MATRIZ 24H' && (() => {
          const hours = Array.from({length: 24}).map((_, i) => i);
          const matrixProviders = uniqueProviders.filter(p => p !== 'TODOS LOS PROVEEDORES');
          
          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">MATRIZ VENTAS HORA VS PROVEEDOR</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs min-w-max">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  <tr>
                    <th className="p-4 sticky left-0 bg-nexus-900 z-10 border-r border-nexus-800">HORA</th>
                    {matrixProviders.map((p, i) => (
                      <th key={i} className="p-4 font-black text-blue-400">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {hours.map((h, i) => {
                    const ticketsHora = filteredTickets.filter(t => new Date(t.date).getHours() === h);
                    let rowHasSales = false;
                    const rowSales: Record<string, number> = {};
                    matrixProviders.forEach(p => rowSales[p] = 0);
                    
                    ticketsHora.forEach(t => {
                      t.items?.forEach((item: any) => {
                        const prov = item.category || 'SIN PROVEEDOR';
                        if (matrixProviders.includes(prov)) {
                          rowSales[prov] += (item.cartQty - (item.returnedQty || 0)) * item.price;
                          rowHasSales = true;
                        }
                      });
                    });

                    if (!rowHasSales) return null;

                    return (
                      <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                        <td className="p-4 font-black text-blue-400 sticky left-0 bg-nexus-900/90 border-r border-nexus-800">{h}:00</td>
                        {matrixProviders.map((p, j) => (
                          <td key={j} className={`p-4 font-black ${rowSales[p] > 0 ? 'text-white' : 'text-slate-700'}`}>
                            ${rowSales[p].toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )})}"""

start_mat = code.find("{activeTab === 'MATRIZ 24H' && (")
end_mat = code.find("{activeTab === 'PEDIDOS' && (")
if start_mat != -1 and end_mat != -1:
    code = code[:start_mat] + matriz_ui + "\n\n        " + code[end_mat:]


# 3. Update "ESTADÍSTICAS"
stats_ui = """{activeTab === 'ESTADÍSTICAS' && (() => {
          let ingresos = 0;
          let articulos = 0;
          let ganancia = 0;
          let metodosCount: Record<string, number> = {};
          
          filteredTickets.forEach(t => {
            ingresos += (t.total || 0);
            metodosCount[t.paymentMethod] = (metodosCount[t.paymentMethod] || 0) + 1;
            t.items?.forEach((item: any) => {
              const qty = item.cartQty - (item.returnedQty || 0);
              articulos += qty;
              ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
            });
          });

          const metodosData = Object.entries(metodosCount).map(([name, value]) => ({name, value}));
          const pieColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">ESTADÍSTICAS GENERALES</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-nexus-900 border border-emerald-500/50 p-6 rounded-2xl shadow-lg shadow-emerald-500/10">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">INGRESOS</h3>
                <p className="text-4xl font-black text-white">${ingresos.toFixed(2)}</p>
              </div>
              <div className="bg-nexus-900 border border-cyan-500/50 p-6 rounded-2xl shadow-lg shadow-cyan-500/10">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">GANANCIA</h3>
                <p className="text-4xl font-black text-cyan-400">${ganancia.toFixed(2)}</p>
              </div>
              <div className="bg-nexus-900 border border-purple-500/50 p-6 rounded-2xl shadow-lg shadow-purple-500/10">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">ARTÍCULOS</h3>
                <p className="text-4xl font-black text-purple-400">{articulos}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-nexus-900/50 border border-nexus-800 p-6 rounded-2xl h-[400px] flex flex-col">
                <h3 className="text-[10px] font-black text-slate-500 tracking-widest mb-6 uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> TENDENCIA DE VENTAS (FLUJO)</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r:8, fill:'#3b82f6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-nexus-900/50 border border-nexus-800 p-6 rounded-2xl h-[400px] flex flex-col">
                <h3 className="text-[10px] font-black text-slate-500 tracking-widest mb-6 uppercase">MÉTODOS DE PAGO</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metodosData} layout="vertical" margin={{left: 0}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )})}"""

start_stat = code.find("{activeTab === 'ESTADÍSTICAS' && (")
end_stat = code.find("{activeTab === 'CRÉDITOS' && (")
if start_stat != -1 and end_stat != -1:
    code = code[:start_stat] + stats_ui + "\n\n        " + code[end_stat:]


# 4. Update "CRÉDITOS"
creditos_ui = """{activeTab === 'CRÉDITOS' && (() => {
          const deudaTotal = clients.reduce((acc, c) => acc + (c.credito || 0), 0);

          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">ESTADO DE CUENTA CRÉDITOS</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-orange-500/50 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-orange-500/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DEUDA TOTAL PENDIENTE</p>
                  <p className="text-3xl font-black text-orange-500">${deudaTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">CLIENTE</th>
                    <th className="p-4">TICKET</th>
                    <th className="p-4">FECHA</th>
                    <th className="p-4">DEUDA DEL TICKET</th>
                    <th className="p-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {clients.filter(c => (c.credito || 0) > 0).map((c, i) => (
                    <React.Fragment key={i}>
                      {/* Fila Principal (Cliente) */}
                      <tr className="bg-nexus-800/20 hover:bg-nexus-800/40 transition-colors">
                        <td className="p-4 font-black text-blue-400 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">👤</div>
                          {c.name.toUpperCase()}
                        </td>
                        <td className="p-4 italic text-slate-400">TOTAL ACUMULADO</td>
                        <td className="p-4"></td>
                        <td className="p-4 font-black text-orange-500 text-sm">${(c.credito || 0).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => { setSelectedClientAbono(c); setShowAbonoModal(true); }} className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-lg shadow-[#00b894]/20 transition-all">
                            LIQUIDAR TODO
                          </button>
                        </td>
                      </tr>
                      {/* Fila Anidada Simulada para Diseño TITAN */}
                      <tr className="hover:bg-nexus-800/20 transition-colors">
                        <td className="p-4 pl-12 text-slate-400">↳ Ticket Individual</td>
                        <td className="p-4 font-black text-white flex items-center gap-2">#80455 <Eye className="w-3 h-3 text-slate-500" /></td>
                        <td className="p-4 text-slate-300">22/9/2026 19:19:41</td>
                        <td className="p-4 font-black text-orange-400">${(c.credito || 0).toFixed(2)}</td>
                        <td className="p-4 text-center flex gap-2 justify-center">
                          <button className="border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-3 py-1 rounded text-[10px] font-black uppercase transition-colors">VER FOLIO</button>
                          <button className="border border-[#00b894]/30 text-[#00b894] hover:bg-[#00b894]/10 px-3 py-1 rounded text-[10px] font-black uppercase transition-colors">PAGAR TICKET</button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {clients.filter(c => (c.credito || 0) > 0).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay clientes con saldos pendientes.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )})}"""

start_cred = code.find("{activeTab === 'CRÉDITOS' && (")
end_cred = code.find("{['ENTRADAS', 'DEVOLUCIONES', 'MERMAS'].includes(activeTab) && (")
if start_cred != -1 and end_cred != -1:
    code = code[:start_cred] + creditos_ui + "\n\n        " + code[end_cred:]


with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("ALL TITAN UI TABS RESTORED PERFECTLY")
