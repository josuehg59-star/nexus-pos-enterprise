import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, FileSpreadsheet, Activity, ArrowUpCircle, ArrowDownCircle, MinusCircle, Calendar, RefreshCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import * as XLSX from 'xlsx';

export function parseUniversalTimestamp(fechaVal: any): number {
  if (!fechaVal) return 0;
  if (typeof fechaVal === 'number') return fechaVal;

  const str = String(fechaVal).replace(/[\u202f\u00a0]/g, ' ').trim();
  if (!str) return 0;

  // 1. Formato Latino DD/MM/YYYY o D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);

    const timeMatch = str.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    let hour = 12, min = 0, sec = 0;
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      min = parseInt(timeMatch[2], 10);
      sec = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    }

    const lower = str.toLowerCase();
    const isPM = lower.includes('p.') || lower.includes('pm') || lower.includes('p.m.');
    const isAM = lower.includes('a.') || lower.includes('am') || lower.includes('a.m.');
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const parsed = new Date(year, month, day, hour, min, sec).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // 2. Formato ISO YYYY-MM-DD...
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const parsed = new Date(str).getTime();
    if (!isNaN(parsed)) return parsed;
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0).getTime();
  }

  // 3. Fallback directo
  const direct = Date.parse(str);
  if (!isNaN(direct)) return direct;

  return 0;
}

export function formatDisplayDate(fechaStr: any, ts: number): string {
  if (ts && ts > 0) {
    try {
      const d = new Date(ts);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dia = pad(d.getDate());
      const mes = pad(d.getMonth() + 1);
      const ano = d.getFullYear();
      let horas = d.getHours();
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
      horas = horas % 12;
      horas = horas ? horas : 12;
      return `${dia}/${mes}/${ano}, ${pad(horas)}:${mins}:${secs} ${ampm}`;
    } catch (e) {}
  }
  return String(fechaStr || '-');
}

function parseDateRangeTs(dateStr: string, isEnd: boolean): number {
  if (!dateStr) return isEnd ? Infinity : 0;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isEnd) {
      return new Date(year, month, day, 23, 59, 59, 999).getTime();
    } else {
      return new Date(year, month, day, 0, 0, 0, 0).getTime();
    }
  }
  return isEnd ? Infinity : 0;
}

