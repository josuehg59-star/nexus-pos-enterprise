const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3008;
const BACKUP_DIR = path.join(os.homedir(), 'Documents', 'NEXUS RESPALDOS');
const LOCAL_DB_FILE = path.join(BACKUP_DIR, 'nexus_master_db.json');

// Cola de eventos con ID consecutivo para soporte multi-caja simultáneo (Cajas 1 a 10 + Móviles)
let syncEventCounter = 0;
let recentSyncEvents = [];

function broadcastSyncEvent(type, payload, folio, sourceCaja) {
  const evt = {
    id: ++syncEventCounter,
    timestamp: Date.now(),
    type,
    payload,
    folio: folio || `EVT-${Date.now()}`,
    sourceCaja: sourceCaja || 'DESCONOCIDO'
  };
  recentSyncEvents.push(evt);
  if (recentSyncEvents.length > 2000) recentSyncEvents.shift();
  console.log(`📡 [SYNC 3008] Evento broadcast #${evt.id}: ${type} (Folio: ${evt.folio}, Caja: ${evt.sourceCaja})`);
  return evt;
}

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getLatestBackup() {
  ensureDir();
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('NEXUS_BACKUP_') && f.endsWith('.json'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? path.join(BACKUP_DIR, files[0].name) : null;
}

function readMasterJSON() {
  ensureDir();
  const latestBackup = getLatestBackup();
  const files = [LOCAL_DB_FILE, latestBackup].filter(Boolean);
  for (const f of files) {
    if (f && fs.existsSync(f)) {
      try {
        const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
        return { data: raw, filePath: f };
      } catch(e) {}
    }
  }
  // En una PC nueva o limpia, inicia sin productos ni ventas quemadas
  return { data: { products: [], tickets: [], kardex: [] }, filePath: LOCAL_DB_FILE };
}

function getMasterProducts() {
  const { data } = readMasterJSON();
  if (Array.isArray(data)) return data;
  if (data.products && Array.isArray(data.products)) return data.products;
  if (data.collections && data.collections.products && Array.isArray(data.collections.products)) return data.collections.products;
  if (data.data && data.data.products) return data.data.products;
  return [];
}

function saveMasterJSON(dataObj) {
  try {
    ensureDir();
    const str = JSON.stringify(dataObj, null, 2);
    fs.writeFileSync(LOCAL_DB_FILE, str, 'utf8');
  } catch(e) {
    console.error('Error guardando master JSON:', e);
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // ==========================================
  // ENDPOINTS DEDICADOS: CONTROL COCA COLA FEMSA
  // ==========================================

  // 1.1 OBTENER DATOS EN VIVO DE COCA COLA FEMSA (CATÁLOGO, VENTAS DEL POS, COMPRAS Y GASTOS)
  if (url === '/api/coca/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    try {
      const u = new URL(req.url, 'http://localhost');
      const targetDate = u.searchParams.get('fecha') || 'HOY';
      const { data } = readMasterJSON();

      const allProds = data.products || [];
      const cocaProds = allProds.filter(p => {
        const s = String(p.supplier_id || p.supplier || '').toUpperCase();
        return s.includes('COCA COLA-- FEMSA') || s.includes('FEMSA') || s === '122';
      }).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category || 'Bebidas',
        supplier: 'COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)',
        cost: Number(p.cost) || 0,
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0
      }));

      // Determinar rango en milisegundos con zona horaria de México (UTC-6)
      let startMs = 0;
      let endMs = Infinity;
      let fechaKey = targetDate;

      const now = new Date();
      const hoyMexico = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); // YYYY-MM-DD

      if (targetDate === 'HOY' || targetDate === hoyMexico || targetDate === '') {
        fechaKey = hoyMexico;
        startMs = new Date(hoyMexico + 'T00:00:00-06:00').getTime();
        endMs = new Date(hoyMexico + 'T23:59:59.999-06:00').getTime();
      } else if (targetDate === 'ACUMULADO' || targetDate === 'TODO') {
        fechaKey = 'ACUMULADO';
        startMs = 0;
        endMs = Infinity;
      } else if (targetDate.length === 7) {
        // YYYY-MM
        fechaKey = targetDate;
        startMs = new Date(targetDate + '-01T00:00:00-06:00').getTime();
        endMs = new Date(targetDate + '-31T23:59:59.999-06:00').getTime();
      } else {
        // Fecha específica YYYY-MM-DD
        fechaKey = targetDate;
        startMs = new Date(targetDate + 'T00:00:00-06:00').getTime();
        endMs = new Date(targetDate + 'T23:59:59.999-06:00').getTime();
      }

      // Ventas de Coca Cola en el rango especificado
      const tickets = data.tickets || [];
      const ticketsDate = tickets.filter(t => {
        const dStr = t.date || t.fecha;
        if (!dStr) return false;
        const dTime = new Date(dStr).getTime();
        return dTime >= startMs && dTime <= endMs;
      });
      
      let ventasTotal = 0;
      let piezasTotal = 0;
      const ventasDetalle = [];

      ticketsDate.forEach(t => {
        const items = t.items || t.cart || [];
        items.forEach(it => {
          const sup = String(it.supplier_id || it.supplier || '').toUpperCase();
          const matchSku = cocaProds.some(cp => cp.sku === it.sku || (cp.id && cp.id === it.id));
          if (matchSku || sup.includes('COCA COLA-- FEMSA')) {
            const qty = Number(it.cartQty || it.qty || 1);
            const lineTot = Number(it.lineTotal || (Number(it.price || 0) * qty) || 0);
            ventasTotal += lineTot;
            piezasTotal += qty;
            const horaLocal = new Date(t.date || t.fecha).toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' });
            ventasDetalle.push({
              folio: t.folio || 'S/F',
              caja: t.caja || 'Caja 1',
              hora: horaLocal,
              sku: it.sku,
              name: it.name,
              qty: qty,
              price: Number(it.price || 0),
              total: lineTot
            });
          }
        });
      });

      // Compras y gastos
      const compras = (data.compras_coca || []).filter(c => {
        if (fechaKey === 'ACUMULADO') return true;
        const cTime = new Date(c.fecha).getTime();
        return cTime >= startMs && cTime <= endMs;
      });

      const gastos = (data.gastos_coca || []).filter(g => {
        if (fechaKey === 'ACUMULADO') return true;
        const gTime = new Date(g.fecha).getTime();
        return gTime >= startMs && gTime <= endMs;
      });

      const efectivoGuardado = data.efectivo_coca && data.efectivo_coca[fechaKey] !== undefined ? data.efectivo_coca[fechaKey] : null;

      const comprasTotal = compras.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
      const gastosTotal = gastos.reduce((acc, g) => acc + (Number(g.total) || 0), 0);

      // Flujo de caja a favor: Ventas menos compras menos gastos
      const efectivoDisponible = ventasTotal - comprasTotal - gastosTotal;

      return res.end(JSON.stringify({
        success: true,
        fecha: fechaKey,
        hoyLocal: hoyMexico,
        productos: cocaProds,
        totalProductos: cocaProds.length,
        ventas: {
          total: ventasTotal,
          piezas: piezasTotal,
          detalle: ventasDetalle
        },
        compras: {
          total: comprasTotal,
          lista: compras
        },
        gastos: {
          total: gastosTotal,
          lista: gastos
        },
        efectivoFisico: efectivoGuardado,
        efectivoDisponible: efectivoDisponible
      }));
    } catch(err) {
      console.error('Error en /api/coca/data:', err);
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 1.2 REGISTRAR COMPRA DE COCA COLA EN LA BASE DE DATOS MAESTRA
  if (url === '/api/coca/guardar-compra') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        if (!data.compras_coca) data.compras_coca = [];

        const compraItem = {
          id: Date.now(),
          fecha: payload.fecha || new Date().toISOString(),
          folioFactura: payload.folioFactura || 'COMPRA-' + Date.now(),
          proveedor: 'COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)',
          monto: Number(payload.monto) || 0,
          detalle: payload.detalle || 'Compra camión Coca-Cola',
          items: payload.items || []
        };

        data.compras_coca.push(compraItem);

        // Si se especificaron productos comprados, sumar al stock en data.products y kardex
        if (Array.isArray(payload.items) && payload.items.length > 0) {
          if (!data.kardex) data.kardex = [];
          payload.items.forEach(it => {
            const prod = (data.products || []).find(p => p.sku === it.sku);
            if (prod) {
              const oldSt = prod.stock || 0;
              const addQty = Number(it.qty || it.cantidad || 0);
              prod.stock = oldSt + addQty;
              data.kardex.push({
                fecha: compraItem.fecha,
                sku: prod.sku,
                productName: prod.name,
                tipo: 'ENTRADA',
                detalles: `COMPRA CAMIÓN COCA-COLA #${compraItem.folioFactura}`,
                cantidad: addQty,
                folio: `COM-${compraItem.folioFactura}`,
                usuario: 'CONTROL COCA',
                caja: 'MÓVIL',
                stockAnterior: oldSt,
                stockNuevo: prod.stock,
                precioVenta: prod.price,
                total: (it.cost || prod.cost) * addQty,
                proveedor: compraItem.proveedor
              });
            }
          });
        }

        saveMasterJSON(data);
        console.log(`📦 [COCA 3008] Compra registrada: $${compraItem.monto} (${compraItem.folioFactura})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, compra: compraItem }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1.3 REGISTRAR GASTO EN EFECTIVO DE COCA COLA
  if (url === '/api/coca/guardar-gasto') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        if (!data.gastos_coca) data.gastos_coca = [];

        const gastoItem = {
          id: Date.now(),
          fecha: payload.fecha || new Date().toISOString(),
          concepto: payload.concepto || 'GASTO DIVERSO',
          detalle: payload.detalle || '',
          total: Number(payload.total) || 0
        };

        data.gastos_coca.push(gastoItem);
        saveMasterJSON(data);
        console.log(`💸 [COCA 3008] Gasto registrado: $${gastoItem.total} - ${gastoItem.concepto}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, gasto: gastoItem }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1.3.1 BORRAR COMPRA
  if (url === '/api/coca/borrar-compra') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        if (data.compras_coca) {
          data.compras_coca = data.compras_coca.filter(c => c.id != payload.id);
          saveMasterJSON(data);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1.3.2 BORRAR GASTO
  if (url === '/api/coca/borrar-gasto') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        if (data.gastos_coca) {
          data.gastos_coca = data.gastos_coca.filter(g => g.id != payload.id);
          saveMasterJSON(data);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1.4 GUARDAR CONTEO DE EFECTIVO FÍSICO
  if (url === '/api/coca/guardar-efectivo') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        if (!data.efectivo_coca) data.efectivo_coca = {};
        const f = payload.fecha || new Date().toISOString().slice(0, 10);
        data.efectivo_coca[f] = Number(payload.monto) || 0;
        saveMasterJSON(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, fecha: f, monto: data.efectivo_coca[f] }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1.5 ACTUALIZAR STOCK DIRECTO DE PRODUCTO(S) DE COCA COLA EN MASTER DB
  if (url === '/api/coca/actualizar-stock') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data } = readMasterJSON();
        const prods = data.products || [];
        let updatedCount = 0;

        const itemsToUpdate = Array.isArray(payload) ? payload : [payload];
        itemsToUpdate.forEach(item => {
          const prod = prods.find(p => p.sku === item.sku || (item.id && p.id === item.id));
          if (prod) {
            prod.stock = Number(item.stock) || 0;
            if (item.cost !== undefined && Number(item.cost) > 0) prod.cost = Number(item.cost);
            if (item.price !== undefined && Number(item.price) > 0) prod.price = Number(item.price);
            updatedCount++;
          }
        });

        saveMasterJSON(data);
        console.log(`🔄 [COCA 3008] Stock actualizado para ${updatedCount} productos Coca Cola.`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, updatedCount }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 1. DESCARGA DE CATÁLOGO MAESTRO PARA EL CELULAR
  if (url === '/api/get-master-db') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const prods = getMasterProducts();
    console.log(`📱 [SYNC 3008] Celular solicitó catálogo -> Enviando ${prods.length} productos.`);
    return res.end(JSON.stringify(prods));
  }

  // 2. GUARDADO DE BASE DE DATOS MAESTRA DESDE EL PUNTO DE VENTA PC
  if (url === '/api/save-master-db' || url === '/api/backup') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { data: currentData } = readMasterJSON();

        // 1. Merge de Tickets: Clave única combinando (id || (caja + '_' + folio))
        const existingTickets = currentData.tickets || [];
        const incomingTickets = payload.tickets || (payload.collections && payload.collections.tickets) || [];
        const ticketMap = new Map();
        const makeTicketKey = (t) => {
          if (t && t.id) return String(t.id);
          return `${(t && t.caja) || 'CAJA'}_${t && t.folio}`;
        };
        existingTickets.forEach(t => { if (t) ticketMap.set(makeTicketKey(t), t); });
        incomingTickets.forEach(t => { if (t) ticketMap.set(makeTicketKey(t), t); });
        const mergedTickets = Array.from(ticketMap.values());

        // 2. Merge de Kardex: Clave única combinando (id || (caja + '_' + folio + '_' + sku + '_' + fecha))
        const existingKardex = currentData.kardex || [];
        const incomingKardex = payload.kardex || (payload.collections && payload.collections.kardex) || [];
        const kardexKeySet = new Set();
        const mergedKardex = [];
        const makeKardexKey = (k) => {
          if (k && k.id) return `ID_${k.id}`;
          return `${(k && k.caja) || 'CAJA'}_${k && k.folio || ''}_${k && k.sku || ''}_${k && k.fecha || ''}`;
        };
        existingKardex.forEach(k => {
          if (k) {
            const key = makeKardexKey(k);
            kardexKeySet.add(key);
            mergedKardex.push(k);
          }
        });
        incomingKardex.forEach(k => {
          if (k) {
            const key = makeKardexKey(k);
            if (!kardexKeySet.has(key)) {
              kardexKeySet.add(key);
              mergedKardex.push(k);
            }
          }
        });

        // 3. Merge de Productos:
        const currentProducts = Array.isArray(currentData) ? currentData : (currentData.products || []);
        const incomingProducts = payload.products || (payload.collections && payload.collections.products) || (Array.isArray(payload) ? payload : []);
        
        const mergedProducts = incomingProducts.map(inProd => {
          return {
            ...inProd,
            // Guardar el stock exacto emitido por la Caja Principal (soporta negativos y positivos exactos)
            stock: inProd.stock !== undefined ? Number(inProd.stock) : 0
          };
        });

        const mergedData = {
          ...payload,
          products: mergedProducts,
          tickets: mergedTickets,
          kardex: mergedKardex
        };

        saveMasterJSON(mergedData);
        const count = mergedProducts.length;
        broadcastSyncEvent('CATALOG_UPDATE', { count, timestamp: Date.now() }, 'CATALOG-SYNC', 'CAJA 1 - PRINCIPAL');
        console.log(`💻 [SYNC 3008] BD maestra actualizada con merge multi-caja -> ${count} productos, ${mergedTickets.length} tickets, ${mergedKardex.length} kardex.`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count, message: 'Base de datos maestra actualizada con merge multi-terminal' }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. SINCRONIZACIÓN DE VENTAS REALIZADAS EN TERMINALES SECUNDARIAS O APP MÓVIL
  if (url === '/api/sync-sale') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const sale = JSON.parse(body);
        const rawFolio = sale.folio || ('MOV-' + Math.floor(100000 + Math.random() * 900000));
        sale.folio = rawFolio;
        const saleCaja = sale.caja || 'CAJA MÓVIL (CELULAR)';
        const kardexFolio = String(rawFolio).startsWith('VTA-') ? rawFolio : `VTA-${rawFolio}`;

        const { data } = readMasterJSON();
        let prodsList = [];
        if (Array.isArray(data)) prodsList = data;
        else if (data.products) prodsList = data.products;
        else if (data.collections && data.collections.products) prodsList = data.collections.products;

        const cartItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.cart || sale.items || []);
        const normalizedCartItems = [];
        
        if (!data.kardex) data.kardex = [];
        if (!data.tickets) data.tickets = [];

        // Idempotencia: Verificar si esta venta por folio/caja o id ya fue procesada anteriormente
        const alreadyInTickets = data.tickets.some(t => 
          (sale.id && t.id === sale.id) || 
          (String(t.folio) === String(rawFolio) && String(t.caja || '').toUpperCase() === String(saleCaja).toUpperCase())
        );

        const alreadyInKardex = data.kardex.some(k => 
          (k.folio === kardexFolio || k.folio === rawFolio) && 
          (String(k.caja || '').toUpperCase() === String(saleCaja).toUpperCase())
        );

        // Descontar stock y registrar en Kardex solo si no se había procesado antes
        cartItems.forEach(item => {
          const code = String(item.sku || item.barcode || item.cod || '').trim().toLowerCase();
          const targetName = String(item.name || item.productName || '').trim().toLowerCase();
          const prod = prodsList.find(p => 
            (code && String(p.sku || p.barcode || '').trim().toLowerCase() === code) ||
            (code && p.barcode2 && String(p.barcode2).toLowerCase().includes(code)) ||
            (code && p.barcode3 && String(p.barcode3).toLowerCase().includes(code)) ||
            (targetName && p.name && p.name.trim().toLowerCase() === targetName) ||
            (item.id && String(p.id) === String(item.id))
          );

          const oldStock = prod ? (prod.stock || 0) : 0;
          const qty = Number(item.cartQty || item.qty || item.cantidad || 1);
          const price = Number(item.price || (prod ? prod.price : 0));
          const sku = prod ? prod.sku : String(item.sku || item.barcode || item.cod || 'N/A');
          const name = prod ? prod.name : String(item.name || item.productName || 'PRODUCTO MÓVIL');
          const cost = Number(item.cost || (prod ? prod.cost : price * 0.7));
          const supplier = String(prod ? (prod.supplier || prod.proveedor || prod.supplier_id || 'VENTA MÓVIL') : (item.supplier || 'VENTA MÓVIL'));

          if (!alreadyInKardex) {
            const newStock = oldStock - qty;
            if (prod) prod.stock = newStock;

            const saleUsuario = sale.cajero || sale.usuario || 'CAJERO';
            // Registrar en kardex con la fecha original de la venta offline
            data.kardex.push({
              fecha: sale.date || new Date().toISOString(),
              sku: sku,
              productName: name,
              tipo: 'SALIDA',
              detalles: `VENTA DESDE ${saleCaja} (FOLIO #${rawFolio})`,
              cantidad: qty,
              folio: kardexFolio,
              usuario: saleUsuario,
              caja: saleCaja,
              stockAnterior: oldStock,
              stockNuevo: newStock,
              precioVenta: price,
              total: price * qty,
              proveedor: supplier
            });
          }

          normalizedCartItems.push({
            ...item,
            id: prod ? prod.id : item.id,
            sku: sku,
            barcode: sku,
            name: name,
            cartQty: qty,
            qty: qty,
            price: price,
            cost: cost,
            total: price * qty,
            supplier: supplier,
            resultingStock: prod ? prod.stock : (oldStock - qty)
          });
        });

        sale.items = normalizedCartItems;

        if (!alreadyInTickets) {
          data.tickets.push(sale);
        } else {
          const tIdx = data.tickets.findIndex(t => 
            (sale.id && t.id === sale.id) || 
            (String(t.folio) === String(rawFolio) && String(t.caja || '').toUpperCase() === String(saleCaja).toUpperCase())
          );
          if (tIdx >= 0) data.tickets[tIdx] = sale;
        }

        saveMasterJSON(data);
        
        // Agregar a la cola de eventos multi-caja si no estaba procesado
        if (!alreadyInKardex) {
          broadcastSyncEvent('SALE', sale, rawFolio, saleCaja);
          console.log(`⚡ [SYNC 3008] Venta #${rawFolio} procesada y stock descontado en Maestro (${saleCaja}).`);
        } else {
          console.log(`⚡ [SYNC 3008] Venta #${rawFolio} ya existía (idempotente). Confirmada.`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, folio: rawFolio, message: 'Venta sincronizada y stock descontado en Maestro' }));
      } catch(e) {
        console.error('Error en /api/sync-sale:', e);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      }
    });
    return;
  }

  // 4.1 SINCRONIZACIÓN DE MOVIMIENTOS DE INVENTARIO (ENTRADAS, COMPRAS, MERMAS, DEVOLUCIONES A PROVEEDOR)
  if (url === '/api/sync-movement' || url === '/api/sync-kardex') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const mov = JSON.parse(body);
        const folio = mov.folio || ('MOV-' + Math.floor(100000 + Math.random() * 900000));
        mov.folio = folio;
        const tipo = (mov.tipo || 'ENTRADA').toUpperCase();
        const sourceCaja = mov.caja || 'DESCONOCIDO';
        const usuario = mov.usuario || mov.user || 'ADMINISTRADOR';
        const proveedor = mov.proveedor || mov.provider || 'PROVEEDOR GENERAL';

        const { data } = readMasterJSON();
        let prodsList = [];
        if (Array.isArray(data)) prodsList = data;
        else if (data.products) prodsList = data.products;
        else if (data.collections && data.collections.products) prodsList = data.collections.products;

        if (!data.kardex) data.kardex = [];
        const alreadyInKardex = data.kardex.some(k => k.folio === folio);

        const items = mov.items || [];
        const updatedProducts = [];

        items.forEach(item => {
          const code = String(item.sku || item.barcode || item.cod || '').trim().toLowerCase();
          const targetName = String(item.name || item.productName || '').trim().toLowerCase();
          let prod = prodsList.find(p => 
            (code && String(p.sku || p.barcode || '').trim().toLowerCase() === code) ||
            (code && p.barcode2 && String(p.barcode2).toLowerCase().includes(code)) ||
            (code && p.barcode3 && String(p.barcode3).toLowerCase().includes(code)) ||
            (targetName && p.name && p.name.trim().toLowerCase() === targetName) ||
            (item.id && String(p.id) === String(item.id))
          );

          const qty = Number(item.qty || item.entradaQty || item.cantidad || 1);
          const cost = Number(item.cost !== undefined ? item.cost : (prod ? prod.cost : 0));
          const price = Number(item.price !== undefined ? item.price : (prod ? prod.price : 0));

          if (!prod && tipo === 'ENTRADA') {
            prod = {
              id: item.id || Date.now() + Math.floor(Math.random() * 1000),
              sku: item.sku || ('SKU-' + Date.now().toString().slice(-6)),
              name: item.name || 'PRODUCTO NUEVO',
              price: price,
              cost: cost,
              stock: qty,
              supplier: proveedor,
              ieps: Number(item.ieps) || 0,
              iva: Number(item.iva) || 0
            };
            prodsList.push(prod);
            if (data.products && Array.isArray(data.products)) data.products.push(prod);
          }

          if (prod) {
            const oldStock = prod.stock || 0;
            const delta = (tipo === 'MERMA' || tipo === 'DEVOLUCION') ? -qty : qty;
            const newStock = oldStock + delta;
            if (!alreadyInKardex) {
              prod.stock = newStock;
            }
            if (cost > 0) prod.cost = cost;
            if (price > 0) prod.price = price;
            if (item.ieps !== undefined) prod.ieps = Number(item.ieps);
            if (item.iva !== undefined) prod.iva = Number(item.iva);

            item.resultingStock = prod.stock;
            item.fullProduct = prod;

            if (!alreadyInKardex) {
              data.kardex.push({
                fecha: mov.date || new Date().toISOString(),
                sku: prod.sku,
                productName: prod.name,
                tipo: tipo,
                detalles: mov.detalles || `${tipo} DESDE ${sourceCaja} (FOLIO #${folio})`,
                cantidad: qty,
                costo: cost,
                precio: price,
                total: (cost > 0 ? cost : price) * qty,
                folio: folio,
                usuario: usuario,
                caja: sourceCaja,
                stockAnterior: oldStock,
                stockNuevo: newStock,
                proveedor: proveedor
              });
            }
            updatedProducts.push(prod);
          }
        });

        if (tipo === 'ENTRADA') {
          if (!data.compras) data.compras = [];
          if (!data.compras.some(c => c.folio === folio)) {
            data.compras.push({
              folio: folio,
              date: mov.date || new Date().toISOString(),
              provider: proveedor,
              items: items,
              total: mov.total || items.reduce((acc, it) => acc + ((Number(it.cost) || Number(it.price) || 0) * (Number(it.qty) || 1)), 0),
              caja: sourceCaja,
              usuario: usuario,
              status: 'COMPRA'
            });
          }
        }

        saveMasterJSON(data);

        if (!alreadyInKardex) {
          broadcastSyncEvent('MOVEMENT', mov, folio, sourceCaja);
          console.log(`📦 [SYNC 3008] Movimiento ${tipo} #${folio} aplicado en Maestro (${updatedProducts.length} productos actualizados desde ${sourceCaja}).`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          folio, 
          updatedCount: updatedProducts.length, 
          message: `Movimiento ${tipo} sincronizado exitosamente con Servidor Maestro` 
        }));
      } catch(e) {
        console.error('Error en /api/sync-movement:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4.2 SINCRONIZACIÓN DE DEVOLUCIONES DE VENTAS / CANCELACIONES
  if (url === '/api/sync-return') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const ret = JSON.parse(body);
        const ticketFolio = ret.ticketFolio || ret.folio || 'N/A';
        const sourceCaja = ret.caja || 'DESCONOCIDO';
        const usuario = ret.usuario || 'ADMINISTRADOR';
        const items = ret.items || [];

        const { data } = readMasterJSON();
        let prodsList = [];
        if (Array.isArray(data)) prodsList = data;
        else if (data.products) prodsList = data.products;
        else if (data.collections && data.collections.products) prodsList = data.collections.products;

        if (!data.kardex) data.kardex = [];

        items.forEach(item => {
          const code = String(item.sku || item.barcode || item.cod || '').trim().toLowerCase();
          const targetName = String(item.name || item.productName || '').trim().toLowerCase();
          const prod = prodsList.find(p => 
            (code && String(p.sku || p.barcode || '').trim().toLowerCase() === code) ||
            (targetName && p.name && p.name.trim().toLowerCase() === targetName) ||
            (item.id && String(p.id) === String(item.id))
          );

          const qty = Number(item.returnedQty || item.qty || 1);
          if (prod) {
            const oldStock = prod.stock || 0;
            const newStock = oldStock + qty;
            prod.stock = newStock;
            item.resultingStock = newStock;

            data.kardex.push({
              fecha: new Date().toISOString(),
              sku: prod.sku,
              productName: `${prod.name} (DEVOLUCIÓN TICKET #${ticketFolio})`,
              tipo: 'DEVOLUCION',
              detalles: `Devolución de cliente desde ${sourceCaja} (Ticket #${ticketFolio})`,
              cantidad: qty,
              costo: prod.cost || 0,
              precio: item.price || prod.price || 0,
              total: qty * (item.price || prod.price || 0),
              folio: `DEV-${ticketFolio}`,
              usuario: usuario,
              caja: sourceCaja,
              stockAnterior: oldStock,
              stockNuevo: newStock
            });
          }
        });

        if (data.tickets && Array.isArray(data.tickets)) {
          const t = data.tickets.find(tk => String(tk.folio) === String(ticketFolio));
          if (t) {
            t.status = ret.esTotal ? 'CANCELADO' : 'DEVOLUCION_PARCIAL';
          }
        }

        saveMasterJSON(data);
        broadcastSyncEvent('RETURN', ret, `DEV-${ticketFolio}`, sourceCaja);
        console.log(`🔄 [SYNC 3008] Devolución Ticket #${ticketFolio} aplicada en Maestro (+stock reintegrado).`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Devolución sincronizada y stock reintegrado en Maestro' }));
      } catch(e) {
        console.error('Error en /api/sync-return:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4.3 SINCRONIZACIÓN DE AUDITORÍA DE INVENTARIO (CONTEO FÍSICO)
  if (url === '/api/sync-audit') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const audit = JSON.parse(body);
        const folio = audit.folio || ('AUD-' + Math.floor(100000 + Math.random() * 900000));
        audit.folio = folio;
        const sourceCaja = audit.caja || audit.terminal || 'AUDITORÍA';
        const usuario = audit.user || audit.usuario || 'ADMINISTRADOR';

        const { data } = readMasterJSON();

        let prodsList = [];
        if (Array.isArray(data)) prodsList = data;
        else if (data.products) prodsList = data.products;
        else if (data.collections && data.collections.products) prodsList = data.collections.products;

        const auditItems = audit.items || [];
        let updatedCount = 0;

        if (!data.kardex) data.kardex = [];
        const alreadyInKardex = data.kardex.some(k => k.folio === folio);

        auditItems.forEach(item => {
          const code = String(item.sku || item.barcode || item.cod || '').trim().toLowerCase();
          const targetName = String(item.name || item.productName || '').trim().toLowerCase();
          const prod = prodsList.find(p => 
            (code && String(p.sku || p.barcode || '').trim().toLowerCase() === code) ||
            (code && p.barcode2 && String(p.barcode2).toLowerCase().includes(code)) ||
            (code && p.barcode3 && String(p.barcode3).toLowerCase().includes(code)) ||
            (targetName && p.name && p.name.trim().toLowerCase() === targetName) ||
            (item.id && String(p.id) === String(item.id))
          );

          if (prod) {
            const oldStock = prod.stock || 0;
            const newStock = Number(item.countedQty !== undefined ? item.countedQty : (item.counted !== undefined ? item.counted : item.stock));
            const diff = newStock - oldStock;
            prod.stock = newStock;
            item.resultingStock = newStock;
            updatedCount++;

            if (!alreadyInKardex && diff !== 0) {
              data.kardex.push({
                fecha: audit.date || new Date().toISOString(),
                sku: prod.sku,
                productName: prod.name,
                tipo: diff > 0 ? 'ENTRADA' : 'MERMA',
                detalles: `AJUSTE CONTEO FÍSICO (${audit.mode || 'PARCIAL'}) DESDE ${sourceCaja} - FOLIO #${folio}`,
                cantidad: Math.abs(diff),
                folio: folio,
                usuario: usuario,
                caja: sourceCaja,
                stockAnterior: oldStock,
                stockNuevo: newStock
              });
            }
          }
        });

        saveMasterJSON(data);
        
        if (!alreadyInKardex) {
          broadcastSyncEvent('AUDIT', audit, folio, sourceCaja);
          console.log(`📋 [SYNC 3008] Auditoría #${folio} aplicada en Maestro (${updatedCount} productos ajustados desde ${sourceCaja}).`);
        } else {
          console.log(`📋 [SYNC 3008] Auditoría #${folio} ya existía (idempotente). Confirmada.`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, folio, updatedCount, message: 'Auditoría sincronizada y stock ajustado en Maestro' }));
      } catch(e) {
        console.error('Error en /api/sync-audit:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

    // ==========================================
  // ENDPOINT: PROBAR CONEXIÓN TERMINAL CLIP PINPAD
  // ==========================================
  if (url === '/api/clip/test-connection' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { apiKey, serialNumber } = JSON.parse(body || '{}');
        const key = (apiKey || '').trim();
        const serial = (serialNumber || '').trim();

        if (!key) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            statusCode: 400,
            message: '⚠️ Falta ingresar la API Key de Clip en Configuración.'
          }));
        }

        const https = require('https');
        const checkDevice = () => new Promise((resolve) => {
          const start = Date.now();
          const req = https.request({
            hostname: 'api-gw.payclip.com',
            port: 443,
            path: '/f2f/pinpad/v1/devices/status',
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'x-api-key': key
            },
            timeout: 3500
          }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
              resolve({
                durationMs: Date.now() - start,
                statusCode: res.statusCode,
                data
              });
            });
          });
          req.on('error', err => resolve({ statusCode: 500, error: err.message, durationMs: Date.now() - start }));
          req.on('timeout', () => {
            req.destroy();
            resolve({ statusCode: 504, error: 'Tiempo de espera agotado (3.5s)', durationMs: 3500 });
          });
          req.end();
        });

        const diag = await checkDevice();
        console.log(`🔍 [CLIP TEST-CONN] Status: ${diag.statusCode} (${diag.durationMs}ms) - ${diag.data || diag.error}`);

        let explanation = '';
        let isReady = false;

        if (diag.statusCode === 200 || diag.statusCode === 201) {
          isReady = true;
          explanation = `¡Conexión Exitosa con Clip!\n\nLa terminal PinPad S/N ${serial || 'activa'} está vinculada, en línea y lista para recibir órdenes automáticas de cobro en modo nube.`;
        } else if (diag.statusCode === 403 || diag.statusCode === 401) {
          explanation = `Respuesta de Clip (${diag.statusCode} No Autorizado / Forbidden):\n\n` +
            `Tu API Key es válida, pero tu cuenta de Clip o la terminal física (S/N: ${serial || 'No especificado'}) aún no están habilitadas por Clip para el servicio PinPad en Nube.\n\n` +
            `👉 ¿Cómo activarlo en Clip?\n` +
            `Envía un correo a sdk@payclip.com con tu correo registrado en Clip y el Número de Serie (${serial}) solicitando la instalación de la app Clip PinPad.\n\n` +
            `💡 Mientras tanto (Cobro Inmediato):\n` +
            `Selecciona 'MODO DIRECTO / MANUAL': Puedes cobrar al instante digitando el total en tu maquinita Clip y presionando F12 en Nexus POS sin ningún retraso.`;
        } else {
          explanation = `Clip respondió código ${diag.statusCode}: ${diag.data || diag.error || 'Error de conexión'}.`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: isReady,
          statusCode: diag.statusCode,
          durationMs: diag.durationMs,
          message: explanation,
          raw: diag.data
        }));
      } catch (err) {
        console.error('Error en /api/clip/test-connection:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ==========================================
  // ENDPOINT: PROXY OFICIAL TERMINAL CLIP (PINPAD API)
  // ==========================================
  if (url === '/api/clip/payment' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { apiKey, serialNumber, amount, reference } = JSON.parse(body || '{}');
        const numAmount = parseFloat(amount) || 0;
        console.log(`💳 [CLIP] Solicitud de cobro rápido: ${numAmount} | Serial: ${serialNumber}`);

        if (!apiKey) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Falta API Key de Clip' }));
        }

        const payload = JSON.stringify({
          amount: numAmount,
          reference: reference || ('NEXUS-' + Date.now().toString().slice(-6)),
          serial_number_pos: String(serialNumber || '').trim()
        });

        const https = require('https');

        const sendToClip = () => new Promise((resolve) => {
          const start = Date.now();
          const clipReq = https.request({
            hostname: 'api.payclip.io',
            port: 443,
            path: '/f2f/pinpad/v1/payment',
            method: 'POST',
            headers: {
              'x-api-key': apiKey.trim(),
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 3000
          }, (clipRes) => {
            let resData = '';
            clipRes.on('data', d => resData += d.toString());
            clipRes.on('end', () => {
              resolve({ statusCode: clipRes.statusCode, data: resData, durationMs: Date.now() - start });
            });
          });

          clipReq.on('error', (err) => {
            resolve({ statusCode: 500, error: err.message, durationMs: Date.now() - start });
          });

          clipReq.on('timeout', () => {
            clipReq.destroy();
            resolve({ statusCode: 504, error: 'Timeout Clip (3s)', durationMs: 3000 });
          });

          clipReq.write(payload);
          clipReq.end();
        });

        const result = await sendToClip();
        console.log(`💳 [CLIP api.payclip.io] Status ${result.statusCode} (${result.durationMs}ms): ${result.data || result.error}`);

        let parsed = null;
        try { parsed = JSON.parse(result.data); } catch(e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: result.statusCode === 200 || result.statusCode === 201,
          statusCode: result.statusCode,
          durationMs: result.durationMs,
          response: parsed,
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

  // 0. HEALTH CHECK / PING ENPOINT
  if (url === '/api/ping' || url === '/ping' || url === '/api/health' || url === '/health') {
    const prodsCount = getMasterProducts().length;
    const detectedIps = [];
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of (nets[name] || [])) {
        if (net.family === 'IPv4' && !net.internal) detectedIps.push(net.address);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      status: 'ONLINE', 
      role: 'MASTER',
      serverTime: Date.now(), 
      productsCount: prodsCount,
      ips: detectedIps,
      primaryIp: detectedIps[0] ? `${detectedIps[0]}:3008` : '127.0.0.1:3008',
      message: 'Servidor Principal NEXUS 3008 activo y respondiendo' 
    }));
  }

  // 1.1 ALIAS PARA PRODUCTOS
  if (url === '/api/products') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const prods = getMasterProducts();
    console.log(`📱 [SYNC 3008] Celular solicitó productos -> Enviando ${prods.length} productos.`);
    return res.end(JSON.stringify(prods));
  }

  // 3.1 ALIAS PARA EVENTOS DE VENTA MÓVIL
  if (url === '/api/sync-event') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        if (event.type === 'SALE') {
          const sale = event;
          const folio = sale.folio || ('VTA-MOV-' + Math.floor(100000 + Math.random() * 900000));
          sale.folio = folio;
          const { data } = readMasterJSON();
          let prodsList = [];
          if (Array.isArray(data)) prodsList = data;
          else if (data.products) prodsList = data.products;
          else if (data.collections && data.collections.products) prodsList = data.collections.products;

          if (!data.kardex) data.kardex = [];
          if (!data.tickets) data.tickets = [];

          const alreadyInKardex = data.kardex.some(k => k.folio === folio);
          if (!alreadyInKardex) {
            sale.items.forEach(it => {
              const code = String(it.code || '').trim().toLowerCase();
              const p = prodsList.find(pr => String(pr.sku || pr.barcode || pr.cod || pr.code || '').trim().toLowerCase() === code);
              if (p) {
                p.stock = (p.stock !== undefined ? Number(p.stock) : 0) - Number(it.quantity || 1);
                it.resultingStock = p.stock;
              }
              data.kardex.push({
                fecha: sale.date || new Date().toISOString(),
                sku: it.code,
                productName: it.name,
                tipo: 'SALIDA',
                detalles: `VENTA MÓVIL (FOLIO #${folio})`,
                cantidad: it.quantity,
                stockResultante: p ? p.stock : 0
              });
            });

            data.tickets.push({
              folio: folio,
              fecha: sale.date || new Date().toISOString(),
              total: sale.total,
              metodoPago: sale.paymentMethod,
              items: sale.items,
              cliente: sale.clientName || 'PUBLICO GENERAL',
              origen: 'MOVIL_ANDROID'
            });

            broadcastSyncEvent('SALE', sale, folio, sale.caja || 'MOVIL_ANDROID');
          }

          saveMasterJSON(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, folio }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 5. OBTENER EVENTOS PENDIENTES PARA EL PUNTO DE VENTA PC (MULTI-TERMINAL)
  if (url === '/api/get-pending-mobile-sync') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const sinceId = parseInt(parsedUrl.searchParams.get('since') || '0', 10);
    const excludeCaja = (parsedUrl.searchParams.get('excludeCaja') || '').trim().toUpperCase();
    
    let events = [];
    if (sinceId > 0) {
      events = recentSyncEvents.filter(e => e.id > sinceId);
    } else {
      events = recentSyncEvents.slice(-50);
    }

    if (excludeCaja) {
      events = events.filter(e => String(e.sourceCaja || '').trim().toUpperCase() !== excludeCaja);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(events));
  }

  // 6. SERVIR APLICACIÓN MÓVIL WEB (caja_movil_app/dist) PARA CUALQUIER CELULAR O TABLET
  const candidateDistDirs = [
    path.join(__dirname, 'caja_movil_app', 'dist'),
    path.join('C:', 'Users', 'JOSUE', 'Desktop', 'NEXUS_POS_ENTERPRISE', 'caja_movil_app', 'dist'),
    path.join(__dirname, '..', 'caja_movil_app', 'dist'),
    path.join(process.resourcesPath || '', 'caja_movil_app', 'dist')
  ];
  let distDir = candidateDistDirs.find(d => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html'))) || candidateDistDirs[0];
  let filePath = path.join(distDir, url === '/' ? 'index.html' : url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(filePath).pipe(res);
  }

  // Fallback Single Page Application (SPA) para rutas de la app móvil
  const indexFallback = path.join(distDir, 'index.html');
  if (fs.existsSync(indexFallback)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return fs.createReadStream(indexFallback).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Puerto ${PORT} ya está en uso por otra instancia. Servidor de sincronización ya activo.`);
  } else {
    console.error(`Error en servidor puerto ${PORT}:`, err);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ️ [SYNC 3008] El puerto ${PORT} ya está ocupado por otra instancia activa.`);
  } else {
    console.warn(`⚠️ [SYNC 3008] Error en servidor HTTP principal:`, err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  console.log("==========================================================");
  console.log(`🚀 SERVIDOR DE SINCRONIZACIÓN MÓVIL ACTIVO EN PUERTO ${PORT}`);
  console.log(`📡 DIRECCIONES IP DISPONIBLES PARA TU CELULAR / APP MÓVIL:`);
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          console.log(`   👉 http://${alias.address}:${PORT} (y puerto 3000)`);
        }
      }
    }
  }
  console.log("==========================================================");
});

// Listener secundario en puerto 3000 para compatibilidad universal con versiones anteriores
try {
  const server3000 = http.createServer((req, res) => {
    // Reenviar directamente al manejador del servidor principal
    server.emit('request', req, res);
  });
  server3000.listen(3000, '0.0.0.0', () => {
    console.log(`✅ COMPATIBILIDAD ACTIVA: Servidor escuchando también en puerto 3000 para versiones anteriores.`);
  });
  server3000.on('error', (err) => {
    console.warn(`⚠️ Puerto 3000 no disponible (${err.message}). El puerto 3008 sigue activo.`);
  });
} catch(e) {
  console.warn('Error inicializando puerto 3000:', e);
}
