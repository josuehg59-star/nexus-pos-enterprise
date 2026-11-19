const fs = require('fs');

const dbFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\database.json';
const serverFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\server.js';
const appJsFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

// 1. Limpiar database.json
let db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
db.config = db.config || {};
db.config.nombreEmpresa = "FINANCIERA CRÉDITO FÁCIL";
db.config.eslogan = "Préstamos Diarios y Soluciones al Instante";
fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), 'utf8');

// 2. Actualizar /api/licencia/activar en server.js
let serverCode = fs.readFileSync(serverFile, 'utf8');
const oldActivarRegex = /app\.post\('\/api\/licencia\/activar'[\s\S]*?res\.json\(\{ success: true, message: '.*?Licencia activada con .*?', licencia: db\.licencia \}\);\s*\}\);/;

const newActivar = `app.post('/api/licencia/activar', (req, res) => {
  const { serial, empresa: empresaParam } = req.body;
  const db = readDB();
  const empresaActual = (db.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL").trim();

  // 1. Validar contra la empresa configurada
  let validacion = validarSerialLicencia(serial, empresaActual);

  // 2. Si no coincide, intentar contra versión sin acentos
  if (!validacion.valida) {
    const valLimpia = validarSerialLicencia(serial, "FINANCIERA CREDITO FACIL");
    if (valLimpia.valida) {
      validacion = valLimpia;
      db.config.nombreEmpresa = "FINANCIERA CRÉDITO FÁCIL";
    }
  }

  // 3. Si se pasó empresa explícita
  if (!validacion.valida && empresaParam) {
    const valParam = validarSerialLicencia(serial, empresaParam);
    if (valParam.valida) {
      validacion = valParam;
      db.config.nombreEmpresa = empresaParam;
    }
  }

  if (!validacion.valida) {
    return res.status(400).json({ error: validacion.error || 'El serial no coincide con el nombre de esta empresa.' });
  }

  db.licencia = {
    serial,
    empresa: validacion.empresa,
    rutasPermitidas: validacion.rutasPermitidas,
    expira: validacion.expira,
    activadaEl: new Date().toISOString()
  };
  writeDB(db);

  res.json({
    success: true,
    message: '¡Licencia activada con éxito para ' + validacion.rutasPermitidas + ' rutas!',
    licencia: db.licencia
  });
});`;

serverCode = serverCode.replace(oldActivarRegex, newActivar);
fs.writeFileSync(serverFile, serverCode, 'utf8');

// 3. Actualizar app.js para auto-rellenar el nombre de la empresa al abrir el generador
let appJs = fs.readFileSync(appJsFile, 'utf8');

appJs = appJs.replace(
  "document.getElementById('panelPrivadoJosue').classList.remove('hidden');",
  "document.getElementById('panelPrivadoJosue').classList.remove('hidden');\n    const empInput = document.getElementById('genEmpresa');\n    if (empInput && !empInput.value) empInput.value = (appState.config?.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL');"
);

// En activarSerialClienteAction, enviar también la empresa de genEmpresa si existe
appJs = appJs.replace(
  "body: JSON.stringify({ serial })",
  "body: JSON.stringify({ serial, empresa: document.getElementById('genEmpresa')?.value || appState.config?.nombreEmpresa })"
);

fs.writeFileSync(appJsFile, appJs, 'utf8');
console.log('✅ Sistema actualizado: Autocorrección de nombre de empresa y auto-rellenado activados.');
