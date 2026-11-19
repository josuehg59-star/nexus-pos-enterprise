with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write("""import { useState } from 'react';
import { Search, FileSpreadsheet, Activity, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import * as XLSX from 'xlsx';

export default function KardexReport() {
  const [search, setSearch] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const movements = useLiveQuery(() => db.kardex.orderBy('fecha').reverse().toArray()) || [];

  const filtered = movements.filter(m => {
    const matchSearch = !searchTerm ||
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStart = !fechaInicio || m.fecha >= fechaInicio;
    const matchEnd = !fechaFin || m.fecha <= fechaFin;
    return matchSearch && matchStart && matchEnd;
  });

  const handleBuscar = () => setSearchTerm(search);

  const handleExport = () => {
    if (filtered.length === 0) return alert('No hay movimientos para exportar.');
    const ws = XLSX.utils.json_to_sheet(filtered.map(m => ({
      FECHA: m.fecha,
      TIPO: m.tipo,
      SKU: m.sku,
      DESCRIPCION: m.productName,
      CANTIDAD: m.cantidad,
      COSTO: m.costo,
      PRECIO: m.precio,
      TOTAL: m.total,
      FOLIO: m.folio,
      PROVEEDOR: m.proveedor
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex');
    XLSX.writeFile(wb, 'Kardex_Movimientos.xlsx');
  };

  const getTipoStyle = (tipo: string) => {
    if (tipo === 'ENTRADA') return 'text-xs font-black px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-900';
    if (tipo === 'DEVOLUCION') return 'text-xs font-black px-3 py-1 rounded-full bg-orange-900/50 text-orange-400 border border-orange-900';
    return 'text-xs font-black px-3 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-900';
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'ENTRADA') return <ArrowUpCircle className="w-4 h-4 text-emerald-400 inline mr-1" />;
    if (tipo === 'DEVOLUCION') return <ArrowDownCircle className="w-4 h-4 text-orange-400 inline mr-1" />;
    return <MinusCircle className="w-4 h-4 text-red-400 inline mr-1" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">

      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">REPORTE DE <span className="text-blue-400">KARDEX</span></h2>
            <p className="text-slate-400 text-sm">HISTORIAL DE MOVIMIENTOS POR PRODUCTO Y FECHA</p>
          </div>
        </div>
        <button onClick={handleExport} className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 px-5 py-3 rounded-lg font-black text-xs flex items-center gap-2 transition-colors">
          <FileSpreadsheet className="w-4 h-4" /> EXPORTAR EXCEL
        </button>
      </div>

      <div className="p-6 flex gap-4 items-end border-b border-nexus-800 shrink-0">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">BUSCAR POR SKU O DESCRIPCION</label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleBuscar(); }} placeholder="Ej: coca, 7501055..." className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-12 pr-4 py-3 rounded-xl font-bold focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">FECHA INICIO</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">FECHA FINAL</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
        </div>
        <button onClick={handleBuscar} className="bg-[#2a68ff] hover:bg-[#1a55e6] text-white px-8 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors h-[46px]">
          <Search className="w-4 h-4" /> BUSCAR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">FECHA</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TIPO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">DESCRIPCION</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CANTIDAD</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">COSTO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">PRECIO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TOTAL LINEA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-500 font-bold">
                    {movements.length === 0
                      ? 'Aun no hay movimientos registrados. Procesa una Entrada para ver el historial.'
                      : 'No se encontraron movimientos con ese filtro.'}
                  </td>
                </tr>
              ) : filtered.map((m, idx) => (
                <tr key={idx} className="hover:bg-nexus-800/30 transition-colors border-b border-nexus-800/30">
                  <td className="p-4 text-xs font-bold text-slate-300">{m.fecha}</td>
                  <td className="p-4 text-center">
                    <span className={getTipoStyle(m.tipo)}>{getTipoIcon(m.tipo)}{m.tipo}</span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-300">{m.sku}</td>
                  <td className="p-4 text-xs font-black text-white uppercase">{m.productName}</td>
                  <td className="p-4 text-center font-black text-blue-400">{m.cantidad}</td>
                  <td className="p-4 text-center text-white font-bold">{"$" + m.costo.toFixed(2)}</td>
                  <td className="p-4 text-center text-emerald-400 font-bold">{"$" + m.precio.toFixed(2)}</td>
                  <td className="p-4 text-center text-white font-black">{"$" + m.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <p className="text-center text-slate-500 text-xs font-bold mt-4">
            {filtered.length} movimientos encontrados
          </p>
        )}
      </div>
    </div>
  );
}
""")
print('KardexReport.tsx written')
