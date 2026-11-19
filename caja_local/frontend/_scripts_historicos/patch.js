const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');
const searchStr = '<button className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">\n                            <Edit className="w-4 h-4" />\n                          </button>';
const replaceStr = '<button onClick={() => { setEditId(item.id || null); setSku(item.sku); setName(item.name); setCategory(item.category || ""); setPrice(item.price.toString()); setCost(item.cost.toString()); setStock(item.stock.toString()); setShowModal(true); }} className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">\n                            <Edit className="w-4 h-4" />\n                          </button>';
if (file.includes(searchStr)) {
  fs.writeFileSync('src/pages/Inventory.tsx', file.replace(searchStr, replaceStr));
  console.log('Success');
} else {
  console.log('Not found');
}
