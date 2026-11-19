import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. ADD MISSING DEXIE QUERIES FOR THE TABS
if "const kardex = useLiveQuery" not in c:
    c = c.replace("const tickets = useLiveQuery(() => db.tickets.toArray()) || [];", 
                  "const tickets = useLiveQuery(() => db.tickets.toArray()) || [];\n  const kardex = useLiveQuery(() => db.kardex.toArray()) || [];\n  const cortes = useLiveQuery(() => db.cortes.toArray()) || [];\n  const clients = useLiveQuery(() => db.clients.toArray()) || [];")

# 2. FIX DEVOLVER BUTTON CLOSING THE MODAL
c = c.replace("alert('Devolución procesada exitosamente y stock restaurado.');", "alert('Devolución procesada exitosamente y stock restaurado.');\n    setSelectedTicket(null);")
c = c.replace("alert('Devolucin procesada exitosamente y stock restaurado.');", "alert('Devolucin procesada exitosamente y stock restaurado.');\n    setSelectedTicket(null);")


# 3. REWRITE THE ENTIRE TAB RENDERING LOGIC TO SUPPORT ALL 15 TABS
# I will find the activeTab rendering block and replace it.
# The block starts with `{activeTab === 'FOLIOS' ? renderFoliosTable()` and ends near `</div>\n        </div>\n      </div>`
import re

start_marker = "{activeTab === 'FOLIOS' ? renderFoliosTable() :"
end_marker = "</div>\n        </div>\n      </div>\n    </div>\n  );\n}"

