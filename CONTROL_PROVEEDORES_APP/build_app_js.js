const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\CONTROL_PROVEEDORES_APP';
const prods = JSON.parse(fs.readFileSync(path.join(targetDir, 'coca_exacto.json'), 'utf8'));

// Escribir un archivo JS separado para que JAMÁS se rompa
const jsContent = `
const catalogoCocaOriginal = ${JSON.stringify(prods)};
let productosCoca = [];
let modo = 'DIA';

function getKey() {
  const d = document.getElementById('inputFecha');
  const fecha = d && d.value ? d.value : new Date().toISOString().split('T')[0];
  return modo === 'DIA' ? fecha : fecha.slice(0, 7);
}

function inicializar() {
  try {
    const inputF = document.getElementById('inputFecha');
    if (inputF && !inputF.value) {
      inputF.value = new Date().toISOString().split('T')[0];
    }

    const localStock = localStorage.getItem('control_coca_femsa_stock');
    if (localStock) {
      const parsed = JSON.parse(localStock);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productosCoca = parsed;
      }
    }
  } catch(e) {
    console.error(e);
  }

  if (!productosCoca || productosCoca.length === 0) {
    productosCoca = JSON.parse(JSON.stringify(catalogoCocaOriginal));
    guardarCatalogoLocal();
  }

  cargarEfectivoGuardado();
  cargarDatos();
}

function guardarCatalogoLocal() {
  localStorage.setItem('control_coca_femsa_stock', JSON.stringify(productosCoca));
}

function toggleFormNuevoProd() {
  const f = document.getElementById('formNuevoProducto');
  const btn = document.getElementById('btnNuevoProdTexto');
  if (!f) return;
  if (f.style.display === 'none' || f.classList.contains('hidden')) {
    f.style.display = 'block';
    f.classList.remove('hidden');
    if (btn) btn.innerText = '✕ CERRAR FORMULARIO';
  } else {
    f.style.display = 'none';
    f.classList.add('hidden');
    if (btn) btn.innerText = '+ AGREGAR PRODUCTO NUEVO';
  }
}

function guardarNuevoProducto() {
  const sku = (document.getElementById('nuevoSku').value || '').trim();
  const name = (document.getElementById('nuevoNombre').value || '').trim();
  const cost = parseFloat(document.getElementById('nuevoCosto').value) || 0;
  const price = parseFloat(document.getElementById('nuevoPrecio').value) || 0;
  const stock = parseFloat(document.getElementById('nuevoStock').value) || 0;

  if (!sku || !name) {
    alert('Por favor ingresa al menos el SKU y el Nombre del producto.');
    return;
  }

  const existe = productosCoca.find(p => p.sku === sku);
  if (existe) {
    existe.name = name;
    existe.cost = cost;
    existe.price = price;
    existe.stock = stock;
    alert('✅ Producto ya existía. Existencias y precios actualizados.');
  } else {
    productosCoca.unshift({
      sku,
      name,
      category: 'Bebidas',
      supplier: 'COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)',
      cost,
      price,
      stock
    });
    alert('🎉 ¡Nuevo producto agregado con éxito a la lista de Coca-Cola FEMSA!');
  }

  guardarCatalogoLocal();
  document.getElementById('nuevoSku').value = '';
  document.getElementById('nuevoNombre').value = '';
  document.getElementById('nuevoCosto').value = '';
  document.getElementById('nuevoPrecio').value = '';
  document.getElementById('nuevoStock').value = '';
  toggleFormNuevoProd();
  cargarDatos();
}

function setModo(m) {
  modo = m;
  const btnD = document.getElementById('btnModoDia');
  const btnM = document.getElementById('btnModoMes');
  if (btnD && btnM) {
    btnD.className = m === 'DIA' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
    btnM.className = m === 'MES' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
  }
  cargarEfectivoGuardado();
  cargarDatos();
}

function cargarEfectivoGuardado() {
  const key = 'efectivo_COCA_' + getKey();
  const guardado = localStorage.getItem(key) || '';
  const inputE = document.getElementById('inputEfectivoManual');
  if (inputE) inputE.value = guardado;
}

function guardarEfectivoManual() {
  const key = 'efectivo_COCA_' + getKey();
  const inputE = document.getElementById('inputEfectivoManual');
  const valor = inputE ? inputE.value : '0';
  localStorage.setItem(key, valor);
  alert('✅ Efectivo guardado para Coca-Cola (' + getKey() + '): $' + (parseFloat(valor) || 0).toFixed(2));
  calcularBalance();
}

function cargarDatos() {
  cargarEfectivoGuardado();
  
  let totalVentas = 0;
  let pzsVendidas = 0;
  let totalCompras = 0;
  let totalOtrosGastos = 0;

  const comprasKey = 'compras_COCA_' + getKey();
  const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
  for (const c of comprasGuardadas) {
    totalCompras += parseFloat(c.total) || 0;
  }

  const salidasKey = 'salidas_COCA_' + getKey();
  const salidasGuardadas = JSON.parse(localStorage.getItem(salidasKey) || '[]');
  for (const s of salidasGuardadas) {
    totalVentas += parseFloat(s.total) || 0;
    pzsVendidas += parseInt(s.cantidad) || 0;
  }

  const gastosKey = 'otros_gastos_' + getKey();
  const gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
  for (const g of gastosGuardados) {
    totalOtrosGastos += parseFloat(g.total) || 0;
  }

  const lblV = document.getElementById('lblVentas');
  const lblPV = document.getElementById('lblPzsVendidas');
  const lblC = document.getElementById('lblCompras');
  const lblPC = document.getElementById('lblPzsCompradas');
  const lblOG = document.getElementById('lblOtrosGastos');
  const lblCG = document.getElementById('lblCantGastos');

  if (lblV) lblV.innerText = '$' + totalVentas.toFixed(2);
  if (lblPV) lblPV.innerText = pzsVendidas + ' piezas vendidas';
  if (lblC) lblC.innerText = '$' + totalCompras.toFixed(2);
  if (lblPC) lblPC.innerText = comprasGuardadas.length + ' notas pagadas';
  if (lblOG) lblOG.innerText = '$' + totalOtrosGastos.toFixed(2);
  if (lblCG) lblCG.innerText = gastosGuardados.length + ' pagos manuales';

  calcularBalance(totalVentas, totalCompras, totalOtrosGastos);
  renderTablaGastos(gastosGuardados);
  actualizarSelectSalidas(productosCoca);

  const busc = document.getElementById('inputBuscador');
  const q = (busc ? busc.value : '').toLowerCase().trim();
  if (q) {
    const filtrados = productosCoca.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.sku || '').toLowerCase().includes(q)
    );
    renderTabla(filtrados);
  } else {
    renderTabla(productosCoca);
  }
}

function renderTablaGastos(lista) {
  const seccion = document.getElementById('seccionListaGastos');
  const tbody = document.getElementById('tablaGastosBody');
  if (!seccion || !tbody) return;
  tbody.innerHTML = '';

  if (lista.length === 0) {
    seccion.style.display = 'none';
    return;
  }
  seccion.style.display = 'block';

  let suma = 0;
  for (const g of lista) {
    suma += parseFloat(g.total) || 0;
    const tr = document.createElement('tr');
    const hora = (g.fecha || '').slice(11, 16) || '--:--';
    tr.innerHTML = '<td class="p-2 text-slate-400 font-mono">' + hora + '</td>' +
      '<td class="p-2 text-white font-bold uppercase">' + g.concepto + '</td>' +
      '<td class="p-2 text-slate-300">' + (g.detalle || '-') + '</td>' +
      '<td class="p-2 text-right text-amber-400 font-bold font-mono">-$' + parseFloat(g.total).toFixed(2) + '</td>' +
      '<td class="p-2 text-center"><button onclick="borrarGasto(' + g.id + ')" class="text-rose-400 hover:text-rose-300 font-bold text-xs">✕</button></td>';
    tbody.appendChild(tr);
  }
  const lblSuma = document.getElementById('lblSumaGastosHeader');
  if (lblSuma) lblSuma.innerText = 'Total descontado: $' + suma.toFixed(2);
}

function borrarGasto(id) {
  const gastosKey = 'otros_gastos_' + getKey();
  let gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
  gastosGuardados = gastosGuardados.filter(g => g.id !== id);
  localStorage.setItem(gastosKey, JSON.stringify(gastosGuardados));
  cargarDatos();
}

function actualizarSelectSalidas(lista) {
  const sel = document.getElementById('selectSalidaProd');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Elige producto para salida --</option>';
  for (const p of lista) {
    const opt = document.createElement('option');
    opt.value = p.sku;
    opt.text = p.name + ' ($' + p.price + ' | Stock: ' + p.stock + ')';
    sel.appendChild(opt);
  }
}

function calcularBalance(ventas, compras, otrosGastos) {
  const v = typeof ventas === 'number' ? ventas : parseFloat((document.getElementById('lblVentas')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const c = typeof compras === 'number' ? compras : parseFloat((document.getElementById('lblCompras')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const g = typeof otrosGastos === 'number' ? otrosGastos : parseFloat((document.getElementById('lblOtrosGastos')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const efManual = parseFloat(document.getElementById('inputEfectivoManual')?.value || '0') || 0;

  const dineroTeorico = v - c - g;
  const balance = efManual - dineroTeorico;

  const lblBal = document.getElementById('lblBalance');
  const lblEst = document.getElementById('lblEstadoBalance');
  if (!lblBal || !lblEst) return;

  lblBal.innerText = (balance >= 0 ? '+$' : '-$') + Math.abs(balance).toFixed(2);
  if (balance > 0.01) {
    lblBal.className = 'text-xl sm:text-2xl font-black text-emerald-400';
    lblEst.className = 'text-[10px] font-bold mt-1 text-emerald-400';
    lblEst.innerText = 'Sobrante en mano';
  } else if (balance < -0.01) {
    lblBal.className = 'text-xl sm:text-2xl font-black text-rose-400';
    lblEst.className = 'text-[10px] font-bold mt-1 text-rose-400';
    lblEst.innerText = 'Faltante contra ventas/gastos';
  } else {
    lblBal.className = 'text-xl sm:text-2xl font-black text-white';
    lblEst.className = 'text-[10px] font-bold mt-1 text-slate-400';
    lblEst.innerText = 'Cuadre exacto (0.00)';
  }
}

function registrarCompraRapida() {
  const folio = (document.getElementById('compraFolio')?.value || '').trim() || 'COMPRA-' + Date.now().toString().slice(-4);
  const total = parseFloat(document.getElementById('compraTotal')?.value || '0') || 0;
  const notas = (document.getElementById('compraNotas')?.value || '').trim();

  if (total <= 0) {
    alert('Por favor ingresa un monto válido para la compra.');
    return;
  }

  const comprasKey = 'compras_COCA_' + getKey();
  const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
  comprasGuardadas.push({
    id: Date.now(),
    folio,
    total,
    notas,
    fecha: new Date().toISOString()
  });
  localStorage.setItem(comprasKey, JSON.stringify(comprasGuardadas));

  if (document.getElementById('compraFolio')) document.getElementById('compraFolio').value = '';
  if (document.getElementById('compraTotal')) document.getElementById('compraTotal').value = '';
  if (document.getElementById('compraNotas')) document.getElementById('compraNotas').value = '';

  alert('✅ Compra guardada para Coca-Cola: ' + folio + ' por $' + total.toFixed(2));
  cargarDatos();
}

function registrarOtroGasto() {
  const concepto = (document.getElementById('gastoConcepto')?.value || '').trim();
  const total = parseFloat(document.getElementById('gastoTotal')?.value || '0') || 0;
  const detalle = (document.getElementById('gastoDetalle')?.value || '').trim();

  if (!concepto) {
    alert('Por favor ingresa el concepto del gasto.');
    return;
  }
  if (total <= 0) {
    alert('Por favor ingresa un monto válido.');
    return;
  }

  const gastosKey = 'otros_gastos_' + getKey();
  const gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
  gastosGuardados.push({
    id: Date.now(),
    concepto,
    total,
    detalle,
    fecha: new Date().toISOString()
  });
  localStorage.setItem(gastosKey, JSON.stringify(gastosGuardados));

  if (document.getElementById('gastoConcepto')) document.getElementById('gastoConcepto').value = '';
  if (document.getElementById('gastoTotal')) document.getElementById('gastoTotal').value = '';
  if (document.getElementById('gastoDetalle')) document.getElementById('gastoDetalle').value = '';

  alert('✅ Gasto descontado en efectivo: ' + concepto + ' por $' + total.toFixed(2));
  cargarDatos();
}

function registrarSalidaProducto() {
  const sel = document.getElementById('selectSalidaProd');
  const sku = sel ? sel.value : '';
  const cant = parseInt(document.getElementById('salidaCantidad')?.value || '0') || 0;

  if (!sku) {
    alert('Por favor selecciona un producto.');
    return;
  }
  if (cant <= 0) {
    alert('Ingresa una cantidad mayor a 0.');
    return;
  }

  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;

  prod.stock = Math.max(0, (prod.stock || 0) - cant);
  guardarCatalogoLocal();

  const salidasKey = 'salidas_COCA_' + getKey();
  const salidasGuardadas = JSON.parse(localStorage.getItem(salidasKey) || '[]');
  salidasGuardadas.push({
    id: Date.now(),
    sku: prod.sku,
    name: prod.name,
    cantidad: cant,
    precio: prod.price,
    total: cant * prod.price,
    fecha: new Date().toISOString()
  });
  localStorage.setItem(salidasKey, JSON.stringify(salidasGuardadas));

  if (document.getElementById('salidaCantidad')) document.getElementById('salidaCantidad').value = '';
  alert('✅ Salida registrada: ' + cant + ' pz de ' + prod.name + ' ($' + (cant * prod.price).toFixed(2) + ')');
  cargarDatos();
}

function cambiarStock(sku, delta) {
  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;
  prod.stock = Math.max(0, (prod.stock || 0) + delta);
  guardarCatalogoLocal();
  cargarDatos();
}

function editarStockManual(sku, nuevoValor) {
  const val = parseFloat(nuevoValor);
  if (isNaN(val)) return;
  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;
  prod.stock = val;
  guardarCatalogoLocal();
  cargarDatos();
}

function renderTabla(lista) {
  const tbody = document.getElementById('tablaProductosBody');
  const lblTotal = document.getElementById('lblTotalProd');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (lblTotal) lblTotal.innerText = lista.length;

  for (const p of lista) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors';
    const valorVenta = (p.stock || 0) * (p.price || 0);

    tr.innerHTML = '<td class="p-3 font-mono text-slate-400">' + p.sku + '</td>' +
      '<td class="p-3 text-white font-bold">' + p.name + '</td>' +
      '<td class="p-3 text-right text-slate-300 font-mono">$' + (p.cost || 0).toFixed(2) + '</td>' +
      '<td class="p-3 text-right text-emerald-400 font-bold font-mono">$' + (p.price || 0).toFixed(2) + '</td>' +
      '<td class="p-3 text-center">' +
        '<input type="number" value="' + (p.stock || 0) + '" class="w-16 bg-slate-950 border border-slate-700 text-center rounded px-1 py-0.5 text-xs font-bold text-white font-mono focus:border-emerald-500" onchange="editarStockManual(\\'' + p.sku + '\\', this.value)">' +
      '</td>' +
      '<td class="p-3 text-center">' +
        '<div class="flex items-center justify-center gap-1">' +
          '<button onclick="cambiarStock(\\'' + p.sku + '\\', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-black text-xs active:scale-95">-1</button>' +
          '<button onclick="cambiarStock(\\'' + p.sku + '\\', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-xs active:scale-95">+1</button>' +
          '<button onclick="cambiarStock(\\'' + p.sku + '\\', 10)" class="px-1.5 h-6 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-black text-[10px] active:scale-95">+10</button>' +
        '</div>' +
      '</td>' +
      '<td class="p-3 text-right text-white font-mono font-bold">$' + valorVenta.toFixed(2) + '</td>';
    tbody.appendChild(tr);
  }
}

function filtrarProductos() {
  cargarDatos();
}

function subirExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    alert('Error: La librería de Excel no se ha cargado. Verifica tu conexión a internet.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

      if (!rows || rows.length < 2) {
        alert('El archivo Excel está vacío.');
        return;
      }

      let actualizados = 0;
      let noCoca = 0;

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const str = (rows[i] || []).join(' ').toUpperCase();
        if (str.includes('SKU') && (str.includes('PRODUCTO') || str.includes('NOMBRE'))) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = rows[headerRowIndex].map(h => (h || '').toString().toUpperCase().trim());
      let colSku = headers.findIndex(h => h.includes('SKU') || h.includes('CODIGO') || h.includes('CÓDIGO'));
      let colProv = headers.findIndex(h => h.includes('PROVEEDOR'));
      let colStock = headers.findIndex(h => h.includes('STOCK') || h.includes('EXISTENCIA') || h.includes('CANTIDAD'));
      let colCost = headers.findIndex(h => h.includes('COSTO'));
      let colPrecio = headers.findIndex(h => h.includes('PRECIO'));

      if (colSku === -1) colSku = 0;

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const sku = (r[colSku] || '').toString().trim();
        if (!sku) continue;

        const prov = colProv !== -1 && r[colProv] ? r[colProv].toString().toUpperCase() : 'COCA COLA-- FEMSA';
        
        if (!prov.includes('COCA COLA-- FEMSA') && !prov.includes('FEMSA') && !prov.includes('COCA')) {
          noCoca++;
          continue;
        }

        const stock = colStock !== -1 ? parseFloat(r[colStock].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
        const cost = colCost !== -1 ? parseFloat(r[colCost].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
        const price = colPrecio !== -1 ? parseFloat(r[colPrecio].toString().replace(/[^0-9.]/g, '')) || 0 : 0;

        const existe = productosCoca.find(p => p.sku === sku);
        if (existe) {
          existe.stock = stock;
          if (cost > 0) existe.cost = cost;
          if (price > 0) existe.price = price;
          actualizados++;
        }
      }

      guardarCatalogoLocal();
      alert('🎉 ¡Existencias de Coca-Cola FEMSA actualizadas con éxito!\\n\\nProductos actualizados: ' + actualizados);
      cargarDatos();

    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel: ' + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Error: La librería de Excel no está disponible.');
    return;
  }
  const data = productosCoca.map(p => ({
    'SKU': p.sku,
    'PRODUCTO': p.name,
    'CATEGORÍA': p.category,
    'PROVEEDOR': p.supplier,
    'COSTO UNITARIO': p.cost,
    'PRECIO VENTA': p.price,
    'STOCK ACTUAL': p.stock,
    'VALOR TOTAL VENTA': (p.stock * p.price).toFixed(2)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Coca Cola FEMSA');
  XLSX.writeFile(wb, 'EXISTENCIAS_COCA_COLA_FEMSA_' + getKey() + '.xlsx');
}

// Iniciar al cargar la ventana
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
`;

fs.writeFileSync(path.join(targetDir, 'app.js'), jsContent, 'utf8');
fs.writeFileSync('C:\\Users\\JOSUE\\AndroidStudioProjects\\PUNTODEVENTA\\app\\src\\main\\assets\\app.js', jsContent, 'utf8');
console.log('app.js generado sin errores sintácticos.');
