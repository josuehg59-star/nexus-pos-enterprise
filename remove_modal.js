const fs = require('fs');
let c = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');

c = c.replace(
  /if \(methodToUse === 'MERCADO PAGO'\) \{\s*await triggerMercadoPagoPayment\(\);\s*\} else \{\s*setIsProcessing\(true\);\s*setProcessMsg\('Procesando pago con ' \+ methodToUse \+ '\.\.\.'\);\s*\}/g,
  `if (methodToUse === 'MERCADO PAGO') {
      await triggerMercadoPagoPayment();
    } else {
      finalizeSaleWithMethod(methodToUse);
    }`
);

fs.writeFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', c);
