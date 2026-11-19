const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const importExcel = "<label className='bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 border border-nexus-700 transition-colors cursor-pointer shadow-lg'>\\n              <Download className='w-4 h-4' /> IMPORTAR EXCEL\\n              <input type='file' accept='.xlsx, .xls' className='hidden' onChange={(e) => alert('Importando excel...')} />\\n            </label>";
const exportExcel = "<button onClick={() => alert('Exportando a Excel...')} className='bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50 px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-colors shadow-lg'>\\n              <Upload className='w-4 h-4' /> EXPORTAR EXCEL\\n            </button>";

file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 border border-nexus-700 transition-colors">[\s\S]*?<Printer className="w-4 h-4" \/> IMPRIMIR ETIQUETAS\n\s*<\/button>/, importExcel);
file = file.replace(/<button className="bg-emerald-900\/30 border border-emerald-500\/50 text-emerald-400 hover:bg-emerald-900\/50 px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-colors">[\s\S]*?<Download className="w-4 h-4" \/> EXPORTAR EXCEL\n\s*<\/button>/, exportExcel);

if(!file.includes('Upload')) {
    file = file.replace('import { PackageSearch', 'import { PackageSearch, Upload');
}

fs.writeFileSync('src/pages/Inventory.tsx', file);
