const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'caja_movil_app', 'dist');
const destDir = 'C:\\Users\\JOSUE\\Desktop\\SISTEMA_RETAILPOS_MOVIL\\app\\src\\main\\assets';

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Limpiar destino previo
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

copyRecursiveSync(srcDir, destDir);
console.log('✅ Archivos de caja_movil_app/dist copiados exitosamente a SISTEMA_RETAILPOS_MOVIL/app/src/main/assets');
