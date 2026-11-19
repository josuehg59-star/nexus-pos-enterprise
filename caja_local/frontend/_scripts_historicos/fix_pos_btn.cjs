const fs = require('fs');
let file = fs.readFileSync('src/pages/PosTerminal.tsx', 'utf8');

file = file.replace(/disabled=\{cart\.length === 0\}/g, '');
file = file.replace('opacity-50 cursor-not-allowed', '');
file = file.replace(/const handleCobrar = async \(\) => \{/g, "const handleCobrar = async () => {\n    if (cart.length === 0) { alert('El carrito está vacío. Agrega productos para cobrar.'); return; }");

fs.writeFileSync('src/pages/PosTerminal.tsx', file);
console.log('Pos fixed');
