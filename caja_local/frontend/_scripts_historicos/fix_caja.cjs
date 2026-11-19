const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

// Fix Imprimir Corte X
file = file.replace('<button className="bg-blue-900/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-colors">\\n            <Printer className="w-4 h-4" /> IMPRIMIR CORTE X (PARCIAL)\\n          </button>', 
'<button onClick={() => window.print()} className="bg-blue-900/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-colors"><Printer className="w-4 h-4" /> IMPRIMIR CORTE X (PARCIAL)</button>');
// I'll use regex for flexibility
file = file.replace(/<button className="bg-blue-900\/30[^>]*>[\s\S]*?<Printer className="w-4 h-4" \/> IMPRIMIR CORTE X \(PARCIAL\)\n\s*<\/button>/m, '<button onClick={() => window.print()} className="bg-blue-900/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-colors"><Printer className="w-4 h-4" /> IMPRIMIR CORTE X (PARCIAL)</button>');

fs.writeFileSync('src/pages/CajaZ.tsx', file);
console.log('CajaZ patched');
