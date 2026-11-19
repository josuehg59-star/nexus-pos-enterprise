const fs = require('fs');
const path = require('path');

const targetJs = 'C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\public\\\\app.js';
let js = fs.readFileSync(targetJs, 'utf8');

// 1. Actualizar renderizarClientes para filtrar ocultos y contar
const oldFilter = `  // Filtrar por estado
  if (appState.filtroEstado === 'PENDIENTES') {
    lista = lista.filter(c => !c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'COBRADOS') {
    lista = lista.filter(c => c.pagadoHoy && c.saldoPendiente > 0);
  } else if (appState.filtroEstado === 'ATRASADOS') {
    lista = lista.filter(c => (c.diasAtraso > 0 || c.estatus === 'RETRASADO') && c.saldoPendiente > 0);
  }`;

const newFilter = `  // Actualizar contador de ocultos
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

js = js.replace(oldFilter, newFilter);

// 2. Añadir badge de código de cliente #CLI-XXXX en la tarjeta
js = js.replace(
  `<h3 class="text-sm font-black text-white leading-tight">\${c.nombre}</h3>`,
  `<span class="bg-slate-800 text-cyan-400 font-mono text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-700">#\${c.id}</span>
              <h3 class="text-sm font-black text-white leading-tight">\${c.nombre}</h3>`
);

// 3. Añadir botón de Ocultar/Reactivar en la fila de acciones de la tarjeta
const btnOcultarCard = `\${appState.rolActivo === 'ADMIN' ? \`
              <button onclick="toggleOcultarCliente('\${c.id}')" class="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition" title="\${c.oculto ? 'Reactivar en ruta activa' : 'Ocultar de ruta activa'}">
                <i data-lucide="\${c.oculto ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                <span>\${c.oculto ? 'Reactivar' : 'Ocultar'}</span>
              </button>
            \` : ''}`;

js = js.replace(
  `<button onclick="abrirModalPagare('\${c.id}')"`,
  btnOcultarCard + `\n            <button onclick="abrirModalPagare('\${c.id}')"`
);

// 4. Actualizar actualizarMarcadoresMapa para que los cobradores no vean a otras motos
const oldCobradoresMap = `  // 1. Dibujar Cobradores (Motos)
  appState.cobradores.forEach(cob => {`;

const newCobradoresMap = `  // 1. Dibujar Cobradores (Motos)
  // Estricta Privacidad: si es cobrador, SOLO dibuja su propia moto (no ve a otros)
  let cobradoresADibujar = appState.cobradores;
  if (appState.rolActivo !== 'ADMIN') {
    cobradoresADibujar = appState.cobradores.filter(c => c.id === appState.rolActivo);
  }
  cobradoresADibujar.forEach(cob => {`;

js = js.replace(oldCobradoresMap, newCobradoresMap);

fs.writeFileSync(targetJs, js, 'utf8');
console.log('✅ app.js actualizado con badge de código #CLI-XXXX, botón ocultar y privacidad en mapa.');
