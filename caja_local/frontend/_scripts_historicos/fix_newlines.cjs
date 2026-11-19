const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');
file = file.replace(/\\n/g, '\n');
fs.writeFileSync('src/pages/CajaZ.tsx', file);
