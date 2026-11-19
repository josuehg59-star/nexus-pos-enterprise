const fs = require('fs');

// Patch PosTerminal.tsx
const posFile = 'caja_local/frontend/src/pages/PosTerminal.tsx';
let posContent = fs.readFileSync(posFile, 'utf8');
posContent = posContent.replace(/Buffer\.from\(pdfBuffer\)/g, "new Uint8Array(pdfBuffer)");
fs.writeFileSync(posFile, posContent);

// Patch Reports.tsx
const reportsFile = 'caja_local/frontend/src/pages/Reports.tsx';
let reportsContent = fs.readFileSync(reportsFile, 'utf8');
reportsContent = reportsContent.replace(/Buffer\.from\(pdfBuffer\)/g, "new Uint8Array(pdfBuffer)");

// Fix getTicketHtmlString scope
if (reportsContent.includes('const getTicketHtmlString = (ticket: any) => {') && !reportsContent.includes('export const getTicketHtmlString')) {
    reportsContent = reportsContent.replace('const getTicketHtmlString = (ticket: any) => {', 'const getTicketHtmlString = (ticket: any) => {');
}
fs.writeFileSync(reportsFile, reportsContent);

console.log("Patched Buffer and getTicketHtmlString!");
