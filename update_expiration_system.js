const fs = require('fs');

const serverFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\server.js';
const htmlFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const appJsFile = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

// 1. ACTUALIZAR SERVER.JS
let serverCode = fs.readFileSync(serverFile, 'utf8');

// Asegurar importación de evaluarEstadoLicencia
serverCode = serverCode.replace(
  "const { MASTER_DEV, generarSerialLicencia, validarSerialLicencia } = require('./licencias');",
  "const { MASTER_DEV, generarSerialLicencia, validarSerialLicencia, evaluarEstadoLicencia } = require('./licencias');"
);

// Actualizar /api/licencia/status
const oldStatusRegex = /app\.get\('\/api\/licencia\/status'[\s\S]*?repoGitHub: "josuehg59-star\/cobranza-financiera"\s*\}\);\s*\}\);/;
const newStatusRoute = `app.get('/api/licencia/status', (req, res) => {
  const db = readDB();
  const evaluacion = evaluarEstadoLicencia(db);
  writeDB(db);

  res.json({
    ...evaluacion,
    cobradoresActuales: (db.cobradores || []).length,
    rutasDisponibles: Math.max(0, (evaluacion.rutasPermitidas || 2) - (db.cobradores || []).length),
    versionActual: "1.0.0",
    repoGitHub: "josuehg59-star/cobranza-financiera"
  });
});`;

serverCode = serverCode.replace(oldStatusRegex, newStatusRoute);
fs.writeFileSync(serverFile, serverCode, 'utf8');
console.log('✅ server.js actualizado con chequeo de vigencia y modo prueba 7 días.');

// 2. ACTUALIZAR INDEX.HTML (PANTALLA DE BLOQUEO POR VENCIMIENTO + BANNER DE PRUEBA)
let htmlCode = fs.readFileSync(htmlFile, 'utf8');

const lockModalHtml = `
  <!-- OVERLAY DE BLOQUEO POR VENCIMIENTO / PERIODO DE PRUEBA -->
  <div id="modalBloqueoLicencia" class="hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-slate-900 border-2 border-red-500 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-center">
      <div class="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40">
        <i data-lucide="lock" class="w-8 h-8"></i>
      </div>
      <div>
        <h2 id="lblTituloBloqueo" class="text-xl font-black text-white uppercase tracking-wide">PERIODO DE PRUEBA FINALIZADO</h2>
        <p id="lblMensajeBloqueo" class="text-xs text-slate-400 mt-2 leading-relaxed">
          Para continuar usando el sistema y desbloquear tus cobranzas, activa tu licencia oficial con el desarrollador.
        </p>
      </div>

      <!-- Datos del Creador: Josue Hernandez -->
      <div class="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-xs space-y-1">
        <p class="text-slate-400">Desarrollador Oficial:</p>
        <p class="text-base font-black text-emerald-400">Josue Hernandez</p>
        <p class="text-xs text-slate-300">Teléfono Directo: <b>961 276 5041</b></p>
      </div>

      <a id="btnContactarWhatsAppBloqueo" href="https://wa.me/529612765041?text=Hola%20Josue%20Hernandez,%20mi%20periodo%20de%20prueba/licencia%20ha%20vencido%20y%20deseo%20activar%20mi%20servicio." target="_blank" class="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition">
        <i data-lucide="message-circle" class="w-5 h-5"></i>
        <span>CONTACTAR POR WHATSAPP A JOSUE HERNANDEZ</span>
      </a>

      <!-- Casilla para ingresar Serial y Desbloquear -->
      <div class="border-t border-slate-800 pt-3 space-y-2">
        <p class="text-[11px] text-slate-400 font-bold">¿Ya compraste tu serial? Ingrésalo aquí para desbloquear:</p>
        <div class="flex gap-2">
          <input type="text" id="inputSerialDesbloqueo" placeholder="Pegar Serial NEXUS-JH-..." class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400">
          <button onclick="desbloquearConSerialInput()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
            Desbloquear
          </button>
        </div>
      </div>
    </div>
  </div>
`;

