const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const oldBtns = '<div className="flex gap-3">\n' +
'            <button onClick={() => setShowLabelModal(true)} className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-nexus-700">\n' +
'              <ScanBarcode className="w-4 h-4" /> IMPRIMIR ETIQUETAS\n' +
'            </button>\n' +
'            <button className="bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors">\n' +
'              <Download className="w-4 h-4" /> EXPORTAR EXCEL\n' +
'            </button>';

const newBtns = '<div className="flex gap-3">\n' +
'            <label className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-nexus-700 cursor-pointer shadow-lg">\n' +
'              <Download className="w-4 h-4" /> IMPORTAR EXCEL\n' +
'              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => alert("Módulo en construcción")} />\n' +
'            </label>\n' +
'            <button onClick={handleExportarExcel} className="bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow-lg">\n' +
'              <Upload className="w-4 h-4" /> EXPORTAR EXCEL\n' +
'            </button>';

file = file.replace(oldBtns, newBtns);
fs.writeFileSync('src/pages/Inventory.tsx', file);
