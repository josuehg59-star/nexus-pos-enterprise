const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace('const products = useLiveQuery(() => db.products.toArray()) || [];', '');
fs.writeFileSync('src/pages/Inventory.tsx', file);
