const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sistema de Crédito, Préstamos y Cobranza en Ruta</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Leaflet Maps CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    #map { height: 460px; width: 100%; border-radius: 1.25rem; }
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
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">

  <!-- TOP BAR & HEADER -->
  <header class="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-3 py-2.5 shadow-xl">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
      
      <!-- Brand & Cobrador info -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
          <i data-lucide="badge-dollar-sign" class="w-6 h-6 text-white"></i>
        </div>
        <div>
          <h1 id="headerEmpresa" class="font-black text-sm sm:text-base tracking-wider uppercase text-white leading-tight">FINANCIERA CRÉDITO FÁCIL</h1>
          <p class="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span id="headerCobrador">Cobrador: Carlos Gómez (Ruta 1)</span>
          </p>
        </div>
      </div>

      <!-- Action Buttons in Top Header -->
      <div class="flex items-center gap-2">
        <!-- BOTÓN CONEXIÓN CELULAR 4G/5G / EN LA CALLE -->
        <button onclick="abrirModalConectarCelular()" class="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md">
          <i data-lucide="smartphone" class="w-4 h-4 text-indigo-400"></i>
          <span class="hidden sm:inline">Conectar Celular</span> (4G/5G)
        </button>

        <!-- KPI Cobrado Hoy -->
        <div class="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-xl text-right">
          <span class="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">Cobrado Hoy</span>
          <span id="navCobradoHoy" class="font-black text-xs sm:text-sm text-white font-mono">$0.00</span>
        </div>

        <!-- Refresh Button -->
        <button onclick="refreshData()" title="Recargar datos" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
          <i data-lucide="rotate-cw" class="w-4 h-4"></i>
        </button>
      </div>

    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <nav class="bg-slate-900/95 border-b border-slate-800 sticky top-[57px] z-30 px-2 py-1.5 backdrop-blur-md">
    <div class="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto text-xs font-bold no-scrollbar">
      <button onclick="switchTab('dashboard')" id="tabBtn-dashboard" class="tab-btn tab-active px-3 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
      </button>
      <button onclick="switchTab('ruta')" id="tabBtn-ruta" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="bike" class="w-4 h-4"></i> Ruta y Cobranza
      </button>
      <button onclick="switchTab('mapa')" id="tabBtn-mapa" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="map" class="w-4 h-4"></i> Monitoreo GPS en Vivo
      </button>
      <button onclick="switchTab('corte')" id="tabBtn-corte" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-amber-300 border border-amber-500/20 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="scissors" class="w-4 h-4 text-amber-400"></i> Corte del Día
      </button>
      <button onclick="switchTab('nuevo')" id="tabBtn-nuevo" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="user-plus" class="w-4 h-4"></i> Nuevo Préstamo
      </button>
      <button onclick="switchTab('historial')" id="tabBtn-historial" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="receipt" class="w-4 h-4"></i> Historial
      </button>
      <button onclick="switchTab('config')" id="tabBtn-config" class="tab-btn px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center gap-2 transition-all shrink-0">
        <i data-lucide="settings" class="w-4 h-4"></i> Configuración
      </button>
    </div>
  </nav>

  <!-- MAIN VIEWPORT -->
  <main class="max-w-7xl mx-auto p-3 sm:p-5 flex-1 w-full space-y-5">

    <!-- ========================================== -->
    <!-- TAB 1: DASHBOARD / RESUMEN GENERAL -->
    <!-- ========================================== -->
    <div id="tab-dashboard" class="tab-content space-y-5">
      
      <!-- 4 BIG CARDS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative shadow-lg">
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cartera Prestada</span>
            <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400"><i data-lucide="badge-dollar-sign" class="w-4 h-4"></i></div>
          </div>
          <p id="dashCartera" class="text-xl sm:text-2xl font-black text-white font-mono">$0.00</p>
          <span class="text-[10px] text-slate-400 mt-1 block">Capital total en calle</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative shadow-lg">
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Saldo por Cobrar</span>
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400"><i data-lucide="hourglass" class="w-4 h-4"></i></div>
          </div>
          <p id="dashPorCobrar" class="text-xl sm:text-2xl font-black text-amber-300 font-mono">$0.00</p>
          <span class="text-[10px] text-slate-400 mt-1 block">Saldo pendiente activo</span>
        </div>

        <div class="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl relative shadow-lg shadow-emerald-500/5">
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Cobrado Hoy</span>
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><i data-lucide="check-circle" class="w-4 h-4"></i></div>
          </div>
          <p id="dashCobradoHoy" class="text-xl sm:text-2xl font-black text-emerald-400 font-mono">$0.00</p>
          <span class="text-[10px] text-emerald-300/80 mt-1 block">Ingreso de la jornada</span>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative shadow-lg">
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Meta del Día</span>
            <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><i data-lucide="target" class="w-4 h-4"></i></div>
          </div>
          <p id="dashMetaDia" class="text-xl sm:text-2xl font-black text-indigo-300 font-mono">$0.00</p>
          <span class="text-[10px] text-slate-400 mt-1 block">Cuotas a cobrar hoy</span>
        </div>
      </div>

      <!-- PROGRESS BAR DEL DÍA -->
      <div class="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
        <div class="flex justify-between items-center text-xs font-bold">
          <span class="text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i> Avance de Cobranza del Día
          </span>
          <span id="dashProgresoPorc" class="font-black font-mono text-emerald-400 text-sm">0%</span>
        </div>
        <div class="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div id="dashProgresoBar" class="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        <div class="flex justify-between text-[11px] text-slate-400 font-bold">
          <span id="dashCobradosCount" class="text-emerald-400">0 cobrados hoy</span>
          <span id="dashPendientesCount" class="text-amber-400">0 pendientes</span>
        </div>
      </div>

      <!-- STATUS SUMMARY -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-slate-900/80 border border-emerald-500/30 p-3.5 rounded-xl text-center">
          <span class="text-2xl font-black text-emerald-400 block" id="countAlDia">0</span>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clientes Al Día</span>
        </div>
        <div class="bg-slate-900/80 border border-rose-500/30 p-3.5 rounded-xl text-center">
          <span class="text-2xl font-black text-rose-400 block" id="countRetrasados">0</span>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Con Atraso</span>
        </div>
        <div class="bg-slate-900/80 border border-blue-500/30 p-3.5 rounded-xl text-center">
          <span class="text-2xl font-black text-blue-400 block" id="countLiquidados">0</span>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Liquidados</span>
        </div>
        <div class="bg-slate-900/80 border border-indigo-500/30 p-3.5 rounded-xl text-center">
          <span class="text-2xl font-black text-indigo-400 block" id="countTotal">0</span>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Clientes</span>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onclick="switchTab('corte')" class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex items-center justify-between text-left hover:border-amber-500 transition-all">
          <div>
            <h4 class="font-black text-xs uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <i data-lucide="scissors" class="w-4 h-4 text-amber-400"></i> Realizar Corte del Día
            </h4>
            <p class="text-[11px] text-slate-400 mt-1">Revisa el arqueo de efectivo en mano, fondo inicial y envía el corte por WhatsApp.</p>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-amber-400 shrink-0"></i>
        </button>

        <button onclick="iniciarNuevoDia()" class="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between text-left hover:border-emerald-500 transition-all">
          <div>
            <h4 class="font-black text-xs uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <i data-lucide="sun" class="w-4 h-4 text-emerald-400"></i> Iniciar Nueva Jornada
            </h4>
            <p class="text-[11px] text-slate-400 mt-1">Reinicia los estados de cobro para hoy y suma días de retraso a quienes no pagaron ayer.</p>
          </div>
          <i data-lucide="calendar-plus" class="w-5 h-5 text-emerald-400 shrink-0"></i>
        </button>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- TAB 2: RUTA Y COBRANZA EN CALLE -->
    <!-- ========================================== -->
    <div id="tab-ruta" class="tab-content hidden space-y-4">
      
      <!-- CONTROLES DE BÚSQUEDA Y FILTRO -->
      <div class="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <!-- Search bar -->
        <div class="relative flex-1 min-w-[220px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" id="rutaSearch" oninput="renderRutaClients()" placeholder="Buscar por nombre, teléfono, calle o ID..." 
                 class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 outline-none">
        </div>
        
        <!-- Filter chips -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
          <button onclick="setRutaFilter('TODOS')" id="flt-TODOS" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold transition-all">Todos</button>
          <button onclick="setRutaFilter('PENDIENTE')" id="flt-PENDIENTE" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold transition-all hover:bg-slate-700">⏳ Pendientes Hoy</button>
          <button onclick="setRutaFilter('PAGADO')" id="flt-PAGADO" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold transition-all hover:bg-slate-700">✅ Cobrados Hoy</button>
          <button onclick="setRutaFilter('ATRASO')" id="flt-ATRASO" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold transition-all hover:bg-slate-700">⚠️ Con Atraso</button>
        </div>
      </div>

      <!-- LISTA DE CLIENTES EN RUTA -->
      <div id="listaClientesRuta" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Injected dynamically -->
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 3: MONITOREO GPS EN VIVO (ADMIN Y RUTA) -->
    <!-- ========================================== -->
    <div id="tab-mapa" class="tab-content hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h3 class="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
            <i data-lucide="map-pinned" class="w-4 h-4 text-emerald-400"></i> Monitoreo GPS de Ruta en Tiempo Real
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">El administrador puede ver exactamente dónde está el cobrador, qué clientes ya cobró (verde) y cuáles le faltan (rojo).</p>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            Cobrador en vivo
          </span>
          <button onclick="centrarEnCobrador()" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg">
            <i data-lucide="navigation" class="w-3.5 h-3.5"></i> Ver Mi Ubicación
          </button>
        </div>
      </div>

      <!-- MAP CONTAINER -->
      <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-2xl relative">
        <div id="map"></div>

        <!-- Map Legend Floating Pill -->
        <div class="absolute bottom-5 left-5 z-[500] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl text-[10px] font-bold space-y-1.5 shadow-xl text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500 border-2 border-white inline-block"></span>
            <span>Cobrador en Ruta (En Vivo)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span>Cliente Cobrado Hoy ✅</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500 border border-white inline-block"></span>
            <span>Pendiente de Cobro Hoy ⏳</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 4: CORTE DEL DÍA / ARQUEO DE CAJA -->
    <!-- ========================================== -->
    <div id="tab-corte" class="tab-content hidden max-w-3xl mx-auto space-y-5">
      
      <!-- CARD PRINCIPAL DEL CORTE -->
      <div class="bg-slate-900 border border-amber-500/40 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-5">
        <div class="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">CIERRE Y ARQUEO DIARIO</span>
            <h3 class="text-xl font-black text-white">Corte de Caja de la Jornada</h3>
            <p id="corteFechaStr" class="text-xs text-slate-400 font-mono mt-0.5">Fecha: Hoy</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Cobrador Responsable</span>
            <span id="corteCobradorNombre" class="font-black text-sm text-white">Carlos Gómez</span>
          </div>
        </div>

        <!-- CUADRE DE EFECTIVO -->
        <div class="space-y-2.5 font-mono text-xs">
          <div class="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span class="text-slate-300 font-bold flex items-center gap-2">
              <i data-lucide="wallet" class="w-4 h-4 text-blue-400"></i> Fondo Inicial de Caja (Mañana)
            </span>
            <span id="corteFondoInicial" class="font-black text-white text-sm">$0.00</span>
          </div>

          <div class="flex justify-between items-center bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 text-emerald-300">
            <span class="font-bold flex items-center gap-2">
              <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-400"></i> (+) Cobranza Total Recibida (Abonos)
            </span>
            <span id="corteTotalCobrado" class="font-black text-emerald-400 text-sm">+$0.00</span>
          </div>

          <div class="flex justify-between items-center bg-rose-950/30 p-3 rounded-xl border border-rose-500/20 text-rose-300">
            <span class="font-bold flex items-center gap-2">
              <i data-lucide="minus-circle" class="w-4 h-4 text-rose-400"></i> (-) Préstamos Nuevos Entregados en Efectivo
            </span>
            <span id="corteTotalPrestado" class="font-black text-rose-400 text-sm">-$0.00</span>
          </div>

          <div class="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-amber-300">
            <span class="font-bold flex items-center gap-2">
              <i data-lucide="fuel" class="w-4 h-4 text-amber-400"></i> (-) Gastos de Ruta (Gasolina / Viáticos)
            </span>
            <span id="corteTotalGastos" class="font-black text-amber-400 text-sm">-$0.00</span>
          </div>
        </div>

        <!-- TOTAL NETO EN MANO A ENTREGAR (DESTACADO) -->
        <div class="bg-gradient-to-r from-amber-950/80 via-slate-950 to-emerald-950/80 border-2 border-amber-500/60 p-5 rounded-2xl text-center shadow-xl space-y-1">
          <span class="text-xs font-black uppercase tracking-widest text-amber-300">EFECTIVO NETO A ENTREGAR EN MANO</span>
          <p id="corteTotalEnMano" class="text-3xl sm:text-4xl font-black text-white font-mono my-1">$0.00 MXN</p>
          <span class="text-[11px] text-slate-300 font-semibold block">Total físico que el cobrador entrega a la administración</span>
        </div>

        <!-- BOTÓN AGREGAR GASTO DE RUTA -->
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-300">¿Hubo gastos de gasolina o moto hoy?</span>
          <button onclick="abrirModalGastoRuta()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Registrar Gasto
          </button>
        </div>

        <!-- BOTONES DE ACCIÓN DEL CORTE -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button onclick="compartirCorteWhatsApp()" class="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
            <i data-lucide="message-circle" class="w-4 h-4"></i> Enviar Corte por WhatsApp
          </button>

          <button onclick="imprimirTicketCorte()" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
            <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Ticket de Corte
          </button>
        </div>

        <button onclick="cerrarYArchivarCorte()" class="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
          <i data-lucide="lock" class="w-4 h-4"></i> Guardar y Cerrar Corte Oficialmente
        </button>

      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 5: REGISTRO DE NUEVO PRÉSTAMO -->
    <!-- ========================================== -->
    <div id="tab-nuevo" class="tab-content hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- FORMULARIO -->
        <div class="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div class="border-b border-slate-800 pb-3">
            <h3 class="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <i data-lucide="user-plus" class="w-4 h-4 text-emerald-400"></i> Registrar Nuevo Préstamo / Cliente
            </h3>
            <p class="text-xs text-slate-400 mt-1">Completa los datos del cliente, aval y fotografía de fachada.</p>
          </div>

          <form id="formNuevoPrestamo" onsubmit="handleCrearPrestamo(event)" class="space-y-4">
            
            <!-- Datos del Cliente -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Nombre Completo del Cliente *</label>
                <input type="text" id="npNombre" required placeholder="Ej. Juan Manuel Pérez García" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:border-emerald-500 outline-none">
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Teléfono / WhatsApp (10 dígitos) *</label>
                <input type="tel" id="npTelefono" required placeholder="52 961 123 4567" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-white focus:border-emerald-500 outline-none">
              </div>
            </div>

            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Dirección / Negocio / Referencia *</label>
              <input type="text" id="npDireccion" required placeholder="Calle 4a Poniente #25, Col. Centro (Frente a la tienda)" 
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:border-emerald-500 outline-none">
            </div>

            <!-- FOTO FACHADA AL DAR DE ALTA -->
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-[11px] font-bold text-white block">🏠 Foto Fachada del Domicilio o Negocio</span>
                  <span id="npFotoFachadaStatus" class="text-[10px] text-slate-400">Toma una foto de la casa/tienda para reconocerla en la ruta</span>
                </div>
                <label class="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow">
                  <i data-lucide="camera" class="w-4 h-4"></i> Tomar Foto
                  <input type="file" id="npFotoInput" accept="image/*" capture="environment" onchange="handleFotoFachadaNuevo(event)" class="hidden">
                </label>
              </div>
              <div id="npFotoPreviewContainer" class="hidden">
                <img id="npFotoPreview" src="" class="h-28 rounded-xl object-cover border border-slate-700 mx-auto">
              </div>
            </div>

            <!-- Datos Financieros -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Monto a Prestar *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" id="npMonto" oninput="simularPrestamo()" required min="100" step="50" value="2000" 
                         class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono font-black text-white focus:border-emerald-500 outline-none">
                </div>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Interés (%) *</label>
                <div class="relative">
                  <input type="number" id="npInteres" oninput="simularPrestamo()" required min="1" max="100" value="20" 
                         class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-black text-white focus:border-emerald-500 outline-none">
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Modalidad de Cobro</label>
                <select id="npModalidad" onchange="simularPrestamo()" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-300 focus:border-emerald-500 outline-none">
                  <option value="DIARIO">DIARIO (Lun-Sáb)</option>
                  <option value="SEMANAL">SEMANAL (Semana)</option>
                  <option value="CATORCENAL">CATORCENAL (14 días)</option>
                  <option value="QUINCENAL">QUINCENAL (Día 15 y 30)</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Plazo Total (Días) *</label>
                <input type="number" id="npDias" oninput="simularPrestamo()" required min="5" max="365" value="24" 
                       class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-black text-white focus:border-emerald-500 outline-none">
              </div>
            </div>

            <!-- Datos del Aval (Opcional para Pagaré) -->
            <div class="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Datos del Aval / Fiador (Para el Pagaré Legal)</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" id="npAvalNombre" placeholder="Nombre completo del Aval" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
                <input type="tel" id="npAvalTelefono" placeholder="Teléfono del Aval" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
                <input type="text" id="npAvalDireccion" placeholder="Dirección del Aval" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
              </div>
            </div>

            <!-- GPS Location Picker Button -->
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span class="text-[11px] font-bold text-white block">Ubicación GPS de la Casa o Negocio</span>
                <span id="gpsCoordsText" class="text-[10px] text-slate-400 font-mono">Ubicación central predeterminada</span>
              </div>
              <button type="button" onclick="capturarGpsClienteNuevo()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5">
                <i data-lucide="crosshair" class="w-4 h-4"></i> Capturar GPS Actual
              </button>
            </div>

            <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i> Crear y Autorizar Préstamo
            </button>
          </form>
        </div>

        <!-- SIMULADOR EN VIVO -->
        <div class="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">RESUMEN DEL CRÉDITO</span>
            <h4 class="text-base font-black text-white">Simulador en Tiempo Real</h4>
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 mt-4 font-mono">
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">Capital a entregar:</span>
                <span id="simCapital" class="font-bold text-white">$2,000.00</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">Interés calculado:</span>
                <span id="simInteres" class="font-bold text-emerald-400">+$400.00 (20%)</span>
              </div>
              <div class="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-black">
                <span class="text-slate-300">Total a Pagar:</span>
                <span id="simTotal" class="text-white">$2,400.00</span>
              </div>
              <div class="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-lg text-center mt-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block" id="simModalidadTitulo">Cuota Diaria a Cobrar</span>
                <span id="simCuota" class="text-2xl font-black text-emerald-400 block my-0.5">$100.00 / día</span>
                <span id="simPlazoTexto" class="text-[10px] text-slate-400 block">por 24 días</span>
              </div>
            </div>
          </div>
          <div class="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
            ℹ️ El préstamo generará el pagaré legal correspondiente y se agregará a la ruta del cobrador con su GPS.
          </div>
        </div>

      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 6: HISTORIAL DE COBROS DEL DÍA -->
    <!-- ========================================== -->
    <div id="tab-historial" class="tab-content hidden space-y-3">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h3 class="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
            <i data-lucide="receipt" class="w-4 h-4 text-emerald-400"></i> Historial Reciente de Abonos
          </h3>
          <p class="text-[11px] text-slate-400">Registro con fecha, hora, monto y cobrador de cada pago recibido.</p>
        </div>
        <span id="historialTotalCount" class="text-xs font-bold text-slate-400">0 cobros</span>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th class="p-3">Hora / Fecha</th>
                <th class="p-3">Cliente</th>
                <th class="p-3">Monto Abonado</th>
                <th class="p-3">Saldo Restante</th>
                <th class="p-3">Cobrador</th>
                <th class="p-3 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody id="historialTableBody" class="divide-y divide-slate-800/60 font-medium">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 7: CONFIGURACIÓN Y RESPALDOS -->
    <!-- ========================================== -->
    <div id="tab-config" class="tab-content hidden max-w-2xl mx-auto space-y-4">
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div class="border-b border-slate-800 pb-3">
          <h3 class="font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
            <i data-lucide="settings" class="w-4 h-4 text-emerald-400"></i> Configuración de la Financiera
          </h3>
          <p class="text-xs text-slate-400 mt-1">Personaliza el nombre de tu empresa, el cobrador en ruta y los parámetros por defecto.</p>
        </div>

        <form id="formConfig" onsubmit="handleGuardarConfig(event)" class="space-y-4 text-xs font-bold">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Nombre de la Empresa o Financiera</label>
            <input type="text" id="cfgNombre" required 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Eslogan o Leyenda de Ticket</label>
            <input type="text" id="cfgEslogan" 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Teléfono de Oficina / WhatsApp</label>
              <input type="text" id="cfgTelefono" 
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Nombre del Cobrador Actual</label>
              <input type="text" id="cfgCobrador" 
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Tasa de Interés por Defecto (%)</label>
              <input type="number" id="cfgInteres" min="1" max="100" 
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Plazo por Defecto (Días)</label>
              <input type="number" id="cfgDias" min="5" max="365" 
                     class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-emerald-500 outline-none">
            </div>
          </div>

          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 uppercase tracking-widest mt-2">
            Guardar Configuración
          </button>
        </form>

        <!-- SECCIÓN DE RESPALDOS -->
        <div class="border-t border-slate-800 pt-4 space-y-3">
          <span class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <i data-lucide="database" class="w-4 h-4 text-blue-400"></i> Copia de Seguridad y Respaldo
          </span>
          <p class="text-[11px] text-slate-400">Descarga un archivo con toda tu cartera de clientes, cobros y cortes para resguardo o para pasar a otra máquina.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/api/backup" download class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
              <i data-lucide="download" class="w-4 h-4"></i> Descargar Respaldo JSON
            </a>

            <label class="cursor-pointer py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
              <i data-lucide="upload" class="w-4 h-4"></i> Restaurar Respaldo
              <input type="file" accept=".json" onchange="handleRestaurarRespaldo(event)" class="hidden">
            </label>
          </div>
        </div>

      </div>
    </div>

  </main>

  <!-- ========================================== -->
  <!-- MODAL: COBRAR ABONO RÁPIDO -->
  <!-- ========================================== -->
  <div id="modalCobro" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-emerald-500/50 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">REGISTRAR ABONO EN RUTA</span>
          <h3 id="modalClienteNombre" class="font-black text-lg text-white leading-tight">Nombre del Cliente</h3>
          <span id="modalClienteSaldo" class="text-xs text-slate-400 font-mono">Saldo pendiente: $0.00</span>
        </div>
        <button onclick="cerrarModalCobro()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Monto a Abonar ($ MXN)</label>
          <input type="number" id="modalAbonoMonto" step="1" 
                 class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-black font-mono text-emerald-400 focus:border-emerald-500 outline-none text-center">
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="setModalMonto('CUOTA')" id="btnCuotaCompleta" class="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors">
            Cuota Completa
          </button>
          <button type="button" onclick="setModalMonto('MEDIO')" id="btnMediaCuota" class="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors">
            Medio Pago
          </button>
          <button type="button" onclick="setModalMonto('TOTAL')" id="btnLiquidacion" class="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors">
            Liquidar Todo
          </button>
        </div>

        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i> GPS del Cobrador:</span>
          <span id="modalGpsStatus" class="font-mono text-emerald-400">Capturado en tiempo real</span>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-800 flex gap-2">
        <button type="button" onclick="cerrarModalCobro()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider">
          Cancelar
        </button>
        <button type="button" onclick="ejecutarCobro()" class="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
          <i data-lucide="check" class="w-4 h-4"></i> Confirmar y WhatsApp
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: MODIFICAR CUOTA DEL CLIENTE -->
  <!-- ========================================== -->
  <div id="modalModificarCuota" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-amber-500/50 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">AJUSTAR PAGO DIARIO/SEMANAL</span>
          <h3 id="modalCuotaClienteNombre" class="font-black text-base text-white">Nombre Cliente</h3>
          <span id="modalCuotaSaldoActual" class="text-xs text-slate-400 font-mono">Saldo: $0.00</span>
        </div>
        <button onclick="cerrarModalModificarCuota()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div>
        <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Nueva Cuota a Cobrar ($ MXN)</label>
        <input type="number" id="inputNuevaCuota" step="5" min="10" 
               class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-black font-mono text-amber-300 focus:border-amber-500 outline-none text-center">
        <p class="text-[10px] text-slate-400 mt-1">Monto sugerido a cobrarle al cliente en cada visita.</p>
      </div>

      <div class="pt-2 border-t border-slate-800 flex gap-2">
        <button type="button" onclick="cerrarModalModificarCuota()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider">
          Cancelar
        </button>
        <button type="button" onclick="guardarNuevaCuota()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg">
          <i data-lucide="save" class="w-4 h-4"></i> Guardar Cuota
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: VER / TOMAR FOTO DE FACHADA -->
  <!-- ========================================== -->
  <div id="modalFotoFachada" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">EVIDENCIA DE DOMICILIO</span>
          <h3 id="modalFachadaClienteNombre" class="font-black text-base text-white">Nombre Cliente</h3>
          <span id="modalFachadaDireccion" class="text-xs text-slate-400 line-clamp-1">Dirección</span>
        </div>
        <button onclick="cerrarModalFotoFachada()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="text-center space-y-3">
        <div id="modalFachadaImgContainer" class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[180px] flex items-center justify-center">
          <img id="modalFachadaImg" src="" class="w-full max-h-[300px] object-cover hidden">
          <div id="modalFachadaPlaceholder" class="p-8 text-slate-500">
            <i data-lucide="image" class="w-12 h-12 mx-auto mb-2 text-slate-600"></i>
            <p class="text-xs font-bold">Sin fotografía de fachada registrada aún.</p>
          </div>
        </div>

        <!-- Botón para Tomar Foto en el Primer Cobro -->
        <label class="cursor-pointer w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
          <i data-lucide="camera" class="w-4 h-4"></i> Tomar / Actualizar Foto Fachada
          <input type="file" accept="image/*" capture="environment" onchange="subirFotoFachadaCliente(event)" class="hidden">
        </label>
      </div>

      <button onclick="cerrarModalFotoFachada()" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider">
        Cerrar
      </button>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: PAGARÉ LEGAL MEXICANO IMPRIMIBLE -->
  <!-- ========================================== -->
  <div id="modalPagare" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">DOCUMENTO OFICIAL LEGAL</span>
          <h3 class="font-black text-lg text-white">Pagaré Legal de Préstamo</h3>
        </div>
        <button onclick="cerrarModalPagare()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Preview del Pagaré -->
      <div id="pagarePreviewBox" class="bg-white text-slate-900 p-5 rounded-2xl border border-slate-300 font-serif text-xs leading-relaxed space-y-3 shadow-inner">
        <!-- Content injected dynamically -->
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2">
        <button onclick="compartirPagareWhatsApp()" class="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
          <i data-lucide="message-circle" class="w-4 h-4"></i> Enviar por WhatsApp
        </button>
        <button onclick="imprimirPagareDocumento()" class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
          <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Pagaré
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: REGISTRAR GASTO DE RUTA -->
  <!-- ========================================== -->
  <div id="modalGastoRuta" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">GASTO OPERATIVO</span>
          <h3 class="font-black text-base text-white">Registrar Gasto de Ruta</h3>
        </div>
        <button onclick="cerrarModalGastoRuta()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-3 text-xs font-bold">
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Concepto del Gasto</label>
          <select id="gastoConcepto" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:border-amber-500 outline-none">
            <option value="Gasolina para Moto">⛽ Gasolina para Moto</option>
            <option value="Ponchadura / Reparación">🔧 Ponchadura / Reparación de Moto</option>
            <option value="Alimentos / Viáticos">🍔 Alimentos / Viáticos</option>
            <option value="Otro Gasto Diverso">📝 Otro Gasto Diverso</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] font-black uppercase text-slate-400 block mb-1">Monto Gastado ($ MXN)</label>
          <input type="number" id="gastoMonto" step="10" placeholder="100" 
                 class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-black font-mono text-amber-400 focus:border-amber-500 outline-none text-center">
        </div>
      </div>

      <div class="pt-2 border-t border-slate-800 flex gap-2">
        <button type="button" onclick="cerrarModalGastoRuta()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider">
          Cancelar
        </button>
        <button type="button" onclick="guardarGastoRuta()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg">
          <i data-lucide="check" class="w-4 h-4"></i> Guardar Gasto
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- MODAL: CONECTAR CELULAR EN LA CALLE (4G/5G) -->
  <!-- ========================================== -->
  <div id="modalConectarCelular" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-indigo-500/50 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
      <div class="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-indigo-400">ACCESO REMOTO DESDE CUALQUIER LUGAR</span>
          <h3 class="font-black text-lg text-white">Conectar Celular con Datos (4G/5G)</h3>
        </div>
        <button onclick="cerrarModalConectarCelular()" class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-4 text-center">
        <p class="text-xs text-slate-300">
          Escanea el código QR con la cámara del celular o abre este enlace. Funciona en toda la ciudad con datos móviles (Telcel, AT&T, Movistar) o cualquier WiFi externo:
        </p>

        <!-- QR Code Container -->
        <div class="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border-2 border-indigo-500">
          <img id="qrImg" src="" alt="Código QR Enlace Móvil" class="w-full h-full object-contain">
        </div>

        <!-- URL Link Box -->
        <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2 text-left">
          <div class="overflow-hidden">
            <span class="text-[9px] uppercase font-bold text-slate-400 block">Enlace Público para Celular</span>
            <span id="enlacePublicoTexto" class="font-mono text-xs font-bold text-emerald-400 truncate block">Cargando enlace...</span>
          </div>
          <button onclick="copiarEnlacePublico()" class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors">
            Copiar
          </button>
        </div>

        <div class="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left space-y-1">
          <p>💡 <strong>Tip para el cobrador:</strong> Una vez abierto en Chrome o Safari en el celular, presiona el menú de 3 puntos y elige <em>"Agregar a la pantalla principal"</em> para que le quede como una app en su celular.</p>
        </div>
      </div>

      <button onclick="cerrarModalConectarCelular()" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider">
        Cerrar
      </button>
    </div>
  </div>

  <!-- JAVASCRIPT APPLICATION CORE -->
  <script>
    let appState = {
      config: {},
      repartidor: {},
      clientes: [],
      cobros: [],
      corteHoy: {},
      dashboard: {},
      tunnel: {},
      rutaFilter: 'TODOS',
      selectedCliente: null,
      tempGps: { lat: 19.4326, lng: -99.1332 },
      npFotoFachadaBase64: '',
      map: null,
      markers: [],
      cobradorMarker: null
    };

    window.addEventListener('DOMContentLoaded', async () => {
      lucide.createIcons();
      await refreshData();
      initMap();
      simularPrestamo();
      startGpsLiveTracking();
      checkOfflineSyncQueue();
    });

    async function refreshData() {
      try {
        const [resDash, resClients, resCobros, resConfig, resRep, resCorte, resTunnel] = await Promise.all([
          fetch('/api/dashboard').then(r => r.json()).catch(() => ({})),
          fetch('/api/clientes').then(r => r.json()).catch(() => []),
          fetch('/api/cobros').then(r => r.json()).catch(() => []),
          fetch('/api/config').then(r => r.json()).catch(() => ({})),
          fetch('/api/repartidor').then(r => r.json()).catch(() => ({})),
          fetch('/api/corte/hoy').then(r => r.json()).catch(() => ({})),
          fetch('/api/tunnel').then(r => r.json()).catch(() => ({}))
        ]);

        appState.dashboard = resDash || {};
        appState.clientes = resClients || [];
        appState.cobros = resCobros || [];
        appState.config = resConfig || {};
        appState.repartidor = resRep || {};
        appState.corteHoy = resCorte || {};
        appState.tunnel = resTunnel || {};

        updateUI();
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    }

    function updateUI() {
      const d = appState.dashboard;
      const c = appState.config;
      const r = appState.repartidor;
      const crt = appState.corteHoy;

      // Header
      if (c.nombreEmpresa) document.getElementById('headerEmpresa').innerText = c.nombreEmpresa;
      if (r.nombre) document.getElementById('headerCobrador').innerText = 'Cobrador: ' + r.nombre;
      document.getElementById('navCobradoHoy').innerText = '$' + (d.totalCobradoHoy || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

      // Dashboard
      document.getElementById('dashCartera').innerText = '$' + (d.totalCarteraPrestada || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
      document.getElementById('dashPorCobrar').innerText = '$' + (d.totalPorCobrar || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
      document.getElementById('dashCobradoHoy').innerText = '$' + (d.totalCobradoHoy || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
      document.getElementById('dashMetaDia').innerText = '$' + (d.metaCobroDia || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

      const meta = d.metaCobroDia || 1;
      const cobrado = d.totalCobradoHoy || 0;
      const porc = Math.min(100, Math.round((cobrado / meta) * 100));
      document.getElementById('dashProgresoPorc').innerText = porc + '%';
      document.getElementById('dashProgresoBar').style.width = porc + '%';
      document.getElementById('dashCobradosCount').innerText = (d.clientesPagadosHoyCount || 0) + ' cobrados hoy';
      document.getElementById('dashPendientesCount').innerText = (d.clientesPendientesHoyCount || 0) + ' pendientes';

      // Counts
      document.getElementById('countAlDia').innerText = d.clientesAlDiaCount || 0;
      document.getElementById('countRetrasados').innerText = d.clientesRetrasadosCount || 0;
      document.getElementById('countLiquidados').innerText = d.clientesLiquidadosCount || 0;
      document.getElementById('countTotal').innerText = d.totalClientes || 0;

      // Corte del día
      if (crt) {
        document.getElementById('corteFechaStr').innerText = 'Fecha: ' + (new Date(crt.fecha || Date.now()).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        document.getElementById('corteCobradorNombre').innerText = crt.cobrador || r.nombre || 'Carlos Gómez';
        document.getElementById('corteFondoInicial').innerText = '$' + (crt.fondoInicial || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        document.getElementById('corteTotalCobrado').innerText = '+$' + (crt.totalCobradoHoy || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        document.getElementById('corteTotalPrestado').innerText = '-$' + (crt.totalPrestadoHoy || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        document.getElementById('corteTotalGastos').innerText = '-$' + (crt.totalGastosHoy || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
        document.getElementById('corteTotalEnMano').innerText = '$' + (crt.totalEnMano || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';
      }

      // Config form
      if (c.nombreEmpresa) document.getElementById('cfgNombre').value = c.nombreEmpresa;
      if (c.eslogan) document.getElementById('cfgEslogan').value = c.eslogan;
      if (c.telefono) document.getElementById('cfgTelefono').value = c.telefono;
      if (r.nombre) document.getElementById('cfgCobrador').value = r.nombre;
      if (c.tasaInteresDefault) document.getElementById('cfgInteres').value = c.tasaInteresDefault;
      if (c.diasPlazoDefault) document.getElementById('cfgDias').value = c.diasPlazoDefault;

      renderRutaClients();
      renderHistorial();
      updateMapMarkers();
      lucide.createIcons();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('tab-active'));

      const target = document.getElementById('tab-' + tabId);
      const btn = document.getElementById('tabBtn-' + tabId);
      if (target) target.classList.remove('hidden');
      if (btn) btn.classList.add('tab-active');

      if (tabId === 'mapa' && appState.map) {
        setTimeout(() => appState.map.invalidateSize(), 200);
      }
      lucide.createIcons();
    }

    function setRutaFilter(flt) {
      appState.rutaFilter = flt;
      document.querySelectorAll('[id^="flt-"]').forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      const act = document.getElementById('flt-' + flt);
      if (act) {
        act.classList.add('bg-emerald-600', 'text-white');
        act.classList.remove('bg-slate-800', 'text-slate-300');
      }
      renderRutaClients();
    }

    function renderRutaClients() {
      const container = document.getElementById('listaClientesRuta');
      const q = (document.getElementById('rutaSearch').value || '').toLowerCase().trim();
      const flt = appState.rutaFilter;

      let list = appState.clientes.filter(c => {
        const matchesQuery = !q || c.nombre.toLowerCase().includes(q) || (c.telefono && c.telefono.includes(q)) || (c.direccion && c.direccion.toLowerCase().includes(q)) || (c.id && c.id.toLowerCase().includes(q));
        if (!matchesQuery) return false;

        if (flt === 'PENDIENTE') return c.saldoPendiente > 0 && !c.pagadoHoy;
        if (flt === 'PAGADO') return c.pagadoHoy;
        if (flt === 'ATRASO') return (c.diasAtraso || 0) > 0 && c.saldoPendiente > 0;
        return true;
      });

      list.sort((a, b) => {
        if (a.pagadoHoy === b.pagadoHoy) return (b.diasAtraso || 0) - (a.diasAtraso || 0);
        return a.pagadoHoy ? 1 : -1;
      });

      if (list.length === 0) {
        container.innerHTML = \`
          <div class="col-span-full py-12 text-center text-slate-500">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-600"></i>
            <p class="font-bold text-sm">No hay clientes que coincidan con este filtro.</p>
          </div>
        \`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = list.map(c => {
        const esLiquidado = c.saldoPendiente <= 0;
        const tieneAtraso = (c.diasAtraso || 0) > 0;
        const pagadoHoy = c.pagadoHoy;
        const tieneFotoFachada = Boolean(c.fotoFachada);

        let statusBadge = '<span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AL DÍA</span>';
        if (tieneAtraso) {
          statusBadge = \`<span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">ATRASO (\${c.diasAtraso}D)</span>\`;
        }
        if (esLiquidado) {
          statusBadge = '<span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">LIQUIDADO</span>';
        }

        const borderClass = pagadoHoy ? 'border-emerald-500/40 bg-slate-900/90' : (tieneAtraso ? 'border-rose-500/40 bg-slate-900' : 'border-slate-800 bg-slate-900');

        return \`
          <div class="border \${borderClass} p-4 rounded-2xl shadow-lg relative flex flex-col justify-between space-y-3 transition-all hover:border-emerald-500/50">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-black text-sm text-white leading-snug">\${c.nombre}</h4>
                  <p class="text-[10px] text-slate-400 font-mono">\${c.id} • \${c.modalidadCobro || 'DIARIO'}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  \${statusBadge}
                  \${pagadoHoy ? '<span class="text-[9px] font-black text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">COBRADO HOY ✅</span>' : ''}
                </div>
              </div>

              <!-- Address & Phone -->
              <p class="text-xs text-slate-300 mt-2 flex items-start gap-1.5">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"></i>
                <span class="line-clamp-2">\${c.direccion || 'Sin dirección'}</span>
              </p>

              <!-- Foto Fachada Badge / Thumbnail -->
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                <button onclick="abrirModalFotoFachada('\${c.id}')" class="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-amber-400 transition-colors">
                  <i data-lucide="camera" class="w-3.5 h-3.5 \${tieneFotoFachada ? 'text-emerald-400' : 'text-slate-500'}"></i>
                  <span>\${tieneFotoFachada ? '🏠 Fachada Registrada' : '📷 Sin Foto Fachada'}</span>
                </button>
                <button onclick="abrirModalPagare('\${c.id}')" title="Ver Pagaré Legal" class="text-[10px] font-black uppercase text-emerald-400 hover:underline flex items-center gap-1">
                  <i data-lucide="file-text" class="w-3 h-3"></i> Pagaré
                </button>
              </div>

              <!-- Financial Info Grid with Edit Cuota button -->
              <div class="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 mt-2 font-mono text-xs">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Cuota</span>
                    <button onclick="abrirModalModificarCuota('\${c.id}')" title="Modificar cuota" class="text-amber-400 hover:text-amber-300 text-[10px] font-black underline flex items-center gap-0.5">
                      <i data-lucide="pencil" class="w-2.5 h-2.5"></i> Editar
                    </button>
                  </div>
                  <span class="text-emerald-400 font-black text-sm">$\${(c.cuotaDiaria || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold text-slate-400 block uppercase">Saldo Pendiente</span>
                  <span class="text-amber-300 font-black text-sm">$\${(c.saldoPendiente || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
              <a href="https://wa.me/\${(c.telefono || '').replace(/[^0-9]/g, '')}" target="_blank" title="Enviar WhatsApp"
                 class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
              </a>

              <a href="https://www.google.com/maps/search/?api=1&query=\${c.lat || 19.4326},\${c.lng || -99.1332}" target="_blank" title="Ver en Google Maps / Cómo Llegar"
                 class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors">
                <i data-lucide="navigation" class="w-4 h-4"></i>
              </a>

              <button onclick="guardarGpsActualCliente('\${c.id}')" title="Guardar mi GPS actual como domicilio de este cliente"
                 class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors">
                <i data-lucide="crosshair" class="w-4 h-4"></i>
              </button>

              <button onclick="abrirModalCobro('\${c.id}')" \${esLiquidado ? 'disabled' : ''}
                      class="flex-1 py-2.5 px-3 rounded-xl \${pagadoHoy ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'} font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                <i data-lucide="\${pagadoHoy ? 'check-check' : 'dollar-sign'}" class="w-4 h-4"></i>
                \${pagadoHoy ? 'Abonado' : 'Cobrar Abono'}
              </button>
            </div>
          </div>
        \`;
      }).join('');
      lucide.createIcons();
    }

    // Modal Cuota Modificable
    function abrirModalModificarCuota(clienteId) {
      const c = appState.clientes.find(cli => cli.id === clienteId);
      if (!c) return;
      appState.selectedCliente = c;

      document.getElementById('modalCuotaClienteNombre').innerText = c.nombre;
      document.getElementById('modalCuotaSaldoActual').innerText = 'Saldo restante: $' + (c.saldoPendiente || 0).toFixed(2);
      document.getElementById('inputNuevaCuota').value = c.cuotaDiaria || 100;

      document.getElementById('modalModificarCuota').classList.remove('hidden');
      document.getElementById('inputNuevaCuota').focus();
    }

    function cerrarModalModificarCuota() {
      document.getElementById('modalModificarCuota').classList.add('hidden');
      appState.selectedCliente = null;
    }

    async function guardarNuevaCuota() {
      if (!appState.selectedCliente) return;
      const c = appState.selectedCliente;
      const nuevaCuota = parseFloat(document.getElementById('inputNuevaCuota').value);

      if (!nuevaCuota || nuevaCuota <= 0) {
        alert('Por favor ingresa una cuota válida mayor a 0');
        return;
      }

      try {
        const res = await fetch(\`/api/clientes/\${c.id}/cuota\`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cuotaDiaria: nuevaCuota })
        });
        const data = await res.json();
        if (data.success) {
          alert(\`¡Cuota de \${c.nombre} actualizada a $\${nuevaCuota.toFixed(2)}!\`);
          cerrarModalModificarCuota();
          await refreshData();
        } else {
          alert('Error: ' + (data.error || 'No se pudo actualizar'));
        }
      } catch (err) {
        alert('Error de conexión: ' + err.message);
      }
    }

    // Modal Foto Fachada
    function abrirModalFotoFachada(clienteId) {
      const c = appState.clientes.find(cli => cli.id === clienteId);
      if (!c) return;
      appState.selectedCliente = c;

      document.getElementById('modalFachadaClienteNombre').innerText = c.nombre;
      document.getElementById('modalFachadaDireccion').innerText = c.direccion || 'Sin dirección';

      const img = document.getElementById('modalFachadaImg');
      const placeholder = document.getElementById('modalFachadaPlaceholder');

      if (c.fotoFachada) {
        img.src = c.fotoFachada;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
      } else {
        img.src = '';
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
      }

      document.getElementById('modalFotoFachada').classList.remove('hidden');
    }

    function cerrarModalFotoFachada() {
      document.getElementById('modalFotoFachada').classList.add('hidden');
      appState.selectedCliente = null;
    }

    function subirFotoFachadaCliente(e) {
      const file = e.target.files[0];
      if (!file || !appState.selectedCliente) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const c = appState.selectedCliente;

        try {
          const res = await fetch(\`/api/clientes/\${c.id}\`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fotoFachada: base64 })
          });
          const data = await res.json();
          if (data.success) {
            alert(\`¡Foto de fachada de \${c.nombre} guardada exitosamente!\`);
            document.getElementById('modalFachadaImg').src = base64;
            document.getElementById('modalFachadaImg').classList.remove('hidden');
            document.getElementById('modalFachadaPlaceholder').classList.add('hidden');
            await refreshData();
          }
        } catch(err) {
          alert('Error guardando foto: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    }

    function handleFotoFachadaNuevo(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        appState.npFotoFachadaBase64 = ev.target.result;
        document.getElementById('npFotoPreview').src = ev.target.result;
        document.getElementById('npFotoPreviewContainer').classList.remove('hidden');
        document.getElementById('npFotoFachadaStatus').innerText = 'Foto de fachada lista para registrar ✅';
      };
      reader.readAsDataURL(file);
    }

    // Modal Pagaré Legal
    function abrirModalPagare(clienteId) {
      const c = appState.clientes.find(cli => cli.id === clienteId);
      if (!c) return;
      appState.selectedCliente = c;

      const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
      const fechaVence = new Date(Date.now() + (c.diasPlazo || 24) * 86400000).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

      const box = document.getElementById('pagarePreviewBox');
      box.innerHTML = \`
        <div style="text-align:center; font-weight:bold; font-size:14px; text-transform:uppercase;">
          PAGARÉ INCONDICIONAL
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px solid #ccc; padding-bottom:4px;">
          <span>BUENO POR: $\${(c.totalPagar || c.prestamoOriginal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
          <span>FOLIO: PAG-\${c.id}</span>
        </div>
        <p style="text-align:justify; margin: 8px 0;">
          Debo(emos) y pagaré(mos) incondicionalmente por este Pagaré a la orden de <strong>\${appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL'}</strong>, 
          en el domicilio del acreedor, el día <strong>\${fechaVence}</strong>, la cantidad de 
          <strong>$\${(c.totalPagar || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>.
        </p>
        <p style="text-align:justify; margin: 8px 0;">
          Valor recibido a mi entera satisfacción. Si este pagaré no fuere pagado a su vencimiento, causará un interés moratorio del <strong>5% mensual</strong> hasta su total liquidación.
        </p>
        <div style="border-top:1px dashed #ccc; padding-top:6px; margin-top:8px;">
          <strong>DATOS DEL DEUDOR:</strong><br/>
          Nombre: \${c.nombre}<br/>
          Dirección: \${c.direccion || 'Domicilio conocido'}<br/>
          Teléfono: \${c.telefono || 'Sin teléfono'}<br/>
          \${c.avalNombre ? \`<strong>AVAL:</strong> \${c.avalNombre} | Tel: \${c.avalTelefono || ''}<br/>\` : ''}
        </div>
        <div style="display:flex; justify-content:space-around; margin-top:20px; text-align:center;">
          <div>
            __________________________<br/>
            <strong>FIRMA DEL DEUDOR</strong><br/>
            \${c.nombre}
          </div>
          \${c.avalNombre ? \`
            <div>
              __________________________<br/>
              <strong>FIRMA DEL AVAL</strong><br/>
              \${c.avalNombre}
            </div>
          \` : ''}
        </div>
      \`;

      document.getElementById('modalPagare').classList.remove('hidden');
    }

    function cerrarModalPagare() {
      document.getElementById('modalPagare').classList.add('hidden');
      appState.selectedCliente = null;
    }

    function compartirPagareWhatsApp() {
      const c = appState.selectedCliente;
      if (!c) return;

      const texto = encodeURIComponent(
        \`*PAGARÉ OFICIAL DE CRÉDITO* 📜\\n\` +
        \`*\${appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL'}*\\n\\n\` +
        \`BUENO POR: $\${(c.totalPagar || 0).toFixed(2)} MXN\\n\` +
        \`Folio: PAG-\${c.id}\\n\\n\` +
        \`Por este pagaré me obligo incondicionalmente a pagar a la orden de \${appState.config.nombreEmpresa || 'la Financiera'} el total de $\${(c.totalPagar || 0).toFixed(2)} MXN en cuotas acordadas.\\n\\n\` +
        \`👤 Deudor: \${c.nombre}\\n\` +
        \`📍 Domicilio: \${c.direccion}\\n\` +
        \`📅 Plazo: \${c.diasPlazo} días\\n\\n\` +
        \`Documento legal registrado en plataforma.\`
      );

      const tel = (c.telefono || '').replace(/[^0-9]/g, '');
      if (tel) {
        window.open(\`https://wa.me/\${tel}?text=\${texto}\`, '_blank');
      } else {
        window.open(\`https://wa.me/?text=\${texto}\`, '_blank');
      }
    }

    function imprimirPagareDocumento() {
      const box = document.getElementById('pagarePreviewBox');
      const ventana = window.open('', '_blank');
      ventana.document.write(\`
        <html>
        <head>
          <title>Pagaré Legal</title>
          <style>
            body { font-family: serif; margin: 30px; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          \${box.innerHTML}
        </body>
        </html>
      \`);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => { ventana.print(); ventana.close(); }, 500);
    }

    // Guardar GPS Actual para un cliente
    async function guardarGpsActualCliente(clienteId) {
      const c = appState.clientes.find(cli => cli.id === clienteId);
      if (!c) return;

      if (!confirm(\`¿Deseas fijar tu ubicación GPS actual como el domicilio oficial de \${c.nombre}?\`)) return;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          try {
            const res = await fetch(\`/api/clientes/\${c.id}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng })
            });
            const data = await res.json();
            if (data.success) {
              alert(\`¡Ubicación GPS de \${c.nombre} guardada con éxito!\`);
              await refreshData();
            }
          } catch(e) {
            alert('Error guardando GPS: ' + e.message);
          }
        }, (err) => {
          alert('Error de GPS: Asegúrate de otorgar permisos de ubicación en el celular.');
        });
      }
    }

    // Modal Cobro de Abono
    function abrirModalCobro(clienteId) {
      const c = appState.clientes.find(cli => cli.id === clienteId);
      if (!c) return;
      appState.selectedCliente = c;

      document.getElementById('modalClienteNombre').innerText = c.nombre;
      document.getElementById('modalClienteSaldo').innerText = 'Saldo pendiente: $' + (c.saldoPendiente || 0).toFixed(2);
      document.getElementById('modalAbonoMonto').value = Math.min(c.saldoPendiente || 0, c.cuotaDiaria || 100);

      document.getElementById('btnCuotaCompleta').innerText = '$' + (c.cuotaDiaria || 100);
      document.getElementById('btnMediaCuota').innerText = '$' + Math.ceil((c.cuotaDiaria || 100) / 2);
      document.getElementById('btnLiquidacion').innerText = 'Todo ($' + (c.saldoPendiente || 0) + ')';

      document.getElementById('modalCobro').classList.remove('hidden');
      document.getElementById('modalAbonoMonto').focus();
    }

    function cerrarModalCobro() {
      document.getElementById('modalCobro').classList.add('hidden');
      appState.selectedCliente = null;
    }

    function setModalMonto(tipo) {
      if (!appState.selectedCliente) return;
      const c = appState.selectedCliente;
      const input = document.getElementById('modalAbonoMonto');

      if (tipo === 'CUOTA') input.value = Math.min(c.saldoPendiente, c.cuotaDiaria);
      if (tipo === 'MEDIO') input.value = Math.min(c.saldoPendiente, Math.ceil(c.cuotaDiaria / 2));
      if (tipo === 'TOTAL') input.value = c.saldoPendiente;
    }

    async function ejecutarCobro() {
      if (!appState.selectedCliente) return;
      const c = appState.selectedCliente;
      const monto = parseFloat(document.getElementById('modalAbonoMonto').value);

      if (!monto || monto <= 0) {
        alert('Por favor ingresa un monto válido a cobrar.');
        return;
      }

      const payload = {
        clienteId: c.id,
        monto: monto,
        tipo: 'ABONO_NORMAL',
        lat: appState.tempGps.lat,
        lng: appState.tempGps.lng,
        cobrador: appState.repartidor.nombre || 'Carlos Gómez'
      };

      try {
        const res = await fetch('/api/cobros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);

        if (!res) {
          // Guardar en cola offline si no hay señal
          saveOfflineCobro(payload, c);
          cerrarModalCobro();
          return;
        }

        const data = await res.json();
        if (data.success) {
          cerrarModalCobro();
          await refreshData();

          // Enviar Recibo de WhatsApp
          const nuevoSaldo = data.clienteActualizado.saldoPendiente;
          const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
          const mensajeWa = encodeURIComponent(
            \`*COMPROBANTE DE PAGO* 🧾\\n\` +
            \`*\${appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL'}*\\n\\n\` +
            \`👤 *Cliente:* \${c.nombre}\\n\` +
            \`💵 *Abono recibido:* $\${monto.toFixed(2)} MXN\\n\` +
            \`📅 *Fecha/Hora:* \${fechaStr}\\n\` +
            \`⏳ *Saldo restante:* $\${nuevoSaldo.toFixed(2)} MXN\\n\` +
            \`🛵 *Cobrador:* \${appState.repartidor.nombre || 'Ruta'}\\n\\n\` +
            \`¡Muchas gracias por su puntualidad! 🙏\`
          );

          if (c.telefono) {
            const telLimpio = c.telefono.replace(/[^0-9]/g, '');
            window.open(\`https://wa.me/\${telLimpio}?text=\${mensajeWa}\`, '_blank');
          } else {
            alert(\`¡Abono de $\${monto.toFixed(2)} registrado correctamente!\`);
          }
        } else {
          alert('Error al registrar cobro: ' + (data.error || 'Fallo de servidor'));
        }
      } catch (err) {
        saveOfflineCobro(payload, c);
        cerrarModalCobro();
      }
    }

    // Soporte Offline Sync
    function saveOfflineCobro(payload, c) {
      let queue = [];
      try { queue = JSON.parse(localStorage.getItem('cola_cobros_offline') || '[]'); } catch(e) {}
      queue.push({ payload, clienteNombre: c.nombre });
      localStorage.setItem('cola_cobros_offline', JSON.stringify(queue));
      alert(\`⚠️ Sin conexión a internet.\\n\\nEl abono de $\${payload.monto.toFixed(2)} para \${c.nombre} quedó guardado localmente en tu teléfono.\\n\\nSe sincronizará en automático en cuanto recuperes señal.\`);
      refreshData();
    }

    async function checkOfflineSyncQueue() {
      let queue = [];
      try { queue = JSON.parse(localStorage.getItem('cola_cobros_offline') || '[]'); } catch(e) {}
      if (queue.length === 0) return;

      console.log('Sincronizando cobros offline pendientes:', queue.length);
      const remaining = [];
      for (const item of queue) {
        try {
          const res = await fetch('/api/cobros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
          if (!res.ok) remaining.push(item);
        } catch(e) {
          remaining.push(item);
        }
      }
      localStorage.setItem('cola_cobros_offline', JSON.stringify(remaining));
      if (remaining.length < queue.length) {
        console.log('Cobros offline sincronizados con éxito');
        refreshData();
      }
    }

    // Modal Gasto de Ruta
    function abrirModalGastoRuta() {
      document.getElementById('modalGastoRuta').classList.remove('hidden');
    }
    function cerrarModalGastoRuta() {
      document.getElementById('modalGastoRuta').classList.add('hidden');
    }

    async function guardarGastoRuta() {
      const concepto = document.getElementById('gastoConcepto').value;
      const monto = parseFloat(document.getElementById('gastoMonto').value);

      if (!monto || monto <= 0) {
        alert('Ingresa un monto válido para el gasto.');
        return;
      }

      try {
        const res = await fetch('/api/gastos-ruta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concepto, monto })
        });
        const data = await res.json();
        if (data.success) {
          alert(\`Gasto de $\${monto.toFixed(2)} registrado correctamente en el corte.\`);
          cerrarModalGastoRuta();
          await refreshData();
        }
      } catch(e) {
        alert('Error guardando gasto: ' + e.message);
      }
    }

    // Compartir Corte por WhatsApp
    function compartirCorteWhatsApp() {
      const crt = appState.corteHoy;
      if (!crt) return;

      const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
      const texto = encodeURIComponent(
        \`*CORTE Y ARQUEO DIARIO DE CAJA* 🧾\\n\` +
        \`*\${appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL'}*\\n\\n\` +
        \`📅 *Fecha:* \${fechaStr}\\n\` +
        \`🛵 *Cobrador:* \${crt.cobrador}\\n\` +
        \`--------------------------------\\n\` +
        \`💼 *Fondo Inicial:* $\${(crt.fondoInicial || 0).toFixed(2)}\\n\` +
        \`💚 *(+) Cobranza Total:* $\${(crt.totalCobradoHoy || 0).toFixed(2)}\\n\` +
        \`🔴 *(-) Préstamos Nuevos:* $\${(crt.totalPrestadoHoy || 0).toFixed(2)}\\n\` +
        \`⛽ *(-) Gastos de Ruta:* $\${(crt.totalGastosHoy || 0).toFixed(2)}\\n\` +
        \`--------------------------------\\n\` +
        \`💵 *EFECTIVO EN MANO A ENTREGAR:* $\${(crt.totalEnMano || 0).toFixed(2)} MXN\\n\` +
        \`--------------------------------\\n\` +
        \`📊 *Rendimiento:* \${crt.clientesCobradosHoy} clientes cobrados hoy (\${crt.efectividad}% de meta)\\n\` +
        \`⏳ *Clientes pendientes:* \${crt.clientesPendientesHoy}\\n\\n\` +
        \`*Firma de Entrega del Cobrador:* __________________\`
      );

      const telAdmin = (appState.config.telefono || '').replace(/[^0-9]/g, '');
      if (telAdmin) {
        window.open(\`https://wa.me/\${telAdmin}?text=\${texto}\`, '_blank');
      } else {
        window.open(\`https://wa.me/?text=\${texto}\`, '_blank');
      }
    }

    // Imprimir Ticket de Corte
    function imprimirTicketCorte() {
      const crt = appState.corteHoy;
      if (!crt) return;

      const ventana = window.open('', '_blank');
      ventana.document.write(\`
        <html>
        <head>
          <title>Corte del Día</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 15px; width: 280px; }
            h2 { font-size: 14px; text-align: center; margin: 2px 0; }
            .center { text-align: center; }
            .line { border-top: 1px dashed black; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total { font-size: 15px; font-weight: bold; margin-top: 6px; }
          </style>
        </head>
        <body>
          <h2>\${appState.config.nombreEmpresa || 'FINANCIERA CRÉDITO FÁCIL'}</h2>
          <div class="center">ARQUEO / CORTE DIARIO</div>
          <div class="line"></div>
          <div class="row"><span>Fecha:</span><span>\${new Date().toLocaleDateString('es-MX')}</span></div>
          <div class="row"><span>Hora:</span><span>\${new Date().toLocaleTimeString('es-MX')}</span></div>
          <div class="row"><span>Cobrador:</span><span>\${crt.cobrador}</span></div>
          <div class="line"></div>
          <div class="row"><span>Fondo Inicial:</span><span>$\${(crt.fondoInicial || 0).toFixed(2)}</span></div>
          <div class="row"><span>(+) Cobranza:</span><span>+$\${(crt.totalCobradoHoy || 0).toFixed(2)}</span></div>
          <div class="row"><span>(-) Préstamos:</span><span>-$\${(crt.totalPrestadoHoy || 0).toFixed(2)}</span></div>
          <div class="row"><span>(-) Gastos Ruta:</span><span>-$\${(crt.totalGastosHoy || 0).toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="row total"><span>TOTAL EN MANO:</span><span>$\${(crt.totalEnMano || 0).toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="row"><span>Cobrados Hoy:</span><span>\${crt.clientesCobradosHoy} clientes</span></div>
          <div class="row"><span>Pendientes:</span><span>\${crt.clientesPendientesHoy} clientes</span></div>
          <br/><br/>
          <div class="center">______________________<br/>FIRMA DEL COBRADOR</div>
          <br/><br/>
          <div class="center">______________________<br/>FIRMA DE RECIBIDO ADMIN</div>
        </body>
        </html>
      \`);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => { ventana.print(); ventana.close(); }, 500);
    }

    // Cerrar y Archivar Corte
    async function cerrarYArchivarCorte() {
      if (!confirm('¿Deseas cerrar formalmente el corte del día de hoy y archivar los números?')) return;
      try {
        const res = await fetch('/api/corte/cerrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notas: 'Cierre de ruta en mano' })
        });
        const data = await res.json();
        if (data.success) {
          alert('¡Corte archivado exitosamente en el historial!');
          await refreshData();
        }
      } catch(e) {
        alert('Error: ' + e.message);
      }
    }

    // Modal Conectar Celular (4G/5G)
    function abrirModalConectarCelular() {
      const tunnel = appState.tunnel || {};
      const url = tunnel.url || \`http://\${tunnel.localIp || 'localhost'}:\${tunnel.port || 4000}\`;

      document.getElementById('enlacePublicoTexto').innerText = url;
      const qrApi = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(url)}\`;
      document.getElementById('qrImg').src = qrApi;

      document.getElementById('modalConectarCelular').classList.remove('hidden');
    }
    function cerrarModalConectarCelular() {
      document.getElementById('modalConectarCelular').classList.add('hidden');
    }
    function copiarEnlacePublico() {
      const url = document.getElementById('enlacePublicoTexto').innerText;
      navigator.clipboard.writeText(url);
      alert('¡Enlace copiado al portapapeles! Puedes pegarlo en WhatsApp para enviárselo al cobrador.');
    }

    // Simulator
    function simularPrestamo() {
      const cap = parseFloat(document.getElementById('npMonto').value) || 0;
      const int = parseFloat(document.getElementById('npInteres').value) || 0;
      const modalidad = document.getElementById('npModalidad').value || 'DIARIO';
      const dias = parseInt(document.getElementById('npDias').value) || 1;

      const ganancia = cap * (int / 100);
      const total = cap + ganancia;

      let cuota = 0;
      let plazoTexto = '';

      if (modalidad === 'DIARIO') {
        cuota = Math.ceil(total / dias);
        plazoTexto = \`por \${dias} días (Lun-Sáb)\`;
        document.getElementById('simModalidadTitulo').innerText = 'Cuota Diaria a Cobrar';
      } else if (modalidad === 'SEMANAL') {
        const semanas = Math.max(1, Math.round(dias / 7));
        cuota = Math.ceil(total / semanas);
        plazoTexto = \`por \${semanas} semanas\`;
        document.getElementById('simModalidadTitulo').innerText = 'Cuota Semanal a Cobrar';
      } else if (modalidad === 'CATORCENAL') {
        const catorcenas = Math.max(1, Math.round(dias / 14));
        cuota = Math.ceil(total / catorcenas);
        plazoTexto = \`por \${catorcenas} catorcenas\`;
        document.getElementById('simModalidadTitulo').innerText = 'Cuota Catorcenal a Cobrar';
      } else {
        const quincenas = Math.max(1, Math.round(dias / 15));
        cuota = Math.ceil(total / quincenas);
        plazoTexto = \`por \${quincenas} quincenas\`;
        document.getElementById('simModalidadTitulo').innerText = 'Cuota Quincenal a Cobrar';
      }

      document.getElementById('simCapital').innerText = '$' + cap.toLocaleString('es-MX', { minimumFractionDigits: 2 });
      document.getElementById('simInteres').innerText = '+$' + ganancia.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' (' + int + '%)';
      document.getElementById('simTotal').innerText = '$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 });
      document.getElementById('simCuota').innerText = '$' + cuota.toFixed(2);
      document.getElementById('simPlazoTexto').innerText = plazoTexto;
    }

    async function handleCrearPrestamo(e) {
      e.preventDefault();
      const cap = parseFloat(document.getElementById('npMonto').value);
      const int = parseFloat(document.getElementById('npInteres').value);
      const dias = parseInt(document.getElementById('npDias').value);
      const modalidad = document.getElementById('npModalidad').value;
      const total = cap + (cap * (int / 100));

      let cuota = Math.ceil(total / dias);
      if (modalidad === 'SEMANAL') cuota = Math.ceil(total / Math.max(1, Math.round(dias / 7)));
      if (modalidad === 'CATORCENAL') cuota = Math.ceil(total / Math.max(1, Math.round(dias / 14)));
      if (modalidad === 'QUINCENAL') cuota = Math.ceil(total / Math.max(1, Math.round(dias / 15)));

      const payload = {
        nombre: document.getElementById('npNombre').value,
        telefono: document.getElementById('npTelefono').value,
        direccion: document.getElementById('npDireccion').value,
        prestamoOriginal: cap,
        interesPorc: int,
        diasPlazo: dias,
        modalidadCobro: modalidad,
        cuotaDiaria: cuota,
        avalNombre: document.getElementById('npAvalNombre').value,
        avalTelefono: document.getElementById('npAvalTelefono').value,
        avalDireccion: document.getElementById('npAvalDireccion').value,
        fotoFachada: appState.npFotoFachadaBase64,
        lat: appState.tempGps.lat,
        lng: appState.tempGps.lng
      };

      try {
        const res = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('¡Préstamo autorizado y cliente agregado a la ruta con éxito!');
          document.getElementById('formNuevoPrestamo').reset();
          appState.npFotoFachadaBase64 = '';
          document.getElementById('npFotoPreviewContainer').classList.add('hidden');
          simularPrestamo();
          await refreshData();
          switchTab('ruta');
        } else {
          alert('Error: ' + (data.error || 'No se pudo guardar'));
        }
      } catch (err) {
        alert('Error de conexión: ' + err.message);
      }
    }

    async function handleGuardarConfig(e) {
      e.preventDefault();
      const payload = {
        nombreEmpresa: document.getElementById('cfgNombre').value,
        eslogan: document.getElementById('cfgEslogan').value,
        telefono: document.getElementById('cfgTelefono').value,
        tasaInteresDefault: parseFloat(document.getElementById('cfgInteres').value),
        diasPlazoDefault: parseInt(document.getElementById('cfgDias').value)
      };

      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        alert('Configuración guardada exitosamente.');
        await refreshData();
      } catch (err) {
        alert('Error al guardar: ' + err.message);
      }
    }

    function handleRestaurarRespaldo(e) {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm('¿Deseas restaurar la base de datos con este archivo? Reemplazará la información actual.')) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          const res = await fetch('/api/backup/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          });
          const data = await res.json();
          if (data.success) {
            alert('¡Base de datos restaurada correctamente!');
            await refreshData();
          } else {
            alert('Error: ' + data.error);
          }
        } catch(err) {
          alert('Archivo JSON de respaldo no válido.');
        }
      };
      reader.readAsText(file);
    }

    async function iniciarNuevoDia() {
      if (!confirm('¿Deseas iniciar una nueva jornada de cobro?\\n\\nEsto marcará a todos los clientes como pendientes de pago para hoy y sumará 1 día de atraso a quienes no pagaron ayer.')) return;
      try {
        const res = await fetch('/api/clientes/reset-dia', { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'Jornada reiniciada');
        await refreshData();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    function renderHistorial() {
      const tbody = document.getElementById('historialTableBody');
      const cobros = appState.cobros || [];
      document.getElementById('historialTotalCount').innerText = cobros.length + ' registros';

      if (cobros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500 font-bold">No hay cobros registrados aún.</td></tr>';
        return;
      }

      tbody.innerHTML = cobros.slice(0, 50).map(c => {
        const fechaStr = new Date(c.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
        return \`
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="p-3 font-mono text-slate-400 text-[11px]">\${fechaStr}</td>
            <td class="p-3 font-bold text-white">\${c.clienteNombre || 'Cliente'}</td>
            <td class="p-3 font-black text-emerald-400 font-mono">+$\${(c.monto || 0).toFixed(2)}</td>
            <td class="p-3 font-mono text-slate-300">$\${(c.saldoRestante || 0).toFixed(2)}</td>
            <td class="p-3 text-slate-400">\${c.cobrador || 'Cobrador'}</td>
            <td class="p-3 text-right">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">REGISTRADO</span>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // MAPA GPS INTERACTIVO
    function initMap() {
      const defaultCoord = [19.4326, -99.1332];
      appState.map = L.map('map').setView(defaultCoord, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(appState.map);

      updateMapMarkers();
    }

    function updateMapMarkers() {
      if (!appState.map) return;
      appState.markers.forEach(m => appState.map.removeLayer(m));
      appState.markers = [];

      (appState.clientes || []).forEach(c => {
        if (!c.lat || !c.lng) return;
        const color = c.pagadoHoy ? '#10b981' : ((c.diasAtraso || 0) > 0 ? '#f43f5e' : '#f59e0b');

        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: \`<div style="background-color: \${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6);"></div>\`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(appState.map);
        marker.bindPopup(\`
          <div style="font-family: sans-serif; color: #0f172a; min-width: 170px;">
            <b style="font-size: 13px;">\${c.nombre}</b><br/>
            <span style="font-size: 11px; color: #475569;">\${c.direccion || 'Sin dirección'}</span><br/>
            <hr style="margin: 5px 0;"/>
            <b style="color: #059669;">Cuota: $\${(c.cuotaDiaria || 0).toFixed(2)}</b> | Saldo: $\${(c.saldoPendiente || 0).toFixed(2)}<br/>
            <span style="font-size: 11px; font-weight: bold; color: \${c.pagadoHoy ? '#059669' : '#dc2626'};">
              \${c.pagadoHoy ? 'COBRADO HOY ✅' : 'PENDIENTE DE COBRO ⏳'}
            </span>
            <div style="margin-top: 8px;">
              <button onclick="abrirModalCobro('\${c.id}')" style="background:#059669; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:bold; cursor:pointer; width:100%;">
                COBRAR ABONO 💵
              </button>
            </div>
          </div>
        \`);
        appState.markers.push(marker);
      });

      const rep = appState.repartidor;
      if (rep && rep.ultimaUbicacion && rep.ultimaUbicacion.lat) {
        const u = rep.ultimaUbicacion;
        if (appState.cobradorMarker) appState.map.removeLayer(appState.cobradorMarker);

        const cobradorIcon = L.divIcon({
          className: 'cobrador-pin',
          html: \`<div class="pulse-cobrador" style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">🛵</div>\`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        appState.cobradorMarker = L.marker([u.lat, u.lng], { icon: cobradorIcon }).addTo(appState.map);
        const horaStr = new Date(u.hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        appState.cobradorMarker.bindPopup(\`<b>🛵 Cobrador en Ruta: \${rep.nombre}</b><br/><span style="font-size: 10px; color: #475569;">Última posición: \${horaStr}</span>\`);
      }
    }

    function centrarEnCobrador() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          appState.tempGps = { lat, lng };
          if (appState.map) {
            appState.map.setView([lat, lng], 16);
          }
        });
      }
    }

    function capturarGpsClienteNuevo() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          appState.tempGps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          document.getElementById('gpsCoordsText').innerText = 'Lat: ' + pos.coords.latitude.toFixed(5) + ', Lng: ' + pos.coords.longitude.toFixed(5);
          alert('¡Ubicación GPS capturada con éxito!');
        }, () => {
          alert('No se pudo acceder a la ubicación. Asegúrate de dar permisos de GPS.');
        });
      }
    }

    function startGpsLiveTracking() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateMyGpsOnServer);
        setInterval(() => {
          navigator.geolocation.getCurrentPosition(updateMyGpsOnServer, () => {});
        }, 45000);
      }
    }

    function updateMyGpsOnServer(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      appState.tempGps = { lat, lng };

      fetch('/api/repartidor/ubicacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      }).catch(() => {});
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('C:/Users/JOSUE/Desktop/SISTEMA_CREDITO_COBRANZA/public/index.html', htmlContent, 'utf8');
console.log('✅ Ultimate index.html created successfully!');
