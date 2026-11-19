const fs = require('fs');
let c = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');
c = c.replace(
  "      if (e.key === 'Enter' && showTicketModal) {\n        e.preventDefault();\n        setShowTicketModal(false);\n      }",
  "      if (e.key === 'Enter') {\n        if (showTicketModal) {\n          e.preventDefault();\n          setShowTicketModal(false);\n        } else if (isProcessing) {\n          e.preventDefault();\n          finalizeSaleWithMethod(paymentMethod);\n        }\n      }"
);
c = c.replace(
  "  }, [cart, paymentMethod, client.name, showTicketModal]);",
  "  }, [cart, paymentMethod, client.name, showTicketModal, isProcessing]);"
);
fs.writeFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', c);
