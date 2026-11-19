const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const newBlock = '<div className="flex items-center gap-3">\n' +
'            <label className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-nexus-700 cursor-pointer shadow-lg">\n' +
'              <Download className="w-4 h-4" /> IMPORTAR EXCEL\n' +
'              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => alert("Módulo de importación...")} />\n' +
'            </label>\n' +
'            <button onClick={handleExportarExcel} className="bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow-lg">\n' +
'              <Upload className="w-4 h-4" /> EXPORTAR EXCEL\n' +
'            </button>';

file = file.replace(/<div className="flex gap-3">[\s\S]*?<\/button>\s*<\/button>/, newBlock);
file = file.replace('import { PackageSearch,', 'import { PackageSearch, Upload,');

fs.writeFileSync('src/pages/Inventory.tsx', file);
