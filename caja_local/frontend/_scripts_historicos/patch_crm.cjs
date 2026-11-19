const fs = require('fs');
let file = fs.readFileSync('src/pages/Crm.tsx', 'utf8');

file = file.replace(/const handleRecarga = async \(\) => {[\s\S]*?setShowMonederoModal\(false\);\n  };/, '');

fs.writeFileSync('src/pages/Crm.tsx', file);
console.log('CRM patched');
