const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\CONTROL_PROVEEDORES_APP';
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CONTROL INDEPENDIENTE - COCA COLA Y EFECTIVO</title>
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
            APP INDEPENDIENTE (SEPARADA DE CAJA)
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            MODO AUDITORÍA Y FLUJO DE EFECTIVO
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <span>CONTROL DE EFECTIVO Y COMPRAS (COCA-COLA)</span>
        </h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">
          Cuadre de dinero en mano vs. compras y ventas de <strong class="text-emerald-400">COCA COLA -- FEMSA</strong>
        </p>
      </div>

      <!-- SELECTOR DE FECHA Y MODO -->
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-black">
          <button id="btnModoDia" onclick="setModo('DIA')" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">DÍA</button>
          <button id="btnModoMes" onclick="setModo('MES')" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white">MES</button>
        </div>
        <input type="date" id="inputFecha" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onchange="cargarDatos()">
        <button onclick="exportarExcel()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg shadow-emerald-600/20">
          📊 EXCEL
        </button>
      </div>
    </div>

    <!-- BOTONES DE PROVEEDORES RÁPIDOS -->
    <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-black">
      <button onclick="seleccionarProveedor('COCA COLA')" id="btnProvCoca" class="px-4 py-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30 flex items-center gap-1.5 whitespace-nowrap">
        🥤 COCA COLA -- FEMSA
      </button>
      <button onclick="seleccionarProveedor('SABRITAS')" id="btnProvSabritas" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🥔 SABRITAS
      </button>
      <button onclick="seleccionarProveedor('BIMBO')" id="btnProvBimbo" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🍞 BIMBO
      </button>
      <button onclick="seleccionarProveedor('BARCEL')" id="btnProvBarcel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🌶️ BARCEL
      </button>
      <button onclick="seleccionarProveedor('PEPSI')" id="btnProvPepsi" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap">
        🔵 PEPSI
      </button>
    </div>

    <!-- 4 TARJETAS DE FLUJO DE EFECTIVO Y BALANCE -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. VENTAS COBRADAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
        <div class="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Ventas Cobradas (Efectivo)</div>
        <div class="text-2xl sm:text-3xl font-black text-emerald-400" id="lblVentas">$0.00</div>
        <div class="text-[11px] text-slate-500 font-semibold mt-1" id="lblPzsVendidas">0 pzs vendidas</div>
      </div>

      <!-- 2. COMPRAS PAGADAS -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
        <div class="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Compras Pagadas al Proveedor</div>
        <div class="text-2xl sm:text-3xl font-black text-rose-400" id="lblCompras">$0.00</div>
        <div class="text-[11px] text-slate-500 font-semibold mt-1" id="lblPzsCompradas">0 notas / facturas</div>
      </div>

      <!-- 3. EFECTIVO MANUAL EDITABLE -->
      <div class="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-blue-950/20 to-slate-900">
        <div class="flex justify-between items-center mb-1">
          <span class="text-xs font-black text-blue-400 uppercase tracking-wider">Efectivo Físico en Mano</span>
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

    <!-- REGISTRAR COMPRA RÁPIDA (PARA SUBIR LAS COMPRAS DE COCA) -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span>📥 SUBIR COMPRA O FACTURA DE COCA-COLA</span>
        </h2>
        <span class="text-xs text-slate-400">Se resta del balance de efectivo y se guarda por fecha</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="text" id="compraFolio" placeholder="Folio / No. Factura o Nota" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <input type="number" step="0.01" id="compraTotal" placeholder="Monto Total Pagado ($)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <input type="text" id="compraNotas" placeholder="Comentarios (ej. 5 rejas de Coca 600, etc.)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
        <button onclick="registrarCompraRapida()" class="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/30 active:scale-95 transition-all">
          + REGISTRAR COMPRA
        </button>
      </div>
    </div>

    <!-- TABLA DE PRODUCTOS DE COCA COLA -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span id="tituloTabla">CATÁLOGO DE PRODUCTOS COCA COLA -- FEMSA</span>
            <span class="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold" id="lblTotalProd">119</span>
          </h2>
          <p class="text-xs text-slate-400 font-semibold">Costos unitarios, Precios de venta al público y Existencias en tienda</p>
        </div>
        <input type="text" id="inputBuscador" placeholder="🔍 Buscar por SKU o Nombre..." class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500" onkeyup="filtrarProductos()">
      </div>

      <div class="overflow-x-auto max-h-[500px] custom-scrollbar">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 sticky top-0 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th class="p-3">SKU / CÓDIGO</th>
              <th class="p-3">PRODUCTO</th>
              <th class="p-3">CATEGORÍA</th>
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
    let productos = [];
    let modo = 'DIA';
    let proveedorActual = 'COCA COLA';

    // Fecha de hoy por defecto
    document.getElementById('inputFecha').value = new Date().toISOString().split('T')[0];

    async function inicializar() {
      try {
        const res = await fetch('./coca_products.json');
        if (res.ok) {
          productos = await res.json();
        }
      } catch (e) {
        console.warn('Error cargando json:', e);
      }

      cargarEfectivoGuardado();
      cargarDatos();
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
      const btns = ['COCA COLA', 'SABRITAS', 'BIMBO', 'BARCEL', 'PEPSI'];
      document.getElementById('tituloTabla').innerText = 'CATÁLOGO DE PRODUCTOS ' + prov;
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
      alert('✅ Efectivo manual guardado exitosamente para el ' + getKey() + ': $' + (parseFloat(valor) || 0).toFixed(2));
      calcularBalance();
    }

    async function cargarDatos() {
      cargarEfectivoGuardado();
      
      let totalVentas = 0;
      let pzsVendidas = 0;
      let totalCompras = 0;

      // Leer compras guardadas locales de esta app
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
      renderTabla(productos);
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

      alert('✅ Compra registrada exitosamente: ' + folio + ' por $' + total.toFixed(2));
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
          <td class="p-3 text-slate-400">\${p.category || 'Bebidas'}</td>
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
      const filtrados = productos.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q)
      );
      renderTabla(filtrados);
    }

    function exportarExcel() {
      const data = productos.map(p => ({
        'SKU': p.sku,
        'PRODUCTO': p.name,
        'CATEGORÍA': p.category,
        'PROVEEDOR': p.supplier,
        'COSTO UNITARIO': p.cost,
        'PRECIO VENTA': p.price,
        'STOCK ACTUAL': p.stock,
        'VALOR VENTA TOTAL': (p.stock * p.price).toFixed(2)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Coca Cola');
      XLSX.writeFile(wb, 'CONTROL_COCA_COLA_' + getKey() + '.xlsx');
    }

    inicializar();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
console.log('index.html creado exitosamente');
