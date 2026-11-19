const fs = require('fs');
const path = require('path');

const serverContent = `const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'database.json');

let activeTunnel = null;
let tunnelUrl = '';

// ==========================================
// TÚNEL PÚBLICO REMOTO PARA CELULARES
// ==========================================
async function startPublicTunnel() {
  try {
    const localtunnel = require('localtunnel');
    const customSubdomain = 'financiera-nexus-' + (Math.floor(1000 + Math.random() * 9000));
    activeTunnel = await localtunnel({ port: PORT, subdomain: customSubdomain });
    tunnelUrl = activeTunnel.url;
    console.log('🌐 [TÚNEL PÚBLICO ACTIVO PARA CELULARES EN LA CALLE / 4G / 5G]');
    console.log('📲 Enlace público: ' + tunnelUrl);

    activeTunnel.on('close', () => {
      console.log('Túnel cerrado. Reconectando...');
      setTimeout(startPublicTunnel, 5000);
    });
    activeTunnel.on('error', (err) => {
      console.log('Aviso túnel:', err.message);
    });
  } catch (e) {
    console.log('Aviso túnel localtunnel:', e.message);
  }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ==========================================
// ACCESO Y GESTIÓN DE BASE DE DATOS
// ==========================================
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) initDB();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo base de datos:', error);
    return { config: {}, cobradores: [], clientes: [], cobros: [], cortes: [], gastos: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error guardando base de datos:', error);
    return false;
  }
}

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      config: {
        nombreEmpresa: "FINANCIERA CRÉDITO FÁCIL",
        eslogan: "Préstamos Diarios y Soluciones al Instante",
        telefono: "55 1234 5678",
        direccion: "Av. Central #120, Col. Centro, CDMX",
        moneda: "$",
        pinAdmin: "1234",
        tasaInteresDefault: 20,
        diasPlazoDefault: 15
      },
      cobradores: [
        {
          id: "COB-1",
          nombre: "Carlos Gómez",
          telefono: "525598765432",
          ruta: "Ruta 1 - Centro / Norte",
          fondoInicial: 2000,
          activo: true,
          ultimaUbicacion: { lat: 19.4326, lng: -99.1332, hora: new Date().toISOString() }
        },
        {
          id: "COB-2",
          nombre: "Miguel Ángel Ruiz",
          telefono: "525587654321",
          ruta: "Ruta 2 - Sur / Oriente",
          fondoInicial: 1500,
          activo: true,
          ultimaUbicacion: { lat: 19.4250, lng: -99.1400, hora: new Date().toISOString() }
        }
      ],
      clientes: [],
      cobros: [],
      cortes: [],
      gastos: []
    };
    writeDB(initialData);
  }
}

// Convertir números a texto en español para contratos
function numeroALetras(monto) {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
  };
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = (centavos < 10 ? '0' : '') + centavos + '/100 M.N.';

  if (entero === 0) return 'CERO PESOS ' + centavosStr;
  if (entero === 100) return 'CIEN PESOS ' + centavosStr;

  function seccion(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let str = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) str += centenas[c] + ' ';
    if (especiales[du]) {
      str += especiales[du];
    } else {
      if (d > 0) {
        str += decenas[d];
        if (u > 0) str += ' Y ' + unidades[u];
      } else if (u > 0) {
        str += unidades[u];
      }
    }
    return str.trim();
  }

  let res = '';
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;

  if (miles > 0) {
    if (miles === 1) res += 'UN MIL ';
    else res += seccion(miles) + ' MIL ';
  }
  if (resto > 0) {
    res += seccion(resto);
  }

  return (res.trim() + ' PESOS ' + centavosStr).toUpperCase();
}


// ==========================================
// 1. ENDPOINTS DE TÚNEL Y CONFIGURACIÓN
// ==========================================
app.get('/api/tunnel', (req, res) => {
  res.json({
    active: Boolean(tunnelUrl),
    url: tunnelUrl || '',
    localIp: getLocalIP(),
    port: PORT
  });
});

app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json(db.config || {});
});

app.post('/api/config', (req, res) => {
  const db = readDB();
  db.config = { ...db.config, ...req.body };
  writeDB(db);
  res.json({ success: true, config: db.config });
});


// ==========================================
// 2. GESTIÓN MULTI-COBRADOR / REPARTIDORES
// ==========================================
app.get('/api/cobradores', (req, res) => {
  const db = readDB();
  const hoyStr = new Date().toISOString().split('T')[0];
  const cobradores = db.cobradores || [];
  const clientes = db.clientes || [];
  const cobros = db.cobros || [];
  const gastos = db.gastos || [];

  const reporte = cobradores.map(cob => {
    const misClientes = clientes.filter(c => c.cobradorId === cob.id && c.saldoPendiente > 0);
    const clientesCobradosHoy = misClientes.filter(c => c.pagadoHoy).length;
    const clientesPendientesHoy = misClientes.filter(c => !c.pagadoHoy).length;

    const misCobrosHoy = cobros.filter(c => (c.cobradorId === cob.id || (!c.cobradorId && cob.id === 'COB-1')) && c.fecha && c.fecha.startsWith(hoyStr));
    const totalCobradoHoy = misCobrosHoy.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);

    const misPrestamosHoy = clientes.filter(c => c.cobradorId === cob.id && c.fechaInicio === hoyStr);
    const totalPrestadoHoy = misPrestamosHoy.reduce((acc, c) => acc + (Number(c.prestamoOriginal) || 0), 0);

    const misGastosHoy = gastos.filter(g => (g.cobradorId === cob.id || (!g.cobradorId && cob.id === 'COB-1')) && g.fecha && g.fecha.startsWith(hoyStr));
    const totalGastosHoy = misGastosHoy.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    const fondo = Number(cob.fondoInicial) || 0;
    const efectivoEnMano = fondo + totalCobradoHoy - totalPrestadoHoy - totalGastosHoy;
    const metaEsperada = misClientes.reduce((acc, c) => acc + (Number(c.cuotaDiaria) || 0), 0);
    const efectividad = misClientes.length > 0 ? Math.round((clientesCobradosHoy / misClientes.length) * 100) : 0;

    return {
      ...cob,
      clientesAsignados: misClientes.length,
      clientesCobradosHoy,
      clientesPendientesHoy,
      totalCobradoHoy,
      totalPrestadoHoy,
      totalGastosHoy,
      efectivoEnMano,
      metaEsperada,
      efectividad
    };
  });

  res.json(reporte);
});

app.post('/api/cobradores', (req, res) => {
  const db = readDB();
  const { nombre, telefono, ruta, fondoInicial } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  const nuevoCobrador = {
    id: "COB-" + (db.cobradores.length + 1),
    nombre: nombre.trim(),
    telefono: (telefono || "").replace(/\\s+/g, ''),
    ruta: ruta || ("Ruta " + (db.cobradores.length + 1)),
    fondoInicial: Number(fondoInicial) || 1000,
    activo: true,
    ultimaUbicacion: {
      lat: 19.4326 + (Math.random() - 0.5) * 0.02,
      lng: -99.1332 + (Math.random() - 0.5) * 0.02,
      hora: new Date().toISOString()
    }
  };

  db.cobradores.push(nuevoCobrador);
  writeDB(db);
  res.json({ success: true, cobrador: nuevoCobrador });
});

app.put('/api/cobradores/:id', (req, res) => {
  const db = readDB();
  const index = (db.cobradores || []).findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Cobrador no encontrado' });

  db.cobradores[index] = {
    ...db.cobradores[index],
    ...req.body,
    id: req.params.id
  };
  writeDB(db);
  res.json({ success: true, cobrador: db.cobradores[index] });
});

app.delete('/api/cobradores/:id', (req, res) => {
  const db = readDB();
  const index = (db.cobradores || []).findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Cobrador no encontrado' });

  db.cobradores.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Cobrador eliminado' });
});

app.post('/api/cobradores/:id/ubicacion', (req, res) => {
  const db = readDB();
  const { lat, lng } = req.body;
  const cobrador = (db.cobradores || []).find(c => c.id === req.params.id);
  if (!cobrador) return res.status(404).json({ error: 'Cobrador no encontrado' });

  cobrador.ultimaUbicacion = {
    lat: Number(lat),
    lng: Number(lng),
    hora: new Date().toISOString()
  };
  writeDB(db);
  res.json({ success: true, ultimaUbicacion: cobrador.ultimaUbicacion });
});


// ==========================================
// 3. GESTIÓN DE CLIENTES Y PRÉSTAMOS
// ==========================================
app.get('/api/clientes', (req, res) => {
  const db = readDB();
  const { cobradorId } = req.query;
  let clientes = db.clientes || [];

  if (cobradorId && cobradorId !== 'ALL') {
    clientes = clientes.filter(c => c.cobradorId === cobradorId);
  }
  res.json(clientes);
});

app.post('/api/clientes', (req, res) => {
  const db = readDB();
  const {
    nombre, telefono, direccion, lat, lng,
    prestamoOriginal, interesPorc, diasPlazo,
    totalPagar: customTotal, cuotaDiaria: customCuota,
    modalidadCobro, cobradorId, cobradorNombre,
    avalNombre, avalTelefono, avalDireccion,
    fotoFachada, firmaDigitalCliente, fechaFirma
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });

  const capital = Number(prestamoOriginal) || 1000;
  const interes = Number(interesPorc) || 20;
  const dias = Number(diasPlazo) || 15;

  const ganancia = capital * (interes / 100);
  const totalPagar = customTotal ? Number(customTotal) : (capital + ganancia);
  const cuotaDiaria = customCuota ? Number(customCuota) : Math.ceil(totalPagar / dias);

  // Cobrador asignado
  let assignedCobrador = (db.cobradores || []).find(c => c.id === cobradorId);
  if (!assignedCobrador && db.cobradores && db.cobradores.length > 0) {
    assignedCobrador = db.cobradores[0];
  }

  const nuevoCliente = {
    id: "CLI-" + Math.floor(1000 + Math.random() * 9000),
    nombre: nombre.trim(),
    telefono: (telefono || "").replace(/\\s+/g, ''),
    direccion: direccion || "",
    lat: Number(lat) || (assignedCobrador?.ultimaUbicacion?.lat || 19.4326),
    lng: Number(lng) || (assignedCobrador?.ultimaUbicacion?.lng || -99.1332),
    prestamoOriginal: capital,
    interesPorc: interes,
    totalPagar: totalPagar,
    cuotaDiaria: cuotaDiaria,
    diasPlazo: dias,
    modalidadCobro: modalidadCobro || 'DIARIO',
    cobradorId: assignedCobrador ? assignedCobrador.id : 'COB-1',
    cobradorNombre: assignedCobrador ? assignedCobrador.nombre : 'Cobrador General',
    avalNombre: avalNombre || '',
    avalTelefono: (avalTelefono || "").replace(/\\s+/g, ''),
    avalDireccion: avalDireccion || '',
    fotoFachada: fotoFachada || '',
    firmaDigitalCliente: firmaDigitalCliente || '',
    fechaFirma: fechaFirma || (firmaDigitalCliente ? new Date().toISOString() : ''),
    fechaInicio: new Date().toISOString().split('T')[0],
    saldoPendiente: totalPagar,
    totalAbonado: 0,
    diasAtraso: 0,
    estatus: "AL_DIA",
    ultimoPagoFecha: null,
    ultimoPagoMonto: 0,
    pagadoHoy: false
  };

  if (!db.clientes) db.clientes = [];
  db.clientes.unshift(nuevoCliente);
  writeDB(db);

  res.json({
    success: true,
    cliente: nuevoCliente,
    montoLetras: numeroALetras(nuevoCliente.totalPagar)
  });
});

app.put('/api/clientes/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const index = (db.clientes || []).findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

  db.clientes[index] = {
    ...db.clientes[index],
    ...req.body,
    id: id
  };
  writeDB(db);
  res.json({ success: true, cliente: db.clientes[index] });
});

app.patch('/api/clientes/:id/cuota', (req, res) => {
  const db = readDB();
  const cliente = (db.clientes || []).find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  const nuevaCuota = Number(req.body.cuotaDiaria);
  if (isNaN(nuevaCuota) || nuevaCuota <= 0) {
    return res.status(400).json({ error: 'Cuota diaria inválida' });
  }

  cliente.cuotaDiaria = nuevaCuota;
  writeDB(db);
  res.json({ success: true, cliente });
});

app.patch('/api/clientes/:id/asignar-cobrador', (req, res) => {
  const db = readDB();
  const cliente = (db.clientes || []).find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  const cobrador = (db.cobradores || []).find(c => c.id === req.body.cobradorId);
  if (!cobrador) return res.status(404).json({ error: 'Cobrador no encontrado' });

  cliente.cobradorId = cobrador.id;
  cliente.cobradorNombre = cobrador.nombre;
  writeDB(db);
  res.json({ success: true, cliente });
});

app.patch('/api/clientes/:id/firma', (req, res) => {
  const db = readDB();
  const cliente = (db.clientes || []).find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  cliente.firmaDigitalCliente = req.body.firmaDigitalCliente || '';
  cliente.fechaFirma = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, cliente });
});

app.patch('/api/clientes/:id/foto', (req, res) => {
  const db = readDB();
  const cliente = (db.clientes || []).find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  cliente.fotoFachada = req.body.fotoFachada || '';
  writeDB(db);
  res.json({ success: true, cliente });
});

app.patch('/api/clientes/:id/gps', (req, res) => {
  const db = readDB();
  const cliente = (db.clientes || []).find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  cliente.lat = Number(req.body.lat);
  cliente.lng = Number(req.body.lng);
  writeDB(db);
  res.json({ success: true, cliente });
});

app.delete('/api/clientes/:id', (req, res) => {
  const db = readDB();
  const index = (db.clientes || []).findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

  db.clientes.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Cliente eliminado correctamente' });
});

app.post('/api/clientes/reset-dia', (req, res) => {
  const db = readDB();
  (db.clientes || []).forEach(c => {
    if (c.saldoPendiente > 0) {
      if (!c.pagadoHoy) {
        c.diasAtraso = (c.diasAtraso || 0) + 1;
        c.estatus = 'RETRASADO';
      }
      c.pagadoHoy = false;
    }
  });
  writeDB(db);
  res.json({ success: true, message: 'Ruta reiniciada para un nuevo día' });
});


// ==========================================
// 4. REGISTRAR COBRO CON RECIBO DE WHATSAPP
// ==========================================
app.post('/api/cobros', (req, res) => {
  const { clienteId, monto, tipo, lat, lng, cobradorId } = req.body;
  const db = readDB();

  const cliente = (db.clientes || []).find(c => c.id === clienteId);
  if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const cantidad = Number(monto) || 0;
  if (cantidad <= 0) return res.status(400).json({ error: "El monto debe ser mayor a 0" });

  const saldoAnterior = cliente.saldoPendiente;
  cliente.totalAbonado = (cliente.totalAbonado || 0) + cantidad;
  cliente.saldoPendiente = Math.max(0, (cliente.totalPagar || 0) - cliente.totalAbonado);
  cliente.ultimoPagoFecha = new Date().toISOString().split('T')[0];
  cliente.ultimoPagoMonto = cantidad;
  cliente.pagadoHoy = true;

  if (cliente.saldoPendiente === 0) {
    cliente.estatus = "LIQUIDADO";
    cliente.diasAtraso = 0;
  } else {
    cliente.estatus = "AL_DIA";
    cliente.diasAtraso = 0;
  }

  // Cobrador que cobró
  const cId = cobradorId || cliente.cobradorId || 'COB-1';
  const cobradorObj = (db.cobradores || []).find(c => c.id === cId);
  const cobradorNombre = cobradorObj ? cobradorObj.nombre : (cliente.cobradorNombre || 'Cobrador');

  // Actualizar ubicación del cobrador si se envió
  if (lat && lng && cobradorObj) {
    cobradorObj.ultimaUbicacion = {
      lat: Number(lat),
      lng: Number(lng),
      hora: new Date().toISOString()
    };
  }

  const folioRecibo = "REC-" + Date.now().toString().slice(-6);
  const fechaHora = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

  const nuevoCobro = {
    id: "COB-" + Date.now(),
    folio: folioRecibo,
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    monto: cantidad,
    saldoAnterior: saldoAnterior,
    saldoNuevo: cliente.saldoPendiente,
    fecha: new Date().toISOString(),
    fechaHoraTexto: fechaHora,
    tipo: tipo || "CUOTA_DIARIA",
    cobradorId: cId,
    cobradorNombre: cobradorNombre,
    lat: Number(lat) || cliente.lat,
    lng: Number(lng) || cliente.lng
  };

  if (!db.cobros) db.cobros = [];
  db.cobros.unshift(nuevoCobro);
  writeDB(db);

  // Generar texto formal y agradecido para WhatsApp
  const empresaNombre = db.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";
  const cuotasPagadas = Math.round(cliente.totalAbonado / (cliente.cuotaDiaria || 1));
  const cuotasTotales = Math.round(cliente.totalPagar / (cliente.cuotaDiaria || 1));

  const waMensaje = 
    "🧾 *COMPROBANTE FORMAL DE PAGO* 🧾\\n" +
    "🏛️ *" + empresaNombre + "*\\n" +
    "-----------------------------------------\\n" +
    "👤 *Cliente:* " + cliente.nombre + "\\n" +
    "🆔 *Folio de Recibo:* " + folioRecibo + "\\n" +
    "📅 *Fecha:* " + fechaHora + "\\n" +
    "🛵 *Cobrador:* " + cobradorNombre + "\\n" +
    "-----------------------------------------\\n" +
    "💰 *MONTO PAGADO HOY:* $" + cantidad.toFixed(2) + " MXN\\n" +
    "📉 *Saldo Anterior:* $" + saldoAnterior.toFixed(2) + "\\n" +
    "✅ *NUEVO SALDO RESTANTE:* $" + cliente.saldoPendiente.toFixed(2) + "\\n" +
    (cliente.saldoPendiente === 0 ? "🎉 *¡FELICIDADES! CRÉDITO LIQUIDADO AL 100%*\\n" : "📊 *Avance del Préstamo:* Cuota " + cuotasPagadas + " de " + cuotasTotales + " pagadas\\n") +
    "-----------------------------------------\\n" +
    "🤝 *¡Muchas gracias por su puntual pago del día de hoy!*\\n" +
    "Su puntualidad y responsabilidad fortalecen su historial crediticio con nosotros y le abren las puertas a mayores montos de préstamo en cualquier momento.\\n\\n" +
    "📌 _Conserve este mensaje como comprobante digital oficial de pago._";

  res.json({
    success: true,
    cobro: nuevoCobro,
    cliente: cliente,
    recibo: {
      folio: folioRecibo,
      clienteNombre: cliente.nombre,
      telefono: cliente.telefono,
      monto: cantidad,
      montoLetras: numeroALetras(cantidad),
      saldoAnterior,
      saldoNuevo: cliente.saldoPendiente,
      fechaHora,
      cobradorNombre,
      empresaNombre,
      whatsappMensaje: waMensaje
    }
  });
});

app.get('/api/cobros', (req, res) => {
  const db = readDB();
  res.json(db.cobros || []);
});


// ==========================================
// 5. CORTE DEL DÍA Y CIERRE DE CAJA
// ==========================================
app.get('/api/corte/hoy', (req, res) => {
  const db = readDB();
  const { cobradorId } = req.query;
  const hoyStr = new Date().toISOString().split('T')[0];

  let cobrosHoy = (db.cobros || []).filter(cob => cob.fecha && cob.fecha.startsWith(hoyStr));
  let prestamosHoy = (db.clientes || []).filter(cli => cli.fechaInicio === hoyStr);
  let gastosHoy = (db.gastos || []).filter(g => g.fecha && g.fecha.startsWith(hoyStr));
  let clientesActivos = (db.clientes || []).filter(c => c.saldoPendiente > 0);

  let cobradorNombre = 'Todos los cobradores (Corte General)';
  let fondoInicial = 0;

  if (cobradorId && cobradorId !== 'ALL') {
    const cob = (db.cobradores || []).find(c => c.id === cobradorId);
    if (cob) {
      cobradorNombre = cob.nombre + ' (' + cob.ruta + ')';
      fondoInicial = Number(cob.fondoInicial) || 0;
    }
    cobrosHoy = cobrosHoy.filter(c => c.cobradorId === cobradorId);
    prestamosHoy = prestamosHoy.filter(c => c.cobradorId === cobradorId);
    gastosHoy = gastosHoy.filter(g => g.cobradorId === cobradorId);
    clientesActivos = clientesActivos.filter(c => c.cobradorId === cobradorId);
  } else {
    fondoInicial = (db.cobradores || []).reduce((acc, c) => acc + (Number(c.fondoInicial) || 0), 0);
  }

  const totalCobradoHoy = cobrosHoy.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  const totalPrestadoHoy = prestamosHoy.reduce((acc, c) => acc + (Number(c.prestamoOriginal) || 0), 0);
  const totalGastosHoy = gastosHoy.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  const totalEnMano = fondoInicial + totalCobradoHoy - totalPrestadoHoy - totalGastosHoy;

  const clientesCobradosHoy = clientesActivos.filter(c => c.pagadoHoy).length;
  const clientesPendientesHoy = clientesActivos.filter(c => !c.pagadoHoy).length;
  const metaEsperada = clientesActivos.reduce((acc, c) => acc + (Number(c.cuotaDiaria) || 0), 0);
  const efectividad = clientesActivos.length > 0 ? Math.round((clientesCobradosHoy / clientesActivos.length) * 100) : 0;

  res.json({
    fecha: new Date().toISOString(),
    fechaCorta: hoyStr,
    cobradorId: cobradorId || 'ALL',
    cobradorNombre,
    fondoInicial,
    totalCobradoHoy,
    totalPrestadoHoy,
    totalGastosHoy,
    totalEnMano,
    metaEsperada,
    efectividad,
    clientesCobradosHoy,
    clientesPendientesHoy,
    cobrosDetalle: cobrosHoy,
    prestamosDetalle: prestamosHoy,
    gastosDetalle: gastosHoy
  });
});

app.post('/api/gastos-ruta', (req, res) => {
  const db = readDB();
  if (!db.gastos) db.gastos = [];

  const { concepto, monto, detalle, cobradorId } = req.body;
  const nuevoGasto = {
    id: "GAS-" + Date.now(),
    concepto: concepto || "Gasto de Ruta",
    monto: Number(monto) || 0,
    detalle: detalle || "",
    cobradorId: cobradorId || "COB-1",
    fecha: new Date().toISOString()
  };

  db.gastos.unshift(nuevoGasto);
  writeDB(db);
  res.json({ success: true, gasto: nuevoGasto });
});

app.post('/api/corte/cerrar', (req, res) => {
  const db = readDB();
  const hoyStr = new Date().toISOString().split('T')[0];
  const { cobradorId, nuevoFondo, notas } = req.body;

  let cobrosHoy = (db.cobros || []).filter(c => c.fecha && c.fecha.startsWith(hoyStr));
  let prestamosHoy = (db.clientes || []).filter(c => c.fechaInicio === hoyStr);
  let gastosHoy = (db.gastos || []).filter(g => g.fecha && g.fecha.startsWith(hoyStr));

  let cobrador = null;
  let fondoInicial = 0;

  if (cobradorId && cobradorId !== 'ALL') {
    cobrador = (db.cobradores || []).find(c => c.id === cobradorId);
    fondoInicial = Number(cobrador?.fondoInicial) || 0;
    cobrosHoy = cobrosHoy.filter(c => c.cobradorId === cobradorId);
    prestamosHoy = prestamosHoy.filter(c => c.cobradorId === cobradorId);
    gastosHoy = gastosHoy.filter(g => g.cobradorId === cobradorId);
  } else {
    fondoInicial = (db.cobradores || []).reduce((acc, c) => acc + (Number(c.fondoInicial) || 0), 0);
  }

  const totalCobradoHoy = cobrosHoy.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  const totalPrestadoHoy = prestamosHoy.reduce((acc, c) => acc + (Number(c.prestamoOriginal) || 0), 0);
  const totalGastosHoy = gastosHoy.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  const totalEnMano = fondoInicial + totalCobradoHoy - totalPrestadoHoy - totalGastosHoy;

  const corteRegistro = {
    id: "CORTE-" + Date.now(),
    fecha: new Date().toISOString(),
    fechaCorta: hoyStr,
    cobradorId: cobradorId || 'ALL',
    cobradorNombre: cobrador ? cobrador.nombre : 'Consolidado General',
    fondoInicial,
    totalCobrado: totalCobradoHoy,
    totalPrestado: totalPrestadoHoy,
    totalGastos: totalGastosHoy,
    totalEnMano,
    totalCobrosCount: cobrosHoy.length,
    notas: notas || 'Corte formal de fin de ruta'
  };

  if (!db.cortes) db.cortes = [];
  db.cortes.unshift(corteRegistro);

  if (nuevoFondo !== undefined && cobrador) {
    cobrador.fondoInicial = Number(nuevoFondo) || 0;
  }

  writeDB(db);
  res.json({ success: true, corte: corteRegistro });
});

app.get('/api/cortes', (req, res) => {
  const db = readDB();
  res.json(db.cortes || []);
});

app.get('/api/dashboard', (req, res) => {
  const db = readDB();
  const clientes = db.clientes || [];
  const hoyStr = new Date().toISOString().split('T')[0];

  const totalCarteraPrestada = clientes.reduce((acc, c) => acc + (c.prestamoOriginal || 0), 0);
  const totalPorCobrar = clientes.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0);
  const totalAbonadoHistorico = clientes.reduce((acc, c) => acc + (c.totalAbonado || 0), 0);

  const cobrosHoy = (db.cobros || []).filter(cob => cob.fecha && cob.fecha.startsWith(hoyStr));
  const totalCobradoHoy = cobrosHoy.reduce((acc, c) => acc + (c.monto || 0), 0);

  const clientesAlDia = clientes.filter(c => c.estatus === 'AL_DIA' && c.saldoPendiente > 0);
  const clientesRetrasados = clientes.filter(c => c.estatus === 'RETRASADO');
  const clientesLiquidados = clientes.filter(c => c.estatus === 'LIQUIDADO');
  const clientesPagadosHoy = clientes.filter(c => c.pagadoHoy && c.saldoPendiente > 0);
  const clientesPendientesHoy = clientes.filter(c => !c.pagadoHoy && c.saldoPendiente > 0);
  const metaCobroDia = clientes.filter(c => c.saldoPendiente > 0).reduce((acc, c) => acc + (c.cuotaDiaria || 0), 0);

  res.json({
    totalCarteraPrestada,
    totalPorCobrar,
    totalAbonadoHistorico,
    totalCobradoHoy,
    metaCobroDia,
    clientesAlDiaCount: clientesAlDia.length,
    clientesRetrasadosCount: clientesRetrasados.length,
    clientesLiquidadosCount: clientesLiquidados.length,
    clientesPagadosHoyCount: clientesPagadosHoy.length,
    clientesPendientesHoyCount: clientesPendientesHoy.length,
    totalClientes: clientes.length,
    cobradoresCount: (db.cobradores || []).length,
    localIp: getLocalIP(),
    port: PORT
  });
});

app.get('/api/backup', (req, res) => {
  const db = readDB();
  res.setHeader('Content-Disposition', 'attachment; filename="RESPALDO_FINANCIERA_' + Date.now() + '.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/backup/restore', (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.clientes) {
      return res.status(400).json({ error: 'Archivo de respaldo no válido' });
    }
    writeDB(backupData);
    res.json({ success: true, message: 'Base de datos restaurada correctamente' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Levantar servidor
initDB();
startPublicTunnel();
app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log('🚀 [SISTEMA CRÉDITO Y COBRANZA MULTI-COBRADOR ACTIVO]');
  console.log('💻 Servidor local: http://localhost:' + PORT);
  console.log('📱 Red local WiFi: http://' + getLocalIP() + ':' + PORT);
  console.log('======================================================');
});
`;

fs.writeFileSync('C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\server.js', serverContent, 'utf8');
console.log('✅ server.js actualizado con soporte completo para multi-cobrador, WhatsApp formal, corte de caja y firma legal.');
