const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'sync_server_3008.js');
let code = fs.readFileSync(serverFile, 'utf8').replace(/\r\n/g, '\n');

const clipEndpointCode = `  // ==========================================
  // ENDPOINT: PROXY OFICIAL TERMINAL CLIP (PINPAD API)
  // ==========================================
  if (url === '/api/clip/payment' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { apiKey, serialNumber, amount, reference } = JSON.parse(body || '{}');
        console.log(\`🧡 [CLIP] Solicitud de cobro recibida: $\${amount} | Serial: \${serialNumber}\`);

        if (!apiKey || !serialNumber) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: false, 
            error: 'Faltan credenciales: Se requiere API Key y Número de Serie de la terminal Clip.' 
          }));
        }

        const payload = JSON.stringify({
          amount: String(amount),
          reference: reference || ('NEXUS-' + Date.now().toString().slice(-6)),
          serial_number_pos: String(serialNumber).trim()
        });

        const https = require('https');

        // Función auxiliar para llamar a Clip vía HTTPS
        const sendToClip = (hostname, reqPath, headers) => {
          return new Promise((resolve) => {
            const clipReq = https.request({
              hostname: hostname,
              port: 443,
              path: reqPath,
              method: 'POST',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
              },
              timeout: 10000
            }, (clipRes) => {
              let resData = '';
              clipRes.on('data', d => resData += d.toString());
              clipRes.on('end', () => {
                resolve({ statusCode: clipRes.statusCode, data: resData });
              });
            });

            clipReq.on('error', (err) => {
              resolve({ statusCode: 500, error: err.message });
            });

            clipReq.on('timeout', () => {
              clipReq.destroy();
              resolve({ statusCode: 504, error: 'Tiempo de espera agotado con servidor Clip' });
            });

            clipReq.write(payload);
            clipReq.end();
          });
        };

        // Intento 1: api.payclip.io con x-api-key
        let result = await sendToClip('api.payclip.io', '/f2f/pinpad/v1/payment', { 'x-api-key': apiKey.trim() });
        console.log(\`🧡 [CLIP api.payclip.io] Status \${result.statusCode}: \${result.data || result.error}\`);

        // Intento 2: Si 401/403/404 probar con Authorization Header
        if (result.statusCode === 401 || result.statusCode === 403 || result.statusCode === 404) {
          const authHeader = apiKey.startsWith('Basic ') || apiKey.startsWith('Bearer ') ? apiKey : \`Basic \${apiKey.trim()}\`;
          const result2 = await sendToClip('api-gw.payclip.com', '/f2f/pinpad/v1/payment', { 
            'x-api-key': apiKey.trim(),
            'Authorization': authHeader 
          });
          console.log(\`🧡 [CLIP api-gw.payclip.com] Status \${result2.statusCode}: \${result2.data || result2.error}\`);
          if (result2.statusCode === 200 || result2.statusCode === 201) {
            result = result2;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: result.statusCode === 200 || result.statusCode === 201,
          statusCode: result.statusCode,
          response: result.data ? JSON.parse(result.data).catch ? result.data : JSON.parse(result.data) : null,
          raw: result.data || result.error
        }));
      } catch (err) {
        console.error('Error procesando pago Clip:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }
`;

if (!code.includes('/api/clip/payment')) {
  code = code.replace(
    "// 0. HEALTH CHECK / PING ENPOINT",
    `${clipEndpointCode}\n  // 0. HEALTH CHECK / PING ENPOINT`
  );
  fs.writeFileSync(serverFile, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ Endpoint /api/clip/payment agregado exitosamente a sync_server_3008.js');
} else {
  console.log('El endpoint ya estaba presente.');
}
