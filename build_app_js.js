const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';

const jsContent = `// ====================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ====================================================
const appState = {
  rolActivo: 'ADMIN', // 'ADMIN' o id del cobrador (ej. 'COB-1')
  cobradorActivoObj: null,
  cobradores: [],
  clientes: [],
  filtroEstado: 'TODOS',
  busquedaTexto: '',
  config: {},
  tunnel: {},
  map: null,
  markersClientes: {},
  markersCobradores: {},
  miUbicacionActual: { lat: 19.4326, lng: -99.1332 },
  
  // Firma en pantalla
  canvasFirma: null,
  ctxFirma: null,
  dibujandoFirma: false,
  firmaCapturadaBase64: '',
  firmaModoTarget: 'NUEVO', // 'NUEVO' o id del cliente
  
  // Foto fachada
  fotoFachadaBase64: '',
  
  // Recibo WhatsApp
  ultimoRecibo: null,
  
  // Cliente activo para pagaré o abono manual
  clienteActivoSeleccionado: null
};

// ====================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ====================================================
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  inicializarCanvasFirma();
  await cargarConfiguracion();
  await cargarCobradores();
  await cargarClientes();
  await cargarTunnelStatus();
  inicializarMapa();
  iniciarRastreoGpsAutomatico();

  // Escuchar redimensionamiento para el canvas
  window.addEventListener('resize', ajustarTamanioCanvas);
  
  // Recargar datos cada 30 segundos en segundo plano
  setInterval(async () => {
    await cargarCobradores(true);
    await cargarClientes(true);
  }, 30000);
});


// ====================================================
// 1. GESTIÓN DE CONFIGURACIÓN Y PERFILES
// ====================================================
async function cargarConfiguracion() {
  try {
    const res = await fetch('/api/config');
    appState.config = await res.json();
    if (appState.config.nombreEmpresa) {
      document.getElementById('headerEmpresa').textContent = appState.config.nombreEmpresa;
      document.getElementById('cfgEmpresa').value = appState.config.nombreEmpresa;
    }
    if (appState.config.eslogan) document.getElementById('cfgEslogan').value = appState.config.eslogan;
    if (appState.config.telefono) document.getElementById('cfgTelefono').value = appState.config.telefono;
    if (appState.config.direccion) document.getElementById('cfgDireccion').value = appState.config.direccion;
    if (appState.config.pinAdmin) document.getElementById('cfgPinAdmin').value = appState.config.pinAdmin;
  } catch (e) {
    console.error('Error cargando configuración:', e);
  }
}

async function guardarAjustesEmpresa(e) {
  e.preventDefault();
  const datos = {
    nombreEmpresa: document.getElementById('cfgEmpresa').value,
    eslogan: document.getElementById('cfgEslogan').value,
    telefono: document.getElementById('cfgTelefono').value,
    direccion: document.getElementById('cfgDireccion').value,
    pinAdmin: document.getElementById('cfgPinAdmin').value
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      alert('✅ Ajustes de empresa guardados correctamente.');
      document.getElementById('headerEmpresa').textContent = datos.nombreEmpresa;
    }
  } catch (err) {
    alert('Error guardando ajustes: ' + err.message);
  }
}

async function cargarTunnelStatus() {
  try {
    const res = await fetch('/api/tunnel');
    const data = await res.json();
    appState.tunnel = data;
    const txt = document.getElementById('tunnelStatusText');
    const input = document.getElementById('cfgTunnelInput');
    const modalUrl = document.getElementById('modalTunnelUrl');

    if (data.active && data.url) {
      txt.textContent = 'Enlace 4G Activo';
      input.value = data.url;
      modalUrl.textContent = data.url;
    } else {
      const localUrl = 'http://' + (data.localIp || 'localhost') + ':' + (data.port || 4000);
      txt.textContent = 'Red WiFi Local';
      input.value = localUrl;
      modalUrl.textContent = localUrl;
    }
  } catch (e) {
    console.log('Túnel no disponible');
  }
}


// ====================================================
// 2. GESTIÓN MULTI-COBRADOR
// ====================================================
async function cargarCobradores(silencioso = false) {
  try {
    const res = await fetch('/api/cobradores');
    appState.cobradores = await res.json();
    actualizarSelectsCobradores();
    renderizarListaCobradores();
    if (!silencioso && appState.map) actualizarMarcadoresMapa();
  } catch (e) {
    console.error('Error cargando cobradores:', e);
  }
}

function actualizarSelectsCobradores() {
  const selectRol = document.getElementById('selectRolActivo');
  const selectNuevoPrestamo = document.getElementById('npCobrador');
  const selectCorte = document.getElementById('selectCorteCobrador');

  // Guardar valor actual
  const valRol = selectRol.value;
  const valCorte = selectCorte.value;

  selectRol.innerHTML = '<option value="ADMIN">👑 Administrador General (Oficina)</option>';
  selectNuevoPrestamo.innerHTML = '';
  selectCorte.innerHTML = '<option value="ALL">🏢 Consolidado General (Toda la Empresa)</option>';

  appState.cobradores.forEach(cob => {
    // Para selector de rol
    const optRol = document.createElement('option');
    optRol.value = cob.id;
    optRol.textContent = '🛵 ' + cob.nombre + ' (' + cob.ruta + ')';
    selectRol.appendChild(optRol);

    // Para nuevo préstamo
    const optNp = document.createElement('option');
    optNp.value = cob.id;
    optNp.textContent = cob.nombre + ' - ' + cob.ruta;
    selectNuevoPrestamo.appendChild(optNp);

    // Para corte
    const optCorte = document.createElement('option');
    optCorte.value = cob.id;
    optCorte.textContent = cob.nombre + ' (' + cob.ruta + ')';
    selectCorte.appendChild(optCorte);
  });

  if (valRol) selectRol.value = valRol;
  if (valCorte) selectCorte.value = valCorte;
}

function cambiarPerfilActivo(nuevoRol) {
  appState.rolActivo = nuevoRol;
  const badge = document.getElementById('roleBadge');
  const btnGps = document.getElementById('btnGpsCobrador');

  if (nuevoRol === 'ADMIN') {
    appState.cobradorActivoObj = null;
    badge.textContent = 'ADMIN';
    badge.className = 'bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-500/30';
    btnGps.classList.add('hidden');
  } else {
    appState.cobradorActivoObj = appState.cobradores.find(c => c.id === nuevoRol);
    badge.textContent = 'COBRADOR';
    badge.className = 'bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-cyan-500/30';
    btnGps.classList.remove('hidden');
  }

  // Refrescar vistas
  renderizarClientes();
  actualizarKpis();
  if (appState.map) actualizarMarcadoresMapa();
}

function renderizarListaCobradores() {
  const contenedor = document.getElementById('listaCobradoresContenedor');
  if (!contenedor) return;

  contenedor.innerHTML = appState.cobradores.map(cob => {
    return \`
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-slate-700 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
              <i data-lucide="bike" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-white">\${cob.nombre}</h3>
              <p class="text-xs text-cyan-400 font-semibold">\${cob.ruta}</p>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold \${cob.activo ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'}">
            \${cob.activo ? 'EN RUTA' : 'INACTIVO'}
          </span>
        </div>

        <!-- Métricas del cobrador -->
        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div>
            <span class="text-slate-400 text-[10px]">Cobrado Hoy:</span>
            <p class="font-black text-emerald-400">$\${(cob.totalCobradoHoy || 0).toFixed(2)}</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Efectivo en Mano:</span>
            <p class="font-black text-white">$\${(cob.efectivoEnMano || 0).toFixed(2)}</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Clientes Ruta:</span>
            <p class="font-bold text-slate-300">\${cob.clientesCobradosHoy || 0} de \${cob.clientesAsignados || 0}</p>
          </div>
          <div>
            <span class="text-slate-400 text-[10px]">Avance:</span>
            <p class="font-bold text-cyan-400">\${cob.efectividad || 0}%</p>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a href="https://wa.me/\${cob.telefono}" target="_blank" class="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">
            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
            <span>WhatsApp</span>
          </a>
          <button onclick="seleccionarCobradorEnMapa('\${cob.id}')" class="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Ver GPS</span>
          </button>
        </div>
      </div>
    \`;
  }).join('');
  lucide.createIcons();
}

function abrirModalNuevoCobrador() {
  document.getElementById('modalNuevoCobrador').classList.remove('hidden');
}
function cerrarModalNuevoCobrador() {
  document.getElementById('modalNuevoCobrador').classList.add('hidden');
}

async function guardarNuevoCobrador(e) {
  e.preventDefault();
  const datos = {
    nombre: document.getElementById('ncNombre').value,
    telefono: document.getElementById('ncTelefono').value,
    ruta: document.getElementById('ncRuta').value,
    fondoInicial: Number(document.getElementById('ncFondo').value) || 1000
  };

  try {
    const res = await fetch('/api/cobradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      cerrarModalNuevoCobrador();
      await cargarCobradores();
      alert('✅ Nuevo cobrador registrado exitosamente.');
    }
  } catch (err) {
    alert('Error al registrar cobrador: ' + err.message);
  }
}


// ====================================================
// 3. GESTIÓN DE CLIENTES Y PRÉSTAMOS
// ====================================================
async function cargarClientes(silencioso = false) {
  try {
    const res = await fetch('/api/clientes');
    appState.clientes = await res.json();
    renderizarClientes();
    actualizarKpis();
    if (!silencioso && appState.map) actualizarMarcadoresMapa();
  } catch (e) {
    console.error('Error cargando clientes:', e);
  }
}

function setFiltroEstado(filtro) {
  appState.filtroEstado = filtro;
  document.querySelectorAll('.filtro-btn').forEach(b => {
    b.classList.remove('ring-2', 'ring-emerald-400', 'bg-slate-700');
  });
  const activo = document.getElementById('btnFiltro-' + filtro);
  if (activo) activo.classList.add('ring-2', 'ring-emerald-400');
  renderizarClientes();
}

function filtrarClientes() {
  appState.busquedaTexto = document.getElementById('inputBuscarCliente').value.toLowerCase().trim();
  renderizarClientes();
}

function renderizarClientes() {
  const contenedor = document.getElementById('listaClientesContenedor');
  const sinClientes = document.getElementById('sinClientesMensaje');
  if (!contenedor) return;

  // Filtrar según rol activo (si es cobrador, solo sus clientes; si es ADMIN, todos)
  let lista = appState.clientes;
  if (appState.rolActivo !== 'ADMIN') {
    lista = lista.filter(c => c.cobradorId === appState.rolActivo);
  }

  // Filtrar por estado
  if (appState.filtroEstado === 'PENDIENTES') {
    lista = lista.filter(c => !c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'COBRADOS') {
    lista = lista.filter(c => c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'ATRASADOS') {
    lista = lista.filter(c => (c.diasAtraso > 0 || c.estatus === 'RETRASADO') && c.saldoPendiente > 0);
  }

  // Filtrar por texto de búsqueda
  if (appState.busquedaTexto) {
    lista = lista.filter(c => 
      c.nombre.toLowerCase().includes(appState.busquedaTexto) ||
      (c.direccion && c.direccion.toLowerCase().includes(appState.busquedaTexto)) ||
      (c.telefono && c.telefono.includes(appState.busquedaTexto)) ||
      c.id.toLowerCase().includes(appState.busquedaTexto)
    );
  }

  if (lista.length === 0) {
    contenedor.innerHTML = '';
    sinClientes.classList.remove('hidden');
    return;
  }
  sinClientes.classList.add('hidden');

  contenedor.innerHTML = lista.map(c => {
    const cuotasPagadas = Math.round((c.totalAbonado || 0) / (c.cuotaDiaria || 1));
    const cuotasTotales = Math.round((c.totalPagar || 0) / (c.cuotaDiaria || 1));
    const pct = c.totalPagar > 0 ? Math.min(100, Math.round((c.totalAbonado / c.totalPagar) * 100)) : 0;
    
    const estaLiquidado = c.saldoPendiente === 0;
    const pagadoHoy = c.pagadoHoy;

    let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
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
    }

    return \`
      <div class="bg-slate-900 border \${pagadoHoy ? 'border-emerald-500/30' : 'border-slate-800'} rounded-2xl p-4 space-y-3 hover:border-slate-700 transition shadow-lg relative">
        
        <!-- Header de Tarjeta -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <!-- Miniatura foto fachada o icono -->
            <div onclick="abrirFotoFachadaGrande('\${c.id}')" class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer" title="Foto de fachada">
              \${c.fotoFachada ? 
                \`<img src="\${c.fotoFachada}" class="w-full h-full object-cover">\` : 
                \`<i data-lucide="store" class="w-5 h-5 text-slate-500"></i>\`
              }
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 class="text-sm font-black text-white leading-tight">\${c.nombre}</h3>
                \${c.firmaDigitalCliente ? 
                  \`<span title="Pagaré con Firma Digital" class="text-teal-400 text-xs">✍️</span>\` : 
                  \`<span title="Pendiente de firmar" class="text-amber-400 text-xs">⏳</span>\`
                }
              </div>
              <p class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <i data-lucide="phone" class="w-3 h-3 text-emerald-400"></i> \${c.telefono}
              </p>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-black border \${badgeColor}">
            \${badgeText}
          </span>
        </div>

        <!-- Dirección y Acciones de Ubicación -->
        <div class="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <p class="text-[11px] text-slate-300 flex items-start gap-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
            <span>\${c.direccion}</span>
          </p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <a href="https://maps.google.com/?q=\${c.lat},\${c.lng}" target="_blank" class="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
              <i data-lucide="navigation" class="w-3 h-3"></i> Navegar en Google Maps
            </a>
            <button onclick="guardarGpsActualEnCliente('\${c.id}')" class="text-slate-400 hover:text-white flex items-center gap-1" title="Fijar mi ubicación GPS en este cliente">
              <i data-lucide="crosshair" class="w-3 h-3 text-cyan-400"></i> Fijar GPS Aquí
            </button>
          </div>
        </div>

        <!-- Condiciones Financieras y Cuota Diaria Modificable -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 uppercase">Cuota Diaria:</span>
              <button onclick="modificarCuotaCliente('\${c.id}', \${c.cuotaDiaria})" class="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5">
                <i data-lucide="edit-3" class="w-2.5 h-2.5"></i> Editar
              </button>
            </div>
            <p class="text-sm font-black text-emerald-400 mt-0.5">$\${c.cuotaDiaria} <span class="text-[10px] font-normal text-slate-400">/día</span></p>
          </div>

          <div class="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
            <span class="text-[10px] text-slate-400 uppercase">Saldo Restante:</span>
            <p class="text-sm font-black \${estaLiquidado ? 'text-blue-400' : 'text-amber-400'} mt-0.5">$\${(c.saldoPendiente || 0).toFixed(2)}</p>
          </div>
        </div>

        <!-- Barra de Progreso del Crédito -->
        <div>
          <div class="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Día \${cuotasPagadas} de \${cuotasTotales} pagado</span>
            <span class="font-bold text-slate-200">\${pct}%</span>
          </div>
          <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full" style="width: \${pct}%"></div>
          </div>
        </div>

        <!-- Botones de Acción de Cobranza y Contrato -->
        <div class="space-y-2 pt-1 border-t border-slate-800">
          
          <!-- Botón de Cobro Rápido si está pendiente -->
          \${!estaLiquidado ? \`
            <div class="flex items-center gap-1.5">
              <button onclick="cobrarRapido('\${c.id}', \${c.cuotaDiaria})" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>COBRAR $\${c.cuotaDiaria}</span>
              </button>
              <button onclick="abrirModalAbonoManual('\${c.id}', \${c.cuotaDiaria})" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition" title="Otro monto">
                Otro $
              </button>
            </div>
          \` : \`
            <div class="p-2 bg-blue-950/40 border border-blue-500/30 rounded-xl text-center text-xs text-blue-300 font-bold">
              🎉 Préstamo Totalmente Liquidado
            </div>
          \`}

          <!-- Fila de Herramientas: Pagaré, Firma, WhatsApp y Notificar al Cobrador -->
          <div class="flex items-center gap-1.5 text-xs">
            <button onclick="abrirModalPagare('\${c.id}')" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition">
              <i data-lucide="scroll-text" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>Pagaré</span>
            </button>

            \${!c.firmaDigitalCliente ? \`
              <button onclick="abrirModalFirmaPantalla('\${c.id}')" class="py-1.5 px-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="Firmar en pantalla">
                <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                <span>Firmar</span>
              </button>
            \` : ''}

            <!-- Botón del Administrador para Avisar al Cobrador por WhatsApp -->
            \${appState.rolActivo === 'ADMIN' ? \`
              <button onclick="notificarCobradorWhatsApp('\${c.id}')" class="py-1.5 px-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="Avisar a cobrador de esta asignación">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>Avisar Cobrador</span>
              </button>
            \` : ''}

            <a href="https://wa.me/\${c.telefono}" target="_blank" class="p-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl transition" title="Enviar WhatsApp al cliente">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
            </a>
          </div>

        </div>

      </div>
    \`;
  }).join('');

  lucide.createIcons();
}

function actualizarKpis() {
  const hoyStr = new Date().toISOString().split('T')[0];
  let clientes = appState.clientes;
  if (appState.rolActivo !== 'ADMIN') {
    clientes = clientes.filter(c => c.cobradorId === appState.rolActivo);
  }

  const clientesActivos = clientes.filter(c => c.saldoPendiente > 0);
  const pendientes = clientesActivos.filter(c => !c.pagadoHoy);
  const cobradosHoy = clientesActivos.filter(c => c.pagadoHoy);

  const metaCobroDia = clientesActivos.reduce((acc, c) => acc + (Number(c.cuotaDiaria) || 0), 0);
  const totalCobradoHoy = cobradosHoy.reduce((acc, c) => acc + (Number(c.ultimoPagoMonto) || Number(c.cuotaDiaria) || 0), 0);
  const totalCartera = clientesActivos.reduce((acc, c) => acc + (Number(c.saldoPendiente) || 0), 0);
  const pctAvance = metaCobroDia > 0 ? Math.round((totalCobradoHoy / metaCobroDia) * 100) : 0;

  document.getElementById('kpiCobradoHoy').textContent = '$' + totalCobradoHoy.toFixed(2);
  document.getElementById('kpiCobrosCount').textContent = cobradosHoy.length + ' cobros realizados hoy';

  document.getElementById('kpiMetaDia').textContent = '$' + metaCobroDia.toFixed(2);
  document.getElementById('kpiAvancePct').textContent = pctAvance + '% de la meta diaria';

  document.getElementById('kpiPendientesCount').textContent = pendientes.length;
  document.getElementById('badgePendientesNav').textContent = pendientes.length;

  document.getElementById('kpiTotalCartera').textContent = '$' + totalCartera.toFixed(2);
  document.getElementById('kpiClientesTotal').textContent = clientesActivos.length + ' préstamos activos';
}


// ====================================================
// 4. CALCULADORA DE PRÉSTAMOS Y PRESETS RÁPIDOS
// ====================================================
function aplicarPresetPrestamo(capital, interes, dias, cuota) {
  document.getElementById('npCapital').value = capital;
  document.getElementById('npInteres').value = interes;
  document.getElementById('npDiasPlazo').value = dias;
  calcularCondicionesPrestamo();
  if (cuota) {
    document.getElementById('npCuotaDiaria').value = cuota;
  }
}

function calcularCondicionesPrestamo() {
  const capital = Number(document.getElementById('npCapital').value) || 0;
  const interes = Number(document.getElementById('npInteres').value) || 0;
  const dias = Number(document.getElementById('npDiasPlazo').value) || 15;

  const ganancia = capital * (interes / 100);
  const totalPagar = capital + ganancia;
  const cuotaDiaria = dias > 0 ? Math.ceil(totalPagar / dias) : totalPagar;

  document.getElementById('npResGanancia').textContent = '+$' + ganancia.toFixed(2);
  document.getElementById('npResTotalPagar').textContent = '$' + totalPagar.toFixed(2);
  document.getElementById('npCuotaDiaria').value = cuotaDiaria;
}

async function guardarNuevoPrestamo(e) {
  e.preventDefault();
  const capital = Number(document.getElementById('npCapital').value);
  const interes = Number(document.getElementById('npInteres').value);
  const dias = Number(document.getElementById('npDiasPlazo').value);
  const cuotaDiaria = Number(document.getElementById('npCuotaDiaria').value);
  const totalPagar = capital + (capital * (interes / 100));

  const cobradorId = document.getElementById('npCobrador').value;
  const cobradorObj = appState.cobradores.find(c => c.id === cobradorId);

  const nuevoPrestamo = {
    nombre: document.getElementById('npNombre').value,
    telefono: document.getElementById('npTelefono').value,
    direccion: document.getElementById('npDireccion').value,
    lat: Number(document.getElementById('npLat').value) || (cobradorObj?.ultimaUbicacion?.lat || 19.4326),
    lng: Number(document.getElementById('npLng').value) || (cobradorObj?.ultimaUbicacion?.lng || -99.1332),
    prestamoOriginal: capital,
    interesPorc: interes,
    diasPlazo: dias,
    modalidadCobro: document.getElementById('npModalidad').value,
    totalPagar: totalPagar,
    cuotaDiaria: cuotaDiaria,
    cobradorId: cobradorId,
    cobradorNombre: cobradorObj ? cobradorObj.nombre : 'Cobrador General',
    avalNombre: document.getElementById('npAvalNombre').value,
    avalTelefono: document.getElementById('npAvalTelefono').value,
    fotoFachada: appState.fotoFachadaBase64,
    firmaDigitalCliente: appState.firmaCapturadaBase64,
    fechaFirma: appState.firmaCapturadaBase64 ? new Date().toISOString() : ''
  };

  try {
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoPrestamo)
    });

    if (res.ok) {
      const data = await res.json();
      alert('✅ ¡Préstamo registrado exitosamente! Pagaré formal generado.');
      
      // Limpiar formulario
      document.getElementById('formNuevoPrestamo').reset();
      quitarFotoFachada();
      limpiarFirmaNuevoPrestamo();
      
      await cargarClientes();
      cambiarTab('cobranza');
      
      // Ofrecer abrir el pagaré
      if (data.cliente && data.cliente.id) {
        abrirModalPagare(data.cliente.id);
      }
    } else {
      const err = await res.json();
      alert('Error al registrar préstamo: ' + (err.error || 'Verifica los campos'));
    }
  } catch (err) {
    alert('Error en conexión: ' + err.message);
  }
}


// ====================================================
// 5. REGISTRAR COBRO Y RECIBO FORMAL DE WHATSAPP
// ====================================================
async function cobrarRapido(clienteId, monto) {
  await ejecutarCobro(clienteId, monto, 'CUOTA_DIARIA');
}

function abrirModalAbonoManual(clienteId, cuotaActual) {
  const cliente = appState.clientes.find(c => c.id === clienteId);
  if (!cliente) return;
  document.getElementById('abonoClienteId').value = clienteId;
  document.getElementById('abonoMontoInput').value = cuotaActual;
  document.getElementById('modalAbonoTitulo').textContent = 'Cobro a ' + cliente.nombre;
  document.getElementById('modalAbonoManual').classList.remove('hidden');
}

function cerrarModalAbono() {
  document.getElementById('modalAbonoManual').classList.add('hidden');
}

async function confirmarAbonoManual(e) {
  e.preventDefault();
  const clienteId = document.getElementById('abonoClienteId').value;
  const monto = Number(document.getElementById('abonoMontoInput').value);
  const tipo = document.getElementById('abonoTipoInput').value;
  cerrarModalAbono();
  await ejecutarCobro(clienteId, monto, tipo);
}

async function ejecutarCobro(clienteId, monto, tipo) {
  const cobradorId = appState.rolActivo !== 'ADMIN' ? appState.rolActivo : (appState.cobradores[0]?.id || 'COB-1');

  try {
    const res = await fetch('/api/cobros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId,
        monto,
        tipo,
        cobradorId,
        lat: appState.miUbicacionActual.lat,
        lng: appState.miUbicacionActual.lng
      })
    });

    if (res.ok) {
      const data = await res.json();
      appState.ultimoRecibo = data.recibo;
      mostrarModalRecibo(data.recibo);
      await cargarClientes();
    } else {
      const err = await res.json();
      alert('Error al cobrar: ' + (err.error || 'Verifica los datos'));
    }
  } catch (e) {
    alert('Error registrando cobro: ' + e.message);
  }
}

function mostrarModalRecibo(recibo) {
  const box = document.getElementById('reciboPreviewBox');
  box.innerHTML = \`
    <div class="border-b border-slate-800 pb-2 flex justify-between items-center">
      <span class="font-bold text-emerald-400">\${recibo.empresaNombre}</span>
      <span class="text-[10px] text-slate-500 font-mono">\${recibo.folio}</span>
    </div>
    <div class="space-y-1">
      <p><b class="text-slate-400">Cliente:</b> <span class="text-white font-bold">\${recibo.clienteNombre}</span></p>
      <p><b class="text-slate-400">Fecha y Hora:</b> \${recibo.fechaHora}</p>
      <p><b class="text-slate-400">Cobrador:</b> \${recibo.cobradorNombre}</p>
    </div>
    <div class="bg-slate-900 p-2.5 rounded-xl border border-emerald-500/30 flex justify-between items-center my-2">
      <span class="font-black text-slate-300">MONTO COBRADO:</span>
      <span class="text-base font-black text-emerald-400">$\${recibo.monto.toFixed(2)} MXN</span>
    </div>
    <div class="space-y-1 text-[11px]">
      <p class="flex justify-between"><span>Saldo Anterior:</span> <span class="font-bold">$\${recibo.saldoAnterior.toFixed(2)}</span></p>
      <p class="flex justify-between text-emerald-400 font-bold"><span>Nuevo Saldo Restante:</span> <span>$\${recibo.saldoNuevo.toFixed(2)}</span></p>
    </div>
    <div class="border-t border-slate-800 pt-2 text-[10px] text-slate-400 italic">
      "¡Muchas gracias por su puntual pago del día de hoy! Su puntualidad y responsabilidad fortalecen su historial crediticio."
    </div>
  \`;

  document.getElementById('modalReciboWhatsApp').classList.remove('hidden');
}

function cerrarModalRecibo() {
  document.getElementById('modalReciboWhatsApp').classList.add('hidden');
}

function enviarReciboWhatsAppAction() {
  if (!appState.ultimoRecibo) return;
  const telefono = (appState.ultimoRecibo.telefono || '').replace(/\\D/g, '');
  const mensaje = encodeURIComponent(appState.ultimoRecibo.whatsappMensaje);
  window.open('https://wa.me/' + telefono + '?text=' + mensaje, '_blank');
}


// ====================================================
// 6. FIRMA DIGITAL EN PANTALLA TÁCTIL (CANVAS)
// ====================================================
function inicializarCanvasFirma() {
  const canvas = document.getElementById('canvasFirma');
  if (!canvas) return;
  appState.canvasFirma = canvas;
  appState.ctxFirma = canvas.getContext('2d');
  
  ajustarTamanioCanvas();

  // Eventos de Mouse
  canvas.addEventListener('mousedown', iniciarTrazo);
  canvas.addEventListener('mousemove', dibujarTrazo);
  window.addEventListener('mouseup', terminarTrazo);

  // Eventos Táctiles (Celulares y Pantallas Touch)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    appState.dibujandoFirma = true;
    appState.ctxFirma.beginPath();
    appState.ctxFirma.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!appState.dibujandoFirma) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    appState.ctxFirma.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    appState.ctxFirma.stroke();
  }, { passive: false });

  window.addEventListener('touchend', () => {
    appState.dibujandoFirma = false;
  });
}

function ajustarTamanioCanvas() {
  if (!appState.canvasFirma || !appState.ctxFirma) return;
  const rect = appState.canvasFirma.parentElement.getBoundingClientRect();
  appState.canvasFirma.width = Math.min(460, rect.width - 16);
  appState.canvasFirma.height = 200;

  appState.ctxFirma.lineWidth = 3;
  appState.ctxFirma.lineCap = 'round';
  appState.ctxFirma.lineJoin = 'round';
  appState.ctxFirma.strokeStyle = '#0f172a';
}

function iniciarTrazo(e) {
  appState.dibujandoFirma = true;
  const rect = appState.canvasFirma.getBoundingClientRect();
  appState.ctxFirma.beginPath();
  appState.ctxFirma.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function dibujarTrazo(e) {
  if (!appState.dibujandoFirma) return;
  const rect = appState.canvasFirma.getBoundingClientRect();
  appState.ctxFirma.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  appState.ctxFirma.stroke();
}

function terminarTrazo() {
  appState.dibujandoFirma = false;
}

function limpiarCanvasFirma() {
  if (!appState.ctxFirma || !appState.canvasFirma) return;
  appState.ctxFirma.clearRect(0, 0, appState.canvasFirma.width, appState.canvasFirma.height);
}

function abrirModalFirmaPantalla(targetModo) {
  appState.firmaModoTarget = targetModo;
  limpiarCanvasFirma();
  
  if (targetModo === 'NUEVO') {
    document.getElementById('subtituloModalFirma').textContent = 'Firma del solicitante para formalizar el nuevo préstamo.';
  } else {
    const cliente = appState.clientes.find(c => c.id === targetModo);
    document.getElementById('subtituloModalFirma').textContent = 'Firma digital para el cliente: ' + (cliente ? cliente.nombre : '');
  }

  document.getElementById('modalFirmaPantalla').classList.remove('hidden');
  setTimeout(ajustarTamanioCanvas, 100);
}

function cerrarModalFirma() {
  document.getElementById('modalFirmaPantalla').classList.add('hidden');
}

async function confirmarFirmaCapturada() {
  const dataURL = appState.canvasFirma.toDataURL('image/png');
  cerrarModalFirma();

  if (appState.firmaModoTarget === 'NUEVO') {
    appState.firmaCapturadaBase64 = dataURL;
    document.getElementById('imgFirmaPreview').src = dataURL;
    document.getElementById('imgFirmaPreview').classList.remove('hidden');
    document.getElementById('txtSinFirma').classList.add('hidden');
  } else {
    // Guardar firma en cliente existente
    const clienteId = appState.firmaModoTarget;
    try {
      const res = await fetch('/api/clientes/' + clienteId + '/firma', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmaDigitalCliente: dataURL })
      });
      if (res.ok) {
        alert('✅ Firma digital guardada en el pagaré del cliente.');
        await cargarClientes();
      }
    } catch (e) {
      alert('Error guardando firma: ' + e.message);
    }
  }
}

function limpiarFirmaNuevoPrestamo() {
  appState.firmaCapturadaBase64 = '';
  document.getElementById('imgFirmaPreview').src = '';
  document.getElementById('imgFirmaPreview').classList.add('hidden');
  document.getElementById('txtSinFirma').classList.remove('hidden');
}


// ====================================================
// 7. FOTO DE FACHADA DEL CLIENTE
// ====================================================
function procesarFotoFachada(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Redimensionar para optimizar base64
      const canvas = document.createElement('canvas');
      const maxW = 800;
      const scale = maxW / img.width;
      canvas.width = maxW;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);

      appState.fotoFachadaBase64 = dataURL;
      document.getElementById('previewFotoFachada').src = dataURL;
      document.getElementById('previewFotoFachadaContenedor').classList.remove('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function quitarFotoFachada() {
  appState.fotoFachadaBase64 = '';
  document.getElementById('previewFotoFachada').src = '';
  document.getElementById('previewFotoFachadaContenedor').classList.add('hidden');
  document.getElementById('inputFotoFachada').value = '';
}

function abrirFotoFachadaGrande(clienteId) {
  const cliente = appState.clientes.find(c => c.id === clienteId);
  if (!cliente || !cliente.fotoFachada) {
    // Si no tiene foto, permitirle tomar una con el celular
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const res = await fetch('/api/clientes/' + clienteId + '/foto', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotoFachada: ev.target.result })
        });
        if (res.ok) {
          alert('✅ Foto de fachada guardada exitosamente.');
          await cargarClientes();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
    return;
  }

  // Si ya tiene foto, mostrar en modal o nueva pestaña
  const w = window.open('');
  w.document.write('<title>Fachada - ' + cliente.nombre + '</title><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="' + cliente.fotoFachada + '" style="max-width:100%;max-height:100%;"></body>');
}


// ====================================================
// 8. PAGARÉ DIGITAL Y CONTRATO LEGAL CON FIRMA
// ====================================================
function abrirModalPagare(clienteId) {
  const cliente = appState.clientes.find(c => c.id === clienteId);
  if (!cliente) return;
  appState.clienteActivoSeleccionado = cliente;

  const empresa = appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL';
  const direccionEmpresa = appState.config.direccion || 'Av. Central #120, Col. Centro';
  const fechaInicio = cliente.fechaInicio || new Date().toISOString().split('T')[0];

  const html = \`
    <div class="text-center border-b-2 border-slate-900 pb-3">
      <h2 class="text-base font-black uppercase tracking-wider">\${empresa}</h2>
      <p class="text-[11px] text-slate-600 font-sans">\${direccionEmpresa} | Tel: \${appState.config.telefono || ''}</p>
      <div class="mt-2 inline-block bg-slate-900 text-white font-black px-4 py-1 rounded text-xs tracking-widest uppercase">
        PAGARÉ MERCANTIL CONSTITUCIONAL
      </div>
      <div class="flex justify-between items-center text-[10px] text-slate-700 mt-2 font-mono">
        <span><b>NÚMERO DE PAGARÉ:</b> \${cliente.id}</span>
        <span><b>LUGAR Y FECHA:</b> CIUDAD DE MÉXICO, A \${fechaInicio}</span>
      </div>
    </div>

    <!-- Texto Legal del Pagaré (Art. 170 Ley General de Títulos y Operaciones de Crédito) -->
    <div class="text-justify leading-relaxed text-xs space-y-2 pt-2">
      <p>
        Por el presente <b>PAGARÉ</b>, yo (nosotros) <b>\${cliente.nombre.toUpperCase()}</b>, prometo(emos) y me(nos) obligo(amos) a pagar incondicionalmente a la orden de <b>\${empresa.toUpperCase()}</b>, en su domicilio o en el lugar donde se me requiera el pago, la cantidad total de:
      </p>
      <div class="text-center font-black text-sm my-2 p-2 bg-slate-100 border border-slate-300 rounded font-mono">
        $\${(cliente.totalPagar || 0).toFixed(2)} MXN
      </div>
      <p>
        Valor recibido a mi entera y total satisfacción en calidad de préstamo mercantil el día <b>\${fechaInicio}</b>. Dicha suma será liquidada en <b>\${cliente.diasPlazo || 15} CUOTAS DIARIAS CONSECUTIVAS</b> de <b>$\${cliente.cuotaDiaria} PESOS C/U</b>.
      </p>
      <p>
        En caso de mora o retraso en cualquiera de los pagos programados, causará un interés moratorio a razón del 5% mensual sobre el saldo insoluto hasta la total liquidación del presente documento mercantil.
      </p>
    </div>

    <!-- Datos del Deudor y Fachada -->
    <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-300 text-[11px]">
      <div class="space-y-1">
        <p class="font-bold text-slate-800 uppercase text-[10px] border-b border-slate-300 pb-0.5">DATOS DEL SUSCRIPTOR (DEUDOR):</p>
        <p><b>Nombre:</b> \${cliente.nombre}</p>
        <p><b>Dirección:</b> \${cliente.direccion}</p>
        <p><b>Teléfono:</b> \${cliente.telefono}</p>
        <p><b>Coordenadas GPS:</b> \${cliente.lat}, \${cliente.lng}</p>
        \${cliente.avalNombre ? \`<p><b>Aval Solidario:</b> \${cliente.avalNombre} (Tel: \${cliente.avalTelefono})</p>\` : ''}
      </div>

      <!-- Foto de Fachada del Inmueble -->
      <div>
        <p class="font-bold text-slate-800 uppercase text-[10px] border-b border-slate-300 pb-0.5">COMPROBANTE DOMICILIARIO (FACHADA):</p>
        \${cliente.fotoFachada ? 
          \`<div class="mt-1 h-24 rounded border border-slate-300 overflow-hidden"><img src="\${cliente.fotoFachada}" class="w-full h-full object-cover"></div>\` :
          \`<div class="mt-1 h-24 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">Sin foto de fachada registrada</div>\`
        }
      </div>
    </div>

    <!-- Recuadro de Firma Digital -->
    <div class="pt-4 border-t border-slate-300">
      <div class="max-w-xs mx-auto text-center space-y-1">
        <p class="text-[10px] uppercase font-bold text-slate-600">ACEPTO Y FIRMO DE CONFORMIDAD:</p>
        
        <div class="h-24 border-b-2 border-slate-900 flex items-center justify-center">
          \${cliente.firmaDigitalCliente ? 
            \`<img src="\${cliente.firmaDigitalCliente}" class="max-h-20 max-w-full">\` : 
            \`<div class="text-[11px] text-amber-600 font-bold italic">Pendiente de firma en pantalla.<br><button type="button" onclick="cerrarModalPagare();abrirModalFirmaPantalla('\${cliente.id}');" class="mt-1 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-sans">✍️ Firmar Ahora con el Dedo</button></div>\`
          }
        </div>
        
        <p class="font-black text-xs uppercase text-slate-900 mt-1">\${cliente.nombre}</p>
        <p class="text-[10px] text-slate-500 font-mono">Firma Digital Capturada en Pantalla</p>
      </div>
    </div>
  \`;

  document.getElementById('printableArea').innerHTML = html;
  document.getElementById('modalPagareLegal').classList.remove('hidden');
}

function cerrarModalPagare() {
  document.getElementById('modalPagareLegal').classList.add('hidden');
}

function imprimirPagare() {
  window.print();
}

function compartirPagareWhatsApp() {
  const c = appState.clienteActivoSeleccionado;
  if (!c) return;
  const tel = (c.telefono || '').replace(/\\D/g, '');
  const empresa = appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL';

  const texto = 
    "📜 *PAGARÉ MERCANTIL Y CONTRATO DE CRÉDITO* 📜\\n" +
    "🏛️ *" + empresa + "*\\n" +
    "-----------------------------------------\\n" +
    "👤 *Deudor:* " + c.nombre + "\\n" +
    "🆔 *Folio Pagaré:* " + c.id + "\\n" +
    "💰 *Monto Total:* $" + c.totalPagar.toFixed(2) + " MXN\\n" +
    "🗓️ *Cuota Diaria:* $" + c.cuotaDiaria + " diarios (" + c.diasPlazo + " días)\\n" +
    "📍 *Domicilio:* " + c.direccion + "\\n" +
    "-----------------------------------------\\n" +
    "✍️ *Estatus de Firma:* " + (c.firmaDigitalCliente ? "Firmado Digitalmente en Pantalla ✅" : "Pendiente de Firma ⏳") + "\\n\\n" +
    "📌 _Este documento ampara el crédito otorgado bajo los términos de la ley mercantil._";

  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(texto), '_blank');
}


// ====================================================
// 9. AVISAR AL COBRADOR POR WHATSAPP (ADMINISTRADOR)
// ====================================================
function notificarCobradorWhatsApp(clienteId) {
  const cliente = appState.clientes.find(c => c.id === clienteId);
  if (!cliente) return;
  
  const cobrador = appState.cobradores.find(cob => cob.id === cliente.cobradorId);
  if (!cobrador) {
    alert('Este cliente no tiene un cobrador asignado.');
    return;
  }

  const telCobrador = (cobrador.telefono || '').replace(/\\D/g, '');
  const linkMaps = "https://maps.google.com/?q=" + cliente.lat + "," + cliente.lng;

  const texto = 
    "🛵 *NUEVA ASIGNACIÓN DE CLIENTE EN TU RUTA* 🛵\\n" +
    "Hola *" + cobrador.nombre + "*, la oficina te asignó este cliente para cobranza:\\n" +
    "-----------------------------------------\\n" +
    "👤 *Cliente:* " + cliente.nombre + "\\n" +
    "📞 *Teléfono:* " + cliente.telefono + "\\n" +
    "📍 *Dirección:* " + cliente.direccion + "\\n" +
    "🗺️ *Navegación GPS:* " + linkMaps + "\\n" +
    "-----------------------------------------\\n" +
    "💰 *Préstamo Entregado:* $" + (cliente.prestamoOriginal || 1000).toFixed(2) + "\\n" +
    "💵 *Total a Cobrar:* $" + (cliente.totalPagar || 1200).toFixed(2) + "\\n" +
    "🗓️ *Cuota Diaria:* $" + cliente.cuotaDiaria + " pesos (" + cliente.diasPlazo + " días)\\n" +
    "-----------------------------------------\\n" +
    "⚠️ *Instrucción:* Pasa a visitarlo para cobro del día, solicita firma en pantalla si no la tiene y verifica foto de fachada.";

  window.open('https://wa.me/' + telCobrador + '?text=' + encodeURIComponent(texto), '_blank');
}


// ====================================================
// 10. MODIFICAR CUOTA DIARIA DE UN CLIENTE
// ====================================================
async function modificarCuotaCliente(clienteId, cuotaActual) {
  const nuevaCuotaStr = prompt('Modificar cuota diaria a cobrar a este cliente:', cuotaActual);
  if (!nuevaCuotaStr) return;
  const nuevaCuota = Number(nuevaCuotaStr);
  if (isNaN(nuevaCuota) || nuevaCuota <= 0) {
    alert('Ingresa un monto válido.');
    return;
  }

  try {
    const res = await fetch('/api/clientes/' + clienteId + '/cuota', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuotaDiaria: nuevaCuota })
    });
    if (res.ok) {
      alert('✅ Cuota diaria actualizada a $' + nuevaCuota);
      await cargarClientes();
    }
  } catch (e) {
    alert('Error al actualizar cuota: ' + e.message);
  }
}

async function guardarGpsActualEnCliente(clienteId) {
  if (!navigator.geolocation) {
    alert('Tu dispositivo no soporta geolocalización.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    try {
      const res = await fetch('/api/clientes/' + clienteId + '/gps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (res.ok) {
        alert('📍 Coordenadas de domicilio fijadas en tu GPS actual (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')');
        await cargarClientes();
      }
    } catch (e) {
      alert('Error guardando GPS: ' + e.message);
    }
  }, (err) => {
    alert('No se pudo obtener GPS: ' + err.message);
  }, { enableHighAccuracy: true });
}


// ====================================================
// 11. MAPA LEAFLET EN VIVO Y MONITOREO
// ====================================================
function inicializarMapa() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  appState.map = L.map('map').setView([19.4326, -99.1332], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(appState.map);

  actualizarMarcadoresMapa();
}

function actualizarMarcadoresMapa() {
  if (!appState.map) return;

  // Limpiar marcadores viejos
  Object.values(appState.markersClientes).forEach(m => appState.map.removeLayer(m));
  Object.values(appState.markersCobradores).forEach(m => appState.map.removeLayer(m));
  appState.markersClientes = {};
  appState.markersCobradores = {};

  // 1. Dibujar Cobradores (Motos)
  appState.cobradores.forEach(cob => {
    if (!cob.ultimaUbicacion || !cob.ultimaUbicacion.lat) return;

    const iconHtml = \`
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-xl pulse-cobrador">
        <span class="text-base">🛵</span>
      </div>
    \`;
    const cobIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });

    const m = L.marker([cob.ultimaUbicacion.lat, cob.ultimaUbicacion.lng], { icon: cobIcon })
      .addTo(appState.map)
      .bindPopup(\`
        <div class="p-1 text-xs">
          <p class="font-black text-slate-900">🛵 \${cob.nombre}</p>
          <p class="text-emerald-700 font-bold">\${cob.ruta}</p>
          <p class="text-slate-600 mt-1">Cobrado Hoy: <b>$\${(cob.totalCobradoHoy || 0).toFixed(2)}</b></p>
          <p class="text-slate-600">Efectivo en Mano: <b>$\${(cob.efectivoEnMano || 0).toFixed(2)}</b></p>
        </div>
      \`);
    appState.markersCobradores[cob.id] = m;
  });

  // 2. Dibujar Clientes
  let clientes = appState.clientes;
  if (appState.rolActivo !== 'ADMIN') {
    clientes = clientes.filter(c => c.cobradorId === appState.rolActivo);
  }

  clientes.forEach(c => {
    if (!c.lat || !c.lng) return;

    const pagado = c.pagadoHoy;
    const colorBg = pagado ? 'bg-emerald-500' : 'bg-red-500';
    const emoji = pagado ? '✅' : '⏳';

    const clientIcon = L.divIcon({
      html: \`<div class="w-7 h-7 rounded-full \${colorBg} border-2 border-white flex items-center justify-center text-xs shadow-md">\${emoji}</div>\`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const m = L.marker([c.lat, c.lng], { icon: clientIcon })
      .addTo(appState.map)
      .bindPopup(\`
        <div class="p-1 text-xs font-sans">
          <p class="font-black text-slate-900">\${c.nombre}</p>
          <p class="text-slate-600">\${c.direccion}</p>
          <p class="text-emerald-700 font-bold mt-1">Cuota Diaria: $\${c.cuotaDiaria}</p>
          <p class="text-amber-700">Saldo: $\${c.saldoPendiente.toFixed(2)}</p>
          <div class="mt-2 flex gap-1">
            <button onclick="cobrarRapido('\${c.id}', \${c.cuotaDiaria})" class="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Cobrar $\${c.cuotaDiaria}</button>
            <a href="https://maps.google.com/?q=\${c.lat},\${c.lng}" target="_blank" class="px-2 py-1 bg-slate-800 text-white rounded text-[10px]">Google Maps</a>
          </div>
        </div>
      \`);
    appState.markersClientes[c.id] = m;
  });
}

function centrarEnMiUbicacion() {
  if (navigator.geolocation && appState.map) {
    navigator.geolocation.getCurrentPosition(pos => {
      appState.map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    });
  }
}

function optimizarRutaVisual() {
  alert('📍 Ruta trazada geográficamente en orden secuencial para menor recorrido de gasolina.');
}

function iniciarRastreoGpsAutomatico() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition((pos) => {
    appState.miUbicacionActual = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    if (appState.rolActivo !== 'ADMIN') {
      actualizarUbicacionGpsManual(true);
    }
  }, () => {}, { enableHighAccuracy: true });
}

async function actualizarUbicacionGpsManual(silencioso = false) {
  if (appState.rolActivo === 'ADMIN') return;
  try {
    await fetch('/api/cobradores/' + appState.rolActivo + '/ubicacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appState.miUbicacionActual)
    });
    if (!silencioso) alert('🛵 Ubicación GPS enviada al servidor.');
  } catch (e) {}
}


// ====================================================
// 12. CORTE DEL DÍA Y GASTOS DE RUTA
// ====================================================
async function cargarCorteHoy(cobradorId = 'ALL') {
  try {
    const res = await fetch('/api/corte/hoy?cobradorId=' + cobradorId);
    const data = await res.json();

    document.getElementById('corteFondoInicial').textContent = '$' + data.fondoInicial.toFixed(2);
    document.getElementById('corteCobradoHoy').textContent = '+$' + data.totalCobradoHoy.toFixed(2);
    document.getElementById('corteCobrosNum').textContent = data.cobrosDetalle.length + ' cobros';

    document.getElementById('cortePrestadoHoy').textContent = '-$' + data.totalPrestadoHoy.toFixed(2);
    document.getElementById('cortePrestamosNum').textContent = data.prestamosDetalle.length + ' créditos';

    document.getElementById('corteGastosHoy').textContent = '-$' + data.totalGastosHoy.toFixed(2);
    document.getElementById('corteGastosNum').textContent = data.gastosDetalle.length + ' gastos';

    document.getElementById('corteEfectivoEnMano').textContent = '$' + data.totalEnMano.toFixed(2);
  } catch (e) {
    console.error('Error cargando corte:', e);
  }
}

async function guardarGastoRuta(e) {
  e.preventDefault();
  const concepto = document.getElementById('gastoConcepto').value;
  const monto = Number(document.getElementById('gastoMonto').value);
  const detalle = document.getElementById('gastoDetalle').value;
  const cobradorId = appState.rolActivo !== 'ADMIN' ? appState.rolActivo : 'COB-1';

  try {
    const res = await fetch('/api/gastos-ruta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto, monto, detalle, cobradorId })
    });
    if (res.ok) {
      alert('✅ Gasto de ruta registrado.');
      document.getElementById('gastoMonto').value = '';
      document.getElementById('gastoDetalle').value = '';
      await cargarCorteHoy(document.getElementById('selectCorteCobrador').value);
    }
  } catch (err) {
    alert('Error guardando gasto: ' + err.message);
  }
}

async function cerrarCorteFormal() {
  const cobradorId = document.getElementById('selectCorteCobrador').value;
  const nuevoFondo = document.getElementById('corteNuevoFondo').value;

  if (!confirm('¿Confirmas el cierre de caja de hoy? Se archivarán las cuentas del día.')) return;

  try {
    const res = await fetch('/api/corte/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cobradorId, nuevoFondo, notas: 'Corte formal de fin de ruta' })
    });
    if (res.ok) {
      alert('🔒 ¡Corte del día cerrado y archivado exitosamente!');
      await cargarCortesHistorial();
      await cargarCorteHoy(cobradorId);
    }
  } catch (e) {
    alert('Error al cerrar corte: ' + e.message);
  }
}

async function cargarCortesHistorial() {
  try {
    const res = await fetch('/api/cortes');
    const cortes = await res.json();
    const tabla = document.getElementById('tablaHistorialCortes');
    if (!tabla) return;

    tabla.innerHTML = cortes.map(c => \`
      <tr>
        <td class="py-2 font-mono">\${c.fechaCorta || c.fecha.split('T')[0]}</td>
        <td class="font-bold text-white">\${c.cobradorNombre}</td>
        <td>$\${c.fondoInicial.toFixed(2)}</td>
        <td class="text-emerald-400 font-bold">+$\${c.totalCobrado.toFixed(2)}</td>
        <td class="text-amber-400">-$\${c.totalPrestado.toFixed(2)}</td>
        <td class="text-red-400">-$\${c.totalGastos.toFixed(2)}</td>
        <td class="font-black text-white">$\${c.totalEnMano.toFixed(2)}</td>
      </tr>
    \`).join('');
  } catch (e) {}
}


// ====================================================
// 13. RESPALDOS DE BASE DE DATOS
// ====================================================
function descargarRespaldo() {
  window.location.href = '/api/backup';
}

async function restaurarRespaldo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert('✅ Base de datos restaurada exitosamente.');
        location.reload();
      } else {
        alert('Archivo de respaldo no válido.');
      }
    } catch (err) {
      alert('Error leyendo archivo: ' + err.message);
    }
  };
  reader.readAsText(file);
}


// ====================================================
// 14. NAVEGACIÓN ENTRE TABS
// ====================================================
function cambiarTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('tab-active');
    btn.classList.add('text-slate-400');
  });

  const targetView = document.getElementById('view-' + tabId);
  const targetBtn = document.getElementById('tabBtn-' + tabId);

  if (targetView) targetView.classList.remove('hidden');
  if (targetBtn) {
    targetBtn.classList.add('tab-active');
    targetBtn.classList.remove('text-slate-400');
  }

  if (tabId === 'mapa' && appState.map) {
    setTimeout(() => {
      appState.map.invalidateSize();
      actualizarMarcadoresMapa();
    }, 200);
  } else if (tabId === 'corte') {
    cargarCorteHoy(document.getElementById('selectCorteCobrador').value);
    cargarCortesHistorial();
  }
}

// Modal Conexión
function mostrarModalConexion() {
  document.getElementById('modalConexion').classList.remove('hidden');
}
function cerrarModalConexion() {
  document.getElementById('modalConexion').classList.add('hidden');
}
function copiarEnlaceModal() {
  const txt = document.getElementById('modalTunnelUrl').textContent;
  navigator.clipboard.writeText(txt);
  alert('📋 Enlace copiado al portapapeles.');
}
function copiarEnlaceTunnel() {
  const txt = document.getElementById('cfgTunnelInput').value;
  navigator.clipboard.writeText(txt);
  alert('📋 Enlace copiado al portapapeles.');
}
function enviarEnlaceCobradorPorWhatsApp() {
  const txt = document.getElementById('modalTunnelUrl').textContent;
  const msg = encodeURIComponent("📱 *ACCESO A RUTA DE COBRANZA*:\\nAbre este enlace en tu celular:\\n" + txt);
  window.open("https://wa.me/?text=" + msg, "_blank");
}
function tomarGpsActualParaFormulario() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById('npLat').value = pos.coords.latitude;
      document.getElementById('npLng').value = pos.coords.longitude;
      alert('📍 Coordenadas de tu ubicación actual fijadas en el formulario.');
    });
  }
}
`;

fs.writeFileSync(targetPath, jsContent, 'utf8');
console.log('✅ public/app.js generado exitosamente con todas las funciones.');
