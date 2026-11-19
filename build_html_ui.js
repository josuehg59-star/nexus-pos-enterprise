const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\index.html';

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sistema de Crédito, Cobranza y Rutas GPS</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Leaflet Maps CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    #map { height: 480px; width: 100%; border-radius: 1.25rem; }
    .tab-active { background-color: #059669 !important; color: #ffffff !important; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .pulse-cobrador { animation: pulse-ring 2s infinite; }
    
    /* Signature Canvas styling */
    .signature-pad {
      border: 2px dashed #475569;
      border-radius: 0.75rem;
      background-color: #ffffff;
      touch-action: none;
      cursor: crosshair;
    }

    @media print {
      body * { visibility: hidden; }
      #printableArea, #printableArea * { visibility: visible; }
      #printableArea { position: absolute; left: 0; top: 0; width: 100%; }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">

  <!-- TOP HEADER -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-3 py-2.5 shadow-xl">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      
      <!-- Brand & Profile Selector -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
          <i data-lucide="badge-dollar-sign" class="w-6 h-6 text-white"></i>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 id="headerEmpresa" class="font-black text-sm sm:text-base tracking-wider uppercase text-white leading-tight">FINANCIERA CRÉDITO FÁCIL</h1>
            <span id="roleBadge" class="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-500/30">ADMIN</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <label for="selectRolActivo" class="text-[11px] text-slate-400 flex items-center gap-1">
              <i data-lucide="user-check" class="w-3 h-3 text-emerald-400"></i> Perfil:
            </label>
            <select id="selectRolActivo" onchange="cambiarPerfilActivo(this.value)" class="bg-slate-800 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-lg border border-slate-700 outline-none focus:border-emerald-500">
              <option value="ADMIN">👑 Administrador General (Oficina)</option>
              <!-- Cobradores se cargan dinámicamente -->
            </select>
          </div>
        </div>
      </div>

      <!-- Live GPS & Remote Link Banner -->
      <div class="flex items-center gap-2 ml-auto">
        <!-- Tunnel / WiFi Pill -->
        <button onclick="mostrarModalConexion()" class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="hidden sm:inline font-medium">Celulares 4G/WiFi:</span>
          <span id="tunnelStatusText" class="text-emerald-400 font-bold">Conectar Celular</span>
          <i data-lucide="smartphone" class="w-3.5 h-3.5 text-slate-400"></i>
        </button>

        <!-- Botón GPS en Vivo (Cobrador) -->
        <button id="btnGpsCobrador" onclick="actualizarUbicacionGpsManual()" title="Enviar mi ubicación actual" class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition">
          <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
          <span class="hidden sm:inline">Mi GPS</span>
        </button>
      </div>

    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <nav class="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-[61px] z-30 px-2 shadow-md">
    <div class="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-1 py-1.5">
      <button onclick="cambiarTab('cobranza')" id="tabBtn-cobranza" class="tab-btn tab-active flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0">
        <i data-lucide="wallet" class="w-4 h-4"></i>
        <span>Cobranza de Hoy</span>
        <span id="badgePendientesNav" class="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">0</span>
      </button>

      <button onclick="cambiarTab('mapa')" id="tabBtn-mapa" class="tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0">
        <i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i>
        <span>Mapa y Rutas GPS</span>
      </button>

      <button onclick="cambiarTab('nuevo')" id="tabBtn-nuevo" class="tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0">
        <i data-lucide="user-plus" class="w-4 h-4 text-teal-400"></i>
        <span>Nuevo Préstamo</span>
      </button>

      <button onclick="cambiarTab('corte')" id="tabBtn-corte" class="tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0">
        <i data-lucide="calculator" class="w-4 h-4 text-amber-400"></i>
        <span>Corte del Día</span>
      </button>

      <button onclick="cambiarTab('cobradores')" id="tabBtn-cobradores" class="tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0">
        <i data-lucide="users" class="w-4 h-4 text-cyan-400"></i>
        <span id="tabCobradoresLabel">Cobradores</span>
      </button>

      <button onclick="cambiarTab('config')" id="tabBtn-config" class="tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0">
        <i data-lucide="settings" class="w-4 h-4 text-purple-400"></i>
        <span>Ajustes & Respaldo</span>
      </button>
    </div>
  </nav>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto w-full p-3 sm:p-5 flex-1">

    <!-- ==================================================== -->
    <!-- TAB 1: COBRANZA DE HOY (LISTA DE CLIENTES EN RUTA) -->
    <!-- ==================================================== -->
    <section id="view-cobranza" class="tab-content block space-y-4">
      
      <!-- Top Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cobrado Hoy</p>
          <p id="kpiCobradoHoy" class="text-xl sm:text-2xl font-black text-emerald-400 mt-1">$0.00</p>
          <p id="kpiCobrosCount" class="text-[10px] text-slate-400 mt-0.5">0 cobros realizados</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta del Día</p>
          <p id="kpiMetaDia" class="text-xl sm:text-2xl font-black text-cyan-400 mt-1">$0.00</p>
          <p id="kpiAvancePct" class="text-[10px] text-slate-400 mt-0.5">0% completado</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clientes Pendientes</p>
          <p id="kpiPendientesCount" class="text-xl sm:text-2xl font-black text-amber-400 mt-1">0</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Por visitar hoy</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cartera en Calle</p>
          <p id="kpiTotalCartera" class="text-xl sm:text-2xl font-black text-indigo-400 mt-1">$0.00</p>
          <p id="kpiClientesTotal" class="text-[10px] text-slate-400 mt-0.5">0 préstamos activos</p>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
        <div class="relative flex-1 min-w-[200px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="inputBuscarCliente" oninput="filtrarClientes()" placeholder="Buscar cliente por nombre, dirección o teléfono..." class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500">
        </div>

        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button onclick="setFiltroEstado('TODOS')" id="btnFiltro-TODOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition">Todos</button>
          <button onclick="setFiltroEstado('PENDIENTES')" id="btnFiltro-PENDIENTES" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition">⏳ Pendientes</button>
          <button onclick="setFiltroEstado('COBRADOS')" id="btnFiltro-COBRADOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition">✅ Cobrados</button>
          <button onclick="setFiltroEstado('ATRASADOS')" id="btnFiltro-ATRASADOS" class="filtro-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition">⚠️ Con Atraso</button>
        </div>
      </div>

      <!-- Clients List -->
      <div id="listaClientesContenedor" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <!-- Render dinámico de tarjetas de clientes -->
      </div>
      
      <div id="sinClientesMensaje" class="hidden text-center py-12 text-slate-500">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm font-semibold">No se encontraron clientes con los filtros seleccionados.</p>
      </div>

    </section>


    <!-- ==================================================== -->
    <!-- TAB 2: MAPA GPS Y RUTAS EN VIVO -->
    <!-- ==================================================== -->
    <section id="view-mapa" class="tab-content hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-black text-white flex items-center gap-2">
            <i data-lucide="map" class="w-5 h-5 text-emerald-400"></i>
            Monitoreo en Vivo de Cobradores y Clientes
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Motos en ruta 🛵 | Clientes por cobrar 🔴 | Clientes cobrados 🟢</p>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="centrarEnMiUbicacion()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition">
            <i data-lucide="crosshair" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Centrar Mapa</span>
          </button>
          <button onclick="optimizarRutaVisual()" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition">
            <i data-lucide="route" class="w-3.5 h-3.5"></i>
            <span>Trazar Ruta Óptima</span>
          </button>
        </div>
      </div>

      <!-- Contenedor del Mapa -->
      <div class="relative bg-slate-900 border border-slate-800 rounded-3xl p-2 shadow-2xl overflow-hidden">
        <div id="map"></div>
      </div>

      <!-- Leyenda y Detalle de Cobradores en Ruta -->
      <div id="cobradoresMapaCards" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <!-- Tarjetas dinámicas de cada cobrador en vivo -->
      </div>
    </section>


    <!-- ==================================================== -->
    <!-- TAB 3: NUEVO PRÉSTAMO Y CALCULADORA DE COBROS DIARIOS -->
    <!-- ==================================================== -->
    <section id="view-nuevo" class="tab-content hidden space-y-5">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h2 class="text-base font-black text-white flex items-center gap-2">
          <i data-lucide="file-signature" class="w-5 h-5 text-teal-400"></i>
          Registro de Nuevo Préstamo y Pagaré Digital
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">Calcula cobros diarios exactos, firma digital en pantalla y foto de fachada.</p>
      </div>

      <!-- Planes Rápidos / Presets Populares -->
      <div class="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
        <p class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
          Seleccionar Plan Rápido de Cobro:
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button type="button" onclick="aplicarPresetPrestamo(1000, 20, 15, 80)" class="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700 text-left transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white group-hover:text-emerald-300">Plan 15 Días</span>
              <span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-black">POPULAR</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">$1,000 capital ➔ <b class="text-emerald-400">$80 diarios</b></p>
            <p class="text-[10px] text-slate-500">20% interés ($200)</p>
          </button>

          <button type="button" onclick="aplicarPresetPrestamo(1000, 20, 20, 60)" class="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700 text-left transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white group-hover:text-emerald-300">Plan 20 Días</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">$1,000 capital ➔ <b class="text-emerald-400">$60 diarios</b></p>
            <p class="text-[10px] text-slate-500">20% interés ($200)</p>
          </button>

          <button type="button" onclick="aplicarPresetPrestamo(1000, 20, 24, 50)" class="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700 text-left transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white group-hover:text-emerald-300">Plan 24 Días</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">$1,000 capital ➔ <b class="text-emerald-400">$50 diarios</b></p>
            <p class="text-[10px] text-slate-500">4 semanas lun-sáb</p>
          </button>

          <button type="button" onclick="aplicarPresetPrestamo(1000, 25, 30, 42)" class="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700 text-left transition group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white group-hover:text-emerald-300">Plan 30 Días</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">$1,000 capital ➔ <b class="text-emerald-400">$42 diarios</b></p>
            <p class="text-[10px] text-slate-500">25% interés ($250)</p>
          </button>
        </div>
      </div>

      <!-- Formulario Principal -->
      <form id="formNuevoPrestamo" onsubmit="guardarNuevoPrestamo(event)" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- Columna 1: Datos del Cliente -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <i data-lucide="user" class="w-4 h-4 text-emerald-400"></i>
            1. Datos del Cliente
          </h3>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo *</label>
            <input type="text" id="npNombre" required placeholder="Ej. Juan Pérez López" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Teléfono Móvil (WhatsApp) *</label>
            <input type="tel" id="npTelefono" required placeholder="Ej. 5512345678" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Dirección / Negocio *</label>
            <textarea id="npDireccion" required rows="2" placeholder="Calle, número, colonia, referencias..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500"></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Asignar a Cobrador / Ruta *</label>
            <select id="npCobrador" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500">
              <!-- Se llena dinámicamente -->
            </select>
          </div>

          <!-- Coordenadas GPS -->
          <div class="pt-1">
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-semibold text-slate-400">Ubicación GPS Domicilio</label>
              <button type="button" onclick="tomarGpsActualParaFormulario()" class="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                <i data-lucide="crosshair" class="w-3 h-3"></i> Mi GPS Actual
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input type="number" step="any" id="npLat" placeholder="Latitud" class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <input type="number" step="any" id="npLng" placeholder="Longitud" class="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            </div>
          </div>
        </div>

        <!-- Columna 2: Condiciones del Préstamo y Cobro Diario -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <i data-lucide="coins" class="w-4 h-4 text-teal-400"></i>
            2. Condiciones de Crédito
          </h3>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Capital Prestado ($) *</label>
              <input type="number" id="npCapital" oninput="calcularCondicionesPrestamo()" required min="100" step="50" value="1000" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">% Interés / Ganancia</label>
              <input type="number" id="npInteres" oninput="calcularCondicionesPrestamo()" required min="0" step="1" value="20" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Plazo (Días de Cobro)</label>
              <input type="number" id="npDiasPlazo" oninput="calcularCondicionesPrestamo()" required min="1" max="365" value="15" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Modalidad de Cobro</label>
              <select id="npModalidad" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500">
                <option value="DIARIO">Diario (Lunes a Sábado / Continuo)</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal (15 días)</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>
          </div>

          <!-- Cuota Diaria y Total a Pagar Calculados -->
          <div class="bg-slate-950 border border-emerald-500/30 p-3 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">Ganancia / Interés:</span>
              <span id="npResGanancia" class="text-xs font-bold text-teal-400">+$200.00</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">Total a Devolver:</span>
              <span id="npResTotalPagar" class="text-sm font-black text-white">$1,200.00</span>
            </div>
            <div class="border-t border-slate-800 pt-2 flex items-center justify-between">
              <div>
                <span class="text-xs font-black text-emerald-400 uppercase">Cuota Diaria a Cobrar:</span>
                <p class="text-[10px] text-slate-500">(Puedes modificarla a mano)</p>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-sm font-bold text-emerald-400">$</span>
                <input type="number" id="npCuotaDiaria" step="1" value="80" class="w-20 bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-sm font-black text-emerald-400 text-right focus:outline-none">
              </div>
            </div>
          </div>

          <!-- Datos de Aval (Opcional) -->
          <div class="border-t border-slate-800 pt-2">
            <p class="text-[11px] font-bold text-slate-400 mb-1">Datos de Aval o Garantía (Opcional)</p>
            <input type="text" id="npAvalNombre" placeholder="Nombre completo del aval" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 mb-1.5">
            <input type="tel" id="npAvalTelefono" placeholder="Teléfono del aval" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
          </div>
        </div>

        <!-- Columna 3: Foto de Fachada y Firma Digital en Pantalla -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <i data-lucide="camera" class="w-4 h-4 text-amber-400"></i>
              3. Foto de Fachada & Firma Digital
            </h3>

            <!-- Foto de Fachada -->
            <div class="mt-2.5">
              <label class="block text-xs font-semibold text-slate-400 mb-1">Foto de Fachada del Domicilio</label>
              <div class="flex items-center gap-2">
                <input type="file" id="inputFotoFachada" accept="image/*" capture="environment" onchange="procesarFotoFachada(event)" class="hidden">
                <button type="button" onclick="document.getElementById('inputFotoFachada').click()" class="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition">
                  <i data-lucide="camera" class="w-4 h-4 text-amber-400"></i>
                  <span>Tomar Foto / Galería</span>
                </button>
              </div>
              <!-- Preview de la foto -->
              <div id="previewFotoFachadaContenedor" class="hidden mt-2 relative rounded-xl overflow-hidden border border-slate-700 h-28 bg-black">
                <img id="previewFotoFachada" src="" class="w-full h-full object-cover">
                <button type="button" onclick="quitarFotoFachada()" class="absolute top-1 right-1 bg-red-600/80 text-white p-1 rounded-lg text-xs">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <!-- Firma Digital en Pantalla -->
            <div class="mt-3.5">
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <i data-lucide="pen-tool" class="w-3.5 h-3.5 text-teal-400"></i>
                  Firma Digital en Pantalla
                </label>
                <button type="button" onclick="abrirModalFirmaPantalla('NUEVO')" class="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1">
                  ✍️ Firmar en Pantalla
                </button>
              </div>

              <!-- Preview de la firma -->
              <div id="previewFirmaContenedor" class="border border-slate-700 rounded-xl bg-white/5 p-2 min-h-[75px] flex items-center justify-center text-center">
                <img id="imgFirmaPreview" src="" class="hidden max-h-16 mx-auto">
                <span id="txtSinFirma" class="text-xs text-slate-500 italic">Sin firma capturada aún.<br>El cliente puede firmar con el dedo en la pantalla.</span>
              </div>
            </div>
          </div>

          <!-- Botón de Registro -->
          <div class="pt-3">
            <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <span>FINALIZAR CONTRATO Y GUARDAR PRÉSTAMO</span>
            </button>
          </div>
        </div>

      </form>
    </section>


    <!-- ==================================================== -->
    <!-- TAB 4: CORTE DEL DÍA Y CIERRE DE CAJA -->
    <!-- ==================================================== -->
    <section id="view-corte" class="tab-content hidden space-y-4">
      
      <!-- Selector de Cobrador para Corte -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-black text-white flex items-center gap-2">
            <i data-lucide="badge-dollar-sign" class="w-5 h-5 text-amber-400"></i>
            Corte del Día y Conciliación de Efectivo en Ruta
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Control de fondo inicial, cobranza, préstamos y gastos de ruta.</p>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-400 font-semibold">Ver corte de:</label>
          <select id="selectCorteCobrador" onchange="cargarCorteHoy(this.value)" class="bg-slate-800 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none">
            <option value="ALL">🏢 Consolidado General (Toda la Empresa)</option>
            <!-- Opciones dinámicas de cobradores -->
          </select>
        </div>
      </div>

      <!-- Tarjetas Financieras del Corte -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
        <div class="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-slate-400 uppercase">Fondo Inicial</p>
          <p id="corteFondoInicial" class="text-lg sm:text-xl font-black text-slate-200 mt-1">$0.00</p>
          <p class="text-[10px] text-slate-500">Caja con que salió</p>
        </div>

        <div class="bg-slate-900 border border-emerald-500/30 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-emerald-400 uppercase">(+) Cobrado Hoy</p>
          <p id="corteCobradoHoy" class="text-lg sm:text-xl font-black text-emerald-400 mt-1">+$0.00</p>
          <p id="corteCobrosNum" class="text-[10px] text-slate-500">0 abonos</p>
        </div>

        <div class="bg-slate-900 border border-amber-500/30 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-amber-400 uppercase">(-) Préstamos Dados</p>
          <p id="cortePrestadoHoy" class="text-lg sm:text-xl font-black text-amber-400 mt-1">-$0.00</p>
          <p id="cortePrestamosNum" class="text-[10px] text-slate-500">0 colocados</p>
        </div>

        <div class="bg-slate-900 border border-red-500/30 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-bold text-red-400 uppercase">(-) Gastos de Ruta</p>
          <p id="corteGastosHoy" class="text-lg sm:text-xl font-black text-red-400 mt-1">-$0.00</p>
          <p id="corteGastosNum" class="text-[10px] text-slate-500">Gasolina, comidas</p>
        </div>

        <div class="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 p-3 sm:p-4 rounded-2xl">
          <p class="text-[11px] font-black text-emerald-300 uppercase">(=) EFECTIVO EN MANO</p>
          <p id="corteEfectivoEnMano" class="text-xl sm:text-2xl font-black text-emerald-400 mt-1">$0.00</p>
          <p class="text-[10px] text-emerald-200/70">A entregar a caja</p>
        </div>
      </div>

      <!-- Acciones del Corte: Registrar Gasto y Cerrar Día -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Registrar Gasto de Ruta -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <i data-lucide="receipt" class="w-4 h-4 text-red-400"></i>
            Registrar Gasto Operativo de Ruta
          </h3>
          <form onsubmit="guardarGastoRuta(event)" class="space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Concepto</label>
                <select id="gastoConcepto" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                  <option value="Gasolina Moto">Gasolina Moto</option>
                  <option value="Ponchadura / Taller">Ponchadura / Taller</option>
                  <option value="Alimentos Cobrador">Alimentos Cobrador</option>
                  <option value="Saldo Celular / Datos">Saldo Celular / Datos</option>
                  <option value="Otro Gasto">Otro Gasto</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Monto ($)</label>
                <input type="number" id="gastoMonto" required min="1" step="1" placeholder="Ej. 100" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold">
              </div>
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Detalle / Nota</label>
              <input type="text" id="gastoDetalle" placeholder="Detalle adicional..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
            </div>
            <button type="submit" class="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Agregar Gasto a la Ruta</span>
            </button>
          </form>
        </div>

        <!-- Cierre Formal de Caja -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <i data-lucide="lock" class="w-4 h-4 text-amber-400"></i>
              Cierre Formal de Ruta del Día
            </h3>
            <p class="text-xs text-slate-400 mt-2">
              Al cerrar el corte, se archiva el balance del día en el historial y se verifica el dinero entregado.
            </p>
            <div class="mt-3">
              <label class="block text-[11px] text-slate-400 mb-1">Nuevo Fondo Inicial para Mañana ($)</label>
              <input type="number" id="corteNuevoFondo" value="2000" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 font-bold">
            </div>
          </div>
          <button onclick="cerrarCorteFormal()" class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20 transition">
            <i data-lucide="check-check" class="w-4 h-4"></i>
            <span>CERRAR CORTE DE HOY Y ARCHIVAR</span>
          </button>
        </div>
      </div>

      <!-- Historial de Cortes Anteriores -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <i data-lucide="history" class="w-4 h-4 text-cyan-400"></i>
          Historial de Cortes Archivados
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-2">Fecha</th>
                <th>Cobrador</th>
                <th>Fondo</th>
                <th>Cobrado</th>
                <th>Prestado</th>
                <th>Gastos</th>
                <th>Total en Mano</th>
              </tr>
            </thead>
            <tbody id="tablaHistorialCortes" class="divide-y divide-slate-800 text-slate-300">
              <!-- Render dinámico -->
            </tbody>
          </table>
        </div>
      </div>

    </section>


    <!-- ==================================================== -->
    <!-- TAB 5: GESTIÓN DE COBRADORES (ADMIN) -->
    <!-- ==================================================== -->
    <section id="view-cobradores" class="tab-content hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-black text-white flex items-center gap-2">
            <i data-lucide="users" class="w-5 h-5 text-cyan-400"></i>
            Administración de Repartidores y Cobradores
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Agrega cobradores, asigna rutas, configura fondos iniciales y supervisa su avance.</p>
        </div>

        <button onclick="abrirModalNuevoCobrador()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>+ Nuevo Cobrador</span>
        </button>
      </div>

      <!-- Tarjetas de Cobradores -->
      <div id="listaCobradoresContenedor" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Render dinámico -->
      </div>
    </section>


    <!-- ==================================================== -->
    <!-- TAB 6: AJUSTES, TÚNEL REMOTO Y RESPALDOS -->
    <!-- ==================================================== -->
    <section id="view-config" class="tab-content hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h2 class="text-base font-black text-white flex items-center gap-2">
          <i data-lucide="settings" class="w-5 h-5 text-purple-400"></i>
          Configuración de Financiera y Respaldos
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">Control de datos de la empresa, conexión remota 4G/WiFi y copias de seguridad.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Datos de Empresa -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            Datos de la Empresa / Financiera
          </h3>
          <form onsubmit="guardarAjustesEmpresa(event)" class="space-y-2.5">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Nombre Comercial</label>
              <input type="text" id="cfgEmpresa" value="FINANCIERA CRÉDITO FÁCIL" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-bold">
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Eslogan / Giro</label>
              <input type="text" id="cfgEslogan" value="Préstamos Diarios y Soluciones al Instante" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Teléfono Matriz</label>
                <input type="text" id="cfgTelefono" value="55 1234 5678" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100">
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">PIN Maestro Admin</label>
                <input type="password" id="cfgPinAdmin" value="1234" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100">
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Dirección de Oficina</label>
              <input type="text" id="cfgDireccion" value="Av. Central #120, Col. Centro, CDMX" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100">
            </div>
            <button type="submit" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition">
              Guardar Cambios de Financiera
            </button>
          </form>
        </div>

        <!-- Conexión Remota y Respaldos -->
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Conexión para Celulares (Datos 4G/WiFi)
            </h3>
            <div class="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <p class="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                Enlace Público Túnel Remoto:
              </p>
              <div class="flex items-center gap-2">
                <input type="text" readonly id="cfgTunnelInput" value="Cargando..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono select-all">
                <button onclick="copiarEnlaceTunnel()" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition">Copiar</button>
              </div>
              <p class="text-[10px] text-slate-500">Abre este enlace en el celular del cobrador desde cualquier parte.</p>
            </div>
          </div>

          <!-- Respaldos de Base de Datos -->
          <div class="space-y-2 border-t border-slate-800 pt-3">
            <h4 class="text-xs font-bold text-slate-300">Copia de Seguridad de la Cartera</h4>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="descargarRespaldo()" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                <i data-lucide="download" class="w-3.5 h-3.5 text-cyan-400"></i>
                <span>Descargar Copia</span>
              </button>
              <div>
                <input type="file" id="inputRestaurar" accept=".json" onchange="restaurarRespaldo(event)" class="hidden">
                <button onclick="document.getElementById('inputRestaurar').click()" class="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                  <i data-lucide="upload" class="w-3.5 h-3.5 text-amber-400"></i>
                  <span>Restaurar Copia</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>


  <!-- ==================================================== -->
  <!-- MODALES DEL SISTEMA -->
  <!-- ==================================================== -->

  <!-- MODAL 1: RECIBO AUTOMÁTICO DE WHATSAPP -->
  <div id="modalReciboWhatsApp" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
          </div>
          <h3 class="text-sm font-black text-white">¡PAGO REGISTRADO CON ÉXITO!</h3>
        </div>
        <button onclick="cerrarModalRecibo()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Comprobante Preview -->
      <div id="reciboPreviewBox" class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
        <!-- Render dinámico -->
      </div>

      <!-- Botones de Acción -->
      <div class="space-y-2 pt-1">
        <button id="btnEnviarWhatsAppRecibo" onclick="enviarReciboWhatsAppAction()" class="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition">
          <i data-lucide="message-circle" class="w-5 h-5"></i>
          <span>ENVIAR RECIBO FORMAL POR WHATSAPP</span>
        </button>
        <button onclick="cerrarModalRecibo()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition">
          Continuar Cobrando
        </button>
      </div>
    </div>
  </div>


  <!-- MODAL 2: FIRMA DIGITAL EN PANTALLA TÁCTIL (CANVAS) -->
  <div id="modalFirmaPantalla" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 class="text-sm font-black text-white flex items-center gap-2">
            <i data-lucide="pen-tool" class="w-4 h-4 text-teal-400"></i>
            FIRMA DIGITAL EN PANTALLA
          </h3>
          <p id="subtituloModalFirma" class="text-xs text-slate-400">Solicite al cliente firmar con el dedo sobre la pantalla.</p>
        </div>
        <button onclick="cerrarModalFirma()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Canvas Táctil -->
      <div class="bg-white rounded-2xl p-2 border-2 border-slate-700 shadow-inner flex flex-col items-center">
        <canvas id="canvasFirma" width="440" height="200" class="signature-pad w-full"></canvas>
      </div>

      <!-- Acciones de Firma -->
      <div class="flex items-center justify-between gap-2 pt-1">
        <button type="button" onclick="limpiarCanvasFirma()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Borrar / Limpiar</span>
        </button>
        <button type="button" onclick="confirmarFirmaCapturada()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition">
          <i data-lucide="check" class="w-4 h-4"></i>
          <span>Confirmar y Guardar Firma</span>
        </button>
      </div>
    </div>
  </div>


  <!-- MODAL 3: PAGARÉ DIGITAL Y CONTRATO LEGAL CON FIRMA -->
  <div id="modalPagareLegal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl my-auto max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
        <div>
          <h3 class="text-sm font-black text-white flex items-center gap-2">
            <i data-lucide="scroll-text" class="w-4 h-4 text-emerald-400"></i>
            PAGARÉ MERCANTIL Y CONTRATO DIGITAL
          </h3>
          <p class="text-[11px] text-slate-400">Documento formal con validez legal según la ley mercantil de México.</p>
        </div>
        <button onclick="cerrarModalPagare()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Contenido del Pagaré (Imprimible) -->
      <div id="printableArea" class="bg-white text-slate-900 p-5 rounded-2xl overflow-y-auto flex-1 font-serif text-xs space-y-3 border border-slate-300 shadow-inner">
        <!-- Render dinámico del contrato legal y pagaré -->
      </div>

      <!-- Botones de Acción -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 shrink-0">
        <button onclick="imprimirPagare()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition">
          <i data-lucide="printer" class="w-3.5 h-3.5"></i>
          <span>Imprimir / Guardar en PDF</span>
        </button>
        <button id="btnCompartirPagareWa" onclick="compartirPagareWhatsApp()" class="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          <span>Enviar Contrato por WhatsApp</span>
        </button>
        <button onclick="cerrarModalPagare()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition">
          Cerrar
        </button>
      </div>
    </div>
  </div>


  <!-- MODAL 4: REGISTRAR PAGO CON OTRO MONTO O MODIFICAR CUOTA -->
  <div id="modalAbonoManual" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 id="modalAbonoTitulo" class="text-sm font-black text-white">Registrar Cobro</h3>
        <button onclick="cerrarModalAbono()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <form onsubmit="confirmarAbonoManual(event)" class="space-y-3">
        <input type="hidden" id="abonoClienteId">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Monto a Cobrar ($)</label>
          <input type="number" id="abonoMontoInput" required min="1" step="1" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-black text-emerald-400 focus:outline-none focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Concepto / Tipo de Cobro</label>
          <select id="abonoTipoInput" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
            <option value="CUOTA_DIARIA">Cuota Diaria Regular</option>
            <option value="ABONO_PARCIAL">Abono Parcial</option>
            <option value="ADELANTO_CUOTAS">Adelanto de Cuotas</option>
            <option value="LIQUIDACION_TOTAL">Liquidación Total de Saldo</option>
          </select>
        </div>
        <button type="submit" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition">
          Confirmar Cobro y Generar Recibo
        </button>
      </form>
    </div>
  </div>


  <!-- MODAL 5: NUEVO COBRADOR -->
  <div id="modalNuevoCobrador" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 class="text-sm font-black text-white">Nuevo Cobrador / Repartidor</h3>
        <button onclick="cerrarModalNuevoCobrador()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <form onsubmit="guardarNuevoCobrador(event)" class="space-y-2.5">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Nombre Completo *</label>
          <input type="text" id="ncNombre" required placeholder="Ej. Juan Pérez" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Teléfono (WhatsApp)</label>
          <input type="tel" id="ncTelefono" placeholder="5512345678" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Ruta Asignada</label>
          <input type="text" id="ncRuta" placeholder="Ej. Ruta 3 - Oriente" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Fondo Inicial Diario ($)</label>
          <input type="number" id="ncFondo" value="1500" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold">
        </div>
        <button type="submit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition">
          Guardar Cobrador
        </button>
      </form>
    </div>
  </div>


  <!-- MODAL 6: MODAL CONEXIÓN CELULAR 4G/WIFI -->
  <div id="modalConexion" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 class="text-sm font-black text-white flex items-center gap-1.5">
          <i data-lucide="smartphone" class="w-4 h-4 text-emerald-400"></i>
          Conectar Celular del Cobrador
        </h3>
        <button onclick="cerrarModalConexion()" class="text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <p class="text-xs text-slate-400">
        Para usar el sistema en la calle con datos 4G/5G o en cualquier red WiFi, abre el siguiente enlace en el celular:
      </p>
      <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
        <p class="text-[10px] text-emerald-400 font-bold uppercase">Enlace de Acceso Remoto:</p>
        <p id="modalTunnelUrl" class="text-xs text-white font-mono break-all select-all font-bold">Cargando...</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="copiarEnlaceModal()" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">
          Copiar Enlace
        </button>
        <button onclick="enviarEnlaceCobradorPorWhatsApp()" class="flex-1 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition">
          Enviar por WhatsApp
        </button>
      </div>
    </div>
  </div>

  <!-- SCRIPT LÓGICO PRINCIPAL -->
  <script src="app.js"></script>
</body>
</html>`;

fs.writeFileSync(targetPath, htmlContent, 'utf8');
console.log('✅ public/index.html generado exitosamente.');
