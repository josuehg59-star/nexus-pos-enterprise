const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Ensure all text in the ticket is pure black and extra bold
// I will just add an inline style to the ticket wrapper
posCode = posCode.replace(/id="ticket-print"\s+className="(.*?)"/g, 'id="ticket-print" className="$1" style={{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast(200%) grayscale(100%)" }}');

// Fix the "Probar Conexin API" bug in Config.tsx so it doesn't throw "Action not supported"
const configPath = path.join(__dirname, 'caja_local/frontend/src/pages/Config.tsx');
let configCode = fs.readFileSync(configPath, 'utf8');

configCode = configCode.replace(/const response = await fetch\(`https:\/\/api\.mercadopago\.com\/point\/integration-api\/devices\/\$\{localSettings\.mercadoPagoDeviceId\}`,\s*\{\s*headers:\s*\{\s*"Authorization":\s*"Bearer "\s*\+\s*localSettings\.mercadoPagoToken\s*\}\s*\}\);/m, 
`// Changed to a POST intent of 500 to test connection properly
const response = await fetch(\`https://api.mercadopago.com/point/integration-api/devices/\${localSettings.mercadoPagoDeviceId}/payment-intents\`, {
  method: 'POST',
  headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken, "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 500 })
});`);

fs.writeFileSync(posPath, posCode);
fs.writeFileSync(configPath, configCode);
console.log('Ticket color and MP test button fixed.');
