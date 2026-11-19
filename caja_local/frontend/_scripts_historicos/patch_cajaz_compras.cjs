const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

const comprasBox = "            <div className='bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>\\n" +
"               <h3 className='text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3'>\\n" +
"                <Calculator className='text-fuchsia-400' /> COMPRAS DEL DÍA (PROVEEDORES)\\n" +
"              </h3>\\n" +
"              <table className='w-full text-left'>\\n" +
"                <thead className='border-b border-nexus-800'>\\n" +
"                  <tr>\\n" +
"                    <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Proveedor</th>\\n" +
"                    <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Artículos</th>\\n" +
"                    <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right'>Total Pagado</th>\\n" +
"                  </tr>\\n" +
"                </thead>\\n" +
"                <tbody className='divide-y divide-nexus-800'>\\n" +
"                  <tr>\\n" +
"                    <td colSpan={3} className='py-8 text-center text-slate-500 font-bold'>No hay compras o entradas registradas el día de hoy.</td>\\n" +
"                  </tr>\\n" +
"                </tbody>\\n" +
"              </table>\\n" +
"              <div className='mt-6 pt-6 border-t border-nexus-800 flex justify-between items-center'>\\n" +
"                <span className='text-xs font-black text-slate-400 tracking-widest'>TOTAL GASTOS (COMPRAS):</span>\\n" +
"                <span className='text-xl font-black text-fuchsia-400'>\.00</span>\\n" +
"              </div>\\n" +
"            </div>\\n\\n          </div>";

file = file.replace(/<\/table>\n\s*<\/div>\n\s*<\/div>/, "</table>\n              </div>\n" + comprasBox);

fs.writeFileSync('src/pages/CajaZ.tsx', file);
console.log('CajaZ updated');
