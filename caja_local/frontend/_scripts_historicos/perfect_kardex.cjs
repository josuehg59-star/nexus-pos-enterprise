const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const tableBodyMap = "{entradas.map((item, idx) => {\\n" +
"                  const cost = item.cost || 0;\\n" +
"                  const price = item.price || 0;\\n" +
"                  const qty = item.entradaQty || 1;\\n" +
"                  const ieps = 0;\\n" +
"                  const iva = 0;\\n" +
"                  const utilidad = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '100.0';\\n" +
"                  const total = cost * qty;\\n" +
"                  return (\\n" +
"                  <tr key={idx} className=\\"hover:bg-nexus-800/30 transition-colors group border-b border-nexus-800/50\\">\\n" +
"                    <td className=\\"p-4 text-xs font-bold text-slate-300\\">{item.sku}</td>\\n" +
"                    <td className=\\"p-4 text-xs font-black text-white uppercase\\">{item.name}</td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" value={item.cost} onChange={(e) => updateEntrada(idx, 'cost', parseFloat(e.target.value) || 0)} className=\\"w-20 bg-transparent border border-nexus-700 text-white font-bold px-2 py-1.5 rounded text-center focus:border-blue-500 outline-none\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" value={item.price} onChange={(e) => updateEntrada(idx, 'price', parseFloat(e.target.value) || 0)} className=\\"w-20 bg-transparent border border-emerald-900/50 text-emerald-400 font-bold px-2 py-1.5 rounded text-center focus:border-emerald-500 outline-none\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center text-xs font-black text-emerald-400\\">\\n" +
"                      {utilidad}%\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <input type=\\"number\\" value={item.entradaQty} onChange={(e) => updateEntrada(idx, 'entradaQty', parseInt(e.target.value) || 1)} className=\\"w-16 bg-blue-900/20 border border-blue-900/50 text-blue-400 font-black px-2 py-1.5 rounded text-center focus:border-blue-500 outline-none\\" />\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <div className=\\"flex items-center justify-center gap-1\\">\\n" +
"                        <input type=\\"number\\" defaultValue=\\"0\\" className=\\"w-12 bg-transparent border border-orange-900/50 text-orange-400 font-bold px-2 py-1.5 rounded text-center outline-none\\" />\\n" +
"                        <span className=\\"text-orange-500/50 text-xs font-bold\\">%</span>\\n" +
"                      </div>\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <div className=\\"flex items-center justify-center gap-1\\">\\n" +
"                        <input type=\\"number\\" defaultValue=\\"0\\" className=\\"w-12 bg-transparent border border-blue-900/50 text-blue-400 font-bold px-2 py-1.5 rounded text-center outline-none\\" />\\n" +
"                        <span className=\\"text-blue-500/50 text-xs font-bold\\">%</span>\\n" +
"                      </div>\\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center text-white font-black\\">\\n" +
"                      \\n" +
"                    </td>\\n" +
"                    <td className=\\"p-4 text-center\\">\\n" +
"                      <button onClick={() => setEntradas(entradas.filter((_, i) => i !== idx))} className=\\"border border-red-900/50 text-red-500 hover:bg-red-900/30 p-2 rounded-lg transition-colors\\">\\n" +
"                        <Trash2 className=\\"w-4 h-4\\" />\\n" +
"                      </button>\\n" +
"                    </td>\\n" +
"                  </tr>\\n" +
"                );})}";

file = file.replace(/{entradas\.map\(\(item, idx\) => \([\s\S]*?<\/tr>\n\s*\)\)}/, tableBodyMap);

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Kardex styled perfectly');
