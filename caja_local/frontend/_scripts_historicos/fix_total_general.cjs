const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

file = file.replace(/const totalGeneral = entradas\.reduce\(\(sum, item\) => sum \+ \(item\.cost \* item\.entradaQty\), 0\);\n\n  return \(/, 'return (');

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('totalGeneral removed');
