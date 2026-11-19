const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const importBtn = "<label className='cursor-pointer bg-fuchsia-900/30 text-fuchsia-500 hover:bg-fuchsia-900/50 border border-fuchsia-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n  <Download className='w-4 h-4' /> IMPORTAR EXCEL\n  <input type='file' accept='.xlsx, .xls' className='hidden' onChange={handleImportExcel} />\n</label>";

const exportBtn = "<button onClick={handleExportExcel} className='bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n  <Download className='w-4 h-4' /> EXPORTAR EXCEL\n</button>";

// Let's just find the exact block by its boundaries
file = file.replace(/<button[^>]*>[\s\S]*?<ScanBarcode[\s\S]*?<\/button>/, importBtn);
file = file.replace(/<button[^>]*>[\s\S]*?EXPORTAR EXCEL[\s\S]*?<\/button>/, exportBtn);

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Success');
