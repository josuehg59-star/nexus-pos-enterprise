const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\CONTROL_PROVEEDORES_APP';
const prods = JSON.parse(fs.readFileSync(path.join(targetDir, 'coca_exacto.json'), 'utf8'));

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CONTROL INDEPENDIENTE - COCA COLA FEMSA (COMPRAS, VENTAS, GASTOS Y EFECTIVO)</title>
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
          <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
            PROVEEDOR EXCLUSIVO: COCA COLA-- FEMSA
          </span>
          <span class="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            119 PRODUCTOS OFICIALES EN STOCK
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>CONTROL DE EFECTIVO - COCA COLA FEMSA</span>
        </h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">
          Proveedor Oficial: <strong class="text-red-400 uppercase text-xs">COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)</strong>
        </p>
      </div>

      <!-- SELECTOR DE FECHA, MODO Y ACCIONES -->
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-black">
          <button id="btnModoDia" onclick="setModo('DIA')" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">DÍA</button>
          <button id="btnModoMes" onclick="setModo('MES')" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">MES</button>
        </div>
        <input type="date" id="inputFecha" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onchange="cargarDatos()">
        
        <!-- BOTÓN ACTUALIZAR EXISTENCIAS POR EXCEL -->
        <label class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 transition-all" title="Actualiza únicamente las existencias de Coca Cola FEMSA">
          <span>📥 SUBIR EXISTENCIAS (EXCEL)</span>
          <input type="file" id="fileExcel" accept=".xlsx, .xls, .csv" class="hidden" onchange="subirExcel(event)">
        </label>

        <!-- BOTÓN DESCARGAR EXCEL -->
        <button onclick="exportarExcel()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
          📊 DESCARGAR EXCEL
        </button>
      </div>
    </div>

    <!-- 5 TARJETAS DE FLUJO DE EFECTIVO, GASTOS Y BALANCE -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      
      <!-- 1. VENTAS / SALIDAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div class="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Ventas Coca-Cola</div>
        <div class="text-xl sm:text-2xl font-black text-emerald-400" id="lblVentas">$0.00</div>
        <div class="text-[10px] text-slate-500 font-semibold mt-1" id="lblPzsVendidas">0 pzs vendidas</div>
      </div>

      <!-- 2. COMPRAS PAGADAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div class="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Compras Facturas</div>
        <div class="text-xl sm:text-2xl font-black text-rose-400" id="lblCompras">$0.00</div>
        <div class="text-[10px] text-slate-500 font-semibold mt-1" id="lblPzsCompradas">0 notas pagadas</div>
      </div>

      <!-- 3. OTROS GASTOS EN EFECTIVO -->
      <div class="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-amber-950/20 to-slate-900">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[11px] font-black text-amber-400 uppercase tracking-wider">Otros Gastos Efectivo</span>
          <span class="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-black">RESTA</span>
        </div>
        <div class="text-xl sm:text-2xl font-black text-amber-400" id="lblOtrosGastos">$0.00</div>
        <div class="text-[10px] text-slate-500 font-semibold mt-1" id="lblCantGastos">0 pagos manuales</div>
      </div>

      <!-- 4. EFECTIVO MANUAL EDITABLE -->
      <div class="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br from-blue-950/20 to-slate-900">
        <div class="flex justify-between items-center mb-1">
          <span class="text-[11px] font-black text-blue-400 uppercase tracking-wider">Efectivo Físico en Mano</span>
          <span class="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-black">EDITABLE</span>
        </div>
        <div class="flex items-center gap-1.5 mt-1">
          <span class="text-lg font-black text-blue-400">$</span>
          <input type="number" step="0.01" id="inputEfectivoManual" placeholder="0.00" class="w-full bg-slate-950 border border-blue-500/40 rounded-xl px-2.5 py-1 text-lg font-black text-white focus:outline-none focus:border-blue-400">
        </div>
        <button onclick="guardarEfectivoManual()" class="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95 transition-all">
          💾 Guardar
        </button>
      </div>

      <!-- 5. BALANCE NETO / CUADRE -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden" id="cardBalance">
        <div class="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Balance / Cuadre</div>
        <div class="text-xl sm:text-2xl font-black text-white" id="lblBalance">$0.00</div>
        <div class="text-[10px] font-bold mt-1" id="lblEstadoBalance">Sin diferencia</div>
      </div>
    </div>

    <!-- MÓDULO DE REGISTRO RÁPIDO: COMPRAS, OTROS GASTOS Y SALIDAS -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      <!-- 1. SUBIR COMPRA / NOTA AL PROVEEDOR -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div class="flex justify-between items-center mb-2.5">
          <h2 class="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📥 1. COMPRA A COCA-COLA FEMSA</span>
          </h2>
          <span class="text-[10px] text-slate-400">Resta de caja</span>
        </div>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="compraFolio" placeholder="Folio / No. Factura" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500">
            <input type="number" step="0.01" id="compraTotal" placeholder="Total Pagado ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500">
          </div>
          <input type="text" id="compraNotas" placeholder="Comentarios (ej. 15 rejas Coca 600, 5 garrafones)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500">
          <button onclick="registrarCompraRapida()" class="w-full bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
            + GUARDAR COMPRA PAGADA
          </button>
        </div>
      </div>

      <!-- 2. REGISTRAR OTROS GASTOS EN EFECTIVO (MANUAL) -->
      <div class="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 bg-gradient-to-b from-amber-950/10 to-slate-900">
        <div class="flex justify-between items-center mb-2.5">
          <h2 class="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>💸 2. OTROS GASTOS MANUALES</span>
          </h2>
          <span class="text-[10px] text-amber-300 font-bold">Descuenta de efectivo</span>
        </div>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="gastoConcepto" placeholder="Concepto (ej. Hielo, Pan, Comida)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500">
            <input type="number" step="0.01" id="gastoTotal" placeholder="Monto Pagado ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500">
          </div>
          <input type="text" id="gastoDetalle" placeholder="Detalle (ej. Se pagó a don Pepe)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500">
          <button onclick="registrarOtroGasto()" class="w-full bg-amber-600 hover:bg-amber-500 text-white py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 active:scale-95 transition-all">
            - DESCONTAR OTRO GASTO
          </button>
        </div>
      </div>

      <!-- 3. REGISTRAR SALIDA / VENTA POR PIEZA -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div class="flex justify-between items-center mb-2.5">
          <h2 class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📤 3. VENTA / SALIDA DE PIEZAS</span>
          </h2>
          <span class="text-[10px] text-slate-400">Descuenta del refrigerador</span>
        </div>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <select id="selectSalidaProd" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 truncate">
              <!-- Opciones inyectadas -->
            </select>
            <input type="number" id="salidaCantidad" placeholder="Piezas (ej. 3)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
          </div>
          <button onclick="registrarSalidaProducto()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 transition-all">
            - REGISTRAR SALIDA
          </button>
        </div>
      </div>

    </div>

    <!-- BOTÓN / MODAL AGREGAR PRODUCTO NUEVO DE COCA COLA -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>➕ ¿LLEGÓ UN PRODUCTO NUEVO DE COCA-COLA FEMSA?</span>
          </h3>
          <p class="text-[11px] text-slate-400">Agrégalo directamente aquí para registrarlo en las existencias.</p>
        </div>
        <button onclick="toggleFormNuevoProd()" class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-all">
          <span id="btnNuevoProdTexto">+ AGREGAR PRODUCTO NUEVO</span>
        </button>
      </div>

      <div id="formNuevoProducto" class="mt-3 pt-3 border-t border-slate-800 hidden space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <input type="text" id="nuevoSku" placeholder="SKU / Código de Barras" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500">
          <input type="text" id="nuevoNombre" placeholder="Nombre (ej. Coca 400ml Vidrio)" class="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500">
          <input type="number" step="0.01" id="nuevoCosto" placeholder="Costo Compra ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500">
          <input type="number" step="0.01" id="nuevoPrecio" placeholder="Precio Venta ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500">
          <input type="number" id="nuevoStock" placeholder="Existencias (Stock)" class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:border-blue-500">
        </div>
        <div class="flex justify-end gap-2">
          <button onclick="guardarNuevoProducto()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 transition-all">
            💾 GUARDAR EN LISTA DE COCA COLA
          </button>
        </div>
      </div>
    </div>

    <!-- LISTA DE OTROS GASTOS DEL DÍA -->
    <div id="seccionListaGastos" class="bg-slate-900 border border-slate-800 rounded-2xl p-4 hidden">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xs font-black text-amber-400 uppercase tracking-wider">Historial de Otros Gastos Pagados en Efectivo (Hoy)</h3>
        <span class="text-xs text-slate-400 font-mono" id="lblSumaGastosHeader">$0.00</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-[10px] font-black uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th class="p-2">HORA</th>
              <th class="p-2">CONCEPTO</th>
              <th class="p-2">DETALLE / NOTAS</th>
              <th class="p-2 text-right">MONTO DESCONTADO</th>
              <th class="p-2 text-center">BORRAR</th>
            </tr>
          </thead>
          <tbody id="tablaGastosBody" class="divide-y divide-slate-800/60 font-semibold"></tbody>
        </table>
      </div>
    </div>

    <!-- TABLA EXCLUSIVA DE COCA COLA FEMSA -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>CATÁLOGO EXCLUSIVO: COCA COLA-- FEMSA</span>
            <span class="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold" id="lblTotalProd">119</span>
          </h2>
          <p class="text-xs text-slate-400 font-semibold">Existencias en refrigerador y almacén (Modifica directo o con los botones + / -)</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input type="text" id="inputBuscador" placeholder="🔍 Buscar producto Coca-Cola..." class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onkeyup="filtrarProductos()">
        </div>
      </div>

      <div class="overflow-x-auto max-h-[550px] custom-scrollbar">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/90 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800 z-10">
            <tr>
              <th class="p-3">SKU</th>
              <th class="p-3">PRODUCTO</th>
              <th class="p-3 text-right">COSTO</th>
              <th class="p-3 text-right">PRECIO</th>
              <th class="p-3 text-center">STOCK ACTUAL (EDITABLE)</th>
              <th class="p-3 text-center">ACCIONES RÁPIDAS</th>
              <th class="p-3 text-right">VALOR VENTA</th>
            </tr>
          </thead>
          <tbody id="tablaProductosBody" class="divide-y divide-slate-800/60 font-semibold">
            <!-- Filas inyectadas -->
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
    // 🌟 CATÁLOGO ESTRICTO DE 119 PRODUCTOS DE COCA COLA FEMSA
    const catalogoCocaOriginal = ` + JSON.stringify(prods) + `;
    let productosCoca = [];
    let modo = 'DIA';

    document.getElementById('inputFecha').value = new Date().toISOString().split('T')[0];

    function inicializar() {
      // 1. Cargar existencias guardadas de Coca Cola
      const localStock = localStorage.getItem('control_coca_femsa_stock');
      if (localStock) {
        try {
          const parsed = JSON.parse(localStock);
          if (Array.isArray(parsed) && parsed.length > 0) {
            productosCoca = parsed;
          }
        } catch(e) {}
      }

      // Si no hay o está vacío, iniciar con los 119 productos originales
      if (!productosCoca || productosCoca.length === 0) {
        productosCoca = [...catalogoCocaOriginal];
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
      if (f.classList.contains('hidden')) {
        f.classList.remove('hidden');
        btn.innerText = '✕ CERRAR FORMULARIO';
      } else {
        f.classList.add('hidden');
        btn.innerText = '+ AGREGAR PRODUCTO NUEVO';
      }
    }

    function guardarNuevoProducto() {
      const sku = document.getElementById('nuevoSku').value.trim();
      const name = document.getElementById('nuevoNombre').value.trim();
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
      document.getElementById('btnModoDia').className = m === 'DIA' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
      document.getElementById('btnModoMes').className = m === 'MES' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
      cargarEfectivoGuardado();
      cargarDatos();
    }

    function getKey() {
      const fecha = document.getElementById('inputFecha').value;
      return modo === 'DIA' ? fecha : fecha.slice(0, 7);
    }

    function cargarEfectivoGuardado() {
      const key = 'efectivo_COCA_' + getKey();
      const guardado = localStorage.getItem(key) || '';
      document.getElementById('inputEfectivoManual').value = guardado;
    }

    function guardarEfectivoManual() {
      const key = 'efectivo_COCA_' + getKey();
      const valor = document.getElementById('inputEfectivoManual').value;
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

      // 1. Leer compras guardadas
      const comprasKey = 'compras_COCA_' + getKey();
      const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
      for (const c of comprasGuardadas) {
        totalCompras += parseFloat(c.total) || 0;
      }

      // 2. Leer salidas / ventas guardadas
      const salidasKey = 'salidas_COCA_' + getKey();
      const salidasGuardadas = JSON.parse(localStorage.getItem(salidasKey) || '[]');
      for (const s of salidasGuardadas) {
        totalVentas += parseFloat(s.total) || 0;
        pzsVendidas += parseInt(s.cantidad) || 0;
      }

      // 3. Leer otros gastos en efectivo guardados
      const gastosKey = 'otros_gastos_' + getKey();
      const gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
      for (const g of gastosGuardados) {
        totalOtrosGastos += parseFloat(g.total) || 0;
      }

      document.getElementById('lblVentas').innerText = '$' + totalVentas.toFixed(2);
      document.getElementById('lblPzsVendidas').innerText = pzsVendidas + ' piezas vendidas';
      document.getElementById('lblCompras').innerText = '$' + totalCompras.toFixed(2);
      document.getElementById('lblPzsCompradas').innerText = comprasGuardadas.length + ' notas pagadas';
      
      document.getElementById('lblOtrosGastos').innerText = '$' + totalOtrosGastos.toFixed(2);
      document.getElementById('lblCantGastos').innerText = gastosGuardados.length + ' pagos manuales';

      calcularBalance(totalVentas, totalCompras, totalOtrosGastos);
      renderTablaGastos(gastosGuardados);
      actualizarSelectSalidas(productosCoca);

      const q = (document.getElementById('inputBuscador').value || '').toLowerCase().trim();
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
      tbody.innerHTML = '';

      if (lista.length === 0) {
        seccion.classList.add('hidden');
        return;
      }
      seccion.classList.remove('hidden');

      let suma = 0;
      for (const g of lista) {
        suma += parseFloat(g.total) || 0;
        const tr = document.createElement('tr');
        const hora = (g.fecha || '').slice(11, 16) || '--:--';
        tr.innerHTML = \`
          <td class="p-2 text-slate-400 font-mono">\${hora}</td>
          <td class="p-2 text-white font-bold uppercase">\${g.concepto}</td>
          <td class="p-2 text-slate-300">\${g.detalle || '-'}</td>
          <td class="p-2 text-right text-amber-400 font-bold font-mono">-$\${parseFloat(g.total).toFixed(2)}</td>
          <td class="p-2 text-center">
            <button onclick="borrarGasto(\${g.id})" class="text-rose-400 hover:text-rose-300 font-bold text-xs">✕</button>
          </td>
        \`;
        tbody.appendChild(tr);
      }
      document.getElementById('lblSumaGastosHeader').innerText = 'Total descontado: $' + suma.toFixed(2);
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
      sel.innerHTML = '<option value="">-- Elige producto para salida --</option>';
      for (const p of lista) {
        const opt = document.createElement('option');
        opt.value = p.sku;
        opt.text = p.name + ' ($' + p.price + ' | Stock: ' + p.stock + ')';
        sel.appendChild(opt);
      }
    }

    function calcularBalance(ventas, compras, otrosGastos) {
      const v = typeof ventas === 'number' ? ventas : parseFloat(document.getElementById('lblVentas').innerText.replace(/[^0-9.]/g, '')) || 0;
      const c = typeof compras === 'number' ? compras : parseFloat(document.getElementById('lblCompras').innerText.replace(/[^0-9.]/g, '')) || 0;
      const g = typeof otrosGastos === 'number' ? otrosGastos : parseFloat(document.getElementById('lblOtrosGastos').innerText.replace(/[^0-9.]/g, '')) || 0;
      const efManual = parseFloat(document.getElementById('inputEfectivoManual').value) || 0;

      // Balance = Efectivo Manual - (Ventas - Compras - Otros Gastos)
      const dineroTeorico = v - c - g;
      const balance = efManual - dineroTeorico;

      const lblBal = document.getElementById('lblBalance');
      const lblEst = document.getElementById('lblEstadoBalance');

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
      const folio = document.getElementById('compraFolio').value.trim() || 'COMPRA-' + Date.now().toString().slice(-4);
      const total = parseFloat(document.getElementById('compraTotal').value) || 0;
      const notas = document.getElementById('compraNotas').value.trim();

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

      document.getElementById('compraFolio').value = '';
      document.getElementById('compraTotal').value = '';
      document.getElementById('compraNotas').value = '';

      alert('✅ Compra guardada para Coca-Cola: ' + folio + ' por $' + total.toFixed(2));
      cargarDatos();
    }

    function registrarOtroGasto() {
      const concepto = document.getElementById('gastoConcepto').value.trim();
      const total = parseFloat(document.getElementById('gastoTotal').value) || 0;
      const detalle = document.getElementById('gastoDetalle').value.trim();

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

      document.getElementById('gastoConcepto').value = '';
      document.getElementById('gastoTotal').value = '';
      document.getElementById('gastoDetalle').value = '';

      alert('✅ Gasto descontado en efectivo: ' + concepto + ' por $' + total.toFixed(2));
      cargarDatos();
    }

    function registrarSalidaProducto() {
      const sku = document.getElementById('selectSalidaProd').value;
      const cant = parseInt(document.getElementById('salidaCantidad').value) || 0;

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

      document.getElementById('salidaCantidad').value = '';
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
      tbody.innerHTML = '';
      document.getElementById('lblTotalProd').innerText = lista.length;

      for (const p of lista) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        const valorVenta = (p.stock || 0) * (p.price || 0);

        tr.innerHTML = \`
          <td class="p-3 font-mono text-slate-400">\${p.sku}</td>
          <td class="p-3 text-white font-bold">\${p.name}</td>
          <td class="p-3 text-right text-slate-300 font-mono">$\${(p.cost || 0).toFixed(2)}</td>
          <td class="p-3 text-right text-emerald-400 font-bold font-mono">$\${(p.price || 0).toFixed(2)}</td>
          <td class="p-3 text-center">
            <input type="number" value="\${p.stock || 0}" class="w-16 bg-slate-950 border border-slate-700 text-center rounded px-1 py-0.5 text-xs font-bold text-white font-mono focus:border-emerald-500" onchange="editarStockManual('\${p.sku}', this.value)">
          </td>
          <td class="p-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="cambiarStock('\${p.sku}', -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-black text-xs active:scale-95">-1</button>
              <button onclick="cambiarStock('\${p.sku}', 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-xs active:scale-95">+1</button>
              <button onclick="cambiarStock('\${p.sku}', 10)" class="px-1.5 h-6 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-black text-[10px] active:scale-95">+10</button>
            </div>
          </td>
          <td class="p-3 text-right text-white font-mono font-bold">$\${valorVenta.toFixed(2)}</td>
        \`;
        tbody.appendChild(tr);
      }
    }

    function filtrarProductos() {
      cargarDatos();
    }

    // 🌟 SUBIR EXISTENCIAS DESDE EL EXCEL DE COCA-COLA FEMSA
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
            alert('El archivo Excel está vacío.');
            return;
          }

          let actualizados = 0;
          let noCoca = 0;

          // Buscar la fila de encabezados
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
            
            // Validar estrictamente si pertenece al proveedor COCA COLA FEMSA
            if (!prov.includes('COCA COLA-- FEMSA') && !prov.includes('FEMSA') && !prov.includes('COCA')) {
              noCoca++;
              continue; // Ignorar otros proveedores
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
          alert('🎉 ¡Existencias de Coca-Cola FEMSA actualizadas con éxito!\n\nProductos con existencias actualizadas: ' + actualizados + (noCoca > 0 ? '\nIgnorados de otros proveedores: ' + noCoca : ''));
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

    inicializar();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
fs.writeFileSync('C:\\Users\\JOSUE\\AndroidStudioProjects\\PUNTODEVENTA\\app\\src\\main\\assets\\index.html', html, 'utf8');
console.log('App Coca Cola FEMSA 100% Exclusiva y optimizada.');
