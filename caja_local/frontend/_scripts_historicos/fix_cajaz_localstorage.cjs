const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

if (!file.includes('comprasDelDia = ')) {
  file = file.replace('const [showHistory, setShowHistory] = useState(false);', "const [showHistory, setShowHistory] = useState(false);\n  const [comprasDelDia, setComprasDelDia] = useState<any[]>(JSON.parse(localStorage.getItem('comprasDia') || '[]'));");
}

const oldTable = "<tbody className='divide-y divide-nexus-800'>\\n                  <tr>\\n                    <td colSpan={3} className='py-8 text-center text-slate-500 font-bold'>No hay compras o entradas registradas el da de hoy.</td>\\n                  </tr>\\n                </tbody>";
const newTable = "<tbody className='divide-y divide-nexus-800'>\\n" +
"                  {comprasDelDia.length === 0 ? (\\n" +
"                    <tr>\\n" +
"                      <td colSpan={3} className='py-8 text-center text-slate-500 font-bold'>No hay compras o entradas registradas el día de hoy.</td>\\n" +
"                    </tr>\\n" +
"                  ) : (\\n" +
"                    comprasDelDia.map((c, i) => (\\n" +
"                      <tr key={i}>\\n" +
"                        <td className='py-3 text-xs font-bold text-slate-400'>{c.proveedor}</td>\\n" +
"                        <td className='py-3 text-xs font-bold text-white'>{c.articulos}</td>\\n" +
"                        <td className='py-3 text-sm font-black text-fuchsia-400 text-right'>$ {c.total.toFixed(2)}</td>\\n" +
"                      </tr>\\n" +
"                    ))\\n" +
"                  )}\\n" +
"                </tbody>";

// The total calculation
const oldTotal = "<span className='text-xl font-black text-fuchsia-400'>.00</span>";
const newTotal = "<span className='text-xl font-black text-fuchsia-400'></span>";

file = file.replace(/<tbody className='divide-y divide-nexus-800'>[\s\S]*?<\/tbody>/, newTable);
file = file.replace(/<span className='text-xl font-black text-fuchsia-400'>\.00<\/span>/, newTotal);
file = file.replace(/<span className='text-xl font-black text-fuchsia-400'>\\.00<\/span>/, newTotal);

fs.writeFileSync('src/pages/CajaZ.tsx', file);
