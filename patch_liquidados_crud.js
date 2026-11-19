const fs = require('fs');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

// ==========================================
// 1. ACTUALIZAR INDEX.HTML
// ==========================================
let html = fs.readFileSync(targetHtml, 'utf8');

// Añadir botón "🎉 Liquidados" a la barra de filtros si no existe
if (!html.includes('btnFiltro-LIQUIDADOS')) {
  const targetFiltro = '<button onclick="setFiltroEstado(\'TODOS\')" id="btnFiltro-TODOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition">Todos</button>';
  const btnLiquidados = targetFiltro.replace('Todos', 'Ruta Activa') + 
    `\n          <button onclick="setFiltroEstado('LIQUIDADOS')" id="btnFiltro-LIQUIDADOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition">🎉 Liquidados (<span id="countLiquidados">0</span>)</button>`;
  html = html.replace(targetFiltro, btnLiquidados);
}

// Añadir Modal de Modificar / Editar Cliente
const modalEditarHtml = `
  <!-- MODAL: MODIFICAR / EDITAR CLIENTE -->
  <div id="modalEditarCliente" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-sm font-black text-white flex items-center gap-2">
          <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i>
          Modificar Datos del Cliente
        </h3>
        <button onclick="cerrarModalEditarCliente()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="formEditarCliente" onsubmit="guardarModificacionCliente(event)" class="space-y-3">
        <input type="hidden" id="editClienteId">

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo *</label>
          <input type="text" id="editNombre" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Teléfono (WhatsApp)</label>
            <input type="tel" id="editTelefono" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Cuota Diaria ($)</label>
            <input type="number" id="editCuota" min="1" step="1" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Dirección / Negocio</label>
          <textarea id="editDireccion" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Cobrador Asignado</label>
          <select id="editCobrador" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold">
            <!-- Dinámico -->
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">Nombre Aval</label>
            <input type="text" id="editAvalNombre" placeholder="Aval..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-200">
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">Teléfono Aval</label>
            <input type="tel" id="editAvalTelefono" placeholder="Tel..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-200">
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button type="button" onclick="cerrarModalEditarCliente()" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">
            Cancelar
          </button>
          <button type="submit" class="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
`;

if (!html.includes('modalEditarCliente')) {
  html = html.replace('</body>', modalEditarHtml + '\n</body>');
}

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✅ index.html actualizado con filtro Liquidados y modal de edición.');

// ==========================================
// 2. ACTUALIZAR APP.JS
// ==========================================
let js = fs.readFileSync(targetJs, 'utf8');

// Actualizar renderizarClientes para excluir liquidados de la pantalla principal
const oldFilterSection = `  // Actualizar contador de ocultos
  const totalOcultos = appState.clientes.filter(c => c.oculto === true).length;
  const countBadge = document.getElementById('countOcultos');
  if (countBadge) countBadge.textContent = totalOcultos;

  // Filtrar ocultos: si el filtro es OCULTOS, muestra solo ocultos; si no, oculta los que tienen oculto=true
  if (appState.filtroEstado === 'OCULTOS') {
    lista = lista.filter(c => c.oculto === true);
  } else {
    lista = lista.filter(c => !c.oculto);
  }

  // Filtrar por estado
  if (appState.filtroEstado === 'PENDIENTES') {
    lista = lista.filter(c => !c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'COBRADOS') {
    lista = lista.filter(c => c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'ATRASADOS') {
    lista = lista.filter(c => (c.diasAtraso > 0 || c.estatus === 'RETRASADO') && c.saldoPendiente > 0);
  }`;

const newFilterSection = `  // Actualizar contadores
  const totalOcultos = appState.clientes.filter(c => c.oculto === true).length;
  const countOcultosBadge = document.getElementById('countOcultos');
  if (countOcultosBadge) countOcultosBadge.textContent = totalOcultos;

  const totalLiquidados = appState.clientes.filter(c => c.saldoPendiente === 0).length;
  const countLiqBadge = document.getElementById('countLiquidados');
  if (countLiqBadge) countLiqBadge.textContent = totalLiquidados;

  // FILTRADO INTELIGENTE:
  // Si el usuario elige LIQUIDADOS, muestra solo los que ya terminaron de pagar
  if (appState.filtroEstado === 'LIQUIDADOS') {
    lista = lista.filter(c => c.saldoPendiente === 0);
  } else if (appState.filtroEstado === 'OCULTOS') {
    lista = lista.filter(c => c.oculto === true);
  } else {
    // EN LA PANTALLA PRINCIPAL (TODOS, PENDIENTES, COBRADOS, ATRASADOS):
    // ¡YA NO SALEN LOS QUE YA LIQUIDARON NI LOS OCULTOS! Solo préstamos activos en calle
    lista = lista.filter(c => c.saldoPendiente > 0 && !c.oculto);

    if (appState.filtroEstado === 'PENDIENTES') {
      lista = lista.filter(c => !c.pagadoHoy);
    } else if (appState.filtroEstado === 'COBRADOS') {
      lista = lista.filter(c => c.pagadoHoy);
    } else if (appState.filtroEstado === 'ATRASADOS') {
      lista = lista.filter(c => c.diasAtraso > 0 || c.estatus === 'RETRASADO');
    }
  }`;

js = js.replace(oldFilterSection, newFilterSection);

