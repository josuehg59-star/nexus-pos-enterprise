const fs = require('fs');
const path = require('path');

function updatePosFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // Buscar el try catch de triggerClipPayment
  const oldFetchRegex = /try\s*\{\s*const payload = \{[\s\S]*?setClipStatus\(\{\s*loading: false,\s*ok: false,\s*message: \(e as Error\)\.message[\s\S]*?\}\);[\s\S]*?return false;\s*\}/;

  const newFetchBlock = `try {
      // 🌟 Llamar a través del servidor local Node 3008 para evitar bloqueos de CORS
      const hostUrl = servidorIp ? (\`http://\${servidorIp.includes(':') ? servidorIp : servidorIp + ':3008'}\`) : 'http://127.0.0.1:3008';
      
      const proxyRes = await fetch(\`\${hostUrl}/api/clip/payment\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          serialNumber,
          amount: chargeAmount.toFixed(2),
          reference: 'NEXUS-' + Date.now().toString().slice(-6)
        })
      }).catch(async () => {
        // Fallback a 127.0.0.1 directo si el hostUrl falla
        return await fetch('http://127.0.0.1:3008/api/clip/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            serialNumber,
            amount: chargeAmount.toFixed(2),
            reference: 'NEXUS-' + Date.now().toString().slice(-6)
          })
        }).catch(() => null);
      });

      if (!proxyRes) {
        setProcessMsg('Servidor de enlace 3008 no responde');
        setClipStatus({
          loading: false,
          ok: false,
          message: 'No se pudo contactar al servidor local 3008. Asegúrate de que el sistema local esté activo.'
        });
        return false;
      }

      const result = await proxyRes.json().catch(() => ({}));

      if (result.success) {
        setProcessMsg('⚡ Cobro de $' + chargeAmount.toFixed(2) + ' enviado a Terminal Clip (' + serialNumber + ')');
        setClipStatus({
          loading: false,
          ok: true,
          message: '¡Orden enviada a tu terminal Clip! ($' + chargeAmount.toFixed(2) + '). El cliente ya puede deslizar o aproximar tarjeta/NFC.'
        });
        return true;
      } else {
        const detail = result.raw || result.error || ('Código HTTP ' + result.statusCode);
        setProcessMsg('Respuesta de Clip (' + (result.statusCode || 'Error') + ')');
        setClipStatus({
          loading: false,
          ok: false,
          message: 'Clip respondió: ' + detail
        });
        return false;
      }
    } catch (e: any) {
      setProcessMsg('Error de conexión');
      setClipStatus({
        loading: false,
        ok: false,
        message: (e as Error).message || 'No se pudo conectar al servicio de Clip.'
      });
      return false;
    }`;

  code = code.replace(oldFetchRegex, newFetchBlock);
  fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`✅ Archivo actualizado con proxy Clip: ${filePath}`);
}

updatePosFile(path.join(__dirname, 'caja_local', 'frontend', 'src', 'pages', 'PosTerminal.tsx'));
updatePosFile(path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'PosTerminal.tsx'));
