const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

const exportFuncRegex = /const handleExportarExcel = \(\) => \{[\s\S]*?XLSX\.writeFile\(workbook, 'Inventario_Maestro\.xlsx'\);\n  \};\n/;

const exportFuncMatch = file.match(exportFuncRegex);
if(exportFuncMatch) {
  file = file.replace(exportFuncMatch[0], '');
  
  // Insert it after const products
  file = file.replace(/const products = useLiveQuery\([\s\S]*?\];\n/, "const products = useLiveQuery(\n    () => {\n      if (searchQuery) {\n        const term = searchQuery.toLowerCase();\n        return db.products.filter(p => \n          p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)\n        ).toArray();\n      }\n      return db.products.toArray();\n    },\n    [searchQuery]\n  ) || [];\n\n" + exportFuncMatch[0]);
}

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Order fixed');
