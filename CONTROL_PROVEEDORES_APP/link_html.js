const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\JOSUE\\Desktop\\NEXUS_POS_ENTERPRISE\\CONTROL_PROVEEDORES_APP';
const fullHtml = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');

const scriptIndex = fullHtml.indexOf('<script>');
if (scriptIndex !== -1) {
  const htmlPart = fullHtml.substring(0, scriptIndex);
  const cleanHtml = htmlPart + '\n  <script src="./app.js"></script>\n</body>\n</html>';
  fs.writeFileSync(path.join(targetDir, 'index.html'), cleanHtml, 'utf8');
  fs.writeFileSync('C:\\Users\\JOSUE\\AndroidStudioProjects\\PUNTODEVENTA\\app\\src\\main\\assets\\index.html', cleanHtml, 'utf8');
  console.log('HTML vinculado exitosamente con ./app.js');
} else {
  console.log('No se encontro la etiqueta script.');
}
