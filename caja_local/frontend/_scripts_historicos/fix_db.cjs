const fs = require('fs');
let file = fs.readFileSync('src/store/database.ts', 'utf8');

const correctStores = "this.version(3).stores({\n" +
"      products: '++id, sku, name, category',\n" +
"      clients: '++id, name, phone, email, monederoCode',\n" +
"      tickets: 'id, date, paymentMethod',\n" +
"      cortes: '++id, date'\n" +
"    });";

file = file.replace(/this\.version\(3\)\.stores\(\{[\s\S]*?\}\);/, correctStores);
fs.writeFileSync('src/store/database.ts', file);
console.log('DB fixed');
