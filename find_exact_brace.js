const fs = require('fs');

function truncateToExactComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  let inFunc = false;
  let braceCount = 0;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('export default function PosTerminal')) {
      inFunc = true;
    }

    if (inFunc) {
      // Contar llaves ignorando comentarios simples o strings si es posible
      for (let ch of line) {
        if (ch === '{') braceCount++;
        else if (ch === '}') {
          braceCount--;
          if (braceCount === 0) {
            endLine = i;
            break;
          }
        }
      }
      if (endLine !== -1) break;
    }
  }

  console.log(`Línea final exacta de PosTerminal: ${endLine + 1} (Total actual: ${lines.length})`);
  if (endLine !== -1) {
    const cleanLines = lines.slice(0, endLine + 1);
    fs.writeFileSync(filePath, cleanLines.join('\r\n'), 'utf8');
    console.log(`✅ Archivo recortado a ${cleanLines.length} líneas.`);
  }
}

truncateToExactComponent('caja_local/frontend/src/pages/PosTerminal.tsx');
truncateToExactComponent('caja_movil_app/src/pages/PosTerminal.tsx');
