const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\CONTROL_PROVEEDORES_APP';
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>NEXUS - CONTROL DE EFECTIVO Y PROVEEDORES</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #0b1120; color: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  </style>
</head>
<body class="p-3 md:p-6 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-5">
    
    <!-- ENCABEZADO -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            SISTEMA INDEPENDIENTE Y SEPARADO
          </span>
          <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
            IMPORTADOR EXCEL EN VIVO
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>CONTROL DE EFECTIVO Y PROVEEDORES</span>
        </h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">
          Proveedor Activo: <strong class="text-emerald-400 uppercase text-sm" id="lblProvActivo">COCA COLA -- FEMSA</strong> | Cuadre de compras vs. ventas y efectivo manual
        </p>
      </div>

      <!-- SELECTOR DE FECHA, MODO Y ACCIONES -->
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-black">
          <button id="btnModoDia" onclick="setModo('DIA')" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">DÍA</button>
          <button id="btnModoMes" onclick="setModo('MES')" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">MES</button>
        </div>
        <input type="date" id="inputFecha" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onchange="cargarDatos()">
        
        <!-- BOTÓN SUBIR EXCEL -->
        <label class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 transition-all">
          <span>📥 SUBIR EXCEL</span>
          <input type="file" id="fileExcel" accept=".xlsx, .xls, .csv" class="hidden" onchange="subirExcel(event)">
        </label>

        <!-- BOTÓN DESCARGAR EXCEL -->
        <button onclick="exportarExcel()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
          📊 DESCARGAR
        </button>
      </div>
    </div>

    <!-- BOTONES DE PROVEEDORES RÁPIDOS -->
    <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-black">
      <button onclick="seleccionarProveedor('COCA COLA')" id="btn_COCA COLA" class="prov-btn px-4 py-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center gap-1.5 whitespace-nowrap">
        🥤 COCA COLA -- FEMSA
      </button>
      <button onclick="seleccionarProveedor('CHEDRAUI')" id="btn_CHEDRAUI" class="prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🛒 CHEDRAUI
      </button>
      <button onclick="seleccionarProveedor('PEÑAFIEL')" id="btn_PEÑAFIEL" class="prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🫧 PEÑAFIEL
      </button>
      <button onclick="seleccionarProveedor('LOCALES')" id="btn_LOCALES" class="prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🏪 PROVEEDORES LOCALES
      </button>
      <button onclick="seleccionarProveedor('SABRITAS')" id="btn_SABRITAS" class="prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🥔 SABRITAS
      </button>
      <button onclick="seleccionarProveedor('BIMBO')" id="btn_BIMBO" class="prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🍞 BIMBO
      </button>
    </div>

    <!-- 4 TARJETAS DE FLUJO DE EFECTIVO Y BALANCE -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. VENTAS COBRADAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
        <div class="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Ventas del Proveedor</div>
        <div class="text-2xl sm:text-3xl font-black text-emerald-400" id="lblVentas">$0.00</div>
        <div class="text-[11px] text-slate-500 font-semibold mt-1" id="lblPzsVendidas">0 pzs vendidas</div>
      </div>

      <!-- 2. COMPRAS PAGADAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
        <div class="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Compras Pagadas</div>
        <div class="text-2xl sm:text-3xl font-black text-rose-400" id="lblCompras">$0.00</div>
        <div class="text-[11px] text-slate-500 font-semibold mt-1" id="lblPzsCompradas">0 notas / facturas</div>
      </div>

      <!-- 3. EFECTIVO MANUAL EDITABLE -->
      <div class="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-blue-950/20 to-slate-900">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-black text-blue-400 uppercase tracking-wider">Efectivo en Mano Físico</span>
          <span class="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-black">EDITABLE DÍA A DÍA</span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xl font-black text-blue-400">$</span>
          <input type="number" step="0.01" id="inputEfectivoManual" placeholder="0.00" class="w-full bg-slate-950 border border-blue-500/40 rounded-xl px-3 py-2 text-xl font-black text-white focus:outline-none focus:border-blue-400">
        </div>
        <button onclick="guardarEfectivoManual()" class="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all">
          💾 Guardar Efectivo
        </button>
      </div>

      <!-- 4. BALANCE NETO / CUADRE -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden" id="cardBalance">
        <div class="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Balance Neto / Cuadre</div>
        <div class="text-2xl sm:text-3xl font-black text-white" id="lblBalance">$0.00</div>
        <div class="text-[11px] font-bold mt-1" id="lblEstadoBalance">Sin diferencia</div>
      </div>
    </div>

    <!-- REGISTRAR COMPRA RÁPIDA O FACTURA -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span>📥 SUBIR COMPRA / NOTA AL PROVEEDOR ACTUAL</span>
        </h2>
        <span class="text-xs text-slate-400">Resta del efectivo y guarda la nota</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="text" id="compraFolio" placeholder="Folio / No. Factura o Nota" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <input type="number" step="0.01" id="compraTotal" placeholder="Monto Pagado ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <input type="text" id="compraNotas" placeholder="Comentarios / Mercancía recibida" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <button onclick="registrarCompraRapida()" class="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
          + REGISTRAR COMPRA
        </button>
      </div>
    </div>

    <!-- TABLA DE PRODUCTOS DEL PROVEEDOR SELECCIONADO -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span id="tituloTabla">PRODUCTOS REGISTRADOS</span>
            <span class="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold" id="lblTotalProd">0</span>
          </h2>
          <p class="text-xs text-slate-400 font-semibold">SKU, Costos, Precios de venta, Stock en almacén y Valor total</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" id="inputBuscador" placeholder="🔍 Buscar por SKU o Nombre..." class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onkeyup="filtrarProductos()">
        </div>
      </div>

      <div class="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-3">SKU / CÓDIGO</th>
              <th class="p-3">PRODUCTO</th>
              <th class="p-3">CATEGORÍA</th>
              <th class="p-3">PROVEEDOR</th>
              <th class="p-3 text-right">COSTO UNIT.</th>
              <th class="p-3 text-right">PRECIO VENTA</th>
              <th class="p-3 text-center">STOCK ACTUAL</th>
              <th class="p-3 text-right">VALOR VENTA TOTAL</th>
            </tr>
          </thead>
          <tbody id="tablaProductosBody" class="divide-y divide-slate-800/60 font-semibold">
            <!-- Filas inyectadas por JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- PIE DE PÁGINA AUTOR -->
    <div class="text-center text-xs text-slate-500 py-4 border-t border-slate-800/60">
      <span class="font-black text-amber-400">JOSUE HERNANDEZ GUTIERREZ</span> | <span class="font-mono">TEL: 9612765041</span>
    </div>

  </div>

  <script>
    let todosLosProductos = [];
    let modo = 'DIA';
    let proveedorActual = 'COCA COLA';

    // Fecha de hoy por defecto
    document.getElementById('inputFecha').value = new Date().toISOString().split('T')[0];

    async function inicializar() {
      // 1. Cargar catálogo guardado en localStorage o desde coca_products.json
      const localStock = localStorage.getItem('control_proveedores_catalogo');
      if (localStock) {
        try {
          todosLosProductos = JSON.parse(localStock);
        } catch(e) {}
      }

      if (!todosLosProductos || todosLosProductos.length === 0) {
        try {
          const res = await fetch('./coca_products.json');
          if (res.ok) {
            todosLosProductos = await res.json();
            // Agregar muestras de Peñafiel por defecto
            todosLosProductos.push(
              { sku: '7501073800908', name: 'PEÑAFIEL AGUA MINERAL 2 LTS', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 26.37, price: 32.00, stock: 3 },
              { sku: '7501073830509', name: 'PEÑAFIEL AGUA MINERAL 600 ML', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 17.00, price: 21.00, stock: 12 },
              { sku: '7501073839892', name: 'PEÑAFIEL LIMONADA /SANGRIA 2 LTS', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 31.50, price: 35.00, stock: 6 },
              { sku: '7501073839861', name: 'PEÑAFIEL NARANJANADA 2 LTS', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 31.50, price: 36.00, stock: 2 },
              { sku: '7501073841949', name: 'PEÑAFIEL PIÑADA 2 LTS', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 31.50, price: 36.00, stock: 4 },
              { sku: '7501073839212', name: 'PEÑAFIEL MINERAL TWIST 1 LT', category: 'Bebidas', supplier: 'PEÑAFIEL', cost: 21.25, price: 24.00, stock: 6 }
            );
            guardarCatalogoLocal();
          }
        } catch (e) {
          console.warn('Error inicial:', e);
        }
      }

      cargarEfectivoGuardado();
      cargarDatos();
    }

    function guardarCatalogoLocal() {
      localStorage.setItem('control_proveedores_catalogo', JSON.stringify(todosLosProductos));
    }

    function setModo(m) {
      modo = m;
      document.getElementById('btnModoDia').className = m === 'DIA' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
      document.getElementById('btnModoMes').className = m === 'MES' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
      cargarEfectivoGuardado();
      cargarDatos();
    }

    function seleccionarProveedor(prov) {
      proveedorActual = prov;
      document.getElementById('lblProvActivo').innerText = prov;
      document.getElementById('tituloTabla').innerText = 'PRODUCTOS DE ' + prov;
      
      // Actualizar estilo botones
      document.querySelectorAll('.prov-btn').forEach(btn => {
        btn.className = 'prov-btn px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap';
      });
      const activeBtn = document.getElementById('btn_' + prov);
      if (activeBtn) {
        activeBtn.className = 'prov-btn px-4 py-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30 whitespace-nowrap';
      }

      cargarEfectivoGuardado();
      cargarDatos();
    }

    function getKey() {
      const fecha = document.getElementById('inputFecha').value;
      return modo === 'DIA' ? fecha : fecha.slice(0, 7);
    }

    function cargarEfectivoGuardado() {
      const key = 'efectivo_' + proveedorActual + '_' + getKey();
      const guardado = localStorage.getItem(key) || '';
      document.getElementById('inputEfectivoManual').value = guardado;
    }

    function guardarEfectivoManual() {
      const key = 'efectivo_' + proveedorActual + '_' + getKey();
      const valor = document.getElementById('inputEfectivoManual').value;
      localStorage.setItem(key, valor);
      alert('✅ Efectivo físico guardado para ' + proveedorActual + ' (' + getKey() + '): $' + (parseFloat(valor) || 0).toFixed(2));
      calcularBalance();
    }

    async function cargarDatos() {
      cargarEfectivoGuardado();
      
      let totalVentas = 0;
      let pzsVendidas = 0;
      let totalCompras = 0;

      // Leer compras registradas para este proveedor y fecha
      const comprasKey = 'compras_' + proveedorActual + '_' + getKey();
      const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
      for (const c of comprasGuardadas) {
        totalCompras += parseFloat(c.total) || 0;
      }

      document.getElementById('lblVentas').innerText = '$' + totalVentas.toFixed(2);
      document.getElementById('lblPzsVendidas').innerText = pzsVendidas + ' piezas vendidas';
      document.getElementById('lblCompras').innerText = '$' + totalCompras.toFixed(2);
      document.getElementById('lblPzsCompradas').innerText = comprasGuardadas.length + ' notas registradas';

      calcularBalance(totalVentas, totalCompras);

      // Filtrar productos del proveedor actual
      const filtradosPorProv = todosLosProductos.filter(p => {
        const s = (p.supplier || '').toUpperCase();
        const n = (p.name || '').toUpperCase();
        if (proveedorActual === 'COCA COLA') return s.includes('COCA') || n.includes('COCA') || n.includes('CIEL');
        if (proveedorActual === 'CHEDRAUI') return s.includes('CHEDRAUI') || n.includes('CHEDRAUI');
        if (proveedorActual === 'PEÑAFIEL') return s.includes('PEÑAFIEL') || s.includes('PENAFIEL') || n.includes('PEÑAFIEL');
        if (proveedorActual === 'LOCALES') return s.includes('LOCAL') || s.includes('MERCADO') || s.includes('TIENDA');
        if (proveedorActual === 'SABRITAS') return s.includes('SABRITAS') || n.includes('SABRITAS') || n.includes('DORITOS');
        if (proveedorActual === 'BIMBO') return s.includes('BIMBO') || n.includes('BIMBO');
        return true;
      });

      renderTabla(filtradosPorProv);
    }

    function calcularBalance(ventas, compras) {
      const v = typeof ventas === 'number' ? ventas : parseFloat(document.getElementById('lblVentas').innerText.replace(/[^0-9.]/g, '')) || 0;
      const c = typeof compras === 'number' ? compras : parseFloat(document.getElementById('lblCompras').innerText.replace(/[^0-9.]/g, '')) || 0;
      const efManual = parseFloat(document.getElementById('inputEfectivoManual').value) || 0;

      // Balance = Efectivo Manual - (Ventas - Compras)
      const balance = efManual - (v - c);
      const lblBal = document.getElementById('lblBalance');
      const lblEst = document.getElementById('lblEstadoBalance');

      lblBal.innerText = (balance >= 0 ? '+$' : '-$') + Math.abs(balance).toFixed(2);
      if (balance > 0.01) {
        lblBal.className = 'text-2xl sm:text-3xl font-black text-emerald-400';
        lblEst.className = 'text-[11px] font-bold mt-1 text-emerald-400';
        lblEst.innerText = 'Sobrante en mano / caja';
      } else if (balance < -0.01) {
        lblBal.className = 'text-2xl sm:text-3xl font-black text-rose-400';
        lblEst.className = 'text-[11px] font-bold mt-1 text-rose-400';
        lblEst.innerText = 'Faltante contra ventas/compras';
      } else {
        lblBal.className = 'text-2xl sm:text-3xl font-black text-white';
        lblEst.className = 'text-[11px] font-bold mt-1 text-slate-400';
        lblEst.innerText = 'Cuadre exacto (0.00)';
      }
    }

    function registrarCompraRapida() {
      const folio = document.getElementById('compraFolio').value.trim() || 'COMPRA-' + Date.now().toString().slice(-4);
      const total = parseFloat(document.getElementById('compraTotal').value) || 0;
      const notas = document.getElementById('compraNotas').value.trim();

      if (total <= 0) {
        alert('Por favor ingresa un monto válido para la compra.');
        return;
      }

      const comprasKey = 'compras_' + proveedorActual + '_' + getKey();
      const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
      comprasGuardadas.push({
        id: Date.now(),
        folio,
        total,
        notas,
        fecha: new Date().toISOString()
      });
      localStorage.setItem(comprasKey, JSON.stringify(comprasGuardadas));

      document.getElementById('compraFolio').value = '';
      document.getElementById('compraTotal').value = '';
      document.getElementById('compraNotas').value = '';

      alert('✅ Compra guardada para ' + proveedorActual + ': ' + folio + ' por $' + total.toFixed(2));
      cargarDatos();
    }

    function renderTabla(lista) {
      const tbody = document.getElementById('tablaProductosBody');
      tbody.innerHTML = '';
      document.getElementById('lblTotalProd').innerText = lista.length;

      for (const p of lista) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        const valorVenta = (p.stock || 0) * (p.price || 0);

        tr.innerHTML = \`
          <td class="p-3 font-mono text-slate-400">\${p.sku}</td>
          <td class="p-3 text-white font-bold">\${p.name}</td>
          <td class="p-3 text-slate-400">\${p.category || 'General'}</td>
          <td class="p-3 text-slate-400">\${p.supplier || proveedorActual}</td>
          <td class="p-3 text-right text-slate-300 font-mono">$\${(p.cost || 0).toFixed(2)}</td>
          <td class="p-3 text-right text-emerald-400 font-bold font-mono">$\${(p.price || 0).toFixed(2)}</td>
          <td class="p-3 text-center"><span class="px-2 py-0.5 rounded bg-slate-800 text-white font-bold font-mono">\${p.stock || 0} pz</span></td>
          <td class="p-3 text-right text-white font-mono font-bold">$\${valorVenta.toFixed(2)}</td>
        \`;
        tbody.appendChild(tr);
      }
    }

    function filtrarProductos() {
      const q = document.getElementById('inputBuscador').value.toLowerCase();
      const filtrados = todosLosProductos.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q)
      );
      renderTabla(filtrados);
    }

    // 🌟 SUBIR INVENTARIO DESDE EXCEL
    function subirExcel(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

          if (!rows || rows.length < 2) {
            alert('El archivo Excel está vacío o no contiene filas de datos.');
            return;
          }

          let agregados = 0;
          let actualizados = 0;
          const headers = rows[0].map(h => (h || '').toString().toUpperCase().trim());

          // Detectar columnas automáticamente
          let colSku = headers.findIndex(h => h.includes('SKU') || h.includes('CODIGO') || h.includes('CÓDIGO') || h.includes('BARCODE'));
          let colNom = headers.findIndex(h => h.includes('PRODUCTO') || h.includes('NOMBRE') || h.includes('DESCRIP') || h.includes('ARTICULO'));
          let colCat = headers.findIndex(h => h.includes('CATEGOR') || h.includes('DEPARTAMENTO'));
          let colProv = headers.findIndex(h => h.includes('PROVEEDOR') || h.includes('MARCA'));
          let colCost = headers.findIndex(h => h.includes('COSTO') || h.includes('COMPRA'));
          let colPrecio = headers.findIndex(h => h.includes('PRECIO') || h.includes('VENTA'));
          let colStock = headers.findIndex(h => h.includes('STOCK') || h.includes('EXISTENCIA') || h.includes('CANTIDAD'));

          if (colSku === -1) colSku = 0;
          if (colNom === -1) colNom = 1;

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;
            const sku = (r[colSku] || '').toString().trim();
            const name = (r[colNom] || '').toString().trim();
            if (!sku || !name) continue;

            const category = colCat !== -1 && r[colCat] ? r[colCat].toString().trim() : 'General';
            const supplier = colProv !== -1 && r[colProv] ? r[colProv].toString().trim() : proveedorActual;
            const cost = colCost !== -1 ? parseFloat(r[colCost].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
            const price = colPrecio !== -1 ? parseFloat(r[colPrecio].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
            const stock = colStock !== -1 ? parseFloat(r[colStock].toString().replace(/[^0-9.]/g, '')) || 0 : 0;

            const existe = todosLosProductos.find(p => p.sku === sku);
            if (existe) {
              existe.name = name;
              if (category) existe.category = category;
              if (supplier) existe.supplier = supplier;
              if (cost > 0) existe.cost = cost;
              if (price > 0) existe.price = price;
              existe.stock = stock;
              actualizados++;
            } else {
              todosLosProductos.push({
                sku,
                name,
                category,
                supplier,
                cost,
                price,
                stock
              });
              agregados++;
            }
          }

          guardarCatalogoLocal();
          alert('🎉 ¡Excel importado con éxito!\n\nNuevos productos: ' + agregados + '\nActualizados: ' + actualizados + '\nTotal en catálogo: ' + todosLosProductos.length);
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
      const data = todosLosProductos.map(p => ({
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
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      XLSX.writeFile(wb, 'INVENTARIO_PROVEEDORES_' + proveedorActual + '_' + getKey() + '.xlsx');
    }

    inicializar();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
console.log('App con Excel, Chedraui, Peñafiel y Locales creada.');
