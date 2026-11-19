import os
import re

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Imports and States
# Find the start of the component
comp_start = re.search(r"export default function Kardex\(\) \{", c)
if comp_start:
    states = """export default function Kardex() {
  const [scanInput, setScanInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [proveedor, setProveedor] = useState('SIN PROVEEDOR');
  const [folio, setFolio] = useState('');
  const [entradas, setEntradas] = useState<any[]>([]);
  const [tipoMovimiento, setTipoMovimiento] = useState('ENTRADA');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const providers = useLiveQuery(() => db.providers.toArray(), []) || [];

  // Cerrar sugerencias al clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda en vivo (Live Search)
  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = scanInput.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        return;
      }
      const matches = await db.products.filter(prod => {
        const skuMatch = prod.sku.toLowerCase().includes(q);
        const nameMatch = prod.name.toLowerCase().includes(q);
        const b2Match = prod.barcode2 && prod.barcode2.toLowerCase().includes(q);
        const b3Match = prod.barcode3 && prod.barcode3.toLowerCase().includes(q);
        return skuMatch || nameMatch || !!b2Match || !!b3Match;
      }).limit(15).toArray();
      setSuggestions(matches);
    };
    const timeoutId = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(timeoutId);
  }, [scanInput]);

  const addProductToTable = (product: any) => {
    setEntradas([...entradas, { ...product, entradaQty: 1 }]);
    setScanInput('');
    setSuggestions([]);
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const term = scanInput.trim().toUpperCase();
      const termLow = term.toLowerCase();
      let product = await db.products.where('sku').equals(term).first();
      
      if (!product) {
        product = (await db.products.toArray()).find(p => 
          p.name.toUpperCase().includes(term) || 
          (p.barcode2 && p.barcode2.toLowerCase().includes(termLow)) || 
          (p.barcode3 && p.barcode3.toLowerCase().includes(termLow))
        );
      }
      
      if (product) {
        addProductToTable(product);
      } else if (suggestions.length > 0) {
        addProductToTable(suggestions[0]);
      } else {
        alert('Producto no encontrado');
      }
    }
  };"""
    
    # Replace from export to handleScan end
    old_logic = re.search(r"export default function Kardex\(\) \{[\s\S]*?const updateEntrada", c)
    if old_logic:
        c = c[:old_logic.start()] + states + "\n\n  const updateEntrada" + c[old_logic.end():]


# 2. Add useRef and useEffect imports if missing
if "useRef" not in c:
    c = c.replace("import { useState } from 'react';", "import { useState, useEffect, useRef } from 'react';")

# 3. Update handleAplicar to use provider and folio
old_aplicar = re.search(r"await db\.kardex\.add\(\{[\s\S]*?proveedor: 'SIN PROVEEDOR'\n\s*\}\);", c)
if old_aplicar:
    new_aplicar = """await db.kardex.add({
        fecha,
        tipo: tipoMovimiento,
        sku: item.sku,
        productName: item.name,
        cantidad: item.entradaQty,
        costo: item.cost || 0,
        precio: item.price || 0,
        total: (item.cost || 0) * item.entradaQty,
        folio: folio,
        proveedor: proveedor
      });"""
    c = c[:old_aplicar.start()] + new_aplicar + c[old_aplicar.end():]

# 4. Update the Providers Dropdown & Folio input
old_header = re.search(r"<div className=\"flex gap-6 mb-6\">[\s\S]*?<div className=\"flex items-end gap-3\">", c)
if old_header:
    new_header = """<div className="flex gap-6 mb-6">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">PROVEEDOR</label>
                <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none">
                  <option value="SIN PROVEEDOR">SIN PROVEEDOR</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">FOLIO DE COMPRA / FACTURA</label>
                <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej: F-99824" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
              </div>
              <div className="flex items-end gap-3">"""
    c = c[:old_header.start()] + new_header + c[old_header.end():]

# 5. Update the Search Bar for live suggestions
old_search = re.search(r"\{\/\* BARRA DE BÚSQUEDA MULTIPLE \*\/\}[\s\S]*?\{\/\* TABLA PRINCIPAL Y TOTALES \*\/\}", c)
if old_search:
    new_search = """{/* BARRA DE BÚSQUEDA MULTIPLE CON AUTOCOMPLETADO */}
            <div className="relative mb-6 shrink-0" ref={searchContainerRef}>
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Escanear, escribir nombre o SKU y seleccionar... (Ej: COCA COLA)" 
                className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-12 pr-4 py-4 rounded-xl font-bold focus:outline-none focus:border-blue-500 text-lg transition-colors"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-nexus-900 border border-nexus-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {suggestions.map((prod, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => addProductToTable(prod)}
                      className="px-4 py-3 hover:bg-nexus-800 cursor-pointer flex justify-between items-center border-b border-nexus-800/50 last:border-0"
                    >
                      <div>
                        <p className="text-white font-bold text-sm">{prod.name}</p>
                        <p className="text-slate-500 text-[10px] font-mono mt-1">SKU: {prod.sku} {prod.barcode2 ? `| Alt: ${prod.barcode2}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-black text-sm">${prod.price.toFixed(2)}</p>
                        <p className="text-slate-500 text-[10px] font-bold">Stock: {prod.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TABLA PRINCIPAL Y TOTALES */}"""
    c = c[:old_search.start()] + new_search + c[old_search.end():]

with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Kardex upgraded with Live Search, dynamic providers, and folios.")
