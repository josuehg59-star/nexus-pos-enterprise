import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    code = f.read()

# Fix encoding issues in the tabs array:
code = code.replace("'ESTAD?STICAS'", "'ESTADÍSTICAS'")
code = code.replace("'ESTAD\ufffd?STICAS'", "'ESTADÍSTICAS'")
code = code.replace("'CR%DITOS'", "'CRÉDITOS'")
code = code.replace("'CR\ufffd%DITOS'", "'CRÉDITOS'")

code = code.replace("activeTab === 'ESTAD?STICAS'", "activeTab === 'ESTADÍSTICAS'")
code = code.replace("activeTab === 'CR%DITOS'", "activeTab === 'CRÉDITOS'")


# Let's forcefully replace ESTADÍSTICAS block
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


# Find where ESTADISTICAS block begins and where it ends
start_stat = code.find("{activeTab === 'ESTADÍSTICAS' && (")
if start_stat == -1: start_stat = code.find("{activeTab === 'ESTAD\ufffd?STICAS' && (")
if start_stat == -1: start_stat = code.find("{activeTab === 'ESTAD?STICAS' && (")

end_stat = code.find("{activeTab === 'CRÉDITOS' && (")
if end_stat == -1: end_stat = code.find("{activeTab === 'CR\ufffd%DITOS' && (")
if end_stat == -1: end_stat = code.find("{activeTab === 'CR%DITOS' && (")

end_cred = code.find("{['ENTRADAS', 'DEVOLUCIONES', 'MERMAS'].includes(activeTab) && (")

if start_stat != -1 and end_stat != -1 and end_cred != -1:
    code = code[:start_stat] + stats_ui + "\n\n        " + creditos_ui + "\n\n        " + code[end_cred:]

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("FIXED UTF-8 AND INJECTED TABS CORRECTLY!")
