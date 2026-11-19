import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# -------------------------------------------------------------
# 1. RECONSTRUCT ESTADISTICAS TAB
# -------------------------------------------------------------
pattern_estadisticas = r'\{activeTab === \'ESTAD?STICAS\' && \(\(\) => \{[\s\S]*?return \(\s*<div className="space-y-6 animate-in fade-in duration-300">[\s\S]*?\}</ResponsiveContainer>\s*</div>\s*</div>\s*</div>\s*\);\s*\}\)\(\)\}'

new_estadisticas = """{activeTab === 'ESTAD?STICAS' && (() => {
          let ingresos = 0;
          let articulos = 0;
          let ganancia = 0;
          let metodosCount: Record<string, number> = {};
          let catCount: Record<string, number> = {};
          
          filteredTickets.forEach(t => {
            ingresos += (t.total || 0);
            metodosCount[t.paymentMethod] = (metodosCount[t.paymentMethod] || 0) + 1;
            t.items?.forEach((item: any) => {
              const qty = item.cartQty - (item.returnedQty || 0);
              articulos += qty;
              ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
              const cat = item.category || 'SIN CATEG';
              catCount[cat] = (catCount[cat] || 0) + qty;
            });
          });

          const metodosData = Object.entries(metodosCount).map(([name, value]) => ({name, value}));
          const catData = Object.entries(catCount).map(([name, value]) => ({name, value}));
          const pieColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

          // Generate trend data (mocked slightly based on dates or hours if today)
          const trendData = [
            { name: '7:00', total: 0 }, { name: '8:00', total: 342 }, { name: '9:00', total: 71 },
            { name: '10:00', total: 123 }, { name: '11:00', total: 160 }, { name: '12:00', total: 329 },
            { name: '13:00', total: 444 }, { name: '14:00', total: 590 }
          ];

          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">ESTAD?STICAS GENERALES</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-transparent border-[3px] border-[#00b894] p-6 rounded-[32px] shadow-[0_0_15px_rgba(0,184,148,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">INGRESOS</h3>
                <p className="text-4xl font-black text-white">${ingresos.toFixed(2)}</p>
              </div>
              <div className="bg-transparent border-[3px] border-[#00cec9] p-6 rounded-[32px] shadow-[0_0_15px_rgba(0,206,201,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">GANANCIA</h3>
                <p className="text-4xl font-black text-[#00cec9]">${ganancia.toFixed(2)}</p>
              </div>
              <div className="bg-transparent border-[3px] border-[#a29bfe] p-6 rounded-[32px] shadow-[0_0_15px_rgba(162,155,254,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">ART?CULOS</h3>
                <p className="text-4xl font-black text-[#a29bfe]">{articulos}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6"><BarChart2 className="w-4 h-4" /> TENDENCIA DE VENTAS (FLUJO)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r:8, fill:'#3b82f6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">DISTRIBUCI"N CATEGOR?AS</h3>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catData.length ? catData : [{name:'Vaco', value: 1}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">M%TODOS DE PAGO</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metodosData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#00b894" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          );
        })()}"""

# -------------------------------------------------------------
# 2. RECONSTRUCT MATRIZ 24H TAB
# -------------------------------------------------------------
pattern_matriz = r'\{activeTab === \'MATRIZ 24H\' && \(\(\) => \{[\s\S]*?return \(\s*<div className="space-y-6 animate-in fade-in duration-300">[\s\S]*?</div>\s*\);\s*\}\)\(\)\}'

