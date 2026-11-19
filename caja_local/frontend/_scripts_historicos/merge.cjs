const fs = require('fs');

let myCode = fs.readFileSync('src/pages/Reports.tsx', 'utf8');
let theirCode = fs.readFileSync('src/pages/Reports.backup.tsx', 'utf8');

// The top of their code has the imports. I want my imports.
// The top of their component has states. I want my states.
// I just want THEIR JSX layout.

const theirReturnStart = theirCode.indexOf('return (');
const theirReturnEnd = theirCode.lastIndexOf(');');
const theirJSX = theirCode.substring(theirReturnStart, theirReturnEnd + 2);

// Let's replace the tables inside theirJSX with my tables.
// My tables are \enderFoliosTable()\ and \enderVentasTable()\

let newJSX = theirJSX;

// Fix the activeTab colors in the pills
const pillRegex = /className=\{\whitespace-nowrap px-4 py-2 rounded-xl text-\[10px\] font-black uppercase tracking-widest transition-colors border \\\$\{\\n              activeTab === tab \\n                \? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500\/20' \\n                : tab === 'M\?S VENDIDOS' \? 'bg-fuchsia-900\/30 border-fuchsia-800 text-fuchsia-400'/;
// theirCode has encoding issues for MÁS VENDIDOS. I'll just use my pill map.

const myReturnStart = myCode.indexOf('return (');
const myReturnEnd = myCode.lastIndexOf(');');
const myJSX = myCode.substring(myReturnStart, myReturnEnd + 2);

// Actually, I'll just replace the filter section in my code with their filter section.
const myFilterStart = myJSX.indexOf('{/* FILTROS */}');
const myFilterEnd = myJSX.indexOf('{/* CONTENEDOR DE TABLA */}');

const theirFilterStart = theirJSX.indexOf('{/* FILTROS */}');
const theirFilterEnd = theirJSX.indexOf('{/* TABLA DE RESULTADOS */}');

const theirFilter = theirJSX.substring(theirFilterStart, theirFilterEnd);

// Modify theirFilter to use my variables:
// 1. Proveedor
let modFilter = theirFilter.replace('<select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">\n                <option>TODOS LOS PROVEEDORES</option>\n                <option>BIMBO SA DE CV</option>\n                <option>LA GARDENIA</option>\n              </select>', 
'<select value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">{uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}</select>');

// 2. Fecha Inicio
modFilter = modFilter.replace('<input type="date" defaultValue="2026-09-27" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />', 
'<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent [color-scheme:dark]" />');

// 3. Fecha Fin
modFilter = modFilter.replace('<input type="date" defaultValue="2026-09-27" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />', 
'<input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent [color-scheme:dark]" />');

const finalJSX = myJSX.substring(0, myFilterStart) + modFilter + myJSX.substring(myFilterEnd);

myCode = myCode.replace(myJSX, finalJSX);

fs.writeFileSync('src/pages/Reports.tsx', myCode);
console.log('Merged successfully');
