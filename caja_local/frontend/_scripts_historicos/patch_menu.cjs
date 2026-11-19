const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace("'Entradas',", "'Entradas', 'Kárdex',");

fs.writeFileSync('src/App.tsx', file);
console.log('Fixed menu');
