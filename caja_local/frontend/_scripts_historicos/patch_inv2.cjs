const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const buttonBlock = "<div className=\\"flex gap-3\\">\n" +
"            <button onClick={() => setShowLabelModal(true)} className=\\"bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors border border-nexus-700\\">\n" +
"              <ScanBarcode className=\\"w-4 h-4\\" /> IMPRIMIR ETIQUETAS\n" +
"            </button>\n" +
"            <label className=\\"cursor-pointer bg-fuchsia-900/30 text-fuchsia-500 hover:bg-fuchsia-900/50 border border-fuchsia-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors\\">\n" +
"              <Download className=\\"w-4 h-4\\" /> IMPORTAR EXCEL\n" +
"              <input type=\\"file\\" accept=\\".xlsx, .xls\\" className=\\"hidden\\" onChange={handleImportExcel} />\n" +
"            </label>\n" +
"            <button onClick={handleExportExcel} className=\\"bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors\\">\n" +
"              <Download className=\\"w-4 h-4\\" /> EXPORTAR EXCEL\n" +
"            </button>\n" +
"            <button \n" +
"              onClick={() => setShowAddModal(true)}\n" +
"              className=\\"bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors\\"\n" +
"            >\n" +
"              <Plus className=\\"w-5 h-5\\" /> NUEVO PRODUCTO\n" +
"            </button>\n" +
"          </div>";

file = file.replace(/<div className="flex gap-3">[\s\S]*?<Plus className="w-5 h-5" \/> NUEVO PRODUCTO\n\s*<\/button>\n\s*<\/div>/m, buttonBlock);

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Inventory patched 2');
