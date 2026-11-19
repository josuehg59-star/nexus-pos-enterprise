const fs = require('fs');
let file = fs.readFileSync('src/index.css', 'utf8');
file = file.replace(/@media print {[^}]*}/g, '');
fs.writeFileSync('src/index.css', file);