if (!htmlCode.includes('modalBloqueoLicencia')) {
  htmlCode = htmlCode.replace('</body>', lockModalHtml + '\n</body>');
}

fs.writeFileSync(htmlFile, htmlCode, 'utf8');
console.log('✅ index.html actualizado con Modal de Bloqueo por Caducidad.');

// 3. ACTUALIZAR APP.JS
let jsCode = fs.readFileSync(appJsFile, 'utf8');

const updateAppJsLic = `
// ==========================================
// MONITOR DE VIGENCIA Y BLOQUEO POR CADUCIDAD
// ==========================================
async function cargarEstadoLicencia() {
  try {
    const res = await fetch('/api/licencia/status');
    const data = await res.json();
    appState.licencia = data;

    const badge = document.getElementById('badgeLicStatus');
    const rutasEl = document.getElementById('lblLicRutas');
    const dispEl = document.getElementById('lblLicDisponibles');
    const vigEl = document.getElementById('lblLicVigencia');

    if (rutasEl) rutasEl.textContent = data.rutasPermitidas + ' Cobradores';
    if (dispEl) dispEl.textContent = data.rutasDisponibles + ' Libres';
    if (vigEl) {
      vigEl.innerHTML = \`\${data.fechaLegible || data.expira} <span class="text-[10px] text-slate-400">(\${data.diasRestantes} días)</span>\`;
    }

    if (badge) {
      if (data.estado === 'ACTIVA') {
        badge.className = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase';
        badge.textContent = 'LICENCIA ACTIVA (' + data.diasRestantes + ' DÍAS)';
      } else if (data.estado === 'MODO_PRUEBA') {
        badge.className = 'bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase';
        badge.textContent = 'PRUEBA GRATIS (' + data.diasRestantes + ' DÍAS RESTANTES)';
      } else {
        badge.className = 'bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase';
        badge.textContent = 'BLOQUEADA / VENCIDA';
      }
    }

    // SI ESTÁ BLOQUEADA POR CADUCIDAD O FIN DE PRUEBA: MOSTRAR BLOQUEO TOTAL
    const modalBloqueo = document.getElementById('modalBloqueoLicencia');
    if (data.estado === 'BLOQUEADA_PRUEBA_VENCIDA' || data.estado === 'BLOQUEADA_VENCIDA' || data.estado === 'BLOQUEADA_INVALIDA') {
      if (modalBloqueo) {
        document.getElementById('lblTituloBloqueo').textContent = data.estado === 'BLOQUEADA_PRUEBA_VENCIDA' ? 'PERIODO DE PRUEBA FINALIZADO' : 'MENSUALIDAD / LICENCIA VENCIDA';
        document.getElementById('lblMensajeBloqueo').textContent = data.mensajeBloqueo || 'Tu servicio ha caducado. Para continuar operando comunícate con Josue Hernandez.';
        modalBloqueo.classList.remove('hidden');
        lucide.createIcons();
      }
    } else {
      if (modalBloqueo) modalBloqueo.classList.add('hidden');
    }

  } catch (e) {}
}

async function desbloquearConSerialInput() {
  const serial = document.getElementById('inputSerialDesbloqueo').value.trim();
  if (!serial) {
    alert('Ingresa el serial de activación.');
    return;
  }

  try {
    const res = await fetch('/api/licencia/activar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('🎉 ¡Licencia activada con éxito! ' + (data.message || ''));
      location.reload();
    } else {
      alert('❌ Error: ' + (data.error || 'Serial inválido o expirado.'));
    }
  } catch (e) {
    alert('Error al desbloquear: ' + e.message);
  }
}
`;

jsCode = jsCode.replace(/async function cargarEstadoLicencia\(\)[\s\S]*?if \(vigEl\) vigEl\.textContent = data\.expira;\s*\}\s*catch \(e\) \{\}\s*\}/, updateAppJsLic);

fs.writeFileSync(appJsFile, jsCode, 'utf8');
console.log('✅ app.js actualizado con chequeo de expiración y desbloqueo.');
