import { useState, useRef, useEffect } from 'react';
import { Printer, Settings, CheckSquare, Square, Package, Search, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';

export default function ImpresionEtiquetas() {
  const [search, setSearch] = useState('');
  
  // 🌟 Persistencia en localStorage para que la lista no se borre al salir
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('nexus_etiquetas_selected_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set<number>(parsed);
      }
    } catch (e) {}
    return new Set<number>();
  });

  const [formato, setFormato] = useState(() => localStorage.getItem('nexus_etiquetas_formato') || '58mm');
  const [anchoBarra, setAnchoBarra] = useState<'AUTO' | 'COMPACTO' | 'ESTANDAR'>(() => {
    return (localStorage.getItem('nexus_etiquetas_ancho') as any) || 'AUTO';
  });
  const printRef = useRef<HTMLDivElement>(null);

  // 🌟 Guardado automático inmediato en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem('nexus_etiquetas_selected_ids', JSON.stringify(Array.from(selectedIds)));
    } catch (e) {}
  }, [selectedIds]);

  const handleFormatoChange = (f: string) => {
    setFormato(f);
    localStorage.setItem('nexus_etiquetas_formato', f);
  };

  const handleAnchoChange = (a: any) => {
    setAnchoBarra(a);
    localStorage.setItem('nexus_etiquetas_ancho', a);
  };

  const handleClearList = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`¿Deseas vaciar la lista de ${selectedIds.size} etiqueta(s) seleccionada(s)?`)) {
      setSelectedIds(new Set());
      localStorage.removeItem('nexus_etiquetas_selected_ids');
    }
  };

  const getBarcodeWidth = () => {
    if (anchoBarra === 'COMPACTO') return 0.95;
    if (anchoBarra === 'ESTANDAR') return 1.15;
    // AUTO (Recomendado): ajustado para caber perfectamente en el cabezal térmico sin cortar líneas
    return formato === '58mm' ? 1.0 : (formato === '50x25' ? 1.1 : 0.9);
  };

  const products = useLiveQuery(() => {
    let q = db.products.toCollection();
    return q.toArray().then(arr => {
      if (search) {
        const s = search.toLowerCase();
        return arr.filter(p => {
          const skuMatch = p.sku.toLowerCase().includes(s);
          const nameMatch = p.name.toLowerCase().includes(s);
          const b2Match = p.barcode2 && p.barcode2.toLowerCase().includes(s);
          const b3Match = p.barcode3 && p.barcode3.toLowerCase().includes(s);
          return skuMatch || nameMatch || b2Match || b3Match;
        });
      }
      return arr;
    });
  }, [search]) || [];

  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id as number)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: ${formato === '58mm' ? '58mm auto' : (formato === '50x25' ? '50mm 25mm' : '38mm 25mm')};
        margin: 0;
        padding: 0;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
          width: ${formato === '58mm' ? '46mm' : '100%'} !important;
          max-width: ${formato === '58mm' ? '46mm' : '100%'} !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: black !important;
          box-sizing: border-box !important;
        }
        svg {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }
      }
    `
  });

  const selectedProducts = products.filter(p => selectedIds.has(p.id as number));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative">
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">IMPRESIÓN DE <span className="text-blue-400">ETIQUETAS</span></h2>
            <p className="text-slate-400 text-sm">CÓDIGOS DE BARRAS PARA PRODUCTOS</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-nexus-800 px-4 py-2 rounded-lg border border-nexus-700">
            <Settings className="w-4 h-4 text-slate-400" />
            <select value={formato} onChange={e => handleFormatoChange(e.target.value)} className="bg-transparent text-white font-bold text-xs focus:outline-none">
              <option value="50x25">ESTÁNDAR (50x25 mm)</option>
              <option value="38x25">PEQUEÑA (38x25 mm)</option>
              <option value="58mm">TICKET POS-58 (Rollo 58mm)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-nexus-800 px-3 py-2 rounded-lg border border-nexus-700">
            <span className="text-[10px] font-black text-slate-400 uppercase">ANCHO BARRAS:</span>
            <select value={anchoBarra} onChange={e => handleAnchoChange(e.target.value as any)} className="bg-transparent text-emerald-400 font-bold text-xs focus:outline-none">
              <option value="AUTO">AUTO (CALIBRADO)</option>
              <option value="COMPACTO">COMPACTO (SIN CORTES)</option>
              <option value="ESTANDAR">ESTÁNDAR</option>
            </select>
          </div>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleClearList}
              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 px-4 py-2 rounded-lg font-black text-xs uppercase shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Vaciar toda la lista de etiquetas guardada"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> LIMPIAR ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> IMPRIMIR ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden print:hidden">
        {/* LISTA DE PRODUCTOS */}
        <div className="w-2/3 flex flex-col border-r border-nexus-800">
          <div className="p-6 border-b border-nexus-800 shrink-0">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="BUSCAR PRODUCTO PARA ETIQUETAR..." 
                className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-12 pr-4 py-3 rounded-xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <table className="w-full text-left">
              <thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-400 transition-colors">
                      {selectedIds.size === products.length && products.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PRODUCTO</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">PRECIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/50">
                {products.map(p => (
                  <tr key={p.id} onClick={() => toggleSelect(p.id as number)} className="hover:bg-nexus-800/30 transition-colors cursor-pointer">
                    <td className="p-4 text-center text-blue-400">
                      {selectedIds.has(p.id as number) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-600" />}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-300">{p.sku}</td>
                    <td className="p-4 text-xs font-black text-white">{p.name}</td>
                    <td className="p-4 text-center text-emerald-400 font-bold">${p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VISTA PREVIA */}
        <div className="w-1/3 bg-nexus-900/30 p-6 flex flex-col">
          <h3 className="font-black text-sm text-slate-400 mb-6 uppercase tracking-widest text-center">Vista Previa de Etiquetas</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-4">
            {selectedProducts.slice(0, 50).map((p, i) => (
              <div key={i} className="bg-white text-black p-2 rounded-lg flex flex-col items-center justify-center shadow-lg" style={{ width: formato === '58mm' ? '210px' : (formato === '50x25' ? '188px' : '143px'), height: formato === '58mm' ? 'auto' : '94px', padding: formato === '58mm' ? '0.75rem' : '0.5rem', marginBottom: formato === '58mm' ? '1rem' : '0' }}>
                <div className="font-bold text-[10px] truncate w-full text-center leading-tight mb-1 text-slate-800">{p.name}</div>
                <div className="flex justify-center w-full overflow-hidden">
                  <Barcode value={p.sku} width={getBarcodeWidth()} height={formato === '58mm' ? 36 : 24} fontSize={13} fontOptions="bold" margin={0} textMargin={2} displayValue={true} />
                </div>
                <div className="font-black text-base mt-1">${p.price.toFixed(2)}</div>
              </div>
            ))}
            {selectedProducts.length > 50 && (
              <div className="text-slate-500 text-xs font-bold">... y {selectedProducts.length - 50} etiquetas más (ocultas en vista previa)</div>
            )}
            {selectedProducts.length === 0 && (
              <div className="text-slate-600 text-xs font-bold text-center mt-20">Selecciona productos para previsualizar sus etiquetas.</div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENEDOR OCULTO PARA IMPRESIÓN REAL */}
      <div className="hidden">
        <div ref={printRef} style={{ width: formato === '58mm' ? '46mm' : '100%', margin: '0 auto', backgroundColor: 'white', padding: '0', color: 'black' }}>
          {selectedProducts.map((p, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              width: '100%',
              pageBreakAfter: formato === '58mm' ? 'auto' : 'always',
              marginBottom: formato === '58mm' ? '14px' : '0',
              paddingTop: formato === '58mm' ? '6px' : '0',
              fontFamily: 'Arial, sans-serif'
            }}>
              
              {/* Descripción más pequeña y compacta */}
              <div style={{ fontWeight: 700, fontSize: formato === '58mm' ? '9.5px' : '8.5px', marginBottom: '3px', lineHeight: '1.15', width: '100%', wordBreak: 'break-word', textTransform: 'uppercase' }}>
                {p.name}
              </div>
              
              {formato === '58mm' && (
                <div style={{ fontWeight: 900, fontSize: '15px', marginBottom: '4px' }}>
                  ${p.price.toFixed(2)}
                </div>
              )}

              {/* Código de barras calibrado con números bien en negritas (bold) */}
              <div style={{ margin: '0 auto', maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                <Barcode 
                  value={p.sku} 
                  width={getBarcodeWidth()} 
                  height={formato === '58mm' ? 36 : 24} 
                  fontSize={13} 
                  fontOptions="bold"
                  margin={0} 
                  textMargin={3} 
                  displayValue={true} 
                />
              </div>

              {formato !== '58mm' && (
                <div style={{ fontWeight: 900, fontSize: '13px', marginTop: '3px' }}>
                  ${p.price.toFixed(2)}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
