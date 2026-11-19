const fs = require('fs');

const content = import { useState } from 'react';
import { Search, FileSpreadsheet, Printer, Save, Trash2, Box } from 'lucide-react';
import { usePosStore } from '../store/useStore';
import { db } from '../store/database';

export default function Kardex() {
  const { cart, addToCart, updateCartQty } = usePosStore();
  const [scanInput, setScanInput] = useState('');
  const [entradas, setEntradas] = useState<any[]>([]);

  const subtotal = entradas.reduce((acc, item) => acc + (item.cost * (item.entradaQty || 1)), 0);

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const term = scanInput.trim().toUpperCase();
      const product = await db.products.where('sku').equals(term).first() || await db.products.where('name').equalsIgnoreCase(term).first();
      
      if (product) {
        setEntradas([...entradas, { ...product, entradaQty: 1 }]);
      } else {
        alert('Producto no encontrado');
      }
      setScanInput('');
    }
  };

  const updateEntrada = (index: number, field: string, value: number) => {
    const updated = [...entradas];
    updated[index][field] = value;
    setEntradas(updated);
  };

  const handleAplicar = async () => {
    for (const item of entradas) {
      const dbProduct = await db.products.get(item.id);
      if (dbProduct) {
        await db.products.update(item.id, {
          cost: item.cost,
          price: item.price,
          stock: dbProduct.stock + item.entradaQty
        });
      }
    }
    alert('Entrada procesada y guardada. El inventario ha sido actualizado.');
    setEntradas([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative">
      <div className="flex-1 flex flex-col print:hidden h-full">
        {/* HEADER */}
        <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
          <div className="flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-emerald-400" />
            <div>
              <h2 className="font-black text-2xl tracking-wider text-white">3. ENTRADA DE <span className="text-emerald-400">MERCADERÍA</span></h2>
              <p className="text-slate-400 text-sm">REGISTRA COMPRAS, AJUSTA COSTOS Y AUMENTA INVENTARIO</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">
              ENTRADA
            </button>
            <button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">
              DEVOLUCIÓN
            </button>
            <button className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors">
              MERMA
            </button>
            <div className="w-px h-8 bg-nexus-700 mx-2"></div>
            <button className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> EXCEL
            </button>
            <button onClick={() => window.print()} className="bg-blue-900/30 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2">
              <Printer className="w-4 h-4" /> IMPRIMIR PDF
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          {/* FORMULARIO SUPERIOR */}
          <div className="flex gap-6 mb-6">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">PROVEEDOR</label>
              <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none">
                <option>SIN PROVEEDOR</option>
                <option>COCA COLA</option>
                <option>BIMBO</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">FOLIO DE COMPRA / FACTURA</label>
              <input type="text" placeholder="Ej: F-99824" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
            </div>
            <div className="flex items-end gap-3">
              <button onClick={handleAplicar} disabled={entradas.length === 0} className={"text-white px-8 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 h-[46px] transition-colors " + (entradas.length > 0 ? "bg-[#2a68ff] hover:bg-[#1a55e6]" : "bg-slate-700 opacity-50 cursor-not-allowed")}>
                <Save className="w-4 h-4" /> APLICAR / PROCESAR
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA MULTIPLE */}
          <div className="relative mb-6 shrink-0">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={handleScan}
              placeholder="Escanear o buscar producto (Ej: 75010001) y presionar Enter..." 
              className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-12 pr-4 py-4 rounded-xl font-bold focus:outline-none focus:border-blue-500 text-lg transition-colors"
            />
          </div>

          {/* TABLA PRINCIPAL Y TOTALES */}
          <div className="flex-1 flex flex-col bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden relative">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU / CÓDIGO</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">DESCRIPCIÓN</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">COSTO</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">PRECIO</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">UTILIDAD</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CANTIDAD</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">IEPS %</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">IVA %</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TOTAL DE LÍNEA</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {entradas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-20 text-center text-slate-500 font-bold">Sin productos</td>
                    </tr>
                  ) : entradas.map((item, idx) => {
                    const cost = item.cost || 0;
                    const price = item.price || 0;
                    const qty = item.entradaQty || 1;
                    const utilidad = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '100.0';
                    const total = cost * qty;
                    return (
                      <tr key={idx} className="hover:bg-nexus-800/30 transition-colors group border-b border-nexus-800/50">
                        <td className="p-4 text-xs font-bold text-slate-300">{item.sku}</td>
                        <td className="p-4 text-xs font-black text-white uppercase">{item.name}</td>
                        <td className="p-4 text-center">
                          <input type="number" value={item.cost} onChange={(e) => updateEntrada(idx, 'cost', parseFloat(e.target.value) || 0)} className="w-20 bg-transparent border border-nexus-700 text-white font-bold px-2 py-1.5 rounded text-center focus:border-blue-500 outline-none" />
                        </td>
                        <td className="p-4 text-center">
                          <input type="number" value={item.price} onChange={(e) => updateEntrada(idx, 'price', parseFloat(e.target.value) || 0)} className="w-20 bg-transparent border border-emerald-900/50 text-emerald-400 font-bold px-2 py-1.5 rounded text-center focus:border-emerald-500 outline-none" />
                        </td>
                        <td className="p-4 text-center text-xs font-black text-emerald-400">
                          {utilidad}%
                        </td>
                        <td className="p-4 text-center">
                          <input type="number" value={item.entradaQty} onChange={(e) => updateEntrada(idx, 'entradaQty', parseInt(e.target.value) || 1)} className="w-16 bg-blue-900/20 border border-blue-900/50 text-blue-400 font-black px-2 py-1.5 rounded text-center focus:border-blue-500 outline-none" />
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" defaultValue="0" className="w-12 bg-transparent border border-orange-900/50 text-orange-400 font-bold px-2 py-1.5 rounded text-center outline-none" />
                            <span className="text-orange-500/50 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" defaultValue="0" className="w-12 bg-transparent border border-blue-900/50 text-blue-400 font-bold px-2 py-1.5 rounded text-center outline-none" />
                            <span className="text-blue-500/50 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-white font-black">
                          \
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => setEntradas(entradas.filter((_, i) => i !== idx))} className="border border-red-900/50 text-red-500 hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TOTALES FLOTANTES */}
            <div className="absolute bottom-6 right-6 bg-[#0b1120] border border-nexus-700 rounded-2xl p-6 w-80 shadow-2xl">
              <div className="flex justify-between items-center mb-3 text-sm font-bold text-slate-400">
                <span>SUBTOTAL:</span>
                <span className="text-white">\</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-sm font-bold text-slate-400">
                <span>IEPS:</span>
                <span className="text-white">\.00</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-400 pb-4 border-b border-nexus-800">
                <span>IVA:</span>
                <span className="text-white">\.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-black text-lg tracking-widest">TOTAL:</span>
                <span className="text-emerald-400 font-black text-3xl">\</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PRINT DIV */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:text-black p-8 font-sans">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-black uppercase">REPORTE DE ENTRADA</h1>
            <p className="text-sm mt-2"><strong>FECHA:</strong> {new Date().toLocaleDateString()}</p>
            <p className="text-sm"><strong>PROVEEDOR:</strong> SIN PROVEEDOR</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black">NEXUS POS</h2>
            <p className="text-sm">RFC: XAXX010101000</p>
          </div>
        </div>
        <table className="w-full text-left text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 font-black">CANTIDAD</th>
              <th className="py-2 font-black">CÓDIGO</th>
              <th className="py-2 font-black">DESCRIPCIÓN</th>
              <th className="py-2 font-black text-right">PRECIO UNITARIO</th>
              <th className="py-2 font-black text-right">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-2">{item.entradaQty || 1}</td>
                <td className="py-2">{item.sku}</td>
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right">\</td>
                <td className="py-2 text-right">\</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between font-bold py-1 border-t border-black">
              <span>SUBTOTAL:</span>
              <span>\</span>
            </div>
            <div className="flex justify-between font-black py-2 border-t-2 border-black text-lg">
              <span>TOTAL:</span>
              <span>\</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TruckIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  )
}
;

fs.writeFileSync('src/pages/Kardex.tsx', content);
