import { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Search, Trash2, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import { notifyDataMutation } from '../store/backup';
import { sendAuditToMaster } from '../store/syncClient';

export default function Auditoria() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterText, setFilterText] = useState('');
  
  // 🌟 Carga inicial directa desde localStorage para que aparezca de inmediato al entrar
  const [conteos, setConteos] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('nexus_auditoria_conteos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch(e) {}
    return {};
  });

  const [scanOrder, setScanOrder] = useState<number[]>(() => {
    try {
      const savedOrder = localStorage.getItem('nexus_auditoria_scan_order');
      if (savedOrder) return JSON.parse(savedOrder);
      const saved = localStorage.getItem('nexus_auditoria_conteos');
      if (saved) return Object.keys(JSON.parse(saved)).map(Number);
    } catch(e) {}
    return [];
  });

  const hasSavedAudit = Object.keys(conteos).length > 0;

  const [modalidad, setModalidad] = useState(() => {
    return localStorage.getItem('nexus_auditoria_modalidad') || (hasSavedAudit ? 'INVENTARIO TOTAL' : 'POR PROVEEDOR');
  });
  const [proveedor, setProveedor] = useState(() => localStorage.getItem('nexus_auditoria_proveedor') || '');
  const [isLibre, setIsLibre] = useState(() => {
    const saved = localStorage.getItem('nexus_auditoria_is_libre');
    return saved !== null ? saved === 'true' : hasSavedAudit;
  });
  const [isAuditing, setIsAuditing] = useState(true);
  const [mostrarBannerAvance, setMostrarBannerAvance] = useState(hasSavedAudit);

  // Desplegable de Sugerencias
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const dbProviders = useLiveQuery(() => db.providers.toArray(), []) || [];
  const dbProducts = useLiveQuery(() => db.products.toArray(), []) || [];

  // Listener para cerrar sugerencias al hacer clic fuera del input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar sugerencias en tiempo real a medida que se escribe en la barra principal
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const cleanTerm = q.replace(/[-_/,.]/g, ' ');
    const searchWords = cleanTerm.split(/\s+/).filter(Boolean);

    const matches = dbProducts.filter(p => {
      const nameStr = String(p.name || (p as any).nombre || (p as any).descripcion || '').toLowerCase().replace(/[-_/,.]/g, ' ');
      const skuStr = String(p.sku || (p as any).codigo || '').toLowerCase();
      const b1Str = String((p as any).barcode || (p as any).barcode1 || '').toLowerCase();
      const b2Str = String(p.barcode2 || '').toLowerCase();
      const b3Str = String(p.barcode3 || '').toLowerCase();

      const itemText = `${skuStr} ${nameStr} ${b1Str} ${b2Str} ${b3Str}`;
      return searchWords.every(w => itemText.includes(w));
    }).slice(0, 15);

    setSuggestions(matches);
    setShowSuggestions(true);
  }, [searchQuery, dbProducts]);

  const scanOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    scanOrder.forEach((id, idx) => map.set(id, idx));
    return map;
  }, [scanOrder]);

  // Mapeo ID o Nombre de Proveedor a Nombre oficial
  const provIdToName = useMemo(() => {
    const map = new Map<string, string>();
    dbProviders.forEach(p => {
      if (p.id) map.set(String(p.id), p.name.trim().toUpperCase());
      if (p.name) map.set(p.name.trim().toUpperCase(), p.name.trim().toUpperCase());
    });
    return map;
  }, [dbProviders]);

  // Lista única de categorías
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    dbProducts.forEach(p => {
      if (p.category) set.add(p.category.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [dbProducts]);

  // 🌟 Guardado automático continuo en tiempo real (Autoguardado a prueba de cierres o recargas)
  useEffect(() => {
    try {
      if (Object.keys(conteos).length > 0) {
        localStorage.setItem('nexus_auditoria_conteos', JSON.stringify(conteos));
        localStorage.setItem('nexus_auditoria_scan_order', JSON.stringify(scanOrder));
        localStorage.setItem('nexus_auditoria_is_libre', String(isLibre));
        localStorage.setItem('nexus_auditoria_modalidad', modalidad);
        localStorage.setItem('nexus_auditoria_proveedor', proveedor);
      }
    } catch(e) {}
  }, [conteos, scanOrder, isLibre, modalidad, proveedor]);

  // Función explícita para guardar avance con confirmación visual
  const handleGuardarAvance = () => {
    try {
      localStorage.setItem('nexus_auditoria_conteos', JSON.stringify(conteos));
      localStorage.setItem('nexus_auditoria_scan_order', JSON.stringify(scanOrder));
      localStorage.setItem('nexus_auditoria_is_libre', String(isLibre));
      localStorage.setItem('nexus_auditoria_modalidad', modalidad);
      localStorage.setItem('nexus_auditoria_proveedor', proveedor);
      alert('💾 ¡Avance de auditoría guardado con éxito! (' + Object.keys(conteos).length + ' productos registrados).');
    } catch(e) {
      alert('Error guardando avance');
    }
  };

  // Función para descartar avance y empezar de cero
  const handleDescartarAvance = () => {
    if (window.confirm('¿Estás seguro de descartar el conteo guardado y comenzar una auditoría limpia?')) {
      setConteos({});
      setScanOrder([]);
      localStorage.removeItem('nexus_auditoria_conteos');
      localStorage.removeItem('nexus_auditoria_scan_order');
      setMostrarBannerAvance(false);
    }
  };

  // Lista única de proveedores combinando la tabla dbProviders y los campos de productos (supplier_id, supplier, proveedor)
  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    dbProviders.forEach(p => {
      if (p.name && p.name.trim()) set.add(p.name.trim().toUpperCase());
    });
    dbProducts.forEach(p => {
      const supp = String(p.supplier_id || p.supplier || p.proveedor || p.supplier_name || '').trim();
      if (supp && isNaN(Number(supp))) {
        set.add(supp.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [dbProviders, dbProducts]);

  // Mapeo O(1) de Códigos de Barra y SKU para búsqueda ultrarrápida (en milisegundos)
  const barcodeMap = useMemo(() => {
    const map = new Map<string, any>();
    dbProducts.forEach(p => {
      const anyP = p as any;
      if (p.sku) map.set(String(p.sku).trim().toLowerCase(), p);
      if (anyP.barcode) map.set(String(anyP.barcode).trim().toLowerCase(), p);
      if (anyP.barcode1) map.set(String(anyP.barcode1).trim().toLowerCase(), p);
      if (p.barcode2) {
        String(p.barcode2).split(',').forEach(b => {
          const clean = b.trim().toLowerCase();
          if (clean) map.set(clean, p);
        });
      }
      if (p.barcode3) {
        String(p.barcode3).split(',').forEach(b => {
          const clean = b.trim().toLowerCase();
          if (clean) map.set(clean, p);
        });
      }
    });
    return map;
  }, [dbProducts]);

  // Helper para multibúsqueda amplia por coincidencia (SKU, Nombre, Código 1, 2 y 3, Categoría, Proveedor)
  const matchSearchTerm = (p: any, term: string) => {
    if (!term) return false;

    const suppStr = String(p.supplier || p.proveedor || p.supplier_name || p.supplier_id || '');
    const nameStr = String(p.name || p.nombre || p.productName || p.description || p.descripcion || p.desc || '');
    const skuStr = String(p.sku || p.codigo || p.code || '');
    const catStr = String(p.category || p.categoria || '');
    const b1Str = String(p.barcode || p.barcode1 || p.codigo_barras || '');
    const b2Str = String(p.barcode2 || '');
    const b3Str = String(p.barcode3 || '');

    const fullProductText = `${skuStr} ${nameStr} ${b1Str} ${b2Str} ${b3Str} ${catStr} ${suppStr}`
      .toLowerCase()
      .replace(/[-_/,.]/g, ' ');

    const cleanTerm = term.toLowerCase().replace(/[-_/,.]/g, ' ');
    const searchWords = cleanTerm.split(/\s+/).filter(Boolean);

    return searchWords.every(word => fullProductText.includes(word));
  };

  // Filtrado de productos para la tabla de auditoría
  const products = useMemo(() => {
    if (!isAuditing) {
      return [];
    }

    let list: any[] = [];
    if (isLibre) {
      // En modo libre, la tabla muestra los productos que se van agregando al conteo
      const countedList = dbProducts.filter(p => p.id && conteos[p.id] !== undefined);
      if (!filterText.trim()) {
        list = countedList;
      } else {
        const fTerm = filterText.trim().toLowerCase();
        list = countedList.filter(p => matchSearchTerm(p, fTerm));
      }
    } else {
      let results = [...dbProducts];

      if (modalidad === 'SOLO NEGATIVOS') {
        results = results.filter(p => (p.stock || 0) < 0);
      } else if (modalidad === 'POR PROVEEDOR' && proveedor) {
        const targetProv = proveedor.trim().toUpperCase();
        results = results.filter(p => {
          const suppIdStr = String(p.supplier_id || '').trim();
          const suppNameStr = String(p.supplier || p.proveedor || p.supplier_name || '').trim().toUpperCase();
          const resolvedName = provIdToName.get(suppIdStr) || (isNaN(Number(suppIdStr)) && suppIdStr ? suppIdStr.toUpperCase() : '');

          return (
            resolvedName === targetProv ||
            suppNameStr === targetProv ||
            suppIdStr.toUpperCase() === targetProv ||
            (suppNameStr && suppNameStr.includes(targetProv)) ||
            (resolvedName && resolvedName.includes(targetProv))
          );
        });
      } else if (modalidad === 'POR CATEGORÍA' && proveedor) {
        const targetCat = proveedor.trim().toUpperCase();
        results = results.filter(p => (p.category || '').trim().toUpperCase() === targetCat);
      }

      if (filterText.trim()) {
        const fTerm = filterText.trim().toLowerCase();
        results = results.filter(p => matchSearchTerm(p, fTerm));
      }

      list = results;
    }

    // 🌟 Ordenamiento: Los productos contados / escaneados aparecen EN PRIMER LUGAR (el más reciente hasta arriba)
    return list.sort((a, b) => {
      const hasCountA = conteos[a.id] !== undefined;
      const hasCountB = conteos[b.id] !== undefined;
      
      const idxA = scanOrderMap.has(a.id) ? scanOrderMap.get(a.id)! : (hasCountA ? 10000 : 999999);
      const idxB = scanOrderMap.has(b.id) ? scanOrderMap.get(b.id)! : (hasCountB ? 10000 : 999999);

      if (idxA !== idxB) return idxA - idxB;
      if (hasCountA !== hasCountB) return hasCountA ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [dbProducts, modalidad, proveedor, isLibre, filterText, provIdToName, conteos, isAuditing, scanOrderMap]);

  const [auditDisplayLimit, setAuditDisplayLimit] = useState(100);

  useEffect(() => {
    setAuditDisplayLimit(100);
  }, [modalidad, proveedor, isLibre, filterText, searchQuery]);

  const visibleProducts = useMemo(() => {
    return products.slice(0, auditDisplayLimit);
  }, [products, auditDisplayLimit]);

  const updateConteo = (id: number, value: string) => {
    const valNum = parseInt(value, 10);
    setScanOrder(prev => [id, ...prev.filter(x => x !== id)]);
    setConteos(prev => ({
      ...prev,
      [id]: isNaN(valNum) ? 0 : valNum
    }));
  };

  const clearConteo = (id: number) => {
    setConteos(prev => ({
      ...prev,
      [id]: 0
    }));
  };

  const removeProductFromCount = (id: number) => {
    setConteos(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addProductToCount = (p: any, delta: number = 1) => {
    if (!p || !p.id) return;
    setIsAuditing(true);
    setScanOrder(prev => [p.id, ...prev.filter(x => x !== p.id)]);
    setConteos(prev => ({
      ...prev,
      [p.id]: (prev[p.id] ?? 0) + delta
    }));
  };

  const handleSelectSuggestion = (p: any) => {
    if (!p || !p.id) return;
    addProductToCount(p, 1);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (err) {}
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const term = searchQuery.trim().toLowerCase();
      
      // 1. Coincidencia O(1) instantánea con HashMap
      let p = barcodeMap.get(term);

      // 2. Si no hay coincidencia exacta, tomar la primera sugerencia si existe
      if (!p && suggestions.length > 0) {
        p = suggestions[0];
      }

      // 3. Fallback por coincidencia amplia
      if (!p) {
        p = dbProducts.find(pr => matchSearchTerm(pr, term));
      }

      if (p && p.id) {
        handleSelectSuggestion(p);
      } else {
        alert(`Producto no encontrado para: ${searchQuery}`);
      }
    }
  };

  const handleIniciarAuditoria = () => {
    setIsAuditing(true);
    if (isLibre) {
      setConteos({});
    } else {
      const initial: Record<number, number> = { ...conteos };
      products.forEach(p => {
        if (p.id && initial[p.id] === undefined) {
          initial[p.id] = 0;
        }
      });
      setConteos(initial);
    }
  };

  const handleResetNegativosACero = async () => {
    const prodsNegativos = dbProducts.filter(p => (p.stock || 0) < 0);
    if (prodsNegativos.length === 0) {
      return alert('No hay productos con stock negativo en el sistema.');
    }
    if (!window.confirm(`¿Deseas corregir y reiniciar a 0 piezas los ${prodsNegativos.length} productos que tienen inventario negativo? Esto eliminará la distorsión del sistema y registrará un movimiento de saneamiento en el Kárdex.`)) return;

    const fecha = new Date().toLocaleString('es-MX');
    const auditFolio = 'SANEAMIENTO-' + Date.now().toString().slice(-6);

    for (const product of prodsNegativos) {
      if (product.id) {
        const oldStock = product.stock || 0;
        const diff = Math.abs(oldStock);
        await db.products.update(product.id, { stock: 0 });
        await db.kardex.add({
          fecha,
          tipo: 'ENTRADA',
          sku: product.sku,
          productName: product.name + ' (SANEAMIENTO NEGATIVO → 0)',
          cantidad: diff,
          costo: product.cost || 0,
          precio: product.price || 0,
          total: diff * (product.cost || 0),
          folio: auditFolio,
          proveedor: 'CORRECCIÓN HISTÓRICA DE INVENTARIO'
        });
      }
    }

    setConteos({});
    notifyDataMutation();
    alert(`¡Éxito! Se restablecieron ${prodsNegativos.length} productos con stock negativo a 0 piezas.`);
  };

  const handleGuardarAuditoria = async () => {
    if (Object.keys(conteos).length === 0) {
      return alert('No hay conteos físicos registrados para aplicar.');
    }
    if (!window.confirm('¿Aplicar conteo físico y generar ajustes de inventario en el sistema?')) return;

    let totalDifPiezas = 0;
    let totalDifDinero = 0;
    const auditFolio = 'AUD-' + Date.now().toString().slice(-6);
    const fecha = new Date().toLocaleString('es-MX');

    for (const [idStr, fisico] of Object.entries(conteos)) {
      const id = parseInt(idStr, 10);
      const product = await db.products.get(id);
      if (product) {
        const diff = fisico - product.stock;
        if (diff !== 0) {
          totalDifPiezas += Math.abs(diff);
          totalDifDinero += Math.abs(diff) * (product.cost || 0);

          // Actualizar stock real en la base de datos
          await db.products.update(id, { stock: fisico });

          // Registrar movimiento en Kárdex
          await db.kardex.add({
            fecha,
            tipo: diff > 0 ? 'ENTRADA' : 'MERMA',
            sku: product.sku,
            productName: product.name + (diff > 0 ? ' (ALTA POR AUDITORÍA)' : ' (BAJA POR AUDITORÍA)'),
            cantidad: Math.abs(diff),
            costo: product.cost || 0,
            precio: product.price || 0,
            total: Math.abs(diff) * (product.cost || 0),
            folio: auditFolio,
            proveedor: String((product as any).supplier || (product as any).proveedor || product.supplier_id || 'AJUSTE FÍSICO AUDITORÍA')
          });
        }
      }
    }

    localStorage.removeItem('nexus_auditoria_conteos');

    const auditItemsToSync = Object.entries(conteos).map(([idStr, fisico]) => {
      const p = dbProducts.find(x => x.id === parseInt(idStr, 10));
      return {
        id: parseInt(idStr, 10),
        sku: p ? p.sku : '',
        name: p ? p.name : '',
        countedQty: fisico,
        stock: p ? p.stock : 0
      };
    });
    sendAuditToMaster({
      folio: auditFolio,
      mode: modalidad,
      items: auditItemsToSync
    });

    notifyDataMutation();
    alert(`¡Auditoría aplicada con éxito!\n\nDiferencia total en piezas: ${totalDifPiezas}\nDiferencia total en costo: $${totalDifDinero.toFixed(2)}`);

    // Reset total de pantalla tras aplicar inventario
    setConteos({});
    setProveedor('');
    setSearchQuery('');
    setFilterText('');
    setIsAuditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">

      {/* HEADER ADAPTABLE CELULAR / ESCRITORIO */}
      <div className="bg-[#0b1120] p-3 sm:px-6 sm:py-3.5 shrink-0 border-b border-[#1e293b]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="font-black text-sm sm:text-lg tracking-tight text-white">7. AUDITORÍA FÍSICA</h2>
            <p className="text-slate-400 text-[10px] font-bold hidden sm:block">CONTEO FÍSICO Y AJUSTES DE INVENTARIO</p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-end gap-2">
            <div className="flex-1 sm:flex-initial flex flex-col">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MODALIDAD</label>
              <select
                value={modalidad}
                onChange={(e) => {
                  setModalidad(e.target.value);
                  setProveedor('');
                  setIsLibre(false);
                }}
                className="bg-[#131b2c] border border-nexus-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs focus:outline-none focus:border-blue-500 w-full sm:w-44"
              >
                <option value="INVENTARIO TOTAL">📦 TOTAL</option>
                <option value="SOLO NEGATIVOS">⚠️ NEGATIVOS</option>
                <option value="POR PROVEEDOR">🚚 PROVEEDOR</option>
                <option value="POR CATEGORÍA">📁 CATEGORÍA</option>
              </select>
            </div>

            {(modalidad === 'POR PROVEEDOR' || modalidad === 'POR CATEGORÍA') && (
              <div className="flex-1 sm:flex-initial flex flex-col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {modalidad === 'POR PROVEEDOR' ? 'PROVEEDOR' : 'CATEGORÍA'}
                </label>
                <select
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="bg-[#131b2c] border border-nexus-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs focus:outline-none focus:border-blue-500 w-full sm:w-48"
                >
                  <option value="">SELECCIONAR...</option>
                  {modalidad === 'POR PROVEEDOR'
                    ? uniqueProviders.map((provName: string) => (
                        <option key={provName} value={provName}>{provName}</option>
                      ))
                    : uniqueCategories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                  }
                </select>
              </div>
            )}

            <div className="flex flex-col items-center">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">LIBRE</label>
              <div className="bg-[#131b2c] border border-nexus-700 h-[32px] w-[36px] rounded-lg flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isLibre}
                  onChange={(e) => setIsLibre(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleIniciarAuditoria}
              className="bg-[#0e9f6e] hover:bg-[#057a55] text-white px-4 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 h-[32px] shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> INICIAR
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2.5 sm:p-5 overflow-hidden">
        {/* 🌟 BANNER VISUAL DE AVANCE GUARDADO */}
        {mostrarBannerAvance && Object.keys(conteos).length > 0 && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 p-3 sm:px-4 rounded-xl mb-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wide">
                  🟢 CONTEO PREVIO RECUPERADO: <span className="text-emerald-400 font-bold">{Object.keys(conteos).length} PRODUCTOS REGISTRADOS</span>
                </p>
                <p className="text-slate-300 text-[10px]">
                  Tus piezas contadas están cargadas en la tabla. Puedes continuar escaneando o editando manualmente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleGuardarAvance}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> GUARDAR AVANCE
              </button>
              <button
                onClick={handleDescartarAvance}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                title="Borrar avance previo"
              >
                <RotateCcw className="w-3.5 h-3.5" /> EMPEZAR DE CERO
              </button>
            </div>
          </div>
        )}

        {/* BARRA DE BÚSQUEDA / ESCANEO */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3 shrink-0 bg-[#131b2c] border border-[#1e293b] p-2.5 sm:p-3.5 rounded-xl">
          <div className="flex-1 relative" ref={searchContainerRef}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold tracking-widest text-[10px]">||||</div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleScan}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="ESCANEE CÓDIGO O ESCRIBA NOMBRE/SKU..."
              className="w-full bg-[#0b1120] border border-nexus-700 text-white pl-8 pr-3 py-2 rounded-lg font-black focus:outline-none focus:border-blue-500 text-xs sm:text-sm placeholder-slate-500"
            />

            {/* DESPLEGABLE DE RESULTADOS ESTILO CARRITO DE VENTAS */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#0b1120] border-2 border-blue-500 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-800">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(p)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-600/30 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-white text-sm group-hover:text-blue-400">
                        {p.name}
                      </span>
                      <div className="flex gap-4 text-xs text-slate-400 mt-0.5">
                        <span>SKU: <strong className="text-slate-300">{p.sku}</strong></span>
                        {p.category && <span>Categoría: <strong className="text-slate-300">{p.category}</strong></span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Stock Sistema</span>
                      <span className={`text-sm font-black ${p.stock < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {p.stock ?? 0} pzs
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-1/3 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="FILTRAR EN LISTA ACTUAL..."
              className="w-full bg-[#1e293b]/50 border border-[#334155]/50 text-white pl-10 pr-4 py-3 rounded-lg font-bold focus:outline-none focus:border-blue-500 text-xs italic placeholder-slate-500"
            />
          </div>
        </div>

        {/* TABLA DE AUDITORIA */}
        <div className="flex-1 bg-[#131b2c] border border-[#1e293b] rounded-t-xl overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-[#0b1120] sticky top-0 z-10 border-b border-[#1e293b]">
                <tr>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest">PRODUCTO</th>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest text-center w-24">SISTEMA</th>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest text-center w-48">CONTEO FÍSICO</th>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest text-center w-24">DIFERENCIA</th>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest text-center w-32">ESTADO</th>
                  <th className="p-4 text-[10px] font-black text-blue-500/70 uppercase tracking-widest text-center w-24">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mb-1" />
                        <p className="text-white font-black text-sm">NO HAY PRODUCTOS PENDIENTES EN AUDITORÍA</p>
                        <p className="text-slate-500 text-xs font-normal max-w-md">
                          {isLibre 
                            ? 'Escanee un código de barras o escriba un nombre/SKU arriba para agregar conteos al inventario.' 
                            : 'Selecciona una modalidad (Proveedor, Categoría o Inventario Total) y haz clic en ▶ INICIAR.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : visibleProducts.map((item: any) => {
                  const fisico = conteos[item.id!] !== undefined ? conteos[item.id!] : 0;
                  const diferencia = fisico - item.stock;

                  return (
                    <tr key={item.id} className="bg-[#1e293b]/20 hover:bg-[#1e293b]/40 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-white text-xs mb-1 uppercase">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          SKU: {item.sku}
                          {item.barcode2 ? ` | Alt: ${item.barcode2}` : ''}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-400 text-xs">
                        {item.stock}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => updateConteo(item.id!, String(Math.max(0, fisico - 1)))}
                            className="w-7 h-7 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded font-black text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={conteos[item.id!] !== undefined ? conteos[item.id!] : 0}
                            onChange={(e) => updateConteo(item.id!, e.target.value)}
                            className="w-16 bg-[#0b1120] border border-blue-500/50 text-white text-center font-black rounded py-1 focus:outline-none focus:border-blue-400 appearance-none text-sm"
                          />
                          <button
                            onClick={() => updateConteo(item.id!, String(fisico + 1))}
                            className="w-7 h-7 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded font-black text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            onClick={() => clearConteo(item.id!)}
                            className="bg-[#334155]/50 text-slate-400 text-[9px] font-black px-2 py-1 rounded hover:bg-[#334155] transition-colors"
                            title="Restablecer conteo a 0"
                          >
                            CLR
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center font-black text-xs">
                        <span className={diferencia < 0 ? 'text-red-500' : diferencia > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {diferencia > 0 ? '+' : ''}{diferencia}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {diferencia < 0 ? (
                          <span className="bg-red-900/30 text-red-500 border border-red-900/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest">FALTANTE</span>
                        ) : diferencia > 0 ? (
                          <span className="bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest">EXCEDENTE</span>
                        ) : (
                          <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest">OK</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => removeProductFromCount(item.id!)} className="p-2 bg-red-900/10 text-red-500 hover:bg-red-900/30 border border-red-900/30 rounded-lg transition-colors" title="Eliminar fila de auditoría">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length > auditDisplayLimit && (
              <div className="flex justify-center my-6">
                <button
                  onClick={() => setAuditDisplayLimit(prev => prev + 100)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                >
                  ➕ CARGAR MÁS PRODUCTOS ({products.length - auditDisplayLimit} RESTANTES)
                </button>
              </div>
            )}
          </div>

          {/* FOOTER BAR */}
          <div className="bg-[#131b2c] border border-[#1e293b] border-t-0 rounded-b-xl shrink-0 flex flex-col sm:flex-row items-center justify-between p-3 sm:px-6 gap-2.5">
            <div className="text-slate-400 text-xs font-bold text-center sm:text-left">
              Mostrando <span className="text-white font-black">{visibleProducts.length}</span> de <span className="text-blue-400 font-black">{products.length}</span> productos ({Object.values(conteos).filter(v => v > 0).length} auditados)
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={handleGuardarAvance}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-black text-xs uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                title="Guardar el conteo actual para continuar después"
              >
                <Save className="w-4 h-4" /> GUARDAR AVANCE ({Object.keys(conteos).length})
              </button>
              {dbProducts.some(p => (p.stock || 0) < 0) && (
                <button onClick={handleResetNegativosACero} className="flex-1 sm:flex-initial bg-amber-900/30 hover:bg-amber-600 border border-amber-500/50 text-amber-300 hover:text-white px-3 py-2 rounded-lg font-black text-xs uppercase transition-colors flex items-center justify-center gap-1.5" title="Restablecer stocks negativos a 0">
                  ⚠️ NEGATIVOS A 0
                </button>
              )}
              <button onClick={handleGuardarAvance} className="flex-1 sm:flex-initial bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-blue-400 px-3.5 py-2 rounded-lg font-black text-xs uppercase transition-colors flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> GUARDAR AVANCE
              </button>
              <button onClick={handleGuardarAuditoria} className="flex-1 sm:flex-initial bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                <CheckCircle2 className="w-3.5 h-3.5" /> APLICAR AJUSTES
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
