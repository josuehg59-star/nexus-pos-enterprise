import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add turnos to the LiveQuery
if "const turnos = useLiveQuery(() => db.turnos.toArray(), []) || [];" not in code:
    code = code.replace("const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];",
                        "const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];\n  const turnos = useLiveQuery(() => db.turnos?.toArray() || [], []) || [];")

# Modify TURNOS tab
turnos_code = """        {activeTab === 'TURNOS' && (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> TURNOS ACTIVOS</h3>
            <div className="bg-nexus-900/50 border border-emerald-500/50 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/10 mb-8">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  <tr><th className="p-4">FOLIO</th><th className="p-4">CAJERO</th><th className="p-4">FECHA APERTURA</th><th className="p-4 text-right">FONDO INICIAL</th><th className="p-4 text-center">ESTADO</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {turnos.filter((t: any) => t.estado === 'ACTIVO').map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-nexus-800/50 bg-emerald-900/10">
                      <td className="p-4 font-black text-emerald-400">{t.folio}</td>
                      <td className="p-4 font-bold">{t.cajero}</td>
                      <td className="p-4 text-slate-300">{new Date(t.fechaApertura).toLocaleString()}</td>
                      <td className="p-4 text-right font-black">${t.montoInicial.toFixed(2)}</td>
                      <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded text-[10px] font-black">EN CURSO</span></td>
                    </tr>
                  ))}
                  {turnos.filter((t: any) => t.estado === 'ACTIVO').length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay turnos activos en este momento.</td></tr>}
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-black text-white uppercase tracking-widest mt-8 mb-4">HISTORIAL DE CORTES Z (CERRADOS)</h3>
            <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                  <tr><th className="p-4">FECHA CIERRE</th><th className="p-4">FONDO INICIAL</th><th className="p-4">EFECTIVO</th><th className="p-4">TARJETA</th><th className="p-4 text-right">TOTAL VENTA</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50 text-white">
                  {filteredCortes.map((c: any, i: number) => (
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
          </div>
        )}"""

pattern = r'\{activeTab === \'TURNOS\' && \([\s\S]*?No hay cortes de caja en este periodo\.</td></tr>\}\n\s*</tbody>\n\s*</table>\n\s*</div>\n\s*\)\}'

code = re.sub(pattern, turnos_code, code)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Reports.tsx updated with active turnos!")
