const fs = require('fs');
const path = require('path');

const zPath = path.join(__dirname, 'caja_local/frontend/src/pages/CajaZ.tsx');
let zCode = fs.readFileSync(zPath, 'utf8');

// 1. Replace the legacy comprasDelDia state with a live query to db.compras
zCode = zCode.replace(
  /const \[comprasDelDia\] = useState<any\[\]>\(JSON\.parse\(localStorage\.getItem\('comprasDia'\) \|\| '\[\]'\)\);/,
  `const comprasList = useLiveQuery(async () => {
    if (!activeTurno) return [];
    return await db.compras.where('date').aboveOrEqual(activeTurno.fechaApertura).toArray();
  }, [activeTurno]) || [];`
);

// 2. We need to find the block we inserted previously for RESUMEN DE PRODUCTOS VENDIDOS
// and replace it back with COMPRAS A PROVEEDORES
const blockRegex = /<div className='bg-nexus-900\/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>[\s\S]*?<\/div>\s*<\/div>\s*\{\/\*\s*COLUMNA DERECHA: FLUJO DE EFECTIVO Y CIERRE\s*\*\/\}/;

const newBlock = `
              <div className='bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>
                 <h3 className='text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3'>
                  <Calculator className='text-fuchsia-400' /> COMPRAS A PROVEEDORES
                </h3>
                <table className='w-full text-left'>
                  <thead className='border-b border-nexus-800'>
                    <tr>
                      <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Proveedor</th>
                      <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right'>Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-nexus-800'>
                    {(() => {
                      const provMap: Record<string, number> = {};
                      let totalGasto = 0;
                      comprasList.forEach(c => {
                        const prov = (c.provider || 'DESCONOCIDO').toUpperCase();
                        if (!provMap[prov]) provMap[prov] = 0;
                        provMap[prov] += (c.total || 0);
                        totalGasto += (c.total || 0);
                      });
                      
                      const provArr = Object.keys(provMap).map(k => ({ provider: k, total: provMap[k] }));

                      if (provArr.length === 0) {
                        return (
                          <tr>
                            <td colSpan={2} className='py-8 text-center text-slate-500 font-bold'>No hay compras a proveedores registradas en este turno.</td>
                          </tr>
                        );
                      }
                      
                      return (
                        <>
                          {provArr.map((c, i) => (
                            <tr key={i}>
                              <td className='py-3 text-sm font-bold text-white'>{c.provider}</td>
                              <td className='py-3 text-sm font-black text-fuchsia-400 text-right'>$ {c.total.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className='py-4 text-sm font-black text-slate-400'>TOTAL GENERAL</td>
                            <td className='py-4 text-lg font-black text-fuchsia-400 text-right'>$ {totalGasto.toFixed(2)}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
`;

zCode = zCode.replace(blockRegex, newBlock + "\n            {/* COLUMNA DERECHA: FLUJO DE EFECTIVO Y CIERRE */}");

// 3. Now let's fix the Z-Cut printout HTML logic!
// Find the previously generated Z-Cut print block
const zPrintRegex = /\/\/ ---- INICIO IMPRESION CORTE Z ----[\s\S]*?\/\/ ---- FIN IMPRESION CORTE Z ----/;

const zPrintNew = `// ---- INICIO IMPRESION CORTE Z ----
      const w = window.open('', '_blank', 'width=420,height=700');
      if (w) {
        // Obtenemos compras de base de datos para imprimirlas (esto usa Dexie, así que ya deberíamos tener el resultado previo o lo calculamos manual si se pasa)
        db.compras.where('date').aboveOrEqual(activeTurno.fechaApertura).toArray().then(comprasList => {
          const provMap: Record<string, number> = {};
          let totalGasto = 0;
          comprasList.forEach(c => {
            const prov = (c.provider || 'DESCONOCIDO').toUpperCase();
            if (!provMap[prov]) provMap[prov] = 0;
            provMap[prov] += (c.total || 0);
            totalGasto += (c.total || 0);
          });
          
          const provArr = Object.keys(provMap).map(k => ({ provider: k, total: provMap[k] }));
          let provHtml = provArr.map(p => \`
            <tr>
              <td style="width:70%; text-align:left;">\${p.provider}</td>
              <td style="width:30%; text-align:right;">$\${p.total.toFixed(2)}</td>
            </tr>
          \`).join('');

          if (provArr.length === 0) {
            provHtml = '<tr><td colspan="2" style="text-align:center;">Ninguna</td></tr>';
          }

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
                  .row { display: flex; justify-content: space-between; margin: 2px 0; }
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
                <h3>COMPRAS A PROVEEDORES</h3>
                <table>
                  <thead>
                    <tr><th>PROVEEDOR</th><th style="text-align:right">TOTAL</th></tr>
                  </thead>
                  <tbody>\${provHtml}</tbody>
                </table>
                <div class="row" style="font-size:11px; margin-top:4px;"><span><b>TOTAL COMPRAS:</b></span><span><b>$\${totalGasto.toFixed(2)}</b></span></div>
                
                <div class="divider"></div>
                <p>*** CORTE REALIZADO ***</p>
              </body>
            </html>
          \`);
          w.document.close();
          w.focus();
          setTimeout(() => { w.print(); w.close(); }, 500);
        });
      }
      // ---- FIN IMPRESION CORTE Z ----`;

zCode = zCode.replace(zPrintRegex, zPrintNew);

fs.writeFileSync(zPath, zCode);
console.log('Fixed purchases logic.');
