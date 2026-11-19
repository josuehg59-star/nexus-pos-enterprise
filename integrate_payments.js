const fs = require('fs');
const path = require('path');

function updateUseSettings(baseDir) {
  const filePath = path.join(baseDir, 'src', 'store', 'useSettings.ts');
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // Agregar campos de Clip y Banco a la interfaz si no existen
  if (!code.includes('clipApiKey:')) {
    code = code.replace(
      'terminalBancariaModo: string;',
      `terminalBancariaModo: string;\n  clipApiKey: string;\n  clipSerialNumber: string;\n  clipModo: string;\n  bancoDefault: string;`
    );
  }

  // Agregar valores iniciales en useSettings
  if (!code.includes('clipApiKey: localStorage.getItem')) {
    code = code.replace(
      "terminalBancariaModo: localStorage.getItem('nexus_terminalBancariaModo') || 'TERMINAL_MANUAL_PINPAD',",
      `terminalBancariaModo: localStorage.getItem('nexus_terminalBancariaModo') || 'TERMINAL_MANUAL_PINPAD',\n  clipApiKey: localStorage.getItem('nexus_clipApiKey') || '',\n  clipSerialNumber: localStorage.getItem('nexus_clipSerialNumber') || '',\n  clipModo: localStorage.getItem('nexus_clipModo') || 'APP_MOVIL',\n  bancoDefault: localStorage.getItem('nexus_bancoDefault') || 'BBVA / BANCOMER',`
    );
  }

  // Guardado en setSettings
  if (!code.includes("localStorage.setItem('nexus_clipApiKey'")) {
    code = code.replace(
      "if (settings.terminalBancariaModo !== undefined) localStorage.setItem('nexus_terminalBancariaModo', settings.terminalBancariaModo);",
      `if (settings.terminalBancariaModo !== undefined) localStorage.setItem('nexus_terminalBancariaModo', settings.terminalBancariaModo);\n    if (settings.clipApiKey !== undefined) localStorage.setItem('nexus_clipApiKey', settings.clipApiKey);\n    if (settings.clipSerialNumber !== undefined) localStorage.setItem('nexus_clipSerialNumber', settings.clipSerialNumber);\n    if (settings.clipModo !== undefined) localStorage.setItem('nexus_clipModo', settings.clipModo);\n    if (settings.bancoDefault !== undefined) localStorage.setItem('nexus_bancoDefault', settings.bancoDefault);`
    );
  }

  fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`✅ useSettings.ts actualizado en ${baseDir}`);
}

updateUseSettings(path.join(__dirname, 'caja_movil_app'));
updateUseSettings(path.join(__dirname, 'caja_local', 'frontend'));
