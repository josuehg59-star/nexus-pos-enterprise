const fs = require('fs');
let file = fs.readFileSync('src/pages/Recargas.tsx', 'utf8');

const newModal = "      {showAddModal && (\\n" +
"        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/80 backdrop-blur-sm'>\\n" +
"          <div className='bg-nexus-900 border border-nexus-700 w-[500px] p-6 rounded-2xl shadow-2xl'>\\n" +
"            <h3 className='text-xl font-black text-white mb-4'>CREAR / MODIFICAR SERVICIOS</h3>\\n" +
"            \\n" +
"            <div className='mb-6 max-h-[200px] overflow-y-auto border border-nexus-700 rounded-xl p-2'>\\n" +
"              {companias.map((c, idx) => (\\n" +
"                <div key={idx} className='flex items-center justify-between p-2 hover:bg-nexus-800 rounded-lg'>\\n" +
"                  <span className='text-slate-300 font-bold text-sm'>{c.id}</span>\\n" +
"                  <button onClick={() => setCustomServices(customServices.filter(cs => cs.id !== c.id))} className='text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 px-3 py-1 rounded-md'>ELIMINAR</button>\\n" +
"                </div>\\n" +
"              ))}\\n" +
"            </div>\\n\\n" +
"            <div className='space-y-4 pt-4 border-t border-nexus-800'>\\n" +
"              <div>\\n" +
"                <label className='text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2'>Agregar Nuevo Servicio</label>\\n" +
"                <div className='flex gap-2'>\\n" +
"                  <input type='text' value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder='Ej: IZZI' className='flex-1 bg-[#0b1120] border border-nexus-700 text-white px-4 py-2 rounded-xl' />\\n" +
"                  <button onClick={() => { if(newServiceName) { setCustomServices([...customServices, { id: newServiceName.toUpperCase(), icon: MonitorPlay, color: 'text-fuchsia-400' }]); setNewServiceName(''); } }} className='px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-black'>AGREGAR</button>\\n" +
"                </div>\\n" +
"              </div>\\n" +
"            </div>\\n" +
"            <div className='flex justify-end gap-3 mt-8'>\\n" +
"              <button onClick={() => setShowAddModal(false)} className='px-6 py-3 bg-nexus-800 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold w-full'>CERRAR VENTANA</button>\\n" +
"            </div>\\n" +
"          </div>\\n" +
"        </div>\\n" +
"      )}";

file = file.replace(/\{showAddModal && \([\s\S]*?\}\)/, newModal);
fs.writeFileSync('src/pages/Recargas.tsx', file);
