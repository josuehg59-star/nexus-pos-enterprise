const fs = require('fs');
const path = require('path');

const repPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let repCode = fs.readFileSync(repPath, 'utf8');

const target = `            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      \`);
    };`;

const replacement = `          </body>
        </html>
      \`);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); w.close(); }, 500);
    };`;

repCode = repCode.replace(target, replacement);

fs.writeFileSync(repPath, repCode);
console.log('Fixed reimprimir in Reports');
