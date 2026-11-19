const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

// Remove the global calcTotal I injected
file = file.replace(/const totalGeneral = entradas\.reduce\(\(sum, item\) => sum \+ \(item\.cost \* item\.entradaQty\), 0\);\n/, '');

// Inject it INSIDE the component right before return
file = file.replace(/return \(/, "const totalGeneral = entradas.reduce((sum, item) => sum + (item.cost * item.entradaQty), 0);\n\n  return (");

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Kardex TS fixed');
