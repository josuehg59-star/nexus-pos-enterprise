const fs = require('fs');

function addServidorIp(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    'clipApiKey, clipSerialNumber, clipModo,',
    'servidorIp, clipApiKey, clipSerialNumber, clipModo,'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ servidorIp agregado a useSettings en: ${filePath}`);
}

addServidorIp('caja_local/frontend/src/pages/PosTerminal.tsx');
addServidorIp('caja_movil_app/src/pages/PosTerminal.tsx');
