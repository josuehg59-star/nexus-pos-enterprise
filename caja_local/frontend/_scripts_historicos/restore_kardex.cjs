const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const tableHeader = "<thead className=\\"bg-nexus-900 border-b border-nexus-800 sticky top-0 z-10\\">\\n" +
"                <tr>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest\\">SKU / CÓDIGO</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest\\">DESCRIPCIÓN</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right\\">COSTO</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right\\">PRECIO</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center\\">UTILIDAD</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center\\">CANTIDAD</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center\\">IEPS %</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center\\">IVA %</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right\\">TOTAL DE LÍNEA</th>\\n" +
"                  <th className=\\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center\\">ACCIÓN</th>\\n" +
"                </tr>\\n" +
"              </thead>";

file = file.replace(/<thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0 z-10">[\s\S]*?<\/thead>/, tableHeader);

const tableBodyMap = "{entradas.map((item, idx) => (\\n" +
"                  <tr key={idx} className=\\"hover:bg-nexus-800/30 transition-colors group\\">\\n" +
"                    <td className=\\"p-4 text-xs font-bold text-slate-300\\">{item.sku}</td>\\n" +
"                    <td className=\\"p-4 text-sm font-black text-white\\">{item.name}</td>\\n" +
"                    <td className=\\"p-4 text-right\\">\\n" +
"                      <div className=\\"flex items-center justify-end\\">\\n" +
"                        <span className=\\"text-slate-500 mr-2\\">$</span>\\n" +
"                        <input type=\\"number\\" value={item.cost} onChange={(e) => updateEntrada(idx, 'cost', parseFloat(e.target.value) || 0)} className=\\"w-20 bg-nexus-900 border border-nexus-700 text-emerald-400 font-bold px-2 py-1 rounded text-right\\" />\\n" +
"                      </div>\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-right\\">\\n" +
"                      <div className=\\"flex items-center justify-end\\">\\n" +
"                        <span className=\\"text-slate-500 mr-2\\">$</span>\\n" +
"                        <input type=\\"number\\" value={item.price} onChange={(e) => updateEntrada(idx, 'price', parseFloat(e.target.value) || 0)} className=\\"w-20 bg-nexus-900 border border-nexus-700 text-blue-400 font-bold px-2 py-1 rounded text-right\\" />\\n" +
"                      </div>\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center text-xs font-bold text-fuchsia-400\\">\\n" +
"                      {(((item.price - item.cost) / (item.cost || 1)) * 100).toFixed(0)}%\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" value={item.entradaQty} onChange={(e) => updateEntrada(idx, 'entradaQty', parseInt(e.target.value) || 1)} className=\\"w-16 bg-nexus-900 border border-nexus-700 text-white font-bold px-2 py-1 rounded text-center\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" defaultValue=\\"0\\" className=\\"w-12 bg-nexus-900 border border-nexus-700 text-slate-300 font-bold px-2 py-1 rounded text-center\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" defaultValue=\\"0\\" className=\\"w-12 bg-nexus-900 border border-nexus-700 text-slate-300 font-bold px-2 py-1 rounded text-center\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-right text-emerald-400 font-black\\">\\n" +
"                      \\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <button onClick={() => setEntradas(entradas.filter((_, i) => i !== idx))} className=\\"text-red-500 hover:text-red-400 p-2\\">\\n" +
"                        <Trash2 className=\\"w-4 h-4\\" />\\n" +
"                      </button>\\n" +
"                    </td>\\n" +
"                  </tr>\\n" +
"                ))}";

file = file.replace(/{entradas\.map\(\(item, idx\) => \([\s\S]*?<\/tr>\n\s*\)\)}/, tableBodyMap);

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Kardex restored');
