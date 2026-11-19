const fs = require('fs');
const content = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');
const idx = content.indexOf("e.key === 'Enter') {");
console.log(content.substring(idx - 100, idx + 100));
