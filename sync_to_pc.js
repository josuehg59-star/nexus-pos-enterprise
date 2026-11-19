const fs = require('fs');
const path = require('path');

// 1. Corregir import RotateCcw en caja_movil_app
const audiPath = path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'Auditoria.tsx');
let audiCode = fs.readFileSync(audiPath, 'utf8');
audiCode = audiCode.replace(
  "import { Play, Search, Trash2, Save, CheckCircle2 } from 'lucide-react';",
  "import { Play, Search, Trash2, Save, CheckCircle2, RotateCcw } from 'lucide-react';"
);
fs.writeFileSync(audiPath, audiCode, 'utf8');
console.log('✅ RotateCcw agregado a Auditoria.tsx en caja_movil_app');

// 2. Copiar Auditoria.tsx e ImpresionEtiquetas.tsx a caja_local/frontend
const localPagesDir = path.join(__dirname, 'caja_local', 'frontend', 'src', 'pages');
if (fs.existsSync(localPagesDir)) {
  fs.copyFileSync(audiPath, path.join(localPagesDir, 'Auditoria.tsx'));
  fs.copyFileSync(
    path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'ImpresionEtiquetas.tsx'),
    path.join(localPagesDir, 'ImpresionEtiquetas.tsx')
  );
  console.log('✅ Auditoria.tsx e ImpresionEtiquetas.tsx sincronizados con caja_local (Punto de Venta PC)');
}
