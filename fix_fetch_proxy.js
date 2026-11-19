const fs = require('fs');

function repairFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split(/\r?\n/);

  // Cortar si hay duplicados
  let endIdx = -1;
  for (let i = 1700; i < lines.length; i++) {
    if (lines[i].trim() === '}' && lines[i - 1].trim() === ')' && lines[i - 2].includes('</div>')) {
      endIdx = i;
      break;
    }
    if (lines[i].trim() === '}' && lines[i - 1].includes(');') && lines[i - 2].includes('</div>')) {
      endIdx = i;
      break;
    }
  }

  if (endIdx !== -1) {
    lines = lines.slice(0, endIdx + 1);
  }

  let code = lines.join('\n');

  // Busquemos triggerClipPayment
  const startFunc = "const triggerClipPayment = async";
  const endFunc = "const triggerMercadoPagoPayment = async";

  const s = code.indexOf(startFunc);
  const e = code.indexOf(endFunc);

  if (s !== -1 && e !== -1) {
    const cleanClipFunc = [
      'const triggerClipPayment = async (customAmount?: number): Promise<boolean> => {',
      '    setIsProcessing(true);',
      '    setProcessMsg("Conectando con Terminal Clip...");',
      '    setClipStatus({ loading: true, message: "Enviando orden a la terminal física Clip..." });',
      '',
      '    const apiKey = clipApiKey ? clipApiKey.trim() : "";',
      '    const serialNumber = clipSerialNumber ? clipSerialNumber.trim() : "";',
      '    const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;',
      '',
      '    if (!apiKey) {',
      '      setProcessMsg("Terminal Clip lista");',
      '      setClipStatus({',
      '        loading: false,',
      '        ok: true,',
      '        message: "Monto a cobrar: $" + chargeAmount.toFixed(2) + " MXN. Puedes cobrar directamente en tu terminal física o colocar tu API Key y Número de Serie en Configuración para cobro automático."',
      '      });',
      '      return true;',
      '    }',
      '',
      '    if (!serialNumber) {',
      '      setProcessMsg("Falta Número de Serie Clip");',
      '      setClipStatus({',
      '        loading: false,',
      '        ok: false,',
      '        message: "⚠️ Falta el Número de Serie de tu terminal Clip (viene en la etiqueta trasera de tu maquinita). Colócalo en Configuración para saber a cuál terminal enviar el cobro."',
      '      });',
      '      return false;',
      '    }',
      '',
      '    try {',
      '      const hostUrl = servidorIp ? ("http://" + (servidorIp.includes(":") ? servidorIp : servidorIp + ":3008")) : "http://127.0.0.1:3008";',
      '      const endpoint = hostUrl + "/api/clip/payment";',
      '',
      '      const payload = {',
      '        apiKey: apiKey,',
      '        serialNumber: serialNumber,',
      '        amount: chargeAmount.toFixed(2),',
      '        reference: "NEXUS-" + Date.now().toString().slice(-6)',
      '      };',
      '',
      '      let proxyRes = await fetch(endpoint, {',
      '        method: "POST",',
      '        headers: { "Content-Type": "application/json" },',
      '        body: JSON.stringify(payload)',
      '      }).catch(async () => {',
      '        return await fetch("http://127.0.0.1:3008/api/clip/payment", {',
      '          method: "POST",',
      '          headers: { "Content-Type": "application/json" },',
      '          body: JSON.stringify(payload)',
      '        }).catch(() => null);',
      '      });',
      '',
      '      if (!proxyRes) {',
      '        setProcessMsg("Servidor local 3008 no responde");',
      '        setClipStatus({',
      '          loading: false,',
      '          ok: false,',
      '          message: "No se pudo contactar al servidor local en puerto 3008. Asegúrate de que el sistema local esté activo."',
      '        });',
      '        return false;',
      '      }',
      '',
      '      const result = await proxyRes.json().catch(() => ({}));',
      '',
      '      if (result.success) {',
      '        setProcessMsg("⚡ Cobro de $" + chargeAmount.toFixed(2) + " enviado a Terminal Clip (" + serialNumber + ")");',
      '        setClipStatus({',
      '          loading: false,',
      '          ok: true,',
      '          message: "¡Orden recibida en terminal Clip! ($" + chargeAmount.toFixed(2) + "). El cliente ya puede deslizar o aproximar tarjeta/NFC."',
      '        });',
      '        return true;',
      '      } else {',
      '        const detail = result.raw || result.error || ("Código " + result.statusCode);',
      '        setProcessMsg("Respuesta de Clip (" + (result.statusCode || "Error") + ")");',
      '        setClipStatus({',
      '          loading: false,',
      '          ok: false,',
      '          message: "Clip respondió: " + detail,',
      '        });',
      '        return false;',
      '      }',
      '    } catch (e: any) {',
      '      setProcessMsg("Error de conexión");',
      '      setClipStatus({',
      '        loading: false,',
      '        ok: false,',
      '        message: (e as Error).message || "No se pudo conectar al servicio de Clip."',
      '      });',
      '      return false;',
      '    }',
      '  };',
      ''
    ].join('\n');

    code = code.slice(0, s) + cleanClipFunc + '\n  ' + code.slice(e);
  }

  fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ Archivo PosTerminal limpiado y corregido:', filePath);
}

repairFile('caja_local/frontend/src/pages/PosTerminal.tsx');
repairFile('caja_movil_app/src/pages/PosTerminal.tsx');
