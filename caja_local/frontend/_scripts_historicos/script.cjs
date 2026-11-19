const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace(/<button[^>]*>\s*<ScanBarcode className="w-4 h-4" \/> IMPRIMIR ETIQUETAS\s*<\/button>/g, 
  "<label className='cursor-pointer bg-fuchsia-900/30 text-fuchsia-500 hover:bg-fuchsia-900/50 border border-fuchsia-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n" +
  "  <Download className='w-4 h-4' /> IMPORTAR EXCEL\n" +
  "  <input type='file' accept='.xlsx, .xls' className='hidden' onChange={handleImportExcel} />\n" +
  "</label>");

file = file.replace(/<button className="bg-emerald-900\/30[^>]*>\s*<Download className="w-4 h-4" \/> EXPORTAR EXCEL\s*<\/button>/g,
  "<button onClick={handleExportExcel} className='bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n" +
  "  <Download className='w-4 h-4' /> EXPORTAR EXCEL\n" +
  "</button>");

fs.writeFileSync('src/pages/Inventory.tsx', file);
