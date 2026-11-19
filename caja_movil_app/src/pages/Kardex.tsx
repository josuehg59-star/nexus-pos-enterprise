import { useState, useEffect, useRef } from 'react';
import { Search, FileSpreadsheet, Printer, Save, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import * as XLSX from 'xlsx';
import ReporteEntradaPDFModal, { type CompraData } from '../components/ReporteEntradaPDFModal';
import { sendMovementToMaster } from '../store/syncClient';

export default function Kardex() {
  const [scanInput, setScanInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [proveedor, setProveedor] = useState('SIN PROVEEDOR');
  const [folio, setFolio] = useState('');
  const [entradas, setEntradas] = useState<any[]>([]);
  const [tipoMovimiento, setTipoMovimiento] = useState('ENTRADA');
  const [createdCompra, setCreatedCompra] = useState<CompraData | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sourceOrderId, setSourceOrderId] = useState<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const providers = useLiveQuery(() => db.providers.toArray(), []) || [];

  // 1. Restaurar de localStorage o de transferencia desde Órdenes de Compra al cargar
  useEffect(() => {
    // Transferencia activa de Orden de Compra
    const poTransfer = localStorage.getItem('nexus_load_po_to_entrada');
    if (poTransfer) {
      try {
        const parsed = JSON.parse(poTransfer);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setProveedor(parsed.provider || 'SIN PROVEEDOR');
          if (parsed.folio) setFolio('ENT-' + parsed.folio);
          if (parsed.orderId) setSourceOrderId(Number(parsed.orderId));
          setEntradas(parsed.items);
          localStorage.removeItem('nexus_load_po_to_entrada');
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Error cargando orden transferida:', e);
      }
    }

    // Borrador de Entrada persistente
    const savedDraft = localStorage.getItem('nexus_pos_entrada_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.entradas && Array.isArray(draft.entradas)) setEntradas(draft.entradas);
        if (draft.proveedor) setProveedor(draft.proveedor);
        if (draft.folio !== undefined) setFolio(draft.folio);
        if (draft.tipoMovimiento) setTipoMovimiento(draft.tipoMovimiento);
      } catch (e) {
        console.error('Error cargando borrador:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Persistir borrador automáticamente ante cualquier cambio
  useEffect(() => {
    if (!isLoaded) return;
    if (entradas.length > 0 || folio.trim()) {
      localStorage.setItem('nexus_pos_entrada_draft', JSON.stringify({
        entradas,
        proveedor,
        folio,
        tipoMovimiento
      }));
    } else {
      localStorage.removeItem('nexus_pos_entrada_draft');
    }
  }, [entradas, proveedor, folio, tipoMovimiento, isLoaded]);

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
    setEntradas([...entradas, {
      ...product,
      entradaQty: 1,
      ieps: Number(product.ieps) || 0,
      iva: Number(product.iva) || 0,
    }]);
    setScanInput('');
    setSuggestions([]);
  };

  // Cálculo de impuestos por línea: IEPS sobre el costo, IVA sobre (costo + IEPS)
  const calcLine = (item: any) => {
    const base = (Number(item.cost) || 0) * (Number(item.entradaQty) || 0);
    const iepsAmt = base * ((Number(item.ieps) || 0) / 100);
    const ivaAmt = (base + iepsAmt) * ((Number(item.iva) || 0) / 100);
    return { base, iepsAmt, ivaAmt, total: base + iepsAmt + ivaAmt };
  };

  const subtotal = entradas.reduce((acc, item) => acc + calcLine(item).base, 0);
  const totalIeps = entradas.reduce((acc, item) => acc + calcLine(item).iepsAmt, 0);
  const totalIva = entradas.reduce((acc, item) => acc + calcLine(item).ivaAmt, 0);
  const granTotal = subtotal + totalIeps + totalIva;

  const updateEntrada = (index: number, field: string, value: number) => {
    const updated = entradas.map((it, i) => i === index ? { ...it, [field]: value } : it);
    setEntradas(updated);
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const term = scanInput.trim().toUpperCase();
      const termLow = term.toLowerCase();
      let product = await db.products.where('sku').equals(term).first();
      
      if (!product) {
        const allProds = await db.products.toArray();
        // 1. Intentar código alterno exacto
        product = allProds.find(p => {
          if (p.barcode2 && String(p.barcode2).toLowerCase().split(',').map(s=>s.trim()).includes(termLow)) return true;
          if (p.barcode3 && String(p.barcode3).toLowerCase().split(',').map(s=>s.trim()).includes(termLow)) return true;
          return false;
        });
        // 2. Coincidencia parcial
        if (!product) {
          product = allProds.find(p => 
            p.name.toUpperCase().includes(term) || 
            (p.barcode2 && p.barcode2.toLowerCase().includes(termLow)) || 
            (p.barcode3 && p.barcode3.toLowerCase().includes(termLow))
          );
        }
      }
      
      if (product) {
        addProductToTable(product);
      } else if (suggestions.length > 0) {
        addProductToTable(suggestions[0]);
      } else {
        alert('Producto no encontrado');
      }
    }
  };

  const handleExportExcel = () => {
    if (entradas.length === 0) return alert('No hay datos para exportar.');
    const ws = XLSX.utils.json_to_sheet(entradas.map(item => {
      const l = calcLine(item);
      return {
        SKU: item.sku,
        DESCRIPCION: item.name,
        COSTO: item.cost,
        PRECIO: item.price,
        CANTIDAD: item.entradaQty,
        'IEPS %': item.ieps || 0,
        'IVA %': item.iva || 0,
        SUBTOTAL: +l.base.toFixed(2),
        IEPS: +l.iepsAmt.toFixed(2),
        IVA: +l.ivaAmt.toFixed(2),
        TOTAL: +l.total.toFixed(2)
      };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas');
    XLSX.writeFile(wb, 'Reporte_Entradas.xlsx');
  };

  const handleAplicar = async () => {
    if (entradas.length === 0) return;

    // Generar folio automático si viene vacío (ej: F-907367)
    const finalFolio = folio.trim() || 'F-' + Math.floor(100000 + Math.random() * 900000);
    const fechaHora = new Date().toLocaleString('es-MX');
    const fechaISO = new Date().toISOString();

    const compraItems = entradas.map(item => {
      const l = calcLine(item);
      return {
        sku: item.sku || 'N/A',
        name: item.name || '',
        unit_measure: item.unit_measure || 'PZA',
        cost: item.cost || 0,
        price: item.price || 0,
        qty: item.entradaQty || 1,
        ieps_pct: Number(item.ieps) || 0,
        iva_pct: Number(item.iva) || 0,
        total: +l.total.toFixed(2)
      };
    });

    // Guardar en tabla de compras con fecha ISO estándar para arqueos y corte Z
    const newCompra: CompraData = {
      folio: finalFolio,
      date: fechaISO,
      provider: proveedor || 'SIN PROVEEDOR',
      items: compraItems,
      subtotal: +subtotal.toFixed(2),
      ieps: +totalIeps.toFixed(2),
      iva: +totalIva.toFixed(2),
      total: +granTotal.toFixed(2),
      status: tipoMovimiento === 'DEVOLUCION' ? 'DEVOLUCION' : (tipoMovimiento === 'MERMA' ? 'MERMA' : 'COMPRA')
    };

    await db.compras.add(newCompra);

    // Actualizar existencias en productos y registrar Kárdex
    for (const item of entradas) {
      const qty = Number(item.entradaQty) || 0;
      const l = calcLine(item);
      
      // Búsqueda robusta por ID, SKU o Nombre para evitar fallos si el item proviene de transferencia u ordenes de compra
      let dbProduct = null;
      if (item.id && !isNaN(Number(item.id))) {
        dbProduct = await db.products.get(Number(item.id));
      }
      if (!dbProduct && item.sku) {
        const cleanSku = String(item.sku).trim();
        dbProduct = await db.products.where('sku').equals(cleanSku).first();
        if (!dbProduct) {
          dbProduct = await db.products.filter(p => String(p.sku || '').trim().toUpperCase() === cleanSku.toUpperCase()).first();
        }
      }
      if (!dbProduct && item.name) {
        const cleanName = String(item.name).trim().toUpperCase();
        dbProduct = await db.products.filter(p => String(p.name || '').trim().toUpperCase() === cleanName).first();
      }

      const oldStock = Number(dbProduct?.stock) || 0;
      // ENTRADA suma stock; MERMA y DEVOLUCIÓN A PROVEEDOR restan stock
      const delta = (tipoMovimiento === 'MERMA' || tipoMovimiento === 'DEVOLUCION') ? -qty : qty;
      const newStock = oldStock + delta;

      if (dbProduct && dbProduct.id) {
        await db.products.update(dbProduct.id, {
          cost: Number(item.cost) || dbProduct.cost || 0,
          price: Number(item.price) || dbProduct.price || 0,
          ieps: Number(item.ieps) !== undefined ? Number(item.ieps) : (dbProduct.ieps || 0),
          iva: Number(item.iva) !== undefined ? Number(item.iva) : (dbProduct.iva || 0),
          stock: newStock
        } as any);
      } else {
        console.warn('Advertencia: No se encontró el producto en catálogo para actualizar stock:', item);
      }

      const detalleTexto = tipoMovimiento === 'DEVOLUCION'
        ? `Devolución a proveedor ${proveedor} (Folio #${finalFolio})`
        : tipoMovimiento === 'MERMA'
          ? `Merma / baja de inventario (Folio #${finalFolio})`
          : `Entrada / compra a proveedor ${proveedor} (Folio #${finalFolio})`;

      await db.kardex.add({
        fecha: fechaHora,
        tipo: tipoMovimiento,
        sku: item.sku || dbProduct?.sku || 'N/A',
        productName: item.name || dbProduct?.name || 'DESCONOCIDO',
        cantidad: qty,
        costo: Number(item.cost) || 0,
        precio: Number(item.price) || 0,
        total: +l.total.toFixed(2),
        folio: finalFolio,
        proveedor: proveedor,
        stockAnterior: oldStock,
        stockNuevo: newStock,
        detalles: detalleTexto
      } as any);
    }

    // Si esta entrada provenía de una Orden de Compra (transferida de SmartPurchasing),
    // actualizar el estatus de la orden original a 'RECIBIDA' para que salga de pendientes
    if (sourceOrderId) {
      try {
        await db.compras.update(sourceOrderId, {
          status: 'RECIBIDA',
          fechaRecepcion: fechaISO
        });
      } catch (err) {
        console.warn('No se pudo marcar la orden original como recibida:', err);
      }
      setSourceOrderId(null);
    } else {
      // Si el folio era tipo ENT-OC-XXXXXX, buscar si existe esa orden y marcarla recibida
      const cleanOcFolio = finalFolio.replace(/^ENT-/, '');
      if (cleanOcFolio.startsWith('OC-')) {
        try {
          const matchOrder = await db.compras.where('folio').equals(cleanOcFolio).first();
          if (matchOrder && matchOrder.id && (matchOrder.status === 'ORDEN' || matchOrder.status === 'PENDIENTE')) {
            await db.compras.update(matchOrder.id, {
              status: 'RECIBIDA',
              fechaRecepcion: fechaISO
            });
          }
        } catch (e) {}
      }
    }

    sendMovementToMaster({
      tipo: tipoMovimiento as any,
      folio: finalFolio,
      proveedor: proveedor,
      detalles: tipoMovimiento === 'DEVOLUCION'
        ? `Devolución a proveedor ${proveedor} (Folio #${finalFolio})`
        : tipoMovimiento === 'MERMA'
          ? `Merma / baja de inventario (Folio #${finalFolio})`
          : `Entrada / compra a proveedor ${proveedor} (Folio #${finalFolio})`,
      items: entradas.map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        qty: Number(item.entradaQty) || 1,
        cost: Number(item.cost) || 0,
        price: Number(item.price) || 0,
        ieps: Number(item.ieps) || 0,
        iva: Number(item.iva) || 0
      }))
    });

    setCreatedCompra(newCompra);
    setShowPDFModal(true);
    setEntradas([]);
    setFolio('');
    localStorage.removeItem('nexus_pos_entrada_draft');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative">
      
      {/* PANTALLA PRINCIPAL (SE OCULTA AL IMPRIMIR) */}
      <div className="flex-1 flex flex-col h-full print:hidden">
        
        {/* HEADER ADAPTABLE */}
        <div className="bg-nexus-900/70 border-b border-nexus-800 shrink-0 p-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-sm sm:text-lg tracking-wider text-white">ENTRADA DE <span className="text-emerald-400">MERCADERÍA</span></h2>
                  {entradas.length > 0 && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {entradas.length} PROD
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">REGISTRA COMPRAS Y AUMENTA INVENTARIO</p>
              </div>
            </div>

            {/* BOTONES DE MOVIMIENTO Y EXPORTACIÓN (SCROLLABLE EN MÓVIL) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              <button onClick={() => setTipoMovimiento("ENTRADA")} className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase transition-colors shrink-0 ${tipoMovimiento === "ENTRADA" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "bg-nexus-800 text-slate-400 hover:bg-nexus-700"}`}>ENTRADA</button>
              <button onClick={() => setTipoMovimiento("DEVOLUCION")} className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase transition-colors shrink-0 ${tipoMovimiento === "DEVOLUCION" ? "bg-orange-500 text-white shadow-md shadow-orange-500/30" : "bg-nexus-800 text-slate-400 hover:bg-nexus-700"}`}>DEVOLUCIÓN</button>
              <button onClick={() => setTipoMovimiento("MERMA")} className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase transition-colors shrink-0 ${tipoMovimiento === "MERMA" ? "bg-red-500 text-white shadow-md shadow-red-500/30" : "bg-nexus-800 text-slate-400 hover:bg-nexus-700"}`}>MERMA</button>
              <button onClick={handleExportExcel} className="bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
              <button onClick={() => window.print()} className="bg-blue-900/30 border border-blue-500/40 text-blue-400 px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 shrink-0">
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-2.5 sm:p-5 overflow-hidden">
          {/* FORMULARIO SUPERIOR */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-3 shrink-0">
            <div className="flex-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">PROVEEDOR</label>
              <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="w-full bg-nexus-900/70 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs focus:border-blue-500 outline-none">
                <option value="SIN PROVEEDOR">SIN PROVEEDOR</option>
                {providers.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">FOLIO DE COMPRA / FACTURA</label>
              <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="Ej: F-99824" className="w-full bg-nexus-900/70 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs focus:border-blue-500 outline-none" />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas vaciar la mesa de entradas actual y limpiar el borrador?')) {
                    setEntradas([]);
                    setFolio('');
                    localStorage.removeItem('nexus_pos_entrada_draft');
                  }
                }}
                disabled={entradas.length === 0 && !folio}
                className="flex-1 sm:flex-initial bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 h-[38px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Limpiar mesa"
              >
                <Trash2 className="w-3.5 h-3.5" /> LIMPIAR
              </button>
              <button onClick={handleAplicar} disabled={entradas.length === 0} className={"flex-1 sm:flex-initial text-white px-5 py-2 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 h-[38px] shadow-lg transition-all " + (entradas.length > 0 ? "bg-[#2a68ff] hover:bg-[#1a55e6] shadow-blue-600/30 active:scale-95" : "bg-slate-700 opacity-50 cursor-not-allowed")}>
                <Save className="w-3.5 h-3.5" /> PROCESAR
              </button>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA MULTIPLE CON AUTOCOMPLETADO */}
          <div className="relative mb-3 shrink-0" ref={searchContainerRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={handleScan}
              placeholder="Escanear, escribir nombre o SKU y seleccionar... (Ej: COCA COLA)" 
              className="w-full bg-nexus-900/70 border border-nexus-700 text-white pl-9 pr-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-blue-500 text-xs sm:text-base transition-colors"
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
                    const qty = item.entradaQty ?? 1;
                    const utilidad = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '100.0';
                    const total = calcLine(item).total;
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
                          <input type="number" min="0" step="any" value={qty} onChange={(e) => updateEntrada(idx, 'entradaQty', parseFloat(e.target.value) || 0)} className="w-16 bg-blue-900/20 border border-blue-900/50 text-blue-400 font-black px-2 py-1.5 rounded text-center focus:border-blue-500 outline-none" />
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min="0" step="any" value={item.ieps ?? 0} onChange={(e) => updateEntrada(idx, 'ieps', parseFloat(e.target.value) || 0)} className="w-14 bg-transparent border border-orange-900/50 text-orange-400 font-bold px-2 py-1.5 rounded text-center outline-none focus:border-orange-500" />
                            <span className="text-orange-500/50 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" min="0" step="any" value={item.iva ?? 0} onChange={(e) => updateEntrada(idx, 'iva', parseFloat(e.target.value) || 0)} className="w-14 bg-transparent border border-blue-900/50 text-blue-400 font-bold px-2 py-1.5 rounded text-center outline-none focus:border-blue-500" />
                            <span className="text-blue-500/50 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-white font-black">
                          ${total.toFixed(2)}
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

            {/* TOTALES (AL FINAL DE LA TABLA) */}
            <div className="bg-nexus-900/90 border-t border-nexus-800 p-3 sm:p-5 flex justify-end shrink-0">
              <div className="w-full sm:w-80">
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-slate-400">
                  <span>SUBTOTAL:</span>
                  <span className="text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-slate-400">
                  <span>IEPS:</span>
                  <span className="text-white">${totalIeps.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2.5 text-xs font-bold text-slate-400 pb-2 border-b border-nexus-800">
                  <span>IVA:</span>
                  <span className="text-white">${totalIva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-black text-sm tracking-wider">TOTAL:</span>
                  <span className="text-emerald-400 font-black text-xl sm:text-2xl">${granTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REPORTE DE IMPRESIÓN (SOLO SE VE AL IMPRIMIR PDF) */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-8 font-sans">
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
                <td className="py-2 text-right">${(item.cost || 0).toFixed(2)}</td>
                <td className="py-2 text-right">${calcLine(item).total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between font-bold py-1 border-t border-black">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold py-1">
              <span>IEPS:</span>
              <span>${totalIeps.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold py-1">
              <span>IVA:</span>
              <span>${totalIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black py-2 border-t-2 border-black text-lg">
              <span>TOTAL:</span>
              <span>${granTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <ReporteEntradaPDFModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        compra={createdCompra}
      />
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
  );
}
