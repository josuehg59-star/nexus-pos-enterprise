const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

if (!file.includes('import * as XLSX from \\'xlsx\\'')) {
    file = file.replace('import { useLiveQuery } from \\'dexie-react-hooks\\';', "import { useLiveQuery } from 'dexie-react-hooks';\\nimport * as XLSX from 'xlsx';");
}

const handleExport = "  const handleExportarExcel = () => {\\n" +
"    if (products.length === 0) return alert('No hay productos para exportar.');\\n" +
"    const data = products.map(p => ({\\n" +
"      'CÓDIGO / SKU': p.sku,\\n" +
"      'NOMBRE DEL PRODUCTO': p.name,\\n" +
"      'CATEGORÍA': p.category || 'Sin Categoría',\\n" +
"      'COSTO ($)': p.cost,\\n" +
"      'PRECIO VENTA ($)': p.price,\\n" +
"      'STOCK ACTUAL': p.stock\\n" +
"    }));\\n" +
"    const worksheet = XLSX.utils.json_to_sheet(data);\\n" +
"    const workbook = XLSX.utils.book_new();\\n" +
"    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');\\n" +
"    XLSX.writeFile(workbook, 'Inventario_Maestro.xlsx');\\n" +
"  };";

file = file.replace('export default function Inventory() {', 'export default function Inventory() {\\n' + handleExport);
file = file.replace("onClick={() => alert('Exportando a Excel...')}", "onClick={handleExportarExcel}");

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Inventory Excel exported');
