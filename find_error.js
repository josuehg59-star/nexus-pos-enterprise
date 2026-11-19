const fs = require('fs');

const content = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');
const lines = content.split(/\r?\n/);
console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("'") && !line.includes('//') && !line.includes('{/*')) {
    const count = (line.match(/'/g) || []).length;
    if (count % 2 !== 0) {
      console.log(`Línea ${i + 1}: ${line}`);
    }
  }
}
