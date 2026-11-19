const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const newRender = "  const renderContent = () => {\n" +
"    if (activeSubMenu && activeSubMenu.includes('K')) return <Kardex />;\n" +
"    if (activeSubMenu && activeSubMenu.includes('Caja Z')) return <CajaZ />;\n" +
"    if (activeSubMenu && activeSubMenu.includes('Recargas')) return <Recargas />;\n" +
"    if (activeSubMenu && activeSubMenu.includes('Anal')) return <Reports />;\n" +
"    if (activeSubMenu && activeSubMenu.includes('Auditor')) return <Auditoria />;\n" +
"    if (activeSubMenu && activeSubMenu.includes('Cat')) return <Inventory />;\n" +
"    if (activeMenu === 'operacion') return <PosTerminal />;\n" +
"    if (activeMenu === 'dashboard') return <DashboardBI />;\n" +
"    if (activeMenu === 'suministro') return <SmartPurchasing />;\n" +
"    if (activeMenu === 'inventario') return <Inventory />;\n" +
"    if (activeMenu === 'crm') return <Crm />;\n" +
"    if (activeMenu === 'configuracion') return <Config />;\n" +
"    return <DashboardBI />;\n" +
"  };";

file = file.replace(/const renderContent = \(\) => {[\s\S]*?return <DashboardBI \/>;\n  };/, newRender);
fs.writeFileSync('src/App.tsx', file);
console.log('App routing hacked securely');
