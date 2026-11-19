const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const newBlock = \<div className="flex gap-2 items-center">
            <button onClick={() => setTipoMovimiento("ENTRADA")} className={\\\px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \\\\}>ENTRADA</button>
            <button onClick={() => setTipoMovimiento("DEVOLUCION")} className={\\\px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \\\\}>DEVOLUCIÓN</button>
            <button onClick={() => setTipoMovimiento("MERMA")} className={\\\px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \\\\}>MERMA</button>
            <div className="w-px h-8 bg-nexus-700 mx-2"></div>
            <button onClick={handleExportExcel} className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> EXCEL
            </button>
            <button onClick={() => window.print()} className="bg-blue-900/30 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2">
              <Printer className="w-4 h-4" /> IMPRIMIR PDF
            </button>
          </div>\;

file = file.replace(/<div className="flex gap-2 items-center">[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex-1 flex flex-col p-8 overflow-hidden">/m, newBlock + '\\n        </div>\\n\\n        <div className="flex-1 flex flex-col p-8 overflow-hidden">');

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Fixed Header Block');
