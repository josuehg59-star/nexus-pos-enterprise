const fs = require('fs');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

// 1. AÑADIR MODAL DE EDITAR COBRADOR EN INDEX.HTML
let html = fs.readFileSync(targetHtml, 'utf8');

const modalEditarCobradorHtml = `
  <!-- MODAL: MODIFICAR / EDITAR COBRADOR -->
  <div id="modalEditarCobrador" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-sm font-black text-white flex items-center gap-2">
          <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i>
          Modificar Cobrador
        </h3>
        <button onclick="cerrarModalEditarCobrador()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form onsubmit="guardarModificacionCobrador(event)" class="space-y-3">
        <input type="hidden" id="editCobId">

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo *</label>
          <input type="text" id="editCobNombre" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold">
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Teléfono (WhatsApp)</label>
          <input type="tel" id="editCobTelefono" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100">
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Ruta Asignada</label>
          <input type="text" id="editCobRuta" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100">
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Fondo Inicial Diario ($)</label>
          <input type="number" id="editCobFondo" min="0" step="1" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold">
        </div>

        <div class="flex items-center justify-between pt-1">
          <label class="text-xs text-slate-300 font-semibold">Estado del Cobrador:</label>
          <select id="editCobActivo" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200">
            <option value="true">Activo (En Ruta)</option>
            <option value="false">Inactivo (Descanso)</option>
          </select>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button type="button" onclick="cerrarModalEditarCobrador()" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition">
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

if (!html.includes('modalEditarCobrador')) {
  html = html.replace('</body>', modalEditarCobradorHtml + '\n</body>');
}
fs.writeFileSync(targetHtml, html, 'utf8');

// 2. ACTUALIZAR APP.JS
let js = fs.readFileSync(targetJs, 'utf8');

// Actualizar renderizarListaCobradores para incluir botones Editar y Eliminar
const oldCobradorActions = `<div class="flex items-center gap-2 pt-1">
          <a href="https://wa.me/\${cob.telefono}" target="_blank" class="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
            <span>WhatsApp</span>
          </a>
          <button onclick="enviarEnlacePersonalizadoCobrador('\${cob.id}')" class="py-1.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1 transition" title="Enviar enlace de celular">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Enviar Enlace</span>
          </button>
          <button onclick="seleccionarCobradorEnMapa('\${cob.id}')" class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Ver GPS</span>
          </button>
        </div>`;

const newCobradorActions = `<div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
          <a href="https://wa.me/\${cob.telefono}" target="_blank" class="py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="WhatsApp">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
          </a>
          <button onclick="enviarEnlacePersonalizadoCobrador('\${cob.id}')" class="py-1.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="Enviar enlace directo al celular">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Enlace</span>
          </button>
          <button onclick="abrirModalEditarCobrador('\${cob.id}')" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition" title="Modificar datos del cobrador">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>Editar</span>
          </button>
          <button onclick="eliminarCobradorAction('\${cob.id}')" class="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl text-[11px] font-bold transition" title="Eliminar cobrador">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>`;

js = js.replace(oldCobradorActions, newCobradorActions);

// Agregar funciones para abrir modal editar cobrador, guardar y eliminar
const cobradorCrudFunctions = `
// ==========================================
// EDICIÓN Y ELIMINACIÓN DE COBRADORES
// ==========================================
function abrirModalEditarCobrador(cobradorId) {
  const cob = appState.cobradores.find(c => c.id === cobradorId);
  if (!cob) return;

  document.getElementById('editCobId').value = cob.id;
  document.getElementById('editCobNombre').value = cob.nombre;
  document.getElementById('editCobTelefono').value = cob.telefono || '';
  document.getElementById('editCobRuta').value = cob.ruta || '';
  document.getElementById('editCobFondo').value = cob.fondoInicial || 1000;
  document.getElementById('editCobActivo').value = cob.activo !== false ? 'true' : 'false';

  document.getElementById('modalEditarCobrador').classList.remove('hidden');
  lucide.createIcons();
}

function cerrarModalEditarCobrador() {
  document.getElementById('modalEditarCobrador').classList.add('hidden');
}

async function guardarModificacionCobrador(e) {
  e.preventDefault();
  const id = document.getElementById('editCobId').value;
  const datos = {
    nombre: document.getElementById('editCobNombre').value.trim(),
    telefono: document.getElementById('editCobTelefono').value.trim(),
    ruta: document.getElementById('editCobRuta').value.trim(),
    fondoInicial: Number(document.getElementById('editCobFondo').value) || 1000,
    activo: document.getElementById('editCobActivo').value === 'true'
  };

  try {
    const res = await fetch('/api/cobradores/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      cerrarModalEditarCobrador();
      alert('✅ Cobrador modificado exitosamente.');
      await cargarCobradores();
      await cargarClientes();
    }
  } catch (err) {
    alert('Error al modificar cobrador: ' + err.message);
  }
}

async function eliminarCobradorAction(cobradorId) {
  const cob = appState.cobradores.find(c => c.id === cobradorId);
  const nombre = cob ? cob.nombre : cobradorId;

  const clientesAsignados = appState.clientes.filter(c => c.cobradorId === cobradorId && c.saldoPendiente > 0).length;

  let msg = '⚠️ ¿Estás seguro de que deseas ELIMINAR al cobrador ' + nombre + '?';
  if (clientesAsignados > 0) {
    msg += '\\n\\nNota: Este cobrador tiene ' + clientesAsignados + ' clientes asignados activos. Deberás reasignarlos a otro cobrador.';
  }

  if (!confirm(msg)) return;

  try {
    const res = await fetch('/api/cobradores/' + cobradorId, {
      method: 'DELETE'
    });
    if (res.ok) {
      alert('🗑️ Cobrador eliminado correctamente.');
      await cargarCobradores();
      await cargarClientes();
    }
  } catch (e) {
    alert('Error al eliminar cobrador: ' + e.message);
  }
}
`;

if (!js.includes('abrirModalEditarCobrador')) {
  js += cobradorCrudFunctions;
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ Cobradores actualizados con opciones completas de Modificar y Eliminar.');
