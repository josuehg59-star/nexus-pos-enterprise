const fs = require('fs');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

let html = fs.readFileSync(targetHtml, 'utf8');
let js = fs.readFileSync(targetJs, 'utf8');

// 1. Añadir Banner de Actualizaciones de GitHub en index.html
const updateBanner = `
  <!-- BANNER AUTO-ACTUALIZACIONES GITHUB -->
  <div id="githubUpdateBanner" class="hidden bg-gradient-to-r from-purple-900 to-indigo-900 border-b border-purple-500/40 px-4 py-2 text-xs flex items-center justify-between text-white sticky top-0 z-50 shadow-lg">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
      <span>🚀 <b>¡Nueva actualización disponible en GitHub!</b> Versión <span id="lblNuevaVersion" class="font-bold underline text-emerald-300"></span> desarrollada por Josue Hernandez.</span>
    </div>
    <div class="flex items-center gap-2">
      <a id="btnDescargarUpdate" href="#" target="_blank" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow transition">Actualizar Ahora</a>
      <button onclick="document.getElementById('githubUpdateBanner').classList.add('hidden')" class="text-slate-300 hover:text-white text-base leading-none">&times;</button>
    </div>
  </div>
`;

if (!html.includes('githubUpdateBanner')) {
  html = html.replace('<header', updateBanner + '\n  <header');
}

// 2. Añadir Sección de Generador Maestro de Seriales en Ajustes
const licPanelHtml = `
      <!-- PANEL MAESTRO DE LICENCIAS Y SERIALES (JOSUE HERNANDEZ) -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/40 p-4 rounded-2xl space-y-3 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <i data-lucide="key" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-white">PANEL MAESTRO DE LICENCIAS Y SERIALES</h3>
              <p class="text-[11px] text-emerald-400 font-semibold">Desarrollador: Josue Hernandez | Tel: 961 276 5041</p>
            </div>
          </div>
          <span id="badgeLicStatus" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">LICENCIA ACTIVA</span>
        </div>

        <!-- Estado actual de la licencia instalada -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span class="text-slate-400 text-[10px]">Rutas Autorizadas:</span>
            <p id="lblLicRutas" class="font-black text-cyan-400">5 Cobradores</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Rutas Disponibles:</span>
            <p id="lblLicDisponibles" class="font-black text-emerald-400">3 Libres</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Vigencia:</span>
            <p id="lblLicVigencia" class="font-black text-amber-400">2027-01-18</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Soporte Oficial:</span>
            <p class="font-black text-white">961 276 5041</p>
          </div>
        </div>

        <!-- Generador de Seriales para Nuevos Clientes -->
        <div class="border-t border-slate-800/80 pt-3">
          <p class="text-xs font-black text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
            Generar Nuevo Serial para Vender (1 a 10+ Colaboradores):
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input type="text" id="genEmpresa" placeholder="Nombre de la Financiera..." class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <select id="genRutas" class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold">
              <option value="1">1 Cobrador / Ruta</option>
              <option value="2">2 Cobradores / Rutas</option>
              <option value="3" selected>3 Cobradores / Rutas</option>
              <option value="5">5 Cobradores / Rutas</option>
              <option value="8">8 Cobradores / Rutas</option>
              <option value="10">10 Cobradores / Rutas</option>
              <option value="20">20 Cobradores / Rutas</option>
            </select>
            <select id="genTipo" class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold">
              <option value="MENSUAL">Mensual (30 Días)</option>
              <option value="BIMESTRAL">Bimestral (60 Días)</option>
              <option value="ANUAL">Anual (365 Días)</option>
              <option value="VITALICIA">Vitalicia (Permanente)</option>
            </select>
            <button onclick="generarSerialMaestroAction()" class="py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-black shadow transition">
              GENERAR SERIAL
            </button>
          </div>

          <!-- Resultado del serial generado -->
          <div id="resultadoSerialBox" class="hidden mt-2.5 p-3 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-bold">Serial Generado:</span>
              <span id="txtSerialGenerado" class="font-mono text-sm font-black text-emerald-400 select-all"></span>
            </div>
            <button onclick="copiarMensajeLicenciaWhatsApp()" class="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Copiar Mensaje Formal con Mis Datos (9612765041) para Enviar al Cliente</span>
            </button>
          </div>
        </div>
      </div>
`;

if (!html.includes('PANEL MAESTRO DE LICENCIAS Y SERIALES')) {
  html = html.replace('<!-- Datos de Empresa -->', licPanelHtml + '\n        <!-- Datos de Empresa -->');
}

// 3. Añadir Footer con Datos de Josue Hernandez
const footerHtml = `
  <!-- FOOTER DESARROLLADOR OFICIAL -->
  <footer class="bg-slate-950 border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-400 space-y-1">
    <p class="font-bold text-slate-200">
      Plataforma de Crédito, Cobranza y Rutas GPS | Creado por <span class="text-emerald-400 font-black">Josue Hernandez</span>
    </p>
    <p class="text-[11px] text-slate-500 flex items-center justify-center gap-2">
      <span>📞 Soporte Técnico y Licencias: <b class="text-slate-300">961 276 5041</b></span>
      <span>•</span>
      <a href="https://wa.me/529612765041" target="_blank" class="text-emerald-400 hover:underline font-bold">WhatsApp Oficial</a>
    </p>
  </footer>
`;

if (!html.includes('FOOTER DESARROLLADOR OFICIAL')) {
  html = html.replace('</body>', footerHtml + '\n</body>');
}

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✅ index.html actualizado con Banner GitHub, Panel de Licencias y Footer de Josue Hernandez.');

