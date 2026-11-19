const fs = require('fs');
const path = require('path');

function updatePosWithClipApi(posPath) {
  if (!fs.existsSync(posPath)) return;
  let code = fs.readFileSync(posPath, 'utf8').replace(/\r\n/g, '\n');

  // 1. Extraer clipApiKey y clipSerialNumber de useSettings si faltan
  if (!code.includes('clipApiKey, clipSerialNumber')) {
    code = code.replace(
      'mercadoPagoToken, mercadoPagoDeviceId,',
      'mercadoPagoToken, mercadoPagoDeviceId, clipApiKey, clipSerialNumber, clipModo,'
    );
  }

  // 2. Agregar estado clipStatus si no existe
  if (!code.includes('const [clipStatus, setClipStatus]')) {
    code = code.replace(
      'const [mpStatus, setMpStatus] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });',
      `const [mpStatus, setMpStatus] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });\n  const [clipStatus, setClipStatus] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });`
    );
  }

  // 3. Agregar la función triggerClipPayment
  const clipFunc = `  const triggerClipPayment = async (customAmount?: number): Promise<boolean> => {
    setIsProcessing(true);
    setProcessMsg('Conectando con Terminal Clip...');
    setClipStatus({ loading: true, message: 'Enviando orden a la terminal física Clip...' });

    const apiKey = clipApiKey?.trim();
    const serialNumber = clipSerialNumber?.trim();
    const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;

    // Validación 1: Sin API Key
    if (!apiKey) {
      setProcessMsg('Terminal Clip lista');
      setClipStatus({
        loading: false,
        ok: true,
        message: 'Monto a cobrar: $' + chargeAmount.toFixed(2) + ' MXN. Puedes cobrar manualmente en tu terminal física o colocar tu API Key y Número de Serie en Configuración para cobro 100% automático.'
      });
      return true;
    }

    // Validación 2: Con API Key pero sin Serial Number de la terminal
    if (!serialNumber) {
      setProcessMsg('Falta Número de Serie Clip');
      setClipStatus({
        loading: false,
        ok: false,
        message: '⚠️ Tu API Key está configurada, pero falta el Número de Serie de tu terminal Clip (viene en la etiqueta trasera de tu maquinita, ej. C12345...). Colócalo en Configuración para que el sistema sepa a cuál terminal enviar el cobro.'
      });
      return false;
    }

    try {
      const payload = {
        amount: chargeAmount.toFixed(2),
        reference: 'NEXUS-' + Date.now().toString().slice(-6),
        serial_number_pos: serialNumber
      };

      // Intento en endpoint primario de Clip PinPad
      let response = await fetch('https://api.payclip.io/f2f/pinpad/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      // Fallback a api-gw.payclip.com
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
          message: 'Orden recibida en terminal Clip ($' + chargeAmount.toFixed(2) + '). El cliente ya puede deslizar, insertar o acercar su tarjeta/NFC.'
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
`;

  if (!code.includes('const triggerClipPayment =')) {
    code = code.replace(
      'const triggerMercadoPagoPayment = async',
      `${clipFunc}\n  const triggerMercadoPagoPayment = async`
    );
  }

  // 4. Conectar handlePaymentClick con CLIP
  code = code.replace(
    "if (method === 'MERCADO PAGO') {\n        triggerMercadoPagoPayment();",
    "if (method === 'MERCADO PAGO') {\n        triggerMercadoPagoPayment();\n      } else if (method === 'CLIP') {\n        triggerClipPayment();"
  );

  // 5. Conectar handleCobrar con CLIP
  code = code.replace(
    "if (methodToUse === 'MERCADO PAGO') {\n      await triggerMercadoPagoPayment();",
    "if (methodToUse === 'MERCADO PAGO') {\n      await triggerMercadoPagoPayment();\n    } else if (methodToUse === 'CLIP') {\n      await triggerClipPayment();"
  );

  // 6. Enriquecer el modal de procesamiento con el estado de Clip
  const oldClipModalContent = `{paymentMethod === 'CLIP' && (
              <div className="w-full bg-amber-950/40 border border-amber-500/40 p-5 rounded-2xl my-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    TERMINAL CLIP ACTIVA
                  </p>
                </div>
                <p className="text-3xl font-black text-white my-1">\${total.toFixed(2)} MXN</p>
                <p className="text-xs text-amber-200 font-bold mt-1">Acerque la tarjeta o dispositivo NFC a la terminal Clip o confirme en la app.</p>
              </div>
            )}`;

  const newClipModalContent = `{paymentMethod === 'CLIP' && (
              <div className="w-full bg-amber-950/60 border border-amber-500/50 p-5 rounded-2xl my-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={\`w-2.5 h-2.5 rounded-full \${clipStatus.ok ? 'bg-emerald-400' : clipStatus.loading ? 'bg-amber-400 animate-ping' : 'bg-rose-400'}\`}></span>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    TERMINAL CLIP ENLACE ACTIVO
                  </p>
                </div>
                <p className="text-3xl font-black text-white my-1">\${total.toFixed(2)} MXN</p>
                <div className="bg-nexus-950/80 p-3 rounded-xl border border-nexus-800 text-left space-y-1 text-xs font-mono mt-2">
                  <p className="text-slate-400"><strong className="text-slate-200">Terminal S/N:</strong> {clipSerialNumber || 'NO ASIGNADO (Configurar en Menú)'}</p>
                  <p className="text-slate-400 truncate"><strong className="text-slate-200">API Key:</strong> {clipApiKey ? \`\${clipApiKey.substring(0, 16)}...\` : 'NO INGRESADA'}</p>
                  <p className="text-slate-400"><strong className="text-slate-200">Estado:</strong> <span className={clipStatus.ok ? 'text-emerald-400 font-bold' : clipStatus.loading ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{clipStatus.message || 'Esperando orden...'}</span></p>
                </div>
              </div>
            )}`;

  if (code.includes(oldClipModalContent)) {
    code = code.replace(oldClipModalContent, newClipModalContent);
  }

  fs.writeFileSync(posPath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`✅ Lógica de API Clip conectada en ${posPath}`);
}

updatePosWithClipApi(path.join(__dirname, 'caja_local', 'frontend', 'src', 'pages', 'PosTerminal.tsx'));
updatePosWithClipApi(path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'PosTerminal.tsx'));
