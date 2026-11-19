const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

let content = fs.readFileSync(targetPath, 'utf8');

// 1. Añadir lectura de parámetro ?cobrador= en DOMContentLoaded
const domLoadedHook = `document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  inicializarCanvasFirma();
  await cargarConfiguracion();
  await cargarCobradores();
  await cargarClientes();
  await cargarTunnelStatus();
  inicializarMapa();
  iniciarRastreoGpsAutomatico();

  // Revisar si viene enlace personalizado para cobrador en la URL (?cobrador=COB-1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramCobrador = urlParams.get('cobrador');
  if (paramCobrador && appState.cobradores.some(c => c.id === paramCobrador)) {
    document.getElementById('selectRolActivo').value = paramCobrador;
    cambiarPerfilActivo(paramCobrador);
  }

  // Escuchar redimensionamiento para el canvas
  window.addEventListener('resize', ajustarTamanioCanvas);
  
  // Sincronización automática en tiempo real cada 8 segundos
  setInterval(async () => {
    await cargarCobradores(true);
    await cargarClientes(true);
  }, 8000);
});`;

content = content.replace(/document\.addEventListener\('DOMContentLoaded',[\s\S]*?setInterval[\s\S]*?\}\, 30000\);\s*\}\);/, domLoadedHook);

// 2. Añadir función para reasignar cobrador desde la tarjeta
const reasignarFn = `
// Reasignar cliente a otro cobrador en ruta al instante
async function reasignarClienteCobrador(clienteId, nuevoCobradorId) {
  try {
    const res = await fetch('/api/clientes/' + clienteId + '/asignar-cobrador', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobradorId: nuevoCobradorId })
    });
    if (res.ok) {
      const cob = appState.cobradores.find(c => c.id === nuevoCobradorId);
      alert('✅ Cliente reasignado exitosamente a ' + (cob ? cob.nombre : nuevoCobradorId));
      await cargarClientes();
    }
  } catch (e) {
    alert('Error al reasignar: ' + e.message);
  }
}

function enviarEnlacePersonalizadoCobrador(cobradorId) {
  const cobrador = appState.cobradores.find(c => c.id === cobradorId);
  if (!cobrador) return;

  const base = appState.tunnel.url || ('http://' + appState.tunnel.localIp + ':' + appState.tunnel.port);
  const linkPersonalizado = base + '/?cobrador=' + cobrador.id;
  const tel = (cobrador.telefono || '').replace(/\\D/g, '');

  const msg = 
    "🛵 *TU ENLACE PERSONAL DE COBRANZA EN RUTA* 🛵\\n" +
    "Hola *" + cobrador.nombre + "*, este es tu enlace directo para tu celular:\\n\\n" +
    linkPersonalizado + "\\n\\n" +
    "📱 *Instrucciones:*\\n" +
    "1. Toca el enlace para abrir tu ruta.\\n" +
    "2. En tu navegador toca los 3 puntos y selecciona *'Agregar a la pantalla principal'* para tenerlo como App.\\n" +
    "3. Solo verás tus clientes y tu efectivo en mano en tiempo real.";

  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
}
`;

content += reasignarFn;

// 3. Modificar la tarjeta de cliente para mostrar selector de cobrador para el ADMIN
content = content.replace(
  `<!-- Fila de Herramientas: Pagaré, Firma, WhatsApp y Notificar al Cobrador -->`,
  `<!-- Selector de Cobrador Asignado (Visible para Administrador) -->
        \${appState.rolActivo === 'ADMIN' ? \`
          <div class="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px]">
            <span class="text-slate-400 font-semibold flex items-center gap-1">
              <i data-lucide="bike" class="w-3 h-3 text-cyan-400"></i> Cobrador:
            </span>
            <select onchange="reasignarClienteCobrador('\${c.id}', this.value)" class="bg-slate-900 text-cyan-300 font-bold px-2 py-1 rounded-lg border border-slate-700 outline-none text-xs">
              \${appState.cobradores.map(cob => \`<option value="\${cob.id}" \${cob.id === c.cobradorId ? 'selected' : ''}>\${cob.nombre} (\${cob.ruta})</option>\`).join('')}
            </select>
          </div>
        \` : ''}

        <!-- Fila de Herramientas: Pagaré, Firma, WhatsApp y Notificar al Cobrador -->`
);

// 4. Modificar la tarjeta de cobrador en listaCobradoresContenedor para incluir botón de enviar enlace
content = content.replace(
  `<button onclick="seleccionarCobradorEnMapa('\${cob.id}')" class="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">`,
  `<button onclick="enviarEnlacePersonalizadoCobrador('\${cob.id}')" class="py-1.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1 transition" title="Enviar enlace de celular">
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
            <span>Enviar Enlace</span>
          </button>
          <button onclick="seleccionarCobradorEnMapa('\${cob.id}')" class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">`
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ public/app.js actualizado con reasignación en ruta y enlaces directos por WhatsApp.');
