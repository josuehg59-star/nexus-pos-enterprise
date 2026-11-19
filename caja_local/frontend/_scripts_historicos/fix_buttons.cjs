const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

file = file.replace(/<button onClick=\{\(\) => setTipoMovimiento\("ENTRADA"\)\} className=\{px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>ENTRADA<\/button>/,
  '<button onClick={() => setTipoMovimiento("ENTRADA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>ENTRADA</button>');

file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">\s*DEVOLUCIÓN\s*<\/button>/,
  '<button onClick={() => setTipoMovimiento("DEVOLUCION")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>DEVOLUCIÓN</button>');

// Wait, the encoding of DEVOLUCIÓN might be mangled. Let's match more broadly
file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">\s*DEVOLUCI.*N\s*<\/button>/,
  '<button onClick={() => setTipoMovimiento("DEVOLUCION")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>DEVOLUCIÓN</button>');

file = file.replace(/<button onClick=\{\(\) => setTipoMovimiento\("MERMA"\)\} className=\{px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>MERMA<\/button>/,
  '<button onClick={() => setTipoMovimiento("MERMA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>MERMA</button>');

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Fixed buttons');
