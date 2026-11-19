const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'caja_local', 'frontend', 'src', 'pages', 'Config.tsx');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

code = code.replace(
  "const { nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, rolCaja, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, setSettings } = useSettings();",
  "const { nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, rolCaja, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey, clipSerialNumber, clipModo, bancoDefault, setSettings } = useSettings();"
);

code = code.replace(
  "const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, rolCaja, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo });",
  "const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, rolCaja, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey: clipApiKey || '', clipSerialNumber: clipSerialNumber || '', clipModo: clipModo || 'APP_MOVIL', bancoDefault: bancoDefault || 'BBVA / BANCOMER' });"
);

fs.writeFileSync(configPath, code.replace(/\n/g, '\r\n'), 'utf8');
console.log('✅ Config.tsx en caja_local actualizado correctamente.');
