const fs = require('fs');
const path = require('path');

const zPath = path.join(__dirname, 'caja_local/frontend/src/pages/CajaZ.tsx');
let zCode = fs.readFileSync(zPath, 'utf8');

// The code block to replace starts with: <div className='bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>
// and ends before {/* COLUMNA DERECHA: FLUJO DE EFECTIVO Y CIERRE */}

const newBlock = `
              <div className='bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>
                 <h3 className='text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3'>
                  <Calculator className='text-blue-400' /> RESUMEN DE PRODUCTOS VENDIDOS
                </h3>
                <table className='w-full text-left'>
                  <thead className='border-b border-nexus-800'>
                    <tr>
                      <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Cant</th>
                      <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Producto</th>
                      <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right'>Total</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-nexus-800'>
                    {(() => {
                      const itemsMap: Record<string, any> = {};
                      tickets.forEach(t => {
                        (t.items || []).forEach((i: any) => {
                          const name = (i.name || i.productName || 'PRODUCTO').toUpperCase();
                          if (!itemsMap[name]) itemsMap[name] = { qty: 0, total: 0 };
                          itemsMap[name].qty += (i.cartQty || i.qty || 1);
                          itemsMap[name].total += (i.lineTotal !== undefined ? i.lineTotal : (i.price * (i.cartQty || i.qty || 1)));
                        });
                      });
                      const itemsArr = Object.keys(itemsMap).map(k => ({ name: k, ...itemsMap[k] }));
                      if (itemsArr.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className='py-8 text-center text-slate-500 font-bold'>No hay productos vendidos en este turno.</td>
                          </tr>
                        );
                      }
                      return itemsArr.map((c, i) => (
                        <tr key={i}>
                          <td className='py-3 text-xs font-bold text-slate-400'>{c.qty}</td>
                          <td className='py-3 text-xs font-bold text-white'>{c.name}</td>
                          <td className='py-3 text-sm font-black text-emerald-400 text-right'>$ {c.total.toFixed(2)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
`;

// Regex replacement
const regex = /<div className='bg-nexus-900\/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>[\s\S]*?<\/div>\s*<\/div>\s*\{\/\*\s*COLUMNA DERECHA: FLUJO DE EFECTIVO Y CIERRE\s*\*\/\}/;

zCode = zCode.replace(regex, newBlock + "\n            {/* COLUMNA DERECHA: FLUJO DE EFECTIVO Y CIERRE */}");

fs.writeFileSync(zPath, zCode);
console.log('CajaZ table replaced.');
