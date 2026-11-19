const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Replace triggerMercadoPagoPayment
const oldMP = `  const triggerMercadoPagoPayment = async () => {
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

const newMP = `  const triggerMercadoPagoPayment = async () => {
    setIsProcessing(true);
    setProcessMsg('Conectando con Terminal Mercado Pago Point...');
    setMpStatus({ loading: true, message: 'Enviando cobro a la terminal física...' });

    const token = mercadoPagoToken || 'APP_USR-7550911274372329-020913-4c9391b9edb39d57a3c97e1af4c86c0f-3193296364';
    const deviceId = mercadoPagoDeviceId || 'POINT_SMART_01';

    try {
      const amountInCents = Math.round(total * 100);
      const payload = {
        amount: amountInCents,
        additional_info: {
          external_reference: \`NEXUS-\${Date.now()}\`,
          print_on_terminal: true
        }
      };

      const response = await fetch(\`https://api.mercadopago.com/point/integration-api/devices/\${deviceId}/payment-intents\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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

// Use regex to replace to handle minor whitespace differences just in case
const regex = /const triggerMercadoPagoPayment = async \(\) => \{[\s\S]*?catch \(e\) \{[\s\S]*?setMpStatus\(\{ loading: false, ok: false, message: \(e as Error\)\.message \}\);\s*\}\s*\};/;

posCode = posCode.replace(regex, newMP);

fs.writeFileSync(posPath, posCode);
console.log('MP fixed.');
