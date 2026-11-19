const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Import KardexReport
if (!file.includes('import KardexReport')) {
  file = file.replace("import Kardex from './pages/Kardex';", "import Kardex from './pages/Kardex';\nimport KardexReport from './pages/KardexReport';");
}

// Add to sidebar subItems
file = file.replace(/subItems: \['Catálogo Maestro', 'Entradas', 'Auditorías Físicas', 'Impresión Etiquetas'\]/g, "subItems: ['Catálogo Maestro', 'Entradas', 'Kárdex', 'Auditorías Físicas', 'Impresión Etiquetas']");

// Route it
if (!file.includes("<KardexReport />")) {
  file = file.replace(/if \(activeMenu === 'inventario' && activeSubMenu === 'Entradas'\) return <Kardex \/>;/g, "if (activeMenu === 'inventario' && activeSubMenu === 'Entradas') return <Kardex />;\n    if (activeMenu === 'inventario' && activeSubMenu === 'Kárdex') return <KardexReport />;");
  file = file.replace(/if \(activeSubMenu === 'Entradas'\) return <Kardex \/>;/g, "if (activeSubMenu === 'Entradas') return <Kardex />;\n          if (activeSubMenu === 'Kárdex') return <KardexReport />;");
}

fs.writeFileSync('src/App.tsx', file);
console.log('App patched');
