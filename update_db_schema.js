const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\SISTEMA_CREDITO_COBRANZA';

// 1. ACTUALIZAR BASE DE DATOS database.json
const dbPath = path.join(targetDir, 'database.json');
let db = {};
if (fs.existsSync(dbPath)) {
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    db = {};
  }
}

// Configuración general
db.config = {
  nombreEmpresa: "FINANCIERA CRÉDITO FÁCIL",
  eslogan: "Préstamos Diarios y Soluciones al Instante",
  telefono: "55 1234 5678",
  direccion: "Av. Central #120, Col. Centro, CDMX",
  moneda: "$",
  pinAdmin: "1234",
  tasaInteresDefault: 20,
  diasPlazoDefault: 15,
  ...(db.config || {})
};
db.config.nombreEmpresa = "FINANCIERA CRÉDITO FÁCIL";
db.config.eslogan = "Préstamos Diarios y Soluciones al Instante";

// Inicializar lista de cobradores
if (!db.cobradores || !Array.isArray(db.cobradores) || db.cobradores.length === 0) {
  db.cobradores = [
    {
      id: "COB-1",
      nombre: "Carlos Gómez",
      telefono: "525598765432",
      ruta: "Ruta 1 - Centro / Norte",
      fondoInicial: 2000,
      activo: true,
      ultimaUbicacion: {
        lat: 19.4326,
        lng: -99.1332,
        hora: new Date().toISOString()
      }
    },
    {
      id: "COB-2",
      nombre: "Miguel Ángel Ruiz",
      telefono: "525587654321",
      ruta: "Ruta 2 - Sur / Oriente",
      fondoInicial: 1500,
      activo: true,
      ultimaUbicacion: {
        lat: 19.4250,
        lng: -99.1400,
        hora: new Date().toISOString()
      }
    }
  ];
}

// Asignar cobrador a clientes que no lo tengan
if (db.clientes && Array.isArray(db.clientes)) {
  db.clientes.forEach((c, index) => {
    if (!c.cobradorId) {
      const assigned = db.cobradores[index % db.cobradores.length];
      c.cobradorId = assigned.id;
      c.cobradorNombre = assigned.nombre;
    }
    if (!c.modalidadCobro) c.modalidadCobro = "DIARIO";
    if (!c.diasPlazo) c.diasPlazo = 15;
    if (!c.firmaDigitalCliente) c.firmaDigitalCliente = "";
    if (!c.fotoFachada) c.fotoFachada = "";
  });
}

if (!db.cortes) db.cortes = [];
if (!db.gastos) db.gastos = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ Base de datos actualizada con soporte multi-cobrador exitosamente.');
