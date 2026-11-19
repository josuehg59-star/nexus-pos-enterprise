const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const printDiv = "      <div className='hidden print:block print:absolute print:inset-0 print:bg-white print:text-black p-8 font-sans'>\n" +
"        <div className='flex justify-between items-start border-b-2 border-black pb-4 mb-4'>\n" +
"          <div>\n" +
"            <h1 className='text-3xl font-black uppercase'>REPORTE DE ENTRADA</h1>\n" +
"            <p className='text-sm mt-2'><strong>FECHA:</strong> {new Date().toLocaleDateString()}</p>\n" +
"            <p className='text-sm'><strong>PROVEEDOR:</strong> SIN PROVEEDOR</p>\n" +
"          </div>\n" +
"          <div className='text-right'>\n" +
"            <h2 className='text-2xl font-black'>NEXUS POS</h2>\n" +
"            <p className='text-sm'>RFC: XAXX010101000</p>\n" +
"          </div>\n" +
"        </div>\n" +
"        <table className='w-full text-left text-sm mb-8 border-collapse'>\n" +
"          <thead>\n" +
"            <tr className='border-b-2 border-black'>\n" +
"              <th className='py-2 font-black'>CANTIDAD</th>\n" +
"              <th className='py-2 font-black'>CÓDIGO</th>\n" +
"              <th className='py-2 font-black'>DESCRIPCIÓN</th>\n" +
"              <th className='py-2 font-black text-right'>PRECIO UNITARIO</th>\n" +
"              <th className='py-2 font-black text-right'>IMPORTE</th>\n" +
"            </tr>\n" +
"          </thead>\n" +
"          <tbody>\n" +
"            {entradas.map((item, idx) => (\n" +
"              <tr key={idx} className='border-b border-gray-300'>\n" +
"                <td className='py-2'>{item.entradaQty || 1}</td>\n" +
"                <td className='py-2'>{item.sku}</td>\n" +
"                <td className='py-2'>{item.name}</td>\n" +
"                <td className='py-2 text-right'></td>\n" +
"                <td className='py-2 text-right'></td>\n" +
"              </tr>\n" +
"            ))}\n" +
"          </tbody>\n" +
"        </table>\n" +
"        <div className='flex justify-end'>\n" +
"          <div className='w-64'>\n" +
"            <div className='flex justify-between font-bold py-1 border-t border-black'>\n" +
"              <span>SUBTOTAL:</span>\n" +
"              <span></span>\n" +
"            </div>\n" +
"            <div className='flex justify-between font-black py-2 border-t-2 border-black text-lg'>\n" +
"              <span>TOTAL:</span>\n" +
"              <span></span>\n" +
"            </div>\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"    </div>";

file = file.replace(/<\/div>\s*$/m, printDiv);
fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Added print layout to Kardex');
