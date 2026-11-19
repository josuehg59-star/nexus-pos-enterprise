const fs = require('fs');
let c = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');
c = c.replace('(window as any).html2canvas', 'html2canvas');
c = c.replace('new (window as any).jspdf.jsPDF', 'new jsPDF');
fs.writeFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', c);