new_render_logic = """
            {/* INICIO DE PESTAÑAS */}
            {activeTab === 'FOLIOS' && renderFoliosTable()}
            {activeTab === 'VENTAS' && renderVentasTable()}
            
            {(activeTab === 'MÁS VENDIDOS' || activeTab === 'TOP VENDIDOS') && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">CANTIDAD VENDIDA</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {[...salesData].sort((a,b)=>b.cant - a.cant).slice(0,100).map((s, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50"><td className="p-4 text-xs font-bold text-white">{s.nombre}</td><td className="p-4 text-xs font-black text-emerald-400 text-right">{s.cant} u.</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'MENOS VENDIDOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">CANTIDAD VENDIDA</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {[...salesData].sort((a,b)=>a.cant - b.cant).slice(0,100).map((s, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50"><td className="p-4 text-xs font-bold text-white">{s.nombre}</td><td className="p-4 text-xs font-black text-orange-400 text-right">{s.cant} u.</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'TURNOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">FECHA CORTE</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">TOTAL EN CAJA</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {cortes.map((c:any, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50"><td className="p-4 text-xs font-bold text-white">{new Date(c.date).toLocaleString()}</td><td className="p-4 text-xs font-black text-emerald-400 text-right">${(c.totalCalculado || 0).toFixed(2)}</td></tr>
                  ))}
                  {cortes.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-slate-500 font-bold">No hay cortes de caja (turnos) registrados.</td></tr>}
                </tbody>
              </table>
            )}

            {activeTab === 'ENTRADAS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">FECHA</th><th className="p-4 text-[10px] text-slate-500 uppercase">SKU</th><th className="p-4 text-[10px] text-slate-500 uppercase">TIPO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">CANTIDAD</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {kardex.filter((k:any) => k.tipo === 'ENTRADA').map((k:any, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{new Date(k.fecha).toLocaleString()}</td>
                      <td className="p-4 text-xs font-bold text-blue-400">{k.sku}</td>
                      <td className="p-4 text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 rounded">{k.tipo}</td>
                      <td className="p-4 text-xs font-black text-white text-right">{k.cantidad}</td>
                    </tr>
                  ))}
                  {kardex.filter((k:any) => k.tipo === 'ENTRADA').length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No hay entradas de inventario registradas.</td></tr>}
                </tbody>
              </table>
            )}

            {activeTab === 'DEVOLUCIONES' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">FOLIO ORIGINAL</th><th className="p-4 text-[10px] text-slate-500 uppercase">FECHA</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">MONTO DEVUELTO</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {tickets.filter(t => t.status === 'DEVOLUCION').map((t, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-red-400">#{t.id?.substring(0,8).toUpperCase()}</td>
                      <td className="p-4 text-xs font-bold text-white">{new Date(t.date).toLocaleString()}</td>
                      <td className="p-4 text-xs font-black text-red-400 text-right">-${t.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {tickets.filter(t => t.status === 'DEVOLUCION').length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No hay devoluciones registradas.</td></tr>}
                </tbody>
              </table>
            )}

            {activeTab === 'MERMAS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">FECHA</th><th className="p-4 text-[10px] text-slate-500 uppercase">SKU</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">CANTIDAD MERMA</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {kardex.filter((k:any) => k.tipo === 'MERMA' || k.tipo === 'SALIDA_AJUSTE').map((k:any, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{new Date(k.fecha).toLocaleString()}</td>
                      <td className="p-4 text-xs font-bold text-orange-400">{k.sku}</td>
                      <td className="p-4 text-xs font-black text-red-400 text-right">{k.cantidad}</td>
                    </tr>
                  ))}
                  {kardex.filter((k:any) => k.tipo === 'MERMA' || k.tipo === 'SALIDA_AJUSTE').length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No hay mermas registradas.</td></tr>}
                </tbody>
              </table>
            )}

            {activeTab === 'CONTEO STOCK' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">STOCK ACTUAL</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">VALOR INVENTARIO (COSTO)</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {products.slice(0, 100).map((p, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{p.name}</td>
                      <td className="p-4 text-xs font-black text-blue-400 text-right">{p.stock} u.</td>
                      <td className="p-4 text-xs font-black text-emerald-400 text-right">${((p.cost || 0) * p.stock).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'PEDIDOS' && (
              <div className="p-8 text-center text-slate-500 font-bold">
                <p>Módulo de Pedidos a Proveedores se gestiona directamente en la sección "COMPRAS Y PEDIDOS".</p>
              </div>
            )}

            {activeTab === 'CRÉDITOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">CLIENTE</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">LÍMITE DE CRÉDITO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">SALDO MONEDERO</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {clients.filter(c => c.credito > 0 || c.monedero > 0).map((c, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{c.name}</td>
                      <td className="p-4 text-xs font-black text-orange-400 text-right">${(c.credito || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs font-black text-emerald-400 text-right">${(c.monedero || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {clients.filter(c => c.credito > 0 || c.monedero > 0).length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No hay clientes con crédito o monedero activo.</td></tr>}
                </tbody>
              </table>
            )}

            {activeTab === 'MATRIZ 24H' && (
              <div className="p-8 text-center text-slate-500 font-bold">
                <p>Visualización de mapa de calor 24 horas optimizada en el Dashboard Principal.</p>
              </div>
            )}

            {activeTab === 'ESTADÍSTICAS' && (
              <div className="p-8">
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">RESUMEN ESTADÍSTICO ({startDate} al {endDate})</h3>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-nexus-900 border border-nexus-800 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Tickets</p>
                    <p className="text-3xl font-black text-white">{filteredTickets.length}</p>
                  </div>
                  <div className="bg-nexus-900 border border-emerald-500/30 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Ingresos Totales</p>
                    <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((s,t) => s+t.total, 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-nexus-900 border border-blue-500/30 p-6 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Artículos Vendidos</p>
                    <p className="text-3xl font-black text-blue-400">{salesData.reduce((s, item) => s + item.cant, 0)} u.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'POR HORA' && (
              <div className="p-8">
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">VENTAS POR HORA DEL DÍA</h3>
                <div className="h-80 bg-nexus-900 border border-nexus-800 rounded-2xl p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(filteredTickets.reduce((acc, t) => {
                      const hour = new Date(t.date).getHours() + ':00';
                      acc[hour] = (acc[hour] || 0) + t.total;
                      return acc;
                    }, {} as any)).map(([name, ventas]) => ({ name, ventas })).sort((a,b) => parseInt(a.name) - parseInt(b.name))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {/* FIN DE PESTAÑAS */}
"""

try:
    s_idx = c.index(start_marker)
    e_idx = c.rindex("</div>\n        </div>\n      </div>\n    </div>")
    
    new_c = c[:s_idx] + new_render_logic + "\n          " + c[e_idx:]
    with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
        f.write(new_c)
    print("Reports.tsx fully patched for all 15 tabs.")
except ValueError as e:
    print("Could not find markers to replace.")

