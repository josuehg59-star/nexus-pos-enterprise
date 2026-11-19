const fs = require('fs');

const targetHtml = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';
const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

let html = fs.readFileSync(targetHtml, 'utf8');
let js = fs.readFileSync(targetJs, 'utf8');

// ==========================================
// 1. ACTUALIZAR INDEX.HTML
// ==========================================

// A. Añadir botón "🚨 Zona Roja" en la barra de filtros
if (!html.includes('btnFiltro-MOROSOS')) {
  const targetAtrasados = '<button onclick="setFiltroEstado(\'ATRASADOS\')" id="btnFiltro-ATRASADOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition">⚠️ Con Atraso</button>';
  const btnMorosos = targetAtrasados + 
    `\n          <button onclick="setFiltroEstado('MOROSOS')" id="btnFiltro-MOROSOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40 transition">🚨 Zona Roja (<span id="countMorosos">0</span>)</button>`;
  html = html.replace(targetAtrasados, btnMorosos);
}

// B. Añadir botón de imprimir ticket térmico en el modal de recibo
const oldReciboBtns = `<button id="btnEnviarWhatsAppRecibo" onclick="enviarReciboWhatsAppAction()" class="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition">
          <i data-lucide="message-circle" class="w-5 h-5"></i>
          <span>ENVIAR RECIBO FORMAL POR WHATSAPP</span>
        </button>`;

const newReciboBtns = `<button id="btnEnviarWhatsAppRecibo" onclick="enviarReciboWhatsAppAction()" class="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition">
          <i data-lucide="message-circle" class="w-5 h-5"></i>
          <span>ENVIAR RECIBO FORMAL POR WHATSAPP</span>
        </button>
        <button onclick="imprimirTicketTermico58mm()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>🖨️ Imprimir Ticket Térmico (58mm / 80mm)</span>
        </button>`;

if (!html.includes('imprimirTicketTermico58mm')) {
  html = html.replace(oldReciboBtns, newReciboBtns);
}

// C. Añadir botones de Exportar Excel y Reporte PDF en el Corte del Día
const oldCorteHeader = `<div class="flex items-center gap-2">
          <label class="text-xs text-slate-400 font-semibold">Ver corte de:</label>`;

const newCorteHeader = `<div class="flex flex-wrap items-center gap-2">
          <button onclick="exportarReporteDiaExcel()" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
            <span>Exportar Excel / CSV</span>
          </button>
          <button onclick="imprimirReporteCorteDia()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-cyan-400"></i>
            <span>Imprimir Reporte PDF</span>
          </button>
          <label class="text-xs text-slate-400 font-semibold ml-2">Ver corte de:</label>`;

if (!html.includes('exportarReporteDiaExcel')) {
  html = html.replace(oldCorteHeader, newCorteHeader);
}

// D. Área de Ticket Térmico 58mm Imprimible
const thermalTicketArea = `
  <!-- ÁREA IMPRIMIBLE: TICKET TÉRMICO 58mm -->
  <div id="thermalPrintArea" class="hidden">
    <!-- Render dinámico del ticket -->
  </div>
`;

if (!html.includes('thermalPrintArea')) {
  html = html.replace('</body>', thermalTicketArea + '\n</body>');
}

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✅ index.html actualizado con Zona Roja, Ticket Térmico 58mm y Exportador Excel/PDF.');


// ==========================================
// 2. ACTUALIZAR APP.JS
// ==========================================

