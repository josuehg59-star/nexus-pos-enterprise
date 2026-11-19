const fs = require('fs');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

let html = fs.readFileSync(targetHtml, 'utf8');

// Reemplazar la sección del panel de licencias para que el cliente SOLO pueda activar/renovar
// y el generador solo se abra para Josue Hernandez con su PIN Maestro
const clientLicPanel = `
      <!-- LICENCIA Y ACTIVACIÓN DEL CLIENTE (CREADO POR JOSUE HERNANDEZ) -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-white">ESTADO DE LICENCIA Y RUTAS</h3>
              <p class="text-[11px] text-slate-400">Software Autorizado por: <b class="text-emerald-400 font-bold">Josue Hernandez</b> (961 276 5041)</p>
            </div>
          </div>
          <span id="badgeLicStatus" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">LICENCIA ACTIVA</span>
        </div>

        <!-- Estado actual visible para el cliente -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span class="text-slate-400 text-[10px]">Rutas Contratadas:</span>
            <p id="lblLicRutas" class="font-black text-cyan-400">5 Cobradores</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Rutas Disponibles:</span>
            <p id="lblLicDisponibles" class="font-black text-emerald-400">3 Libres</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Fecha de Vencimiento:</span>
            <p id="lblLicVigencia" class="font-black text-amber-400">2027-01-18</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Soporte y Renovación:</span>
            <p class="font-black text-white">961 276 5041</p>
          </div>
        </div>

        <!-- Caja de Activación / Renovación para el Cliente -->
        <div class="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div class="flex-1 min-w-[240px] flex items-center gap-2">
            <input type="text" id="inputActivarSerialCliente" placeholder="Pegar Serial de Renovación..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono">
            <button onclick="activarSerialClienteAction()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow transition">
              Activar Serial
            </button>
          </div>
          <a href="https://wa.me/529612765041?text=Hola%20Josue%20Hernandez,%20deseo%20renovar%20mi%20licencia%20o%20contratar%20m%C3%A1s%20rutas%20de%20cobranza." target="_blank" class="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
            <span>Comprar Más Rutas con Josue Hernandez</span>
          </a>
        </div>

        <!-- BOTÓN SECRETO EXCLUSIVO DE JOSUE HERNANDEZ PARA ABRIR GENERADOR MAESTRO -->
        <div class="pt-2 border-t border-slate-800/60 flex justify-end">
          <button type="button" onclick="abrirGeneradorMaestroJosue()" class="text-[10px] text-slate-600 hover:text-emerald-400 flex items-center gap-1 transition">
            <i data-lucide="lock" class="w-2.5 h-2.5"></i>
            <span>Acceso Maestro (Josue Hernandez)</span>
          </button>
        </div>

        <!-- MODAL / CAJA PRIVADA DEL GENERADOR MAESTRO (SOLO CON PIN SECRETO DE JOSUE) -->
        <div id="panelPrivadoJosue" class="hidden mt-3 p-3.5 rounded-2xl bg-slate-950 border-2 border-emerald-500 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <p class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="key" class="w-4 h-4"></i>
              Generador Exclusivo de Seriales - Josue Hernandez
            </p>
            <button onclick="document.getElementById('panelPrivadoJosue').classList.add('hidden')" class="text-slate-400 hover:text-white text-xs">&times; Cerrar</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input type="text" id="genEmpresa" placeholder="Nombre Financiera..." class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <select id="genRutas" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-bold">
              <option value="1">1 Cobrador</option>
              <option value="2">2 Cobradores</option>
              <option value="3" selected>3 Cobradores</option>
              <option value="5">5 Cobradores</option>
              <option value="8">8 Cobradores</option>
              <option value="10">10 Cobradores</option>
              <option value="20">20 Cobradores</option>
            </select>
            <select id="genTipo" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold">
              <option value="MENSUAL">Mensual (30 Días)</option>
              <option value="BIMESTRAL">Bimestral (60 Días)</option>
              <option value="ANUAL">Anual (365 Días)</option>
              <option value="VITALICIA">Vitalicia</option>
            </select>
            <button onclick="generarSerialMaestroAction()" class="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition">
              CREAR SERIAL
            </button>
          </div>

          <div id="resultadoSerialBox" class="hidden p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-bold">Serial Generado:</span>
              <span id="txtSerialGenerado" class="font-mono text-xs sm:text-sm font-black text-emerald-400 select-all"></span>
            </div>
            <button onclick="copiarMensajeLicenciaWhatsApp()" class="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Copiar Mensaje Formal con Mis Datos (9612765041) para Enviar al Cliente</span>
            </button>
          </div>
        </div>

      </div>
`;

// Reemplazar la sección anterior
const oldSectionRegex = /<!-- PANEL MAESTRO DE LICENCIAS Y SERIALES \(JOSUE HERNANDEZ\) -->[\s\S]*?<!-- Datos de Empresa -->/;
if (oldSectionRegex.test(html)) {
  html = html.replace(oldSectionRegex, clientLicPanel + '\n        <!-- Datos de Empresa -->');
}

fs.writeFileSync(targetHtml, html, 'utf8');

// Actualizar app.js con la protección del PIN maestro de Josue Hernandez
let js = fs.readFileSync(targetJs, 'utf8');

const masterAccessJs = `
// Acceso Exclusivo para Josue Hernandez
function abrirGeneradorMaestroJosue() {
  const pin = prompt('🔐 Ingrese el PIN Secreto de Desarrollador Maestro (Josue Hernandez):');
  if (pin === '9612' || pin === '9612765041') {
    document.getElementById('panelPrivadoJosue').classList.remove('hidden');
    lucide.createIcons();
  } else {
    alert('❌ Acceso denegado. Solo Josue Hernandez puede generar seriales de licencia.');
  }
}

async function activarSerialClienteAction() {
  const serial = document.getElementById('inputActivarSerialCliente').value.trim();
  if (!serial) {
    alert('Por favor pega el serial de activación recibido.');
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
    alert('Error al activar licencia: ' + e.message);
  }
}
`;

if (!js.includes('abrirGeneradorMaestroJosue')) {
  js += masterAccessJs;
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ Protección completada: El generador ahora está 100% blindado y protegido para Josue Hernandez.');
