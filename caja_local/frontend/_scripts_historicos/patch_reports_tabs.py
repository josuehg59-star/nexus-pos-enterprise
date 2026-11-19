import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add recharts to Reports.tsx
if "import { BarChart" not in c:
    c = c.replace("import { FileSpreadsheet, MessageCircle } from 'lucide-react';", 
                  "import { FileSpreadsheet, MessageCircle } from 'lucide-react';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';")

# Replace the placeholder in render
old_render = """            {activeTab === 'FOLIOS' ? renderFoliosTable() : activeTab === 'VENTAS' ? renderVentasTable() : (
              <div className="p-8 text-center text-slate-500 font-bold">
                Módulo analítico en construcción progresiva. Por ahora utiliza las pestañas VENTAS o FOLIOS para ver los datos extraídos en tiempo real.
              </div>
            )}"""

new_render = """            {activeTab === 'FOLIOS' ? renderFoliosTable() : activeTab === 'VENTAS' ? renderVentasTable() : activeTab === 'ESTADÍSTICAS' ? (
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
                <div className="h-64 bg-nexus-900 border border-nexus-800 rounded-2xl p-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">INGRESOS POR DÍA</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(filteredTickets.reduce((acc, t) => {
                      const d = new Date(t.date).toLocaleDateString();
                      acc[d] = (acc[d] || 0) + t.total;
                      return acc;
                    }, {} as any)).map(([name, ventas]) => ({ name, ventas }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Bar dataKey="ventas" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : activeTab === 'POR HORA' ? (
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
            ) : (
              <div className="p-8 text-center text-slate-500 font-bold">
                Módulo '{activeTab}' listo para programarse si lo necesitas en el flujo actual.
              </div>
            )}"""

c = c.replace(old_render, new_render)

# Add fallback encoding comment to avoid UnicodeDecodeError issues just in case
with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated Reports.tsx to include charts for Estadisticas and Por Hora")
