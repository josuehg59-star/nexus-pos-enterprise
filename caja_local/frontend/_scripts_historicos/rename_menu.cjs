const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(/Entradas y K.rdex/g, 'Entradas');

fs.writeFileSync('src/App.tsx', file);
console.log('Renamed menu');
