const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace("import { db } from '../store/database';", "import { db } from '../store/database';\nimport * as XLSX from 'xlsx';");

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
"      for (const row of data as any[]) {\n" +
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
"  };";

file = file.replace(/const handleAddProduct = async \(\) => {/, exportFunc + "\n\n  const handleAddProduct = async () => {");

const buttonBlock = "            <button onClick={() => setShowLabelModal(true)} className='bg-nexus-800 hover:bg-nexus-700 text-slate-300 border border-nexus-700 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n" +
"              <ScanBarcode className='w-4 h-4' /> IMPRIMIR ETIQUETAS\n" +
"            </button>\n" +
"            <label className='cursor-pointer bg-fuchsia-900/30 text-fuchsia-500 hover:bg-fuchsia-900/50 border border-fuchsia-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n" +
"              <Download className='w-4 h-4' /> IMPORTAR EXCEL\n" +
"              <input type='file' accept='.xlsx, .xls' className='hidden' onChange={handleImportExcel} />\n" +
"            </label>\n" +
"            <button onClick={handleExportExcel} className='bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>\n" +
"              <Download className='w-4 h-4' /> EXPORTAR EXCEL\n" +
"            </button>";

file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700[\s\S]*?<Download className="w-4 h-4" \/> EXPORTAR EXCEL\n\s*<\/button>/m, buttonBlock);

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Inventory patched');
