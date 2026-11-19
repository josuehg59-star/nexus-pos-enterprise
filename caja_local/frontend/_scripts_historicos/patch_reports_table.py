import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Let's locate the table manually using index
start_str = "activeTab === 'CR"
end_str = "No hay clientes con"
start_idx = c.find(start_str)

if start_idx != -1:
    end_idx = c.find("</table>", start_idx) + 8
    
    new_creditos = """
            {activeTab === 'CRÉDITOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr>
                    <th className="p-4 text-[10px] text-slate-500 uppercase">CLIENTE</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">DEUDA (CRÉDITO)</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">SALDO MONEDERO</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {clients.filter(c => (c.credito || 0) > 0 || (c.monedero || 0) > 0).map((c, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{c.name}</td>
                      <td className="p-4 text-xs font-black text-orange-400 text-right">${(c.credito || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs font-black text-emerald-400 text-right">${(c.monedero || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs text-right">
                        {(c.credito || 0) > 0 && (
                          <button 
                            onClick={() => { setSelectedClientAbono(c); setAbonoAmount(c.credito.toString()); setShowAbonoModal(true); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            LIQUIDAR / ABONAR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clients.filter(c => (c.credito || 0) > 0 || (c.monedero || 0) > 0).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No hay clientes con crédito o monedero activo.</td></tr>}
                </tbody>
              </table>
"""
    # Note we only replace up to </table>. 
    # Let's ensure we find the closing bracket } after </table>
    full_end_idx = c.find(")}", end_idx) + 2
    c = c[:start_idx] + new_creditos.lstrip() + c[full_end_idx:]

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Abonos table injected")
