const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

posCode = posCode.replace(/className="max-h-16 max-w-\[160px\] mx-auto mb-2 object-contain filter contrast-125 grayscale"/g, 
  'className="max-h-16 max-w-[160px] mx-auto mb-2 object-contain" style={{ filter: "grayscale(100%) contrast(1000%) brightness(50%)" }}');

fs.writeFileSync(posPath, posCode);

const repPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let repCode = fs.readFileSync(repPath, 'utf8');

repCode = repCode.replace(/className="max-h-16 max-w-\[160px\] mx-auto mb-2 object-contain filter contrast-125 grayscale"/g, 
  'className="max-h-16 max-w-[160px] mx-auto mb-2 object-contain" style={{ filter: "grayscale(100%) contrast(1000%) brightness(50%)" }}');

fs.writeFileSync(repPath, repCode);
console.log('Logo darkened.');
