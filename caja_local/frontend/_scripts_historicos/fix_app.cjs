const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Fix broken characters in App.tsx
file = file.replace(/Entradas y Kordex/g, 'Entradas y Kárdex');
file = file.replace(/Entradas y Krdex/g, 'Entradas y Kárdex');
file = file.replace(/Catlogo Maestro/g, 'Catálogo Maestro');
file = file.replace(/Auditoras Fsicas/g, 'Auditorías Físicas');

fs.writeFileSync('src/App.tsx', file);
console.log('App.tsx routing fixed!');
