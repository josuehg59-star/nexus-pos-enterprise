const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const exportFunc = "  const handleExportExcel = async () => {\n" +
"    const allProducts = await db.products.toArray();\n" +
"    const ws = XLSX.utils.json_to_sheet(allProducts);\n" +
"    const wb = XLSX.utils.book_new();\n" +
"    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');\n" +
"    XLSX.writeFile(wb, 'Inventario.xlsx');\n" +
"  };\n\n" +
"  const handleImportExcel = async (e: any) => {\n" +
"    const file = e.target.files[0];\n" +
"    if(!file) return;\n" +
"    const reader = new FileReader();\n" +
"    reader.onload = async (evt) => {\n" +
"      const bstr = evt.target.result;\n" +
"      const wb = XLSX.read(bstr, { type: 'binary' });\n" +
"      const wsname = wb.SheetNames[0];\n" +
"      const ws = wb.Sheets[wsname];\n" +
"      const data = XLSX.utils.sheet_to_json(ws);\n" +
"      alert('Se importaron ' + data.length + ' productos.');\n" +
"      for (const row of data) {\n" +
"        await db.products.put({\n" +
"          sku: String(row.sku || ''),\n" +
"          name: String(row.name || '').toUpperCase(),\n" +
"          cost: parseFloat(row.cost || 0),\n" +
"          price: parseFloat(row.price || 0),\n" +
"          stock: parseInt(row.stock || 0),\n" +
"          category: String(row.category || 'Sin Categoria')\n" +
"        });\n" +
"      }\n" +
"    };\n" +
"    reader.readAsBinaryString(file);\n" +
"  };\n\n";

file = file.replace(/const handleSaveProduct = async \(\) => {/, exportFunc + "const handleSaveProduct = async () => {");
fs.writeFileSync('src/pages/Inventory.tsx', file);
