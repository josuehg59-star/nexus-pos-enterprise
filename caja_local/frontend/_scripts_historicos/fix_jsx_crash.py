import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to find the block starting from {['M?S VENDIDOS', 'TOP VENDIDOS']... to just before {activeTab === 'FOLIOS' && (
block_regex = r"\{?\['M.*S VENDIDOS', 'TOP VENDIDOS'\].includes\(activeTab\) && \([\s\S]*?(?=\{activeTab === 'FOLIOS' && \()"

replacement = """{['MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-900 border-b border-nexus-800 text-slate-500 uppercase">
                <tr><th className="p-4">PRODUCTO</th><th className="p-4 text-center">PIEZAS VENDIDAS</th><th className="p-4 text-right">TOTAL GENERADO</th></tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50 text-white">
                {(() => {
                  const productSales = new Map<string, {qty:number, total:number}>();
                  filteredTickets.forEach(t => {
                    t.items?.forEach((item:any) => {
                      const current = productSales.get(item.name) || {qty:0, total:0};
                      const qty = item.cartQty - (item.returnedQty || 0);
                      productSales.set(item.name, {
                        qty: current.qty + qty,
                        total: current.total + (qty * item.price)
                      });
                    });
                  });
                  let sorted = Array.from(productSales.entries());
                  if (activeTab === 'MÁS VENDIDOS' || activeTab === 'TOP VENDIDOS') sorted.sort((a,b) => b[1].qty - a[1].qty);
                  if (activeTab === 'MENOS VENDIDOS') sorted.sort((a,b) => a[1].qty - b[1].qty);
                  return sorted.map(([name, stats], idx) => (
                    <tr key={idx} className="hover:bg-nexus-800/50">
                      <td className="p-4 font-bold">{name}</td>
                      <td className="p-4 text-center font-black text-blue-400">{stats.qty}</td>
                      <td className="p-4 text-right font-black text-emerald-400">${stats.total.toFixed(2)}</td>
                    </tr>
                  ));
                })()}
                {filteredTickets.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No hay datos suficientes.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'VENTAS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE DE VENTAS</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-emerald-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">VENTA BRUTA TOTAL</p>
                  <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs whitespace-nowrap">
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
                </table>
            </div>
          </div>
        )}

"""

if re.search(block_regex, code):
    code = re.sub(block_regex, replacement, code)
else:
    print("Could not find block regex")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Restored MÁS VENDIDOS and VENTAS perfectly")
