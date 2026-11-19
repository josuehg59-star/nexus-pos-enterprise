const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

const historyModal = "      {showHistory && (\n" +
"        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/80 backdrop-blur-sm'>\n" +
"          <div className='bg-nexus-900 border border-nexus-700 w-[600px] p-6 rounded-2xl shadow-2xl'>\n" +
"            <div className='flex justify-between items-center mb-6'>\n" +
"              <h3 className='text-xl font-black text-white'>HISTORIAL DE CORTES Z</h3>\n" +
"              <button onClick={() => setShowHistory(false)} className='text-slate-400 hover:text-white font-black text-xl'>X</button>\n" +
"            </div>\n" +
"            <div className='space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar'>\n" +
"              {historialCortes.length === 0 ? (\n" +
"                <p className='text-slate-500 text-center py-4 font-bold'>No hay cortes registrados en la base de datos.</p>\n" +
"              ) : (\n" +
"                historialCortes.map(corte => (\n" +
"                  <div key={corte.id} className='bg-nexus-800 p-4 rounded-xl border border-nexus-700'>\n" +
"                    <div className='flex justify-between mb-2'>\n" +
"                      <span className='text-white font-bold'>{new Date(corte.date).toLocaleString()}</span>\n" +
"                      <span className='text-emerald-400 font-black'>\</span>\n" +
"                    </div>\n" +
"                    <div className='text-xs text-slate-400 flex gap-4 font-bold'>\n" +
"                      <span>Efectivo: \</span>\n" +
"                      <span>Tarjeta: \</span>\n" +
"                    </div>\n" +
"                  </div>\n" +
"                ))\n" +
"              )}\n" +
"            </div>\n" +
"          </div>\n" +
"        </div>\n" +
"      )}";

file = file.replace('return (', 'return (\n    <>\n' + historyModal);
file = file.replace('</div>\n  );\n}', '</div>\n    </>\n  );\n}');

file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-6 py-3 rounded-xl font-black text-xs[\s\S]*?<History className="w-4 h-4" \/> HISTORIAL DE CORTES\n\s*<\/button>/m, '<button onClick={() => setShowHistory(true)} className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 border border-nexus-700 transition-colors"><History className="w-4 h-4" /> HISTORIAL DE CORTES</button>');

fs.writeFileSync('src/pages/CajaZ.tsx', file);
console.log('CajaZ Patched');
