const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

if (!file.includes('salidasEfectivo')) {
  file = file.replace('const [montoInicial, setMontoInicial] = useState(\\'500\\');', 'const [montoInicial, setMontoInicial] = useState(\\'500\\');\n  const [salidasEfectivo, setSalidasEfectivo] = useState(\\'0\\');');
  
  file = file.replace('const totalEnCajaFisica = parseFloat(montoInicial || \\'0\\') + ventasEfectivo;', 'const totalEnCajaFisica = parseFloat(montoInicial || \\'0\\') + ventasEfectivo - parseFloat(salidasEfectivo || \\'0\\');');
  
  const salidaJSX = "<div>\n" +
"                  <label className='text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2'>Compras / Pago a Proveedores (-)</label>\n" +
"                  <div className='flex items-center'>\n" +
"                    <span className='bg-nexus-800 text-slate-400 px-4 py-3 rounded-l-xl font-bold border border-nexus-700 border-r-0'>$</span>\n" +
"                    <input \n" +
"                      type='number' \n" +
"                      value={salidasEfectivo}\n" +
"                      onChange={e => setSalidasEfectivo(e.target.value)}\n" +
"                      className='w-full bg-[#0b1120] border border-nexus-700 text-rose-400 px-4 py-3 rounded-r-xl font-bold focus:outline-none focus:border-rose-500 transition-colors' \n" +
"                    />\n" +
"                  </div>\n" +
"                </div>";
                
  file = file.replace('<div className="pt-6 border-t border-nexus-800">', salidaJSX + '\n\n                <div className="pt-6 border-t border-nexus-800">');
  
  fs.writeFileSync('src/pages/CajaZ.tsx', file);
  console.log('CajaZ patched for compras');
}
