const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Replace p-4 with p-1
posCode = posCode.replace(/className="bg-white p-4 shadow-2xl /g, 'className="bg-white p-1 shadow-2xl ');
posCode = posCode.replace(/mb-3/g, 'mb-1');
posCode = posCode.replace(/my-2/g, 'my-1');
posCode = posCode.replace(/mt-3/g, 'mt-1');

// Convert space-y-0.5 to leading-tight or no space
posCode = posCode.replace(/space-y-0\.5/g, 'leading-none');

fs.writeFileSync(posPath, posCode);
console.log('PosTerminal.tsx layout compacted.');

// Fix printTicket in PosTerminal.tsx to just use html2canvas + jsPDF and save as PDF.
// Wait, my previous script changed printTicket already. Let's make sure it's tight.
