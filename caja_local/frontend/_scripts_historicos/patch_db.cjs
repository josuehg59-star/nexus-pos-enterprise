const fs = require('fs');
let file = fs.readFileSync('src/store/database.ts', 'utf8');

if (!file.includes('compras:')) {
  file = file.replace(/tickets: 'id, folio, date',/, "tickets: 'id, folio, date',\n      compras: '++id, folio, date, provider',");
  file = file.replace(/export interface Ticket {/, "export interface Compra {\n  id?: number;\n  folio: string;\n  date: string;\n  provider: string;\n  items: any[];\n  subtotal: number;\n  total: number;\n}\n\nexport interface Ticket {");
  file = file.replace(/tickets: Dexie.Table<Ticket, number>;/, "tickets: Dexie.Table<Ticket, number>;\n  compras: Dexie.Table<Compra, number>;");
  fs.writeFileSync('src/store/database.ts', file);
  console.log('Database updated with compras');
} else {
  console.log('Already has compras');
}
