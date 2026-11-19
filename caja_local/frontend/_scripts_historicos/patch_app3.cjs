const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace('import Auditoria from \\'./pages/Auditoria\\';', 'import Auditoria from \\'./pages/Auditoria\\';\\nimport Recargas from \\'./pages/Recargas\\';');

file = file.replace(/if \(activeSubMenu === 'Recargas y Servicios'\) return <div.*?;/, "if (activeSubMenu === 'Recargas y Servicios') return <Recargas />;");

fs.writeFileSync('src/App.tsx', file);
console.log('App patched');
