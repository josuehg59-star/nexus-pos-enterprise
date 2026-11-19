const fs = require('fs');
const filePath = 'C:/Users/JOSUE/Desktop/SISTEMA_CREDITO_COBRANZA/server.js';
let code = fs.readFileSync(filePath, 'utf8');

// Add tunnel management if not present
if (!code.includes('let activeTunnel = null;')) {
  const tunnelBlock = `
let activeTunnel = null;
let tunnelUrl = '';

// Iniciar túnel público en segundo plano para celulares en la calle (4G/5G)
async function startPublicTunnel() {
  try {
    const localtunnel = require('localtunnel');
    const customSubdomain = 'financiera-nexus-' + (Math.floor(1000 + Math.random() * 9000));
    activeTunnel = await localtunnel({ port: PORT, subdomain: customSubdomain });
    tunnelUrl = activeTunnel.url;
    console.log(\`🌐 [TÚNEL PÚBLICO ACTIVO PARA CELULARES EN LA CALLE / 4G / 5G]\`);
    console.log(\`📲 Enlace público: \${tunnelUrl}\`);

    activeTunnel.on('close', () => {
      console.log('Túnel público cerrado. Intentando reconectar...');
      setTimeout(startPublicTunnel, 5000);
    });
    activeTunnel.on('error', (err) => {
      console.log('Error en túnel:', err.message);
    });
  } catch (e) {
    console.log('Aviso: No se pudo iniciar túnel automático:', e.message);
  }
}

// Endpoint para consultar el estado del túnel
app.get('/api/tunnel', (req, res) => {
  res.json({
    active: Boolean(tunnelUrl),
    url: tunnelUrl || '',
    localIp: getLocalIP(),
    port: PORT
  });
});

app.post('/api/tunnel/restart', async (req, res) => {
  if (activeTunnel) {
    try { activeTunnel.close(); } catch(e) {}
  }
  await startPublicTunnel();
  res.json({ success: true, url: tunnelUrl });
});
`;

  code = code.replace("const DB_FILE = path.join(__dirname, 'database.json');", "const DB_FILE = path.join(__dirname, 'database.json');\n" + tunnelBlock);

  // Iniciar túnel al arrancar
  code = code.replace("app.listen(PORT, '0.0.0.0', () => {", "startPublicTunnel();\napp.listen(PORT, '0.0.0.0', () => {");

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('✅ Added public tunnel support to server.js');
} else {
  console.log('Tunnel code already in server.js');
}
