const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const regex = /const products = useLiveQuery\([\s\S]*?\]\n  \) \|\| \[\];/;
file = file.replace(regex, '');
fs.writeFileSync('src/pages/Inventory.tsx', file);
