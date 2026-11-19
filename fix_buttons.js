const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Update handlePaymentClick to trigger the modal automatically if it's a direct payment method
const newHandlePaymentClick = `
  const handlePaymentClick = (method: string) => {
    setPaymentMethod(method);
    if (cart.length > 0 && method !== 'EFECTIVO') {
      if (method === 'MERCADO PAGO') {
        triggerMercadoPagoPayment();
      } else {
        setIsProcessing(true);
      }
    }
  };
`;
posCode = posCode.replace(/const handlePaymentClick = \(method: string\) => \{[\s\S]*?setPaymentMethod\(method\);\s*\};/, newHandlePaymentClick.trim());


// Update handleCobrar to also show the modal for other methods instead of bypassing it
const newHandleCobrar = `
  const handleCobrar = async () => {
    if (cart.length === 0) {
      alert("El carrito estǭ vaco");
      return;
    }
    const methodToUse = paymentMethod;

    if (methodToUse === 'MERCADO PAGO') {
      await triggerMercadoPagoPayment();
    } else if (methodToUse === 'EFECTIVO') {
      finalizeSaleWithMethod(methodToUse);
    } else {
      setIsProcessing(true);
    }
  };
`;
posCode = posCode.replace(/const handleCobrar = async \(\) => \{[\s\S]*?finalizeSaleWithMethod\(methodToUse\);\s*\}\s*\};/m, newHandleCobrar.trim());

// Also fix the text encoding issue if possible (CR%DITO -> CRÉDITO)
posCode = posCode.replace(/CR%DITO/g, 'CRÉDITO');

fs.writeFileSync(posPath, posCode);
console.log('Payment buttons fixed.');
