const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const applyLogic = "  const handleAplicar = async () => {\n" +
"    if (entradas.length === 0) return;\n" +
"    for (const item of entradas) {\n" +
"      const dbProduct = await db.products.where('sku').equals(item.sku).first();\n" +
"      if (dbProduct && dbProduct.id) {\n" +
"        await db.products.update(dbProduct.id, {\n" +
"          cost: item.cost,\n" +
"          price: item.price,\n" +
"          stock: dbProduct.stock + item.entradaQty\n" +
"        });\n" +
"      }\n" +
"    }\n" +
"    alert('Entrada procesada y guardada. El inventario ha sido actualizado.');\n" +
"    setEntradas([]);\n" +
"  };";

file = file.replace(/const handleAplicar = async \(\) => {[\s\S]*?setEntradas\(\[\]\);\n  };/, applyLogic);
fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Aplicar patched');
