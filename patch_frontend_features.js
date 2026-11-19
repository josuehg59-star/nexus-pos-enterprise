const fs = require('fs');
const path = require('path');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

// ==========================================
// 1. ACTUALIZAR INDEX.HTML
// ==========================================
let html = fs.readFileSync(targetHtml, 'utf8');

// Actualizar placeholder de búsqueda
html = html.replace(
  'placeholder="Buscar cliente por nombre, dirección o teléfono..."',
  'placeholder="Buscar por Código (#1001), Nombre, Dirección o Teléfono..."'
);

// Añadir botón de filtro "Ocultos" si no existe
if (!html.includes('btnFiltro-OCULTOS')) {
  const targetFiltro = 'id="btnFiltro-ATRASADOS"';
  const btnOcultos = '<button onclick="setFiltroEstado(\'OCULTOS\')" id="btnFiltro-OCULTOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition">👁️ Ocultos (<span id="countOcultos">0</span>)</button>';
  
  html = html.replace('</button>', '</button>\n          ' + btnOcultos);
}

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✅ index.html actualizado con filtro Ocultos y búsqueda por código.');

// ==========================================
// 2. ACTUALIZAR APP.JS
// ==========================================
let js = fs.readFileSync(targetJs, 'utf8');

// Modificar cambiarPerfilActivo para proteger acceso a ADMIN con PIN
const cambiarPerfilFn = "function cambiarPerfilActivo(nuevoRol) {\n" +
"  const pinConfig = appState.config.pinAdmin || '1234';\n" +
"  if (nuevoRol === 'ADMIN' && appState.rolActivo !== 'ADMIN') {\n" +
"    const pinIngresado = prompt('🔐 Ingresa el PIN Maestro de Administrador:');\n" +
"    if (pinIngresado !== pinConfig) {\n" +
"      alert('❌ PIN Incorrecto. Acceso exclusivo para el Administrador.');\n" +
"      document.getElementById('selectRolActivo').value = appState.rolActivo;\n" +
"      return;\n" +
"    }\n" +
"  }\n\n" +
"  appState.rolActivo = nuevoRol;\n" +
"  const badge = document.getElementById('roleBadge');\n" +
"  const btnGps = document.getElementById('btnGpsCobrador');\n" +
"  const tabCobradores = document.getElementById('tabBtn-cobradores');\n" +
"  const tabConfig = document.getElementById('tabBtn-config');\n\n" +
"  if (nuevoRol === 'ADMIN') {\n" +
"    appState.cobradorActivoObj = null;\n" +
"    badge.textContent = 'ADMIN';\n" +
"    badge.className = 'bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-500/30';\n" +
"    btnGps.classList.add('hidden');\n" +
"    if (tabCobradores) tabCobradores.classList.remove('hidden');\n" +
"    if (tabConfig) tabConfig.classList.remove('hidden');\n" +
"  } else {\n" +
"    appState.cobradorActivoObj = appState.cobradores.find(c => c.id === nuevoRol);\n" +
"    badge.textContent = 'COBRADOR EN RUTA';\n" +
"    badge.className = 'bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-cyan-500/30';\n" +
"    btnGps.classList.remove('hidden');\n" +
"    if (tabCobradores) tabCobradores.classList.add('hidden');\n" +
"    if (tabConfig) tabConfig.classList.add('hidden');\n" +
"  }\n\n" +
"  renderizarClientes();\n" +
"  actualizarKpis();\n" +
"  if (appState.map) actualizarMarcadoresMapa();\n" +
"}";

js = js.replace(/function cambiarPerfilActivo\(nuevoRol\)[\s\S]*?if \(appState\.map\) actualizarMarcadoresMapa\(\);\s*\}/, cambiarPerfilFn);

// Función para alternar ocultar/mostrar cliente
const toggleOcultarFn = "\nasync function toggleOcultarCliente(clienteId) {\n" +
"  try {\n" +
"    const res = await fetch('/api/clientes/' + clienteId + '/toggle-oculto', {\n" +
"      method: 'PATCH'\n" +
"    });\n" +
"    if (res.ok) {\n" +
"      const data = await res.json();\n" +
"      const cli = appState.clientes.find(c => c.id === clienteId);\n" +
"      if (cli) cli.oculto = data.oculto;\n" +
"      alert(data.oculto ? '👁️ Cliente ocultado de la ruta activa.' : '✅ Cliente restaurado y visible en la ruta.');\n" +
"      await cargarClientes();\n" +
"    }\n" +
"  } catch (e) {\n" +
"    alert('Error al cambiar visibilidad: ' + e.message);\n" +
"  }\n" +
"}\n";

if (!js.includes('toggleOcultarCliente')) {
  js += toggleOcultarFn;
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ app.js actualizado con PIN de seguridad y toggle-oculto.');
