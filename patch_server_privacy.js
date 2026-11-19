const fs = require('fs');
const path = require('path');

const serverFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\server.js';
let code = fs.readFileSync(serverFile, 'utf8');

// Añadir endpoint toggle-oculto si no existe
if (!code.includes('/api/clientes/:id/toggle-oculto')) {
  const target = "app.patch('/api/clientes/:id/asignar-cobrador'";
  const newRoute = "app.patch('/api/clientes/:id/toggle-oculto', (req, res) => {\n" +
  "  const db = readDB();\n" +
  "  const cliente = (db.clientes || []).find(c => c.id === req.params.id);\n" +
  "  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });\n" +
  "  cliente.oculto = !cliente.oculto;\n" +
  "  writeDB(db);\n" +
  "  res.json({ success: true, oculto: cliente.oculto, cliente });\n" +
  "});\n\n";
  code = code.replace(target, newRoute + target);
}

// Asegurar que GET /api/clientes soporte filtrado estricto por cobrador y ocultos
const getClientesTarget = "app.get('/api/clientes', (req, res) => {\n" +
"  const db = readDB();\n" +
"  const { cobradorId } = req.query;\n" +
"  let clientes = db.clientes || [];\n\n" +
"  if (cobradorId && cobradorId !== 'ALL') {\n" +
"    clientes = clientes.filter(c => c.cobradorId === cobradorId);\n" +
"  }\n" +
"  res.json(clientes);\n" +
"});";

const getClientesReplacement = "app.get('/api/clientes', (req, res) => {\n" +
"  const db = readDB();\n" +
"  const { cobradorId, verOcultos } = req.query;\n" +
"  let clientes = db.clientes || [];\n\n" +
"  if (cobradorId && cobradorId !== 'ALL') {\n" +
"    clientes = clientes.filter(c => c.cobradorId === cobradorId);\n" +
"  }\n\n" +
"  if (verOcultos === 'ONLY') {\n" +
"    clientes = clientes.filter(c => c.oculto === true);\n" +
"  } else if (verOcultos !== 'ALL') {\n" +
"    clientes = clientes.filter(c => !c.oculto);\n" +
"  }\n\n" +
"  res.json(clientes);\n" +
"});";

if (code.includes(getClientesTarget)) {
  code = code.replace(getClientesTarget, getClientesReplacement);
}

fs.writeFileSync(serverFile, code, 'utf8');
console.log('✅ server.js actualizado con endpoint toggle-oculto y filtrado estricto.');