// Modificar la tarjeta de cliente para agregar botones de Modificar, Eliminar y Renovar
const oldActionRow = `<button onclick="abrirModalPagare('\${c.id}')" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition">
              <i data-lucide="scroll-text" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Pagaré</span>
            </button>`;

const newActionRow = `\${estaLiquidado ? \`
            <button onclick="renovarPrestamoCliente('\${c.id}')" class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition shadow-md shadow-emerald-600/30">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              <span>Renovar Crédito</span>
            </button>
          \` : ''}
          <button onclick="abrirModalEditarCliente('\${c.id}')" class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="Modificar datos">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>Editar</span>
          </button>
          <button onclick="abrirModalPagare('\${c.id}')" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition">
            <i data-lucide="scroll-text" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Pagaré</span>
          </button>
          \${appState.rolActivo === 'ADMIN' ? \`
            <button onclick="eliminarClienteAction('\${c.id}')" class="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition" title="Eliminar cliente">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          \` : ''}`;

js = js.replace(oldActionRow, newActionRow);

// Añadir funciones de Editar, Eliminar y Renovar en app.js
const crudFunctions = `
// ==========================================
// EDICIÓN, ELIMINACIÓN Y RENOVACIÓN DE CLIENTES
// ==========================================
function abrirModalEditarCliente(clienteId) {
  const c = appState.clientes.find(cli => cli.id === clienteId);
  if (!c) return;

  document.getElementById('editClienteId').value = c.id;
  document.getElementById('editNombre').value = c.nombre;
  document.getElementById('editTelefono').value = c.telefono;
  document.getElementById('editCuota').value = c.cuotaDiaria;
  document.getElementById('editDireccion').value = c.direccion || '';
  document.getElementById('editAvalNombre').value = c.avalNombre || '';
  document.getElementById('editAvalTelefono').value = c.avalTelefono || '';

  // Llenar select de cobradores
  const selectCob = document.getElementById('editCobrador');
  selectCob.innerHTML = appState.cobradores.map(cob => \`
    <option value="\${cob.id}" \${cob.id === c.cobradorId ? 'selected' : ''}>\${cob.nombre} (\${cob.ruta})</option>
  \`).join('');

  document.getElementById('modalEditarCliente').classList.remove('hidden');
  lucide.createIcons();
}

function cerrarModalEditarCliente() {
  document.getElementById('modalEditarCliente').classList.add('hidden');
}

async function guardarModificacionCliente(e) {
  e.preventDefault();
  const id = document.getElementById('editClienteId').value;
  const cobradorId = document.getElementById('editCobrador').value;
  const cobObj = appState.cobradores.find(cob => cob.id === cobradorId);

  const datos = {
    nombre: document.getElementById('editNombre').value.trim(),
    telefono: document.getElementById('editTelefono').value.trim(),
    cuotaDiaria: Number(document.getElementById('editCuota').value),
    direccion: document.getElementById('editDireccion').value.trim(),
    cobradorId: cobradorId,
    cobradorNombre: cobObj ? cobObj.nombre : 'Cobrador',
    avalNombre: document.getElementById('editAvalNombre').value.trim(),
    avalTelefono: document.getElementById('editAvalTelefono').value.trim()
  };

  try {
    const res = await fetch('/api/clientes/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      cerrarModalEditarCliente();
      alert('✅ Datos del cliente modificados exitosamente.');
      await cargarClientes();
    }
  } catch (err) {
    alert('Error al modificar: ' + err.message);
  }
}

async function eliminarClienteAction(clienteId) {
  const c = appState.clientes.find(cli => cli.id === clienteId);
  const nombre = c ? c.nombre : clienteId;

  if (!confirm('⚠️ ¿Estás seguro de que deseas ELIMINAR permanentemente a ' + nombre + '? Esta acción no se puede deshacer.')) return;

  try {
    const res = await fetch('/api/clientes/' + clienteId, {
      method: 'DELETE'
    });
    if (res.ok) {
      alert('🗑️ Cliente eliminado de la base de datos.');
      await cargarClientes();
    }
  } catch (e) {
    alert('Error al eliminar: ' + e.message);
  }
}

function renovarPrestamoCliente(clienteId) {
  const c = appState.clientes.find(cli => cli.id === clienteId);
  if (!c) return;

  cambiarTab('nuevo');
  document.getElementById('npNombre').value = c.nombre;
  document.getElementById('npTelefono').value = c.telefono;
  document.getElementById('npDireccion').value = c.direccion;
  document.getElementById('npCobrador').value = c.cobradorId;
  document.getElementById('npAvalNombre').value = c.avalNombre || '';
  document.getElementById('npAvalTelefono').value = c.avalTelefono || '';
  if (c.lat) document.getElementById('npLat').value = c.lat;
  if (c.lng) document.getElementById('npLng').value = c.lng;

  if (c.fotoFachada) {
    appState.fotoFachadaBase64 = c.fotoFachada;
    document.getElementById('previewFotoFachada').src = c.fotoFachada;
    document.getElementById('previewFotoFachadaContenedor').classList.remove('hidden');
  }

  alert('⚡ Datos de ' + c.nombre + ' cargados para renovarle un nuevo crédito.');
}
`;

if (!js.includes('renovarPrestamoCliente')) {
  js += crudFunctions;
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ app.js actualizado: Los liquidados ya no salen en la ruta activa, y se añadieron botones de Modificar, Eliminar y Renovar.');
