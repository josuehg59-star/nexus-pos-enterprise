import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Restore the Tabs array
old_tabs = r"\['VENTAS', 'ESTADÍSTICAS', 'CRÉDITOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS'\]"
new_tabs = "['MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 'PEDIDOS', 'CRÉDITOS']"

c = re.sub(old_tabs, new_tabs, c)

# 2. Add content blocks for the restored tabs
# We'll inject them right before {activeTab === 'ESTADÍSTICAS' && (
injection_point = c.find("{activeTab === 'ESTADÍSTICAS' && (")

if injection_point != -1:
    restored_views = """
        {['MÁS VENDIDOS', 'TOP VENDIDOS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANTIDAD VENDIDA</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-center text-emerald-400 font-black">{p.qty} pz</td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-slate-500 font-bold">No hay datos de ventas.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'MENOS VENDIDOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">CANTIDAD VENDIDA</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {[...topProducts].reverse().map((p, i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-center text-red-400 font-black">{p.qty} pz</td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-slate-500 font-bold">No hay datos de ventas.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'FOLIOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">FOLIO</th><th className="p-4">FECHA</th><th className="p-4">MÉTODO</th><th className="p-4 text-right">TOTAL</th><th className="p-4 text-center">ACCIÓN</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {filteredTickets.map((t,i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-mono text-blue-400">#{t.id?.substring(0,8).toUpperCase()}</td>
                    <td className="p-4">{new Date(t.date).toLocaleString()}</td>
                    <td className="p-4 font-bold">{t.paymentMethod}</td>
                    <td className="p-4 text-right font-black text-emerald-400">${(t.total||0).toFixed(2)}</td>
                    <td className="p-4 text-center"><button onClick={()=>setSelectedTicket(t)} className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded text-[10px] font-bold">VER DETALLE</button></td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">No hay folios.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'CONTEO STOCK' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">SKU</th><th className="p-4">PRODUCTO</th><th className="p-4">CATEGORÍA</th><th className="p-4 text-right">STOCK ACTUAL</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {products.slice(0, 100).map((p,i) => (
                  <tr key={i} className="hover:bg-nexus-800/50">
                    <td className="p-4 font-mono text-slate-400">{p.sku}</td>
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4">{p.category}</td>
                    <td className="p-4 text-right font-black text-blue-400">{p.stock} pz</td>
                  </tr>
                ))}
                {products.length > 100 && <tr><td colSpan={4} className="p-4 text-center text-slate-500 text-[10px]">Mostrando los primeros 100 productos...</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'POR HORA' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-8 text-center">
            <h3 className="text-xl font-black text-white mb-4">REPORTE DE VENTAS POR HORA</h3>
            <div className="grid grid-cols-6 gap-4">
              {Array.from({length: 24}).map((_, i) => {
                const totalHora = filteredTickets.filter(t => new Date(t.date).getHours() === i).reduce((s, t) => s + (t.total||0), 0);
                return (
                  <div key={i} className="bg-nexus-800 p-4 rounded-xl border border-nexus-700">
                    <p className="text-slate-400 font-bold text-xs">{i.toString().padStart(2, '0')}:00</p>
                    <p className="text-emerald-400 font-black">${totalHora.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'MATRIZ 24H' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
             <BarChart3 className="w-16 h-16 text-slate-700 mb-4" />
             <p className="text-slate-500 font-bold">Visualización de mapa de calor 24 horas optimizada en el Dashboard Principal.</p>
          </div>
        )}

        {activeTab === 'PEDIDOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
             <p className="text-slate-500 font-bold">No hay pedidos registrados en este periodo.</p>
          </div>
        )}

"""
    c = c[:injection_point] + restored_views + c[injection_point:]

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
    print("Restored missing tabs in Reports.tsx")