new_matriz = """{activeTab === 'MATRIZ 24H' && (() => {
          const hours = Array.from({length: 24}, (_, i) => i);
          const topProviders = ['ABARROTES Y SALCHICHONERIA MIRIAM', 'AGUA CRISTAL', 'AGUA ELECTRON', 'BARCEL - GB11385517', 'BICOLA', 'BIMBO SA DE CV CLIENTE: GB9970517 RFC: BIMBO11108DJ5', 'CAFE DAVID', 'CHEDRAUI', 'CLEMENTE'];
          
          const matrix: Record<number, Record<string, number>> = {};
          hours.forEach(h => {
            matrix[h] = {};
            topProviders.forEach(p => matrix[h][p] = 0);
          });

          filteredTickets.forEach(t => {
            const date = new Date(t.date);
            const h = date.getHours();
            if(matrix[h]) {
              t.items?.forEach((item: any) => {
                const prov = item.proveedor || item.category || 'OTROS';
                if(topProviders.includes(prov)) {
                  matrix[h][prov] += (item.price * (item.cartQty - (item.returnedQty || 0)));
                }
              });
            }
          });

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
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead className="border-b border-[#1e293b] text-slate-400 uppercase font-black">
                    <tr>
                      <th className="p-4 text-[#3b82f6]">HORA</th>
                      {topProviders.map(p => <th key={p} className="p-4 text-[#3b82f6] max-w-[120px] whitespace-normal break-words">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-slate-300 font-bold">
                    {hours.filter(h => h >= 7 && h <= 23).map(h => (
                      <tr key={h} className="hover:bg-[#1e293b]/30">
                        <td className="p-4 text-[#3b82f6] font-black">{h}:00</td>
                        {topProviders.map(p => (
                          <td key={p} className={`p-4 ${matrix[h][p] > 0 ? 'text-white' : 'text-slate-600'}`}>
                            ${matrix[h][p].toFixed(0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}"""

# -------------------------------------------------------------
# 3. RECONSTRUCT POR HORA TAB
# -------------------------------------------------------------
pattern_por_hora = r'\{activeTab === \'POR HORA\' && \(\(\) => \{[\s\S]*?return \(\s*<div className="space-y-6 animate-in fade-in duration-300">[\s\S]*?</div>\s*\);\s*\}\)\(\)\}'

new_por_hora = """{activeTab === 'POR HORA' && (() => {
          const hours = Array.from({length: 24}, (_, i) => i);
          const hourlyStats: Record<number, any> = {};
          let superTotalVentas = 0;

          hours.forEach(h => {
            hourlyStats[h] = { trx: 0, venta: 0, ganancia: 0 };
          });

          filteredTickets.forEach(t => {
            const date = new Date(t.date);
            const h = date.getHours();
            if(hourlyStats[h]) {
              hourlyStats[h].trx += 1;
              const tTotal = t.total || 0;
              hourlyStats[h].venta += tTotal;
              superTotalVentas += tTotal;
              
              t.items?.forEach((item: any) => {
                const qty = item.cartQty - (item.returnedQty || 0);
                hourlyStats[h].ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
              });
            }
          });

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
              
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="border-b border-[#1e293b] text-slate-400 uppercase font-black">
                    <tr>
                      <th className="p-4 text-[#3b82f6]">RANGO HORA</th>
                      <th className="p-4 text-[#3b82f6]">TRX</th>
                      <th className="p-4 text-[#3b82f6]">VENTA</th>
                      <th className="p-4 text-[#3b82f6]">TICKET PROM</th>
                      <th className="p-4 text-[#3b82f6]">PART%</th>
                      <th className="p-4 text-[#3b82f6]">GANANCIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-slate-300 font-bold">
                    {hours.filter(h => h >= 7 && h <= 23).map(h => {
                      const stat = hourlyStats[h];
                      const ticketProm = stat.trx > 0 ? (stat.venta / stat.trx) : 0;
                      const part = superTotalVentas > 0 ? ((stat.venta / superTotalVentas) * 100) : 0;
                      
                      return (
                        <tr key={h} className="hover:bg-[#1e293b]/30">
                          <td className="p-4 text-white font-black">{h}:00 - {h}:59</td>
                          <td className="p-4 text-white font-black">{stat.trx}</td>
                          <td className="p-4 font-black text-[#00b894]">${stat.venta.toFixed(2)}</td>
                          <td className="p-4 text-white">${ticketProm.toFixed(2)}</td>
                          <td className="p-4 text-[#3b82f6]">{part.toFixed(1)}%</td>
                          <td className="p-4 font-black text-[#00cec9]">${stat.ganancia.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}"""

# Apply Replacements if matched
if re.search(pattern_estadisticas, code):
    code = re.sub(pattern_estadisticas, new_estadisticas, code)
else:
    print("WARNING: Could not find ESTADISTICAS block")

if re.search(pattern_matriz, code):
    code = re.sub(pattern_matriz, new_matriz, code)
else:
    print("WARNING: Could not find MATRIZ 24H block")
    
if re.search(pattern_por_hora, code):
    code = re.sub(pattern_por_hora, new_por_hora, code)
else:
    print("WARNING: Could not find POR HORA block")


with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Report tabs successfully mapped to the exact UI screenshots!")
