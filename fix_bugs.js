const fs = require('fs');
const path = require('path');

// --- FIX PosTerminal.tsx ---
const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// 1. Fix stale closure by adding montoRecibido to useEffect dependencies
posCode = posCode.replace(/\[cart, paymentMethod, client\.name, showTicketModal, isProcessing\]\);/g, '[cart, paymentMethod, client.name, showTicketModal, isProcessing, montoRecibido]);');

// 2. Always show unit price on ticket
posCode = posCode.replace(/\{item\.cartQty > 1 && <span className="block text-\[8px\] text-black font-normal">/g, '{true && <span className="block text-[10px] text-black font-black">');

fs.writeFileSync(posPath, posCode);

// --- FIX Reports.tsx ---
const repPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let repCode = fs.readFileSync(repPath, 'utf8');

// Fix print missing close and timeout
const badScript = `            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      \`);
    };`;

const goodScript = `          </body>
        </html>
      \`);
      w.document.close();
      w.focus();
      setTimeout(() => { w.print(); w.close(); }, 500);
    };`;

repCode = repCode.replace(badScript, goodScript);
fs.writeFileSync(repPath, repCode);

// --- FIX CajaZ.tsx ---
const zPath = path.join(__dirname, 'caja_local/frontend/src/pages/CajaZ.tsx');
let zCode = fs.readFileSync(zPath, 'utf8');

// We need to inject the printing of the Corte Z
const zPrintLogic = `
      // ---- INICIO IMPRESION CORTE Z ----
      const w = window.open('', '_blank', 'width=420,height=700');
      if (w) {
        // Aggregate products sold
        const itemsMap = {};
        tickets.forEach(t => {
          (t.items || []).forEach(i => {
            const name = (i.name || i.productName || 'PRODUCTO').toUpperCase();
            if (!itemsMap[name]) itemsMap[name] = { qty: 0, total: 0 };
            itemsMap[name].qty += (i.cartQty || i.qty || 1);
            itemsMap[name].total += (i.lineTotal !== undefined ? i.lineTotal : (i.price * (i.cartQty || i.qty || 1)));
          });
        });
        const itemsArr = Object.keys(itemsMap).map(k => ({ name: k, ...itemsMap[k] }));

        let itemsHtml = itemsArr.map(i => \`
          <tr>
            <td style="width:15%; text-align:center;">\${i.qty}</td>
            <td style="width:55%; text-align:left;">\${i.name.substring(0,20)}</td>
            <td style="width:30%; text-align:right;">$\${i.total.toFixed(2)}</td>
          </tr>
        \`).join('');

        w.document.write(\`
          <html>
            <head>
              <title>Corte Z</title>
              <style>
                @page { size: 58mm auto; margin: 0; }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  font-weight: 900 !important;
                  width: 44mm !important;
                  max-width: 44mm !important;
                  margin: 0 auto !important;
                  padding: 1mm 0 !important;
                  color: #000000 !important;
                  background-color: #ffffff !important;
                }
                * { font-weight: 900 !important; color: #000000 !important; }
                h2, h3, p { margin: 3px 0; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin: 5px 0; }
                th { border-bottom: 2px dashed #000; text-align: left; }
                td, th { padding: 2px 0; font-size: 10px; }
                .divider { border-top: 1.5px dashed #000; margin: 5px 0; }
                .row { display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              <h2>CORTE Z (CIERRE)</h2>
              <p>FECHA: \${new Date().toLocaleString()}</p>
              <div class="divider"></div>
              <div class="row"><span>FONDO INICIAL:</span><span>$\${activeTurno.montoInicial}</span></div>
              <div class="row"><span>V. EFECTIVO:</span><span>$\${ventasEfectivo.toFixed(2)}</span></div>
              <div class="row"><span>V. TARJETA:</span><span>$\${ventasTarjeta.toFixed(2)}</span></div>
              <div class="row"><span>V. TRANSF:</span><span>$\${ventasTransferencia.toFixed(2)}</span></div>
              <div class="divider"></div>
              <div class="row" style="font-size:12px"><span><b>TOTAL VENTAS:</b></span><span><b>$\${totalVentas.toFixed(2)}</b></span></div>
              <div class="divider"></div>
              <div class="row" style="font-size:12px"><span><b>TOTAL EN CAJA (EFECTIVO):</b></span><span><b>$\${totalEnCajaFisica.toFixed(2)}</b></span></div>
              <div class="divider"></div>
              <h3>RESUMEN DE PRODUCTOS</h3>
              <table>
                <thead>
                  <tr><th>CT</th><th>DESC</th><th style="text-align:right">TOTAL</th></tr>
                </thead>
                <tbody>\${itemsHtml}</tbody>
              </table>
              <div class="divider"></div>
              <p>*** CORTE REALIZADO ***</p>
            </body>
          </html>
        \`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 500);
      }
      // ---- FIN IMPRESION CORTE Z ----
`;

zCode = zCode.replace(/await db\.cortes\.add\(\{[\s\S]*?totalEsperado: totalEnCajaFisica\s*\}\);/, '$&\n' + zPrintLogic);
fs.writeFileSync(zPath, zCode);

console.log('All fixes applied');