// Actualizar renderizarClientes para incluir el filtro MOROSOS y contar morosos
const filterSectionMorososOld = `  // FILTRADO INTELIGENTE:
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

const filterSectionMorososNew = `  // Contar morosos en zona roja (3 o más días de atraso)
  const totalMorosos = appState.clientes.filter(c => (c.diasAtraso >= 3) && c.saldoPendiente > 0 && !c.oculto).length;
  const countMorososBadge = document.getElementById('countMorosos');
  if (countMorososBadge) countMorososBadge.textContent = totalMorosos;

  // FILTRADO INTELIGENTE:
  if (appState.filtroEstado === 'LIQUIDADOS') {
    lista = lista.filter(c => c.saldoPendiente === 0);
  } else if (appState.filtroEstado === 'OCULTOS') {
    lista = lista.filter(c => c.oculto === true);
  } else if (appState.filtroEstado === 'MOROSOS') {
    // Zona Roja: Más de 3 días sin abonar
    lista = lista.filter(c => (c.diasAtraso >= 3) && c.saldoPendiente > 0 && !c.oculto);
  } else {
    // EN LA PANTALLA PRINCIPAL (TODOS, PENDIENTES, COBRADOS, ATRASADOS):
    lista = lista.filter(c => c.saldoPendiente > 0 && !c.oculto);

    if (appState.filtroEstado === 'PENDIENTES') {
      lista = lista.filter(c => !c.pagadoHoy);
    } else if (appState.filtroEstado === 'COBRADOS') {
      lista = lista.filter(c => c.pagadoHoy);
    } else if (appState.filtroEstado === 'ATRASADOS') {
      lista = lista.filter(c => c.diasAtraso > 0 || c.estatus === 'RETRASADO');
    }
  }`;

js = js.replace(filterSectionMorososOld, filterSectionMorososNew);

// Añadir alerta visual de Zona Roja y botón de cobro al aval en la tarjeta del cliente
const oldCardBadgeBlock = `let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    let badgeText = 'PENDIENTE HOY';
    if (estaLiquidado) {
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      badgeText = 'LIQUIDADO';
    } else if (pagadoHoy) {
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      badgeText = 'COBRADO HOY';
    } else if (c.diasAtraso > 0) {
      badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30';
      badgeText = c.diasAtraso + ' DÍAS ATRASO';
    }`;

const newCardBadgeBlock = `let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    let badgeText = 'PENDIENTE HOY';
    const esMorosoZonaRoja = c.diasAtraso >= 3 && !estaLiquidado;

    if (estaLiquidado) {
      badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      badgeText = 'LIQUIDADO';
    } else if (esMorosoZonaRoja) {
      badgeColor = 'bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse font-black';
      badgeText = '🚨 ZONA ROJA (' + c.diasAtraso + ' DÍAS)';
    } else if (pagadoHoy) {
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      badgeText = 'COBRADO HOY';
    } else if (c.diasAtraso > 0) {
      badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30';
      badgeText = c.diasAtraso + ' DÍAS ATRASO';
    }`;

js = js.replace(oldCardBadgeBlock, newCardBadgeBlock);

// Añadir funciones para ticket térmico, exportar Excel y cobrar al aval
const newAdvancedFunctions = `
// ==========================================
// 1. TICKET TÉRMICO 58mm / 80mm
// ==========================================
function imprimirTicketTermico58mm() {
  const r = appState.ultimoRecibo;
  if (!r) return;

  const empresa = appState.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";
  const telefono = appState.config?.telefono || "961 276 5041";
  const direccion = appState.config?.direccion || "Matriz de Operaciones";

  const ticketHtml = \`
    <style>
      @page { margin: 0; size: 58mm auto; }
      body { margin: 0; padding: 4px; font-family: 'Courier New', monospace; font-size: 11px; color: #000; width: 54mm; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 4px 0; }
    </style>
    <div class="text-center">
      <div class="bold" style="font-size: 13px;">\${empresa}</div>
      <div>\${direccion}</div>
      <div>Tel: \${telefono}</div>
      <div class="line"></div>
      <div class="bold">COMPROBANTE DE PAGO</div>
      <div>FOLIO: \${r.folio}</div>
      <div>FECHA: \${r.fechaHora}</div>
      <div>COBRADOR: \${r.cobradorNombre}</div>
      <div class="line"></div>
    </div>
    <div>
      <div><b>CLIENTE:</b> \${r.clienteNombre}</div>
    </div>
    <div class="line"></div>
    <div style="font-size: 13px;">
      <b>MONTO COBRADO: $\${r.monto.toFixed(2)}</b>
    </div>
    <div class="line"></div>
    <div>Saldo Anterior: $\${r.saldoAnterior.toFixed(2)}</div>
    <div class="bold">NUEVO SALDO RESTANTE: $\${r.saldoNuevo.toFixed(2)}</div>
    <div class="line"></div>
    <div class="text-center" style="font-size: 9px;">
      ¡Muchas gracias por su puntual pago del día de hoy!<br>
      Conserve este ticket oficial.
    </div>
  \`;

  const ventanaTicket = window.open('', '_blank', 'width=350,height=500');
  ventanaTicket.document.write(ticketHtml);
  ventanaTicket.document.close();
  ventanaTicket.focus();
  setTimeout(() => {
    ventanaTicket.print();
    ventanaTicket.close();
  }, 250);
}

// ==========================================
// 2. EXPORTAR REPORTE DEL DÍA A EXCEL / CSV
// ==========================================
function exportarReporteDiaExcel() {
  const hoyStr = new Date().toISOString().split('T')[0];
  const empresa = appState.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";
  
  let cobros = appState.clientes.filter(c => c.pagadoHoy);
  let pendientes = appState.clientes.filter(c => !c.pagadoHoy && c.saldoPendiente > 0);

  let csvContent = "data:text/csv;charset=utf-8,\\uFEFF";
  csvContent += "REPORTE DE COBRANZA DEL DÍA - " + empresa + "\\n";
  csvContent += "FECHA: " + hoyStr + "\\n\\n";

  // 1. Tabla de Cobrados
  csvContent += "--- CLIENTES COBRADOS HOY ---\\n";
  csvContent += "Código,Cliente,Teléfono,Dirección,Cobrador,Cuota Cobrada,Saldo Restante,Estatus\\n";
  cobros.forEach(c => {
    csvContent += \`"\${c.id}","\${c.nombre}","\${c.telefono}","\${c.direccion}","\${c.cobradorNombre || ''}","$\${c.ultimoPagoMonto || c.cuotaDiaria}","$\${c.saldoPendiente}","COBRADO"\\n\`;
  });

  csvContent += "\\n--- CLIENTES PENDIENTES DE HOY ---\\n";
  csvContent += "Código,Cliente,Teléfono,Dirección,Cobrador,Cuota Pendiente,Saldo Restante,Días Atraso\\n";
  pendientes.forEach(c => {
    csvContent += \`"\${c.id}","\${c.nombre}","\${c.telefono}","\${c.direccion}","\${c.cobradorNombre || ''}","$\${c.cuotaDiaria}","$\${c.saldoPendiente}","\${c.diasAtraso} días"\\n\`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", \`REPORTE_COBRANZA_\${hoyStr}.csv\`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert('📥 Reporte del día exportado en Excel/CSV correctamente.');
}

function imprimirReporteCorteDia() {
  window.print();
}

// ==========================================
// 3. COBRANZA URGENTE A MOROSOS Y AVALES
// ==========================================
function avisarMorosoUrgenteWhatsApp(clienteId) {
  const c = appState.clientes.find(cli => cli.id === clienteId);
  if (!c) return;
  const tel = (c.telefono || '').replace(/\\D/g, '');
  const empresa = appState.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";

  const msg = 
    "⚠️ *NOTIFICACIÓN DE COBRANZA - ADELANTO URGENTE* ⚠️\\n" +
    "🏛️ *" + empresa + "*\\n" +
    "-----------------------------------------\\n" +
    "Estimado(a) *" + c.nombre + "*:\\n\\n" +
    "Le informamos que su crédito presenta un retraso de *" + c.diasAtraso + " DÍAS* sin registrar su abono diario correspondiente.\\n\\n" +
    "💰 *Saldo Pendiente:* $" + (c.saldoPendiente || 0).toFixed(2) + " MXN\\n" +
    "🗓️ *Cuota Diaria Requerida:* $" + c.cuotaDiaria + " MXN\\n" +
    "-----------------------------------------\\n" +
    "📌 Le solicitamos comunicarse hoy mismo o esperar la visita de su cobrador para regularizar su cuenta y evitar cargos moratorios o visita formal al aval de garantía.\\n\\n" +
    "📞 Atención a Clientes: " + (appState.config?.telefono || "961 276 5041");

  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
}

function contactarAvalWhatsApp(clienteId) {
  const c = appState.clientes.find(cli => cli.id === clienteId);
  if (!c || !c.avalTelefono) {
    alert('Este cliente no tiene teléfono de aval registrado.');
    return;
  }
  const telAval = (c.avalTelefono || '').replace(/\\D/g, '');
  const empresa = appState.config?.nombreEmpresa || "FINANCIERA CRÉDITO FÁCIL";

  const msg = 
    "📢 *AVISO AVAL SOLIDARIO DE GARANTÍA* 📢\\n" +
    "🏛️ *" + empresa + "*\\n" +
    "-----------------------------------------\\n" +
    "Estimado(a) *" + (c.avalNombre || 'Aval') + "*:\\n\\n" +
    "Nos comunicamos de la financiera para informarle que el titular del crédito, *" + c.nombre + "*, a quien usted respalda como aval, presenta un atraso de *" + c.diasAtraso + " días* en sus pagos diarios.\\n\\n" +
    "💰 *Saldo por Liquidar:* $" + (c.saldoPendiente || 0).toFixed(2) + " MXN\\n" +
    "-----------------------------------------\\n" +
    "Agradecemos su valioso apoyo para recordarle o ponerse en contacto con nosotros al " + (appState.config?.telefono || "961 276 5041") + " para evitar afectaciones legales.";

  window.open('https://wa.me/' + telAval + '?text=' + encodeURIComponent(msg), '_blank');
}
`;

if (!js.includes('imprimirTicketTermico58mm')) {
  js += newAdvancedFunctions;
}

// Agregar botones en la tarjeta para morosos si tienen retraso
const btnMorosoCard = `\${esMorosoZonaRoja ? \`
            <div class="flex items-center gap-1 pt-1 border-t border-rose-500/30">
              <button onclick="avisarMorosoUrgenteWhatsApp('\${c.id}')" class="flex-1 py-1 px-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition">
                <i data-lucide="alert-triangle" class="w-3 h-3 text-rose-400"></i>
                <span>Cobranza Urgente WhatsApp</span>
              </button>
              \${c.avalTelefono ? \`
                <button onclick="contactarAvalWhatsApp('\${c.id}')" class="py-1 px-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-xl text-[10px] font-bold flex items-center gap-1 transition" title="Avisar al Aval">
                  <i data-lucide="user-x" class="w-3 h-3 text-amber-400"></i>
                  <span>Avisar Aval</span>
                </button>
              \` : ''}
            </div>
          \` : ''}`;

if (!js.includes('avisarMorosoUrgenteWhatsApp')) {
  js = js.replace('<!-- Fila de Herramientas: Pagaré, Firma, WhatsApp y Notificar al Cobrador -->', btnMorosoCard + '\n        <!-- Fila de Herramientas: Pagaré, Firma, WhatsApp y Notificar al Cobrador -->');
}

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ app.js actualizado con Ticket Térmico 58mm, Exportador Excel y Cobranza a Morosos y Avales.');
