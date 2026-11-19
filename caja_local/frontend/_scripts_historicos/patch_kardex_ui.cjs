const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

// 1. Add state for tipoMovimiento and import XLSX
if (!file.includes('const [tipoMovimiento')) {
  file = file.replace('const [entradas, setEntradas] = useState<any[]>([]);', "const [entradas, setEntradas] = useState<any[]>([]);\n  const [tipoMovimiento, setTipoMovimiento] = useState('ENTRADA');");
}
if (!file.includes('import * as XLSX')) {
  file = file.replace("import { db } from '../store/database';", "import { db } from '../store/database';\nimport * as XLSX from 'xlsx';");
}

// 2. Add handleExportExcel
const exportExcelCode = const handleExportExcel = () => {
    if (entradas.length === 0) return alert('No hay datos para exportar.');
    const ws = XLSX.utils.json_to_sheet(entradas.map(item => ({
      SKU: item.sku,
      DESCRIPCION: item.name,
      COSTO: item.cost,
      PRECIO: item.price,
      CANTIDAD: item.entradaQty,
      TOTAL: item.cost * (item.entradaQty || 1)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas');
    XLSX.writeFile(wb, 'Reporte_Entradas.xlsx');
  };;
if (!file.includes('const handleExportExcel')) {
  file = file.replace('const handleAplicar = async () => {', exportExcelCode + '\n\n  const handleAplicar = async () => {');
}

// 3. Fix the Totals Box to not overlap (make it a footer instead of absolute)
file = file.replace(/<div className="absolute bottom-6 right-6 bg-\[#0b1120\] border border-nexus-700 rounded-2xl p-6 w-80 shadow-2xl">/, '<div className="bg-nexus-900/80 border-t border-nexus-800 p-6 flex justify-end shrink-0"><div className="w-80">');
file = file.replace(/<span className="text-emerald-400 font-black text-3xl">\\\<\/span>\n\s*<\/div>\n\s*<\/div>/, '<span className="text-emerald-400 font-black text-3xl">\\</span>\n            </div>\n          </div>\n          </div>');

// 4. Update the 3 Buttons to show active state
file = file.replace(/<button className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">\s*ENTRADA\s*<\/button>/, '<button onClick={() => setTipoMovimiento("ENTRADA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>ENTRADA</button>');
file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">\s*DEVOLUCIÓN\s*<\/button>/, '<button onClick={() => setTipoMovimiento("DEVOLUCION")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>DEVOLUCIÓN</button>');
file = file.replace(/<button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">\s*MERMA\s*<\/button>/, '<button onClick={() => setTipoMovimiento("MERMA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>MERMA</button>');

// 5. Link EXCEL button
file = file.replace(/<button className="bg-emerald-900\/30 border border-emerald-500\/50 text-emerald-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2">/, '<button onClick={handleExportExcel} className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2 transition-colors">');


fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Kardex patched');
