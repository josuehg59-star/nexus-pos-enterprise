const fs = require('fs');
const posFile = 'caja_local/frontend/src/pages/PosTerminal.tsx';
let posContent = fs.readFileSync(posFile, 'utf8');

// Replace triggerMercadoPagoPayment
const oldRegex = /const triggerMercadoPagoPayment = async \(\) => \{[\s\S]*?\} catch \(e\) \{[\s\S]*?\}[\s\S]*?\};/;

const newFunction = `const triggerMercadoPagoPayment = async () => {
    setIsProcessing(true);
    setProcessMsg('Conectando con Terminal Mercado Pago Point...');
    setMpStatus({ loading: true, message: 'Enviando cobro a la terminal física...' });

    const token = mercadoPagoToken || 'APP_USR-7550911274372329-020913-4c9391b9edb39d57a3c97e1af4c86c0f-3193296364';
    const deviceId = mercadoPagoDeviceId || 'POINT_SMART_01';

    try {
      const response = await fetch(\`https://api.mercadopago.com/point/integration-api/devices/\${deviceId}/payment-intents\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(total * 100) / 100,
          description: \`Venta POS \${cajaNombre} - \${nombreNegocio}\`,
          payment: {
            installments: 1,
            type: "credit_card",
            installments_cost: "buyer"
          }
        })
      });

      if (response.ok) {
        setProcessMsg(\`⚡ Cobro enviado a Terminal Mercado Pago (\${deviceId})\`);
        setMpStatus({ loading: false, ok: true, message: \`Orden recibida en terminal. El cliente ya puede deslizar o aproximar tarjeta/NFC.\` });
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("MP Error:", err);
        setProcessMsg(\`Error al conectar con la terminal\`);
        setMpStatus({ loading: false, ok: false, message: (err.message || err.error || "No se pudo enviar el cobro a la terminal.") + " (Revisa tu Device ID)" });
      }
    } catch (e) {
      setProcessMsg(\`Error de conexión\`);
      setMpStatus({ loading: false, ok: false, message: (e as Error).message });
    }
  };`;

posContent = posContent.replace(oldRegex, newFunction);
fs.writeFileSync(posFile, posContent);
console.log("Patched triggerMercadoPagoPayment!");