// 4. Agregar lógica de Licencias, Offline Sync y GitHub Updater en app.js
const appJsAdditions = `
// ==========================================
// MÓDULO LICENCIAS Y GITHUB UPDATER - JOSUE HERNANDEZ (9612765041)
// ==========================================
async function cargarEstadoLicencia() {
  try {
    const res = await fetch('/api/licencia/status');
    const data = await res.json();
    
    const rutasEl = document.getElementById('lblLicRutas');
    const dispEl = document.getElementById('lblLicDisponibles');
    const vigEl = document.getElementById('lblLicVigencia');

    if (rutasEl) rutasEl.textContent = data.rutasPermitidas + ' Cobradores';
    if (dispEl) dispEl.textContent = data.rutasDisponibles + ' Libres';
    if (vigEl) vigEl.textContent = data.expira;
  } catch (e) {}
}

async function generarSerialMaestroAction() {
  const empresa = document.getElementById('genEmpresa').value.trim();
  const rutas = document.getElementById('genRutas').value;
  const tipo = document.getElementById('genTipo').value;

  if (!empresa) {
    alert('Ingresa el nombre de la financiera del cliente.');
    return;
  }

  try {
    const res = await fetch('/api/licencia/generar-maestro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinDev: '9612', empresa, rutas, tipo, dias: tipo === 'MENSUAL' ? 30 : 365 })
    });
    const data = await res.json();
    if (data.success && data.licencia) {
      document.getElementById('txtSerialGenerado').textContent = data.licencia.serial;
      document.getElementById('resultadoSerialBox').classList.remove('hidden');
      appState.ultimoSerialGenerado = data.licencia;
      alert('✅ ¡Serial generado con éxito!');
    } else {
      alert('Error: ' + (data.error || 'No se pudo generar'));
    }
  } catch (e) {
    alert('Error al generar serial: ' + e.message);
  }
}

function copiarMensajeLicenciaWhatsApp() {
  const lic = appState.ultimoSerialGenerado;
  if (!lic) return;

  const msg = 
    "🏛️ *BIENVENIDO A TU PLATAFORMA FINANCIERA* 🏛️\\n" +
    "Desarrollado por: *Josue Hernandez* (Tel: 961 276 5041)\\n\\n" +
    "Tu licencia oficial de activación ha sido autorizada:\\n" +
    "-----------------------------------------\\n" +
    "🏢 *Financiera:* " + lic.empresa + "\\n" +
    "🔑 *Serial de Activación:* " + lic.serial + "\\n" +
    "🛵 *Rutas / Motos Contratadas:* " + lic.rutasPermitidas + " Cobradores\\n" +
    "📅 *Vigencia:* " + lic.expira + "\\n" +
    "-----------------------------------------\\n" +
    "📲 *Soporte y Renovaciones Directas:*\\n" +
    "Josue Hernandez - WhatsApp: 961 276 5041";

  navigator.clipboard.writeText(msg);
  alert('📋 Mensaje copiado con tus datos listo para enviar por WhatsApp.');
}

// ==========================================
// VERIFICADOR DE AUTO-ACTUALIZACIÓN GITHUB
// ==========================================
async function verificarActualizacionesGitHub() {
  try {
    const repo = "josuehg59-star/cobranza-financiera";
    const res = await fetch('https://api.github.com/repos/' + repo + '/releases/latest');
    if (!res.ok) return;
    const release = await res.json();
    const versionGitHub = release.tag_name || release.name;

    // Si hay versión nueva diferente a la 1.0.0 instalada
    if (versionGitHub && versionGitHub !== 'v1.0.0' && versionGitHub !== '1.0.0') {
      const banner = document.getElementById('githubUpdateBanner');
      const lbl = document.getElementById('lblNuevaVersion');
      const btn = document.getElementById('btnDescargarUpdate');

      if (banner && lbl && btn) {
        lbl.textContent = versionGitHub;
        btn.href = release.html_url;
        banner.classList.remove('hidden');
      }
    }
  } catch (e) {
    // Silencioso si no hay internet o no hay release
  }
}

// ==========================================
// MODO OFFLINE (COBRAR SIN DATOS / INTERNET)
// ==========================================
function guardarCobroOfflineLocal(cobroData) {
  let offline = JSON.parse(localStorage.getItem('nexus_cobros_offline') || '[]');
  offline.push(cobroData);
  localStorage.setItem('nexus_cobros_offline', JSON.stringify(offline));
}

async function sincronizarCobrosOffline() {
  if (!navigator.onLine) return;
  const offline = JSON.parse(localStorage.getItem('nexus_cobros_offline') || '[]');
  if (offline.length === 0) return;

  try {
    const res = await fetch('/api/cobros/batch-offline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobrosOffline: offline })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.removeItem('nexus_cobros_offline');
      console.log('✅ Cobros offline sincronizados con el Administrador:', data.procesados);
      await cargarClientes(true);
    }
  } catch (e) {}
}

window.addEventListener('online', sincronizarCobrosOffline);
setInterval(sincronizarCobrosOffline, 15000);
`;

if (!js.includes('cargarEstadoLicencia')) {
  js += appJsAdditions;
  js = js.replace("inicializarMapa();", "inicializarMapa();\n  cargarEstadoLicencia();\n  verificarActualizacionesGitHub();\n  sincronizarCobrosOffline();");
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ app.js actualizado con soporte Offline, Verificador GitHub y Licencias.');
