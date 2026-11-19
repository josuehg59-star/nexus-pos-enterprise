const fs = require('fs');
const path = require('path');

function updatePosButtons(posPath) {
  if (!fs.existsSync(posPath)) return;
  let code = fs.readFileSync(posPath, 'utf8').replace(/\r\n/g, '\n');

  // 1. Reemplazar la lista de métodos de pago en el grid
  const targetGrid = `{['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'MIXTO', 'CRÉDITO', 'MERCADO PAGO', 'MONEDERO'].map(met => (`;
  const replacementGrid = `{['EFECTIVO', 'TARJETA', 'CLIP', 'MERCADO PAGO', 'TRANSFERENCIA', 'MIXTO', 'CRÉDITO', 'MONEDERO'].map(met => (`;

  if (code.includes(targetGrid)) {
    code = code.replace(targetGrid, replacementGrid);
  }

  // Estilo visual del botón CLIP
  code = code.replace(
    "met === 'MONEDERO' ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400'",
    "met === 'CLIP' ? 'bg-amber-600/30 border-amber-500 text-amber-400 font-black shadow-md ring-1 ring-amber-400' : met === 'MONEDERO' ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400'"
  );

  code = code.replace(
    "met === 'MONEDERO' ? 'bg-nexus-800 border-nexus-700 text-fuchsia-400/70 hover:bg-nexus-700'",
    "met === 'CLIP' ? 'bg-nexus-800 border-amber-600/40 text-amber-400 hover:bg-nexus-700' : met === 'MONEDERO' ? 'bg-nexus-800 border-nexus-700 text-fuchsia-400/70 hover:bg-nexus-700'"
  );

  // Icono para CLIP
  code = code.replace(
    "{met === 'TARJETA' && <CreditCard className=\"w-3 h-3\" />}",
    `{met === 'TARJETA' && <CreditCard className="w-3 h-3 text-blue-400" />}\n                  {met === 'CLIP' && <CreditCard className="w-3 h-3 text-amber-400" />}`
  );

  // Etiqueta bonita para CLIP
  code = code.replace(
    "{met}\n                </button>",
    `{met === 'CLIP' ? 'CLIP' : met}\n                </button>`
  );

  // Barra inferior de atajos: agregar CLIP
  code = code.replace(
    "TAR [F7]",
    "TAR [F7]   CLIP"
  );

  fs.writeFileSync(posPath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`✅ Botón CLIP agregado a la botonera de cobro en ${posPath}`);
}

updatePosButtons(path.join(__dirname, 'caja_local', 'frontend', 'src', 'pages', 'PosTerminal.tsx'));
updatePosButtons(path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'PosTerminal.tsx'));
