const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');
file = file.replace(/if \(activeSubMenu === 'Recargas y Servicios'\) return <div[\s\S]*?;/, "if (activeSubMenu === 'Recargas y Servicios') return <Recargas />;");
fs.writeFileSync('src/App.tsx', file);
console.log('App patched');
