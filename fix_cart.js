const fs = require('fs');
let c = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');
c = c.replace('lastTicket.cart.map', '(lastTicket.items || lastTicket.cart || []).map');
fs.writeFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', c);
