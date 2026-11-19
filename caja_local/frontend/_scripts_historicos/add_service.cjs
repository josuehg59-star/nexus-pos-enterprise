const fs = require('fs');
let file = fs.readFileSync('src/pages/Recargas.tsx', 'utf8');

if (!file.includes('showAddModal')) {
  file = file.replace('const [compania, setCompania] = useState(\\'TELCEL\\');', 'const [compania, setCompania] = useState(\\'TELCEL\\');\\n  const [showAddModal, setShowAddModal] = useState(false);\\n  const [newServiceName, setNewServiceName] = useState(\\'\\');\\n  const [customServices, setCustomServices] = useState<{id: string, icon: any, color: string}[]>([]);');
}

file = file.replace('const companias = [', 'const companias = [\\n    ...customServices,');

const modal = "      {showAddModal && (\\n" +
"        <div className=\\"fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/80 backdrop-blur-sm\\">\\n" +
"          <div className=\\"bg-nexus-900 border border-nexus-700 w-[400px] p-6 rounded-2xl shadow-2xl\\">\\n" +
"            <h3 className=\\"text-xl font-black text-white mb-4\\">NUEVO SERVICIO</h3>\\n" +
"            <div className=\\"space-y-4\\">\\n" +
"              <div>\\n" +
"                <label className=\\"text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2\\">Nombre del Servicio</label>\\n" +
"                <input type=\\"text\\" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder=\\"Ej: IZZI\\" className=\\"w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-2 rounded-xl\\" />\\n" +
"              </div>\\n" +
"            </div>\\n" +
"            <div className=\\"flex justify-end gap-3 mt-8\\">\\n" +
"              <button onClick={() => setShowAddModal(false)} className=\\"px-4 py-2 bg-nexus-800 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold\\">CANCELAR</button>\\n" +
"              <button onClick={() => { if(newServiceName) { setCustomServices([...customServices, { id: newServiceName.toUpperCase(), icon: MonitorPlay, color: 'text-fuchsia-400' }]); setShowAddModal(false); setNewServiceName(''); } }} className=\\"px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-black\\">GUARDAR SERVICIO</button>\\n" +
"            </div>\\n" +
"          </div>\\n" +
"        </div>\\n" +
"      )}";

file = file.replace('return (', 'return (\\n    <>\\n' + modal);
file = file.replace('</div>\\n  );\\n}', '</div>\\n    </>\\n  );\\n}');

const headerBtn = "<div className=\\"flex items-center gap-3 mb-8\\">";
const headerBtnReplace = "<div className=\\"flex items-center justify-between mb-8\\">\\n        <div className=\\"flex items-center gap-3\\">\\n          <Smartphone className=\\"w-8 h-8 text-fuchsia-500\\" />\\n          <div>\\n            <h2 className=\\"font-black text-2xl tracking-wider text-white\\">RECARGAS Y PAGO DE SERVICIOS</h2>\\n            <p className=\\"text-slate-400 text-sm\\">VENDE TIEMPO AIRE Y COBRA RECIBOS</p>\\n          </div>\\n        </div>\\n        <button onClick={() => setShowAddModal(true)} className=\\"bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase transition-colors border border-nexus-700\\">CREAR / MODIFICAR SERVICIO</button>\\n      </div>";

file = file.replace(/<div className="flex items-center gap-3 mb-8">[\s\S]*?<\/div>\n      <\/div>/, headerBtnReplace);

fs.writeFileSync('src/pages/Recargas.tsx', file);
console.log('Recargas button added');
