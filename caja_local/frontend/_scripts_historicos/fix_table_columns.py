import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the VENTAS table block
start_table = r'<table className="w-full text-left text-xs">\s*<thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">[\s\S]*?No hay ventas registradas\.</td></tr>\}\s*</tbody>\s*</table>'

new_table = """<table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">CÓDIGO</th>
                        <th className="p-4">PRODUCTO</th>
                        <th className="p-4">MÉTODO</th>
                        <th className="p-4">PROVEEDOR</th>
                        <th className="p-4 text-center">CANT.</th>
                        <th className="p-4 text-right">COSTO</th>
                        <th className="p-4 text-right">PRECIO</th>
                        <th className="p-4 text-right">TOTAL</th>
                        <th className="p-4 text-right">UTIL.</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white">
                    {(() => {
                       const skuToProv = new Map(products.map(p => [String(p.sku), String((p as any).supplier_id || p.category || '').toUpperCase()]));
                       let sumCant = 0;
                       let sumTotal = 0;
                       let sumUtil = 0;
                       const rows = filteredTickets.flatMap(t => t.items?.map((item:any, idx:number) => {
                          const prov = skuToProv.get(String(item.sku)) || 'SIN PROVEEDOR';
                          const cant = item.cartQty - (item.returnedQty || 0);
                          const costo = item.cost || (item.price * 0.7);
                          const total = item.price * cant;
                          const util = (item.price - costo) * cant;
                          
                          sumCant += cant;
                          sumTotal += total;
                          sumUtil += util;

                          return (
                            <tr key={`${t.id}-${idx}`} className="hover:bg-[#1e293b]/30 transition-colors border-b border-[#1e293b]/30">
                              <td className="p-4 font-mono text-blue-400 text-xs">{item.sku}</td>
                              <td className="p-4 font-bold text-slate-300 text-xs truncate max-w-[200px]" title={item.name}>{item.name}</td>
                              <td className="p-4 font-bold text-slate-400 text-[10px] uppercase">{t.paymentMethod}</td>
                              <td className="p-4 font-bold text-blue-400 text-[10px] uppercase truncate max-w-[150px]" title={prov}>{prov}</td>
                              <td className="p-4 font-black text-white text-center">{cant}</td>
                              <td className="p-4 font-bold text-slate-400 text-right">${costo.toFixed(2)}</td>
                              <td className="p-4 font-bold text-slate-300 text-right">${item.price?.toFixed(2)}</td>
                              <td className="p-4 font-black text-emerald-400 text-right">${total.toFixed(2)}</td>
                              <td className="p-4 font-black text-blue-400 text-right">${util.toFixed(2)}</td>
                            </tr>
                          );
                       }));

                       return (
                          <>
                            {rows}
                            {rows.length > 0 && (
                              <tr className="bg-[#0b1120]">
                                 <td colSpan={4} className="p-4 text-right font-black text-white tracking-widest uppercase">TOTAL:</td>
                                 <td className="p-4 text-center font-black text-white">{sumCant}</td>
                                 <td colSpan={2}></td>
                                 <td className="p-4 text-right font-black text-emerald-400">${sumTotal.toFixed(2)}</td>
                                 <td className="p-4 text-right font-black text-blue-400">${sumUtil.toFixed(2)}</td>
                              </tr>
                            )}
                            {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
                          </>
                       );
                    })()}
                  </tbody>
                </table>"""

if re.search(start_table, code):
    code = re.sub(start_table, new_table, code)
else:
    print("Could not find table block")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Re-structured VENTAS table to perfectly match Titan POS")
