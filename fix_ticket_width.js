const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// 1. Fix the ticket print container in JSX
posCode = posCode.replace(/<div id="ticket-print" className="[^"]+" style=\{\{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast\(200%\) grayscale\(100%\)" \}\}>/, 
`<div id="ticket-print" className="bg-white px-2 py-0 font-mono text-black w-full text-[12px] font-black select-none" style={{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast(200%) grayscale(100%)" }}>`);

// 2. Make the logo bigger, it was max-h-10 max-w-[120px]
posCode = posCode.replace(/className="max-h-10 max-w-\[120px\] mx-auto mb-2 object-contain filter contrast-125"/g, 'className="max-h-16 max-w-[160px] mx-auto mb-2 object-contain filter contrast-125 grayscale"');

// 3. Fix the popup print logic
const oldPrint = `w.document.write('<html><head><title>Ticket</title>' + styles + '</head><body style="margin:0; padding:0; background:white; display:flex; justify-content:center;">');`;
const newPrint = `w.document.write('<html><head><title>Ticket</title>' + styles + '<style>@page { margin: 0; } @media print { body, html { margin: 0; padding: 0; width: 100%; } #ticket-print { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; } }</style></head><body style="margin:0; padding:0; background:white; width: 100%;">');`;
posCode = posCode.replace(oldPrint, newPrint);

// Check if we need to remove any explicit width styling in the text container, we don't think there is any.
fs.writeFileSync(posPath, posCode);
console.log('PosTerminal fixed.');

// Now fix Reports.tsx Reimprimir
const repPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let repCode = fs.readFileSync(repPath, 'utf8');

repCode = repCode.replace(/<div id="reprint-ticket" className="[^"]+">/, 
`<div id="reprint-ticket" className="bg-white px-2 py-0 font-mono text-black w-full text-[12px] font-black select-none" style={{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast(200%) grayscale(100%)" }}>`);

repCode = repCode.replace(/className="max-h-10 max-w-\[120px\] mx-auto mb-2 object-contain filter contrast-125"/g, 'className="max-h-16 max-w-[160px] mx-auto mb-2 object-contain filter contrast-125 grayscale"');

repCode = repCode.replace(/w\.document\.write\('<html><head><title>Reimpresión Ticket<\/title>' \+ styles \+ '<\/head><body style="margin:0; padding:0; background:white; display:flex; justify-content:center;">'\);/,
`w.document.write('<html><head><title>Reimpresión Ticket</title>' + styles + '<style>@page { margin: 0; } @media print { body, html { margin: 0; padding: 0; width: 100%; } #reprint-ticket { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; } }</style></head><body style="margin:0; padding:0; background:white; width: 100%;">');`);

fs.writeFileSync(repPath, repCode);
console.log('Reports fixed.');
