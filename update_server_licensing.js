const fs = require('fs');
const path = require('path');

const targetServer = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\server.js';
let serverCode = fs.readFileSync(targetServer, 'utf8');

// 1. Requerir licencias al inicio
if (!serverCode.includes("require('./licencias')")) {
  serverCode = "const { MASTER_DEV, generarSerialLicencia, validarSerialLicencia } = require('./licencias');\n" + serverCode;
}

// 2. Modificar initDB para inicializar licencia
const initDbTarget = "function initDB() {";
const initDbReplacement = `function initDB() {
  // Asegurar licencia por defecto
  const defaultLic = generarSerialLicencia("FINANCIERA CRÉDITO FÁCIL", 5, "MENSUAL", 60);`;

serverCode = serverCode.replace(initDbTarget, initDbReplacement);

// 3. Agregar endpoints de Licencias y Auto-Update
const routesToAdd = `
// ==========================================
// MÓDULO DE LICENCIAS - CREADOR: JOSUE HERNANDEZ (9612765041)
// ==========================================
app.get('/api/licencia/status', (req, res) => {
  const db = readDB();
  const lic = db.licencia || generarSerialLicencia(db.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL", 5, "MENSUAL", 60);
  const status = validarSerialLicencia(lic.serial, db.config?.nombreEmpresa || lic.empresa);

  res.json({
    ...lic,
    ...status,
    creador: MASTER_DEV.nombre,
    telefonoSoporte: MASTER_DEV.telefono,
    cobradoresActuales: (db.cobradores || []).length,
    rutasDisponibles: (lic.rutasPermitidas || 5) - (db.cobradores || []).length,
    versionActual: "1.0.0",
    repoGitHub: "josuehg59-star/cobranza-financiera"
  });
});

app.post('/api/licencia/activar', (req, res) => {
  const { serial } = req.body;
  const db = readDB();
  const empresa = db.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";

  const validacion = validarSerialLicencia(serial, empresa);
  if (!validacion.valida) {
    return res.status(400).json({ error: validacion.error || 'Serial inválido o no corresponde a esta empresa.' });
  }

  db.licencia = {
    serial,
    empresa,
    rutasPermitidas: validacion.rutasPermitidas,
    expira: validacion.expira,
    activadaEl: new Date().toISOString()
  };
  writeDB(db);

  res.json({ success: true, message: '¡Licencia activada con éxito!', licencia: db.licencia });
});

// Panel Maestro del Desarrollador (Josue Hernandez)
app.post('/api/licencia/generar-maestro', (req, res) => {
  const { pinDev, empresa, rutas, tipo, dias } = req.body;
  if (pinDev !== '9612' && pinDev !== '9612765041') {
    return res.status(403).json({ error: 'PIN de Desarrollador Maestro incorrecto.' });
  }

  if (!empresa) return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' });

  const lic = generarSerialLicencia(empresa, rutas || 3, tipo || 'MENSUAL', dias || 30);
  res.json({ success: true, licencia: lic });
});

// Cobros Offline en Lote (cuando vuelve la señal)
app.post('/api/cobros/batch-offline', (req, res) => {
  const { cobrosOffline } = req.body;
  if (!Array.isArray(cobrosOffline) || cobrosOffline.length === 0) {
    return res.json({ success: true, procesados: 0 });
  }

  const db = readDB();
  let procesados = 0;

  cobrosOffline.forEach(item => {
    const cliente = (db.clientes || []).find(c => c.id === item.clienteId);
    if (cliente) {
      const cantidad = Number(item.monto) || 0;
      cliente.totalAbonado = (cliente.totalAbonado || 0) + cantidad;
      cliente.saldoPendiente = Math.max(0, (cliente.totalPagar || 0) - cliente.totalAbonado);
      cliente.pagadoHoy = true;
      cliente.ultimoPagoMonto = cantidad;
      cliente.ultimoPagoFecha = item.fecha ? item.fecha.split('T')[0] : new Date().toISOString().split('T')[0];

      if (cliente.saldoPendiente === 0) cliente.estatus = 'LIQUIDADO';
      
      db.cobros.unshift({
        id: item.id || ("COB-OFF-" + Date.now() + Math.random()),
        folio: item.folio || ("REC-" + Date.now().toString().slice(-6)),
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        monto: cantidad,
        fecha: item.fecha || new Date().toISOString(),
        tipo: item.tipo || 'CUOTA_DIARIA_OFFLINE',
        cobradorId: item.cobradorId || 'COB-1',
        cobradorNombre: item.cobradorNombre || 'Cobrador'
      });
      procesados++;
    }
  });

  writeDB(db);
  res.json({ success: true, procesados });
});
`;

if (!serverCode.includes('/api/licencia/status')) {
  serverCode += routesToAdd;
}

// 4. Validar límite de cobradores en POST /api/cobradores
const cobradoresLimitCheck = `app.post('/api/cobradores', (req, res) => {
  const db = readDB();
  const maxRutas = db.licencia?.rutasPermitidas || 5;
  if ((db.cobradores || []).length >= maxRutas) {
    return res.status(403).json({
      error: 'Has alcanzado el límite de rutas contratadas (' + maxRutas + ' cobradores). Para ampliar tu plan, contacta a Josue Hernandez al 961 276 5041.'
    });
  }`;

serverCode = serverCode.replace("app.post('/api/cobradores', (req, res) => {\n  const db = readDB();", cobradoresLimitCheck);

fs.writeFileSync(targetServer, serverCode, 'utf8');
console.log('✅ server.js actualizado con módulo completo de licencias de Josue Hernandez y soporte Offline.');
