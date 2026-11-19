import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# I will replace the final catch-all branch.
old_catchall = """            ) : (
              <div className="p-8 text-center text-slate-500 font-bold">
                Módulo '{activeTab}' listo para programarse si lo necesitas en el flujo actual.
              </div>
            )}"""

new_logic = """            ) : activeTab === 'MÁS VENDIDOS' || activeTab === 'TOP VENDIDOS' ? (
              <div className="p-8">
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">MÁS VENDIDOS</h3>
                <table className="w-full text-left">
                  <thead className="bg-nexus-900 border-b border-nexus-800">
                    <tr><th className="p-4 text-[10px] text-slate-500">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right">CANTIDAD</th></tr>
                  </thead>
                  <tbody>
                    {[...salesData].sort((a,b)=>b.cant - a.cant).slice(0,50).map((s, i) => (
                      <tr key={i} className="border-b border-nexus-800/50"><td className="p-4 text-xs font-bold text-white">{s.nombre}</td><td className="p-4 text-xs font-black text-emerald-400 text-right">{s.cant} u.</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'MENOS VENDIDOS' ? (
              <div className="p-8">
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">MENOS VENDIDOS</h3>
                <table className="w-full text-left">
                  <thead className="bg-nexus-900 border-b border-nexus-800">
                    <tr><th className="p-4 text-[10px] text-slate-500">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right">CANTIDAD</th></tr>
                  </thead>
                  <tbody>
                    {[...salesData].sort((a,b)=>a.cant - b.cant).slice(0,50).map((s, i) => (
                      <tr key={i} className="border-b border-nexus-800/50"><td className="p-4 text-xs font-bold text-white">{s.nombre}</td><td className="p-4 text-xs font-black text-orange-400 text-right">{s.cant} u.</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'CONTEO STOCK' ? (
              <div className="p-8">
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">VALORACIÓN DE INVENTARIO Y STOCK</h3>
                <table className="w-full text-left">
                  <thead className="bg-nexus-900 border-b border-nexus-800">
                    <tr><th className="p-4 text-[10px] text-slate-500">PRODUCTO</th><th className="p-4 text-[10px] text-slate-500 text-right">STOCK ACTUAL</th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-nexus-800/50"><td className="p-4 text-xs text-slate-400">El módulo de conteo avanzado estará aquí. Revisa INVENTARIO Y ALMACÉN para el stock en tiempo real.</td><td className="p-4"></td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-bold">
                El módulo de {activeTab} extraerá la información de la base de datos muy pronto.
              </div>
            )}"""

c = c.replace(old_catchall, new_logic)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated Reports.tsx catch-all logic")