export default function KardexReport() {
  const [search, setSearch] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [displayLimit, setDisplayLimit] = useState(300);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const rawKardex = useLiveQuery(() => db.kardex.reverse().toArray(), []) || [];
  const rawTickets = useLiveQuery(() => db.tickets.reverse().toArray(), []) || [];
  const rawCompras = useLiveQuery(() => db.compras.reverse().toArray(), []) || [];

  const allMovements = useMemo(() => {
    const combined: any[] = [];
    const kardexFolios = new Set<string>();

    // 1. Movimientos directos de inventario (Entradas, Mermas, Devoluciones, Ajustes, Auditorías)
    rawKardex.forEach(k => {
      if (k.folio) {
        const f = String(k.folio).trim();
        kardexFolios.add(f);
        kardexFolios.add(f.replace(/^[#F-]/, ''));
        kardexFolios.add(`F-${f.replace(/^[#F-]/, '')}`);
        kardexFolios.add(`ENT-${f.replace(/^[#F-]/, '')}`);
      }
      combined.push({
        ...k,
        ts: parseUniversalTimestamp(k.fecha)
      });
    });

    // 2. Compras efectivamente RECIBIDAS/APLICADAS en db.compras (órdenes pendientes NO deben salir en Kárdex)
    rawCompras.forEach(c => {
      // Si la compra es solo una orden de compra o borrador no aplicado, ignorarla en el Kárdex
      if (c.status === 'ORDEN' || c.status === 'BORRADOR' || c.status === 'PENDIENTE') {
        return;
      }
      const folioStr = c.folio ? String(c.folio).trim() : '';
      if (folioStr && (kardexFolios.has(folioStr) || kardexFolios.has(`ENT-${folioStr}`))) {
        return;
      }
      if (Array.isArray(c.items)) {
        const compraTs = parseUniversalTimestamp(c.date);
        c.items.forEach((item: any) => {
          const qty = Number(item.qty || item.entradaQty || 1);
          if (qty <= 0) return;
          const cost = Number(item.cost) || 0;
          const price = Number(item.price) || 0;

          combined.push({
            tipo: 'ENTRADA',
            sku: String(item.sku || '').trim(),
            productName: String(item.name || item.description || '').trim().toUpperCase(),
            cantidad: qty,
            fecha: c.date,
            ts: compraTs,
            costo: cost,
            costoUnitario: cost,
            precio: price,
            precioVenta: price,
            total: (item.total || (cost * qty)),
            folio: c.folio || 'ENTRADA',
            proveedor: String(c.provider || 'PROVEEDOR').trim().toUpperCase()
          });
        });
      }
    });

    return combined;
  }, [rawKardex, rawCompras]);

  // Live autocompletado de productos eficiente con límite
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    let isCancelled = false;
    db.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (!!p.barcode2 && p.barcode2.toLowerCase().includes(q)) ||
      (!!p.barcode3 && p.barcode3.toLowerCase().includes(q))
    ).limit(8).toArray().then(matches => {
      if (!isCancelled) setSuggestions(matches);
    });
    return () => { isCancelled = true; };
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocalDateString = (d: Date = new Date()) => {
    const local = new Date(d);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split('T')[0];
  };

  const applyPreset = (preset: 'HOY' | 'AYER' | 'MES' | 'ANO' | 'TODOS') => {
    const now = new Date();
    if (preset === 'HOY') {
      const todayStr = getLocalDateString(now);
      setFechaInicio(todayStr);
      setFechaFin(todayStr);
    } else if (preset === 'AYER') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = getLocalDateString(yesterday);
      setFechaInicio(yestStr);
      setFechaFin(yestStr);
    } else if (preset === 'MES') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFechaInicio(getLocalDateString(firstDay));
      setFechaFin(getLocalDateString(lastDay));
    } else if (preset === 'ANO') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      setFechaInicio(getLocalDateString(firstDay));
      setFechaFin(getLocalDateString(lastDay));
    } else if (preset === 'TODOS') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  useEffect(() => {
    setDisplayLimit(search.trim() ? 500 : 150);
  }, [search, fechaInicio, fechaFin, tipoFilter]);

  const textFilteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    const startTs = parseDateRangeTs(fechaInicio, false);
    const endTs = parseDateRangeTs(fechaFin, true);

    return allMovements.filter(m => {
      const matchSearch = !query ||
        (m.productName && String(m.productName).toLowerCase().includes(query)) ||
        (m.sku && String(m.sku).toLowerCase().includes(query)) ||
        (m.tipo && String(m.tipo).toLowerCase().includes(query)) ||
        (m.proveedor && String(m.proveedor).toLowerCase().includes(query)) ||
        (m.folio && String(m.folio).toLowerCase().includes(query));

      const matchDate = (!fechaInicio && !fechaFin) || (m.ts >= startTs && m.ts <= endTs);
      return matchSearch && matchDate;
    }).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [allMovements, search, fechaInicio, fechaFin]);

  const filteredMovements = useMemo(() => {
    if (tipoFilter === 'ENTRADA') {
      return textFilteredMovements.filter(m => m.tipo === 'ENTRADA');
    }
    if (tipoFilter === 'SALIDA') {
      return textFilteredMovements.filter(m => m.tipo === 'SALIDA');
    }
    if (tipoFilter === 'DEVOLUCION') {
      return textFilteredMovements.filter(m => String(m.tipo || '').includes('DEVOLUCION'));
    }
    if (tipoFilter === 'MERMA') {
      return textFilteredMovements.filter(m => m.tipo === 'MERMA');
    }
    if (tipoFilter === 'AJUSTE') {
      return textFilteredMovements.filter(m => String(m.tipo || '').includes('AJUSTE') || String(m.tipo || '').includes('AUDITORIA') || String(m.tipo || '').includes('ALTA'));
    }
    return textFilteredMovements;
  }, [textFilteredMovements, tipoFilter]);

  const visibleMovements = useMemo(() => {
    return filteredMovements.slice(0, displayLimit);
  }, [filteredMovements, displayLimit]);

  const stats = useMemo(() => {
    let entradas = 0;
    let salidas = 0;
    let totalMonto = 0;
    textFilteredMovements.forEach(m => {
      if (m.tipo === 'ENTRADA') entradas += (m.cantidad || 0);
      else salidas += (m.cantidad || 0);
      totalMonto += (m.total || 0);
    });
    return { entradas, salidas, totalMonto };
  }, [textFilteredMovements]);

  const handleExport = () => {
    if (filteredMovements.length === 0) return alert('No hay movimientos para exportar.');
    const ws = XLSX.utils.json_to_sheet(filteredMovements.map(m => ({
      FECHA: m.fecha,
      TIPO: m.tipo,
      SKU: m.sku,
      DESCRIPCION: m.productName,
      CANTIDAD: m.cantidad,
      STOCK_ANTERIOR: m.stockAnterior ?? '',
      STOCK_NUEVO: m.stockNuevo ?? '',
      COSTO: m.costo ?? m.costoUnitario ?? 0,
      PRECIO: m.precio ?? m.precioVenta ?? 0,
      TOTAL: m.total,
      FOLIO: m.folio || '',
      PROVEEDOR: m.proveedor || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex');
    XLSX.writeFile(wb, `Kardex_Movimientos_${fechaInicio || 'inicio'}_al_${fechaFin || 'fin'}.xlsx`);
  };

  const getTipoStyle = (tipo: string) => {
    const t = String(tipo || '').toUpperCase();
    if (t === 'ENTRADA') return 'text-xs font-black px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-900/50';
    if (t.includes('DEVOLUCION')) return 'text-xs font-black px-3 py-1 rounded-full bg-orange-900/50 text-orange-400 border border-orange-900/50';
    if (t === 'MERMA') return 'text-xs font-black px-3 py-1 rounded-full bg-rose-900/50 text-rose-400 border border-rose-900/50';
    if (t.includes('AJUSTE') || t.includes('AUDITORIA') || t.includes('ALTA')) return 'text-xs font-black px-3 py-1 rounded-full bg-purple-900/50 text-purple-400 border border-purple-900/50';
    return 'text-xs font-black px-3 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-900/50';
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'ENTRADA') return <ArrowUpCircle className="w-4 h-4 text-emerald-400 inline mr-1" />;
    if (tipo === 'DEVOLUCION') return <ArrowDownCircle className="w-4 h-4 text-orange-400 inline mr-1" />;
    return <MinusCircle className="w-4 h-4 text-red-400 inline mr-1" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">

      {/* HEADER */}
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">REPORTE DE <span className="text-blue-400">KARDEX</span></h2>
            <p className="text-slate-400 text-sm">HISTORIAL COMPLETO DE MOVIMIENTOS E INVENTARIO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-nexus-900/80 border border-nexus-700 p-1.5 rounded-xl">
            <button onClick={() => applyPreset('HOY')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:bg-nexus-800 transition-colors">HOY</button>
            <button onClick={() => applyPreset('AYER')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:bg-nexus-800 transition-colors">AYER</button>
            <button onClick={() => applyPreset('MES')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:bg-nexus-800 transition-colors">ESTE MES</button>
            <button onClick={() => applyPreset('ANO')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-300 hover:bg-nexus-800 transition-colors">ESTE AÑO</button>
            <button onClick={() => applyPreset('TODOS')} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-blue-400 hover:bg-nexus-800 transition-colors">VER TODOS</button>
          </div>
          <button onClick={handleExport} className="bg-[#25D366] hover:bg-[#20b858] text-white px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20">
            <FileSpreadsheet className="w-4 h-4" /> EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* CONTROLES DE FILTRADO Y BÚSQUEDA EN VIVO */}
      <div className="p-6 flex gap-4 items-end border-b border-nexus-800 shrink-0 bg-nexus-900/30">
        <div className="flex-1 relative" ref={searchRef}>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">BUSCAR POR SKU, PRODUCTO O PROVEEDOR</label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Escribe para buscar al instante (Ej: ACEITE NUTRIOLI, 750109121993, ENTRADA)..." 
              className="w-full bg-nexus-900 border border-nexus-700 text-white pl-12 pr-10 py-3 rounded-xl font-bold focus:outline-none focus:border-blue-500 text-sm transition-colors" 
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white font-black text-sm">✕</button>
            )}
          </div>

          {/* DESPLEGABLE DE AUTOCOMPLETADO */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-nexus-900 border border-nexus-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
              {suggestions.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => { setSearch(p.name); setShowSuggestions(false); }}
                  className="px-4 py-3 hover:bg-nexus-800 cursor-pointer flex justify-between items-center border-b border-nexus-800/50 last:border-0"
                >
                  <div>
                    <p className="font-black text-white text-xs uppercase">{p.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Stock: {p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">FECHA INICIO</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">FECHA FINAL</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">TIPO MOVIMIENTO</label>
          <select 
            value={tipoFilter} 
            onChange={e => setTipoFilter(e.target.value)} 
            className="bg-nexus-900 border border-nexus-700 text-white px-3 py-3 rounded-xl font-bold focus:border-blue-500 outline-none text-xs"
          >
            <option value="TODOS">📦 TODOS</option>
            <option value="ENTRADA">🟢 ENTRADAS (COMPRAS)</option>
            <option value="SALIDA">🔴 SALIDAS (VENTAS)</option>
            <option value="DEVOLUCION">🟠 DEVOLUCIONES</option>
            <option value="MERMA">🥀 MERMAS / PÉRDIDAS</option>
            <option value="AJUSTE">🟣 AJUSTES / AUDITORÍAS</option>
          </select>
        </div>
        <button onClick={() => { setShowSuggestions(false); }} className="bg-[#2a68ff] hover:bg-[#1a55e6] text-white px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors h-[46px] shadow-lg shadow-blue-600/20">
          <Search className="w-4 h-4" /> BUSCAR
        </button>
        <button onClick={() => { setSearch(''); setFechaInicio(''); setFechaFin(''); setTipoFilter('TODOS'); }} className="bg-nexus-800 hover:bg-nexus-700 text-slate-300 px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors h-[46px]">
          <RefreshCcw className="w-4 h-4" /> LIMPIAR
        </button>
      </div>

      {/* RESUMEN DE TARJETAS DE MÉTRICAS INTERACTIVAS */}
      <div className="grid grid-cols-3 gap-6 px-6 pt-6 shrink-0">
        <div 
          onClick={() => setTipoFilter(tipoFilter === 'ENTRADA' ? 'TODOS' : 'ENTRADA')}
          className={`bg-nexus-900/50 border p-4 rounded-2xl cursor-pointer transition-all ${tipoFilter === 'ENTRADA' ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-950/20' : 'border-emerald-500/30 hover:border-emerald-500/60'}`}
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENTRADAS REGISTRADAS</p>
            {tipoFilter === 'ENTRADA' && <span className="text-[9px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full">FILTRADO</span>}
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">+{stats.entradas} <span className="text-xs font-normal text-slate-400">piezas</span></p>
        </div>
        <div 
          onClick={() => setTipoFilter(tipoFilter === 'SALIDA' ? 'TODOS' : 'SALIDA')}
          className={`bg-nexus-900/50 border p-4 rounded-2xl cursor-pointer transition-all ${tipoFilter === 'SALIDA' ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/20' : 'border-red-500/30 hover:border-red-500/60'}`}
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">SALIDAS Y MERMAS</p>
            {tipoFilter === 'SALIDA' && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">FILTRADO</span>}
          </div>
          <p className="text-2xl font-black text-red-400 mt-1">-{stats.salidas} <span className="text-xs font-normal text-slate-400">piezas</span></p>
        </div>
        <div 
          onClick={() => setTipoFilter('TODOS')}
          className={`bg-nexus-900/50 border p-4 rounded-2xl cursor-pointer transition-all ${tipoFilter === 'TODOS' ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-950/20' : 'border-blue-500/30 hover:border-blue-500/60'}`}
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">TOTAL VALORIZADO LÍNEAS</p>
            {tipoFilter === 'TODOS' && <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full">TODOS</span>}
          </div>
          <p className="text-2xl font-black text-blue-400 mt-1">${stats.totalMonto.toFixed(2)}</p>
        </div>
      </div>

      {/* TABLA DE HISTORIAL DE MOVIMIENTOS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* Banner informativo de modo de consulta */}
        {!search.trim() ? (
          <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 mb-4 flex items-center justify-between text-xs text-blue-200 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-black text-white text-xs uppercase tracking-wide">HISTORIAL GENERAL DE MOVIMIENTOS ({fechaInicio ? `${fechaInicio} AL ${fechaFin}` : 'TODOS'})</p>
                <p className="text-[11px] text-blue-300">
                  Mostrando movimientos de cualquier índole: <strong className="text-emerald-400">Entradas</strong>, <strong className="text-rose-400">Salidas / Ventas</strong>, <strong className="text-orange-400">Devoluciones</strong>, <strong className="text-purple-400">Ajustes</strong> y <strong className="text-red-400">Mermas</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl">
              Auditoría activa
            </span>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 mb-4 flex items-center justify-between text-xs text-emerald-200 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="font-black text-white text-xs uppercase tracking-wide">
                  AUDITORÍA COMPLETA DE KÁRDEX: <span className="text-emerald-400 font-mono underline">{search.toUpperCase()}</span>
                </p>
                <p className="text-[11px] text-emerald-300">
                  Mostrando todas las ENTRADAS, COMPRAS, SALIDAS DE VENTA, MERMAS y AJUSTES del producto.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSearch('')}
              className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-1.5 rounded-xl transition-all"
            >
              ✕ Quitar filtro de producto
            </button>
          </div>
        )}

        <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left whitespace-nowrap text-xs">
            <thead className="bg-[#0b1120] border-b border-[#1e293b] sticky top-0 z-10 font-black text-[10px] text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-4">FECHA</th>
                <th className="p-4">FOLIO</th>
                <th className="p-4 text-center">TIPO</th>
                <th className="p-4">SKU</th>
                <th className="p-4">DESCRIPCIÓN</th>
                <th className="p-4 text-center">CANTIDAD</th>
                <th className="p-4 text-center">STOCK (ANT → NUEVO)</th>
                <th className="p-4 text-right">COSTO</th>
                <th className="p-4 text-right">PRECIO</th>
                <th className="p-4 text-right">TOTAL LÍNEA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50 text-white">
              {visibleMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-white text-sm font-black uppercase tracking-wider">
                        {allMovements.length === 0
                          ? 'Aún no hay movimientos registrados en el Kárdex'
                          : 'No se encontraron movimientos con los filtros seleccionados'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {!search.trim()
                          ? 'Escribe el nombre o SKU de un producto en el buscador para ver sus entradas y ventas.'
                          : `Verifica las fechas seleccionadas o limpia los filtros para ver todos los movimientos.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : visibleMovements.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors border-b border-[#1e293b]/30">
                  <td className="p-4 text-xs font-bold text-slate-300">{formatDisplayDate(m.fecha, m.ts)}</td>
                  <td className="p-4 font-mono font-bold text-amber-400 text-xs">{m.folio || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <span className={getTipoStyle(m.tipo)}>{getTipoIcon(m.tipo)}{m.tipo}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-400">{m.sku}</td>
                  <td className="p-4 font-black text-white uppercase">{m.productName}</td>
                  <td className="p-4 text-center font-black text-blue-400">{m.cantidad}</td>
                  <td className="p-4 text-center font-bold">
                    {m.stockAnterior !== undefined && m.stockNuevo !== undefined ? (
                      <span className="font-mono text-xs">
                        <span className="text-slate-400">{m.stockAnterior}</span>
                        <span className="text-blue-400 mx-1">→</span>
                        <span className={m.stockNuevo < 0 ? 'text-rose-400 font-black' : 'text-emerald-400 font-black'}>{m.stockNuevo}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-slate-400 font-bold">${(m.costo ?? m.costoUnitario ?? 0).toFixed(2)}</td>
                  <td className="p-4 text-right text-emerald-400 font-bold">${(m.precio ?? m.precioVenta ?? 0).toFixed(2)}</td>
                  <td className="p-4 text-right font-black text-emerald-400">${(m.total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMovements.length > displayLimit && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setDisplayLimit(prev => prev + 150)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-8 py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
            >
              ➕ CARGAR MÁS MOVIMIENTOS ({filteredMovements.length - displayLimit} RESTANTES)
            </button>
          </div>
        )}

        {filteredMovements.length > 0 && (
          <p className="text-center text-slate-500 text-xs font-bold mt-4">
            Mostrando <span className="text-white font-black">{visibleMovements.length}</span> de <span className="text-blue-400 font-black">{filteredMovements.length}</span> movimientos encontrados ({allMovements.length} totales en Kárdex)
          </p>
        )}
      </div>
    </div>
  );
}
