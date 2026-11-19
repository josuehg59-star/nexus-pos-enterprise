const fs = require('fs');

const missingFunctions = fs.readFileSync('temp_functions.ts', 'utf8');

const posFile = 'caja_local/frontend/src/pages/PosTerminal.tsx';
let posContent = fs.readFileSync(posFile, 'utf8');

const triggerEnd = posContent.indexOf('const handlePausar = () => {');
if (triggerEnd !== -1) {
  posContent = posContent.substring(0, triggerEnd) + missingFunctions + '\n  ' + posContent.substring(triggerEnd);
}

// ensure closing brace
if (!posContent.trim().endsWith('}')) {
  posContent += '\n}\n';
}
// wait, the component might already end with `}` correctly if we don't mess up.
// Let's remove the extra `}` from earlier if there are any trailing ones.
posContent = posContent.replace(/\}\s*\}\s*\}\s*$/, '}\n'); 

fs.writeFileSync(posFile, posContent);
console.log('Functions restored using temp file.');
