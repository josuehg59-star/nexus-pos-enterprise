const fs = require('fs');

function restoreAndCleanPos(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  // El archivo original termina en la primera ocurrencia de "    </div>\n  );\n}"
  let endIdx = -1;
  for (let i = 1500; i < lines.length; i++) {
    if (lines[i].trim() === '}' && lines[i - 1] && lines[i - 1].includes(');') && lines[i - 2] && lines[i - 2].includes('</div>')) {
      endIdx = i;
      break;
    }
  }

  if (endIdx !== -1) {
    lines = lines.slice(0, endIdx + 1);
  }

  let code = lines.join('\n');

  // Ahora corregir la zona entre triggerMercadoPagoPayment
  // Busquemos dónde está el bloque dañado entre "suggestions]);" y "const triggerMercadoPagoPayment"
  const anchorBefore = "window.addEventListener('keydown', handleGlobalScannerInput, true);\n    return () => window.removeEventListener('keydown', handleGlobalScannerInput, true);\n  }, [showTicketModal, isProcessing, showMixtoModal, showUserModal, showWaModal, showAdicionalModal, suggestions]);";

  const cleanFunctions = `  const triggerClipPayment = async (customAmount?: number): Promise<boolean> => {
    setIsProcessing(true);
    setProcessMsg('Conectando con Terminal Clip...');
    setClipStatus({ loading: true, message: 'Enviando orden a la terminal física Clip...' });

    const apiKey = clipApiKey?.trim();
    const serialNumber = clipSerialNumber?.trim();
    const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;

    if (!apiKey) {
      setProcessMsg('Terminal Clip lista');
      setClipStatus({
        loading: false,
        ok: true,
        message: 'Monto a cobrar: $' + chargeAmount.toFixed(2) + ' MXN. Puedes cobrar directamente en tu terminal física o colocar tu API Key y Número de Serie en Configuración para cobro 100% automático.'
      });
      return true;
    }

    if (!serialNumber) {
      setProcessMsg('Falta Número de Serie Clip');
      setClipStatus({
        loading: false,
        ok: false,
        message: '⚠️ Falta el Número de Serie de tu terminal Clip (viene en la etiqueta trasera de tu maquinita). Colócalo en Configuración para saber a cuál terminal enviar el cobro.'
      });
      return false;
    }

    try {
      const payload = {
        amount: chargeAmount.toFixed(2),
        reference: 'NEXUS-' + Date.now().toString().slice(-6),
        serial_number_pos: serialNumber
      };

      let response = await fetch('https://api.payclip.io/f2f/pinpad/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!response || !response.ok) {
        response = await fetch('https://api-gw.payclip.com/f2f/pinpad/v1/payment', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }

      if (response && response.ok) {
        setProcessMsg('⚡ Cobro de $' + chargeAmount.toFixed(2) + ' enviado a Terminal Clip (' + serialNumber + ')');
        setClipStatus({
          loading: false,
          ok: true,
          message: 'Orden recibida en terminal Clip ($' + chargeAmount.toFixed(2) + '). El cliente ya puede deslizar o aproximar tarjeta/NFC.'
        });
        return true;
      } else {
        const err = response ? await response.json().catch(() => ({})) : {};
        const errMsg = err.message || err.description || err.error || 'Verifica que la terminal Clip esté encendida, con internet y que el Número de Serie (' + serialNumber + ') coincida.';
        setProcessMsg('Detalle de conexión Clip');
        setClipStatus({
          loading: false,
          ok: false,
          message: errMsg
        });
        return false;
      }
    } catch (e: any) {
      setProcessMsg('Error de conexión con Clip');
      setClipStatus({
        loading: false,
        ok: false,
        message: (e as Error).message || 'No se pudo conectar a los servidores de Clip.'
      });
      return false;
    }
  };

  const triggerMercadoPagoPayment = async (customAmount?: number): Promise<boolean> => {
    setIsProcessing(true);
    setProcessMsg('Conectando con Terminal Mercado Pago Point...');
    setMpStatus({ loading: true, message: 'Enviando cobro a la terminal física...' });

    const token = mercadoPagoToken || 'APP_USR-7550911274372329-020913-4c9391b9edb39d57a3c97e1af4c86c0f-3193296364';
    const deviceId = mercadoPagoDeviceId || 'POINT_SMART_01';

    try {
      const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;
      const amountInCents = Math.round(chargeAmount * 100);
      const payload = {
        amount: amountInCents,
        additional_info: {
          external_reference: 'NEXUS-' + Date.now(),
          print_on_terminal: true
        }
      };

      const response = await fetch('https://api.mercadopago.com/point/integration-api/devices/' + deviceId + '/payment-intents', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setProcessMsg('⚡ Cobro de $' + chargeAmount.toFixed(2) + ' enviado a Terminal (' + deviceId + ')');
        setMpStatus({ loading: false, ok: true, message: 'Orden recibida en terminal ($' + chargeAmount.toFixed(2) + '). El cliente ya puede deslizar o aproximar tarjeta/NFC.' });
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("MP Error:", err);
        setProcessMsg('Error al conectar con la terminal');
        setMpStatus({ loading: false, ok: false, message: (err.message || err.error || "No se pudo enviar el cobro a la terminal.") + " (Revisa tu Device ID)" });
        return false;
      }
    } catch (e) {
      setProcessMsg('Error de conexión');
      setMpStatus({ loading: false, ok: false, message: (e as Error).message });
      return false;
    }
  };`;

  // Reemplazar desde anchorBefore hasta el final de triggerMercadoPagoPayment
  const regexDamaged = /window\.addEventListener\('keydown', handleGlobalScannerInput, true\);[\s\S]*?return false;\s*\}\s*;/;

  const replacementBlock = `window.addEventListener('keydown', handleGlobalScannerInput, true);\n    return () => window.removeEventListener('keydown', handleGlobalScannerInput, true);\n  }, [showTicketModal, isProcessing, showMixtoModal, showUserModal, showWaModal, showAdicionalModal, suggestions]);\n\n${cleanFunctions}`;

  code = code.replace(regexDamaged, replacementBlock);

  fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ Archivo limpiado y reestructurado:', filePath);
}

restoreAndCleanPos('caja_local/frontend/src/pages/PosTerminal.tsx');
restoreAndCleanPos('caja_movil_app/src/pages/PosTerminal.tsx');
