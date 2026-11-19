const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace('const [isSubmitting, setIsSubmitting] = useState(false);', 'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [editId, setEditId] = useState<number | null>(null);');

file = file.replace('setShowModal(true);', 'setShowAddModal(true);');
file = file.replace('setShowModal(true)', 'setShowAddModal(true)');

// Now the submit logic needs to handle editId
const submitLogic = "  const handleAddProduct = async () => {\n" +
"    if (!sku || !name || !price) {\n" +
"      return alert('SKU, Nombre y Precio son obligatorios');\n" +
"    }\n" +
"    setIsSubmitting(true);\n" +
"    try {\n" +
"      if (editId) {\n" +
"        await db.products.update(editId, {\n" +
"          sku,\n" +
"          name: name.toUpperCase(),\n" +
"          cost: parseFloat(cost) || 0,\n" +
"          price: parseFloat(price) || 0,\n" +
"          stock: parseInt(stock) || 0,\n" +
"          category\n" +
"        });\n" +
"      } else {\n" +
"        await db.products.add({\n" +
"          sku,\n" +
"          name: name.toUpperCase(),\n" +
"          cost: parseFloat(cost) || 0,\n" +
"          price: parseFloat(price) || 0,\n" +
"          stock: parseInt(stock) || 0,\n" +
"          category\n" +
"        });\n" +
"      }\n" +
"      // Reset form\n" +
"      setSku('');\n" +
"      setName('');\n" +
"      setCost('');\n" +
"      setPrice('');\n" +
"      setStock('');\n" +
"      setEditId(null);\n" +
"      setShowAddModal(false);\n" +
"    } catch (error) {\n" +
"      console.error('Error guardando producto:', error);\n" +
"      alert('Ocurrió un error al guardar el producto');\n" +
"    } finally {\n" +
"      setIsSubmitting(false);\n" +
"    }\n" +
"  };";

file = file.replace(/const handleAddProduct = async \(\) => {[\s\S]*?setIsSubmitting\(false\);\n    }\n  };/, submitLogic);

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Inventory patched 3');
