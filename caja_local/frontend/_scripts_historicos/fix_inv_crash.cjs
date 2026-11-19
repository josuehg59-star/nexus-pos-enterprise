const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace("  const products = useLiveQuery(() => db.products.toArray()) || [];\\n  \\n  const handleExportarExcel", "  const handleExportarExcel");
fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Fixed crash');
