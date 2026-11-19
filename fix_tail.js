const fs = require('fs');

function fixTail(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split(/\r?\n/);
  
  // Buscar el último "}" solo en una línea
  let lastBraceIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '}') {
      lastBraceIdx = i;
      break;
    }
  }

  if (lastBraceIdx !== -1) {
    lines = lines.slice(0, lastBraceIdx + 1);
    fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
    console.log(`✅ Archivo recortado a ${lines.length} líneas terminando en '}' para: ${filePath}`);
  }
}

fixTail('caja_local/frontend/src/pages/PosTerminal.tsx');
fixTail('caja_movil_app/src/pages/PosTerminal.tsx');
