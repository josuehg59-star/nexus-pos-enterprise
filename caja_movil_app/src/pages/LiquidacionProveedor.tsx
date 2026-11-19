import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Save, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { db, type Product, type Ticket, type Compra } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import * as XLSX from 'xlsx';

export default function LiquidacionProveedor() {
  // Fecha seleccionada en formato YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState(getTodayStr().slice(0, 7)); // YYYY-MM
  const [viewMode, setViewMode] = useState<'DIA' | 'MES'>('DIA');
  const [selectedProvider, setSelectedProvider] = useState<string>('COCA COLA');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCashInput, setManualCashInput] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Carga reactiva de datos desde Dexie
  const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  const allTickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const allCompras = useLiveQuery(() => db.compras.toArray(), []) || [];
  const allProviders = useLiveQuery(() => db.providers.toArray(), []) || [];
  const allDailyCash = useLiveQuery(() => db.dailyCashEntries.toArray(), []) || [];

  // Proveedores sugeridos en botones rápidos
  const quickProviders = [
    { label: 'COCA COLA', query: 'COCA' },
    { label: 'SABRITAS', query: 'SABRITAS' },
    { label: 'BIMBO', query: 'BIMBO' },
    { label: 'BARCEL', query: 'BARCEL' },
    { label: 'PEPSI', query: 'PEPSI' },
    { label: 'LALA', query: 'LALA' }
  ];

  // Resolver nombre de proveedor
  const matchProvider = (target: string, query: string) => {
    const t = String(target || '').toUpperCase();
    const q = String(query || '').toUpperCase();
    return t.includes(q);
  };

  // Cargar el efectivo manual guardado para la fecha y proveedor seleccionados
  useEffect(() => {
    const entry = allDailyCash.find(e => 
      e.dateKey === selectedDate && 
      (e.provider === selectedProvider || matchProvider(e.provider, selectedProvider))
    );
    if (entry) {
      setManualCashInput(entry.cashAmount.toString());
      setManualNotes(entry.notes || '');
    } else {
      setManualCashInput('');
      setManualNotes('');
    }
  }, [selectedDate, selectedProvider, allDailyCash]);

  // Guardar efectivo manual en Dexie
  const handleSaveManualCash = async () => {
    const amount = parseFloat(manualCashInput) || 0;
    try {
      const existing = await db.dailyCashEntries
        .where('dateKey')
        .equals(selectedDate)
        .filter(e => e.provider === selectedProvider || matchProvider(e.provider, selectedProvider))
        .first();

      if (existing && existing.id) {
        await db.dailyCashEntries.update(existing.id, {
          cashAmount: amount,
          notes: manualNotes,
          updatedAt: new Date().toISOString()
        });
      } else {
        await db.dailyCashEntries.add({
          dateKey: selectedDate,
          provider: selectedProvider,
          cashAmount: amount,
          notes: manualNotes,
          updatedAt: new Date().toISOString()
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Error al guardar efectivo:', e);
      alert('No se pudo guardar el efectivo: ' + (e as Error).message);
    }
  };

  // 1. Filtrar productos pertenecientes al proveedor seleccionado
  const providerProducts = useMemo(() => {
    return allProducts.filter(p => {
      const pAny = p as any;
      const provStr = `${pAny.supplier || ''} ${pAny.provider || ''} ${pAny.supplier_name || ''}`.toUpperCase();
      const isProv = matchProvider(provStr, selectedProvider);
      // Fallback especial para marcas icónicas si no tienen asignado supplier formal
      if (selectedProvider === 'COCA COLA') {
        const nameUpper = String(p.name || '').toUpperCase();
        return isProv || 
          p.supplier_id === 122 || 
          nameUpper.includes('COCA') || 
          nameUpper.includes('CIEL') || 
          nameUpper.includes('FANTA') || 
          nameUpper.includes('SPRITE') || 
          nameUpper.includes('VALLE') || 
          nameUpper.includes('TOPO CHICO') ||
          nameUpper.includes('SANTA CLARA') ||
          nameUpper.includes('FRESCA 2') ||
          nameUpper.includes('FRESCA 3') ||
          nameUpper.includes('POWER MORA');
      }
      return isProv;
    });
  }, [allProducts, selectedProvider]);

  // Mapa de SKUs del proveedor
  const providerSkuSet = useMemo(() => {
    const set = new Set<string>();
    providerProducts.forEach(p => {
      if (p.sku) set.add(p.sku.trim().toUpperCase());
      if (p.barcode2) set.add(p.barcode2.trim().toUpperCase());
      if (p.barcode3) set.add(p.barcode3.trim().toUpperCase());
    });
    return set;
  }, [providerProducts]);

  // Función para determinar si una fecha de ticket o compra cae en el rango seleccionado
  const matchesDateFilter = (dateStr: string) => {
    if (!dateStr) return false;
    if (viewMode === 'DIA') {
      return dateStr.includes(selectedDate);
    } else {
      // Modo mes
      return dateStr.includes(selectedMonth);
    }
  };

  // 2. Compras / Entradas del proveedor en el rango seleccionado
  const comprasDelPeriodo = useMemo(() => {
    return allCompras.filter(c => {
      const matchProv = matchProvider(c.provider, selectedProvider);
      return matchProv && matchesDateFilter(c.date);
    });
  }, [allCompras, selectedProvider, selectedDate, selectedMonth, viewMode]);

  const totalComprasMonto = useMemo(() => {
    return comprasDelPeriodo.reduce((sum, c) => sum + (c.total || 0), 0);
  }, [comprasDelPeriodo]);

  // 3. Ventas de productos del proveedor en el rango seleccionado
  const ventasStats = useMemo(() => {
    let piezasVendidas = 0;
    let montoTotalVendido = 0;
    let montoEfectivoVendido = 0;
    const ventasPorSku = new Map<string, { qty: number; total: number }>();

    allTickets.forEach(t => {
      if (!matchesDateFilter(t.date)) return;
      
      const isEfectivo = !t.paymentMethod || t.paymentMethod.toUpperCase() === 'EFECTIVO';
      
      (t.items || []).forEach((item: any) => {
        const itemSku = String(item.sku || item.barcode || '').trim().toUpperCase();
        const itemName = String(item.name || '').trim().toUpperCase();
        
        // Verificar si pertenece al proveedor
        const isMatch = providerSkuSet.has(itemSku) || 
          providerProducts.some(p => p.sku === itemSku || (p.name && p.name.trim().toUpperCase() === itemName));

        if (isMatch) {
          const qty = Number(item.cartQty || item.qty || item.cantidad || 0) - Number(item.returnedQty || 0);
          if (qty > 0) {
            const price = Number(item.price || 0);
            const lineTotal = price * qty;
            
            piezasVendidas += qty;
            montoTotalVendido += lineTotal;
            if (isEfectivo) {
              montoEfectivoVendido += lineTotal;
            }

            const current = ventasPorSku.get(itemSku) || { qty: 0, total: 0 };
            ventasPorSku.set(itemSku, {
              qty: current.qty + qty,
              total: current.total + lineTotal
            });
          }
        }
      });
    });

    return {
      piezasVendidas,
      montoTotalVendido,
      montoEfectivoVendido,
      ventasPorSku
    };
  }, [allTickets, providerSkuSet, providerProducts, selectedDate, selectedMonth, viewMode]);

  // Compras desglosadas por SKU
  const comprasPorSku = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    comprasDelPeriodo.forEach(c => {
      (c.items || []).forEach((item: any) => {
        const sku = String(item.sku || '').trim().toUpperCase();
        const qty = Number(item.qty || item.entradaQty || 0);
        const cost = Number(item.cost || 0);
        const total = Number(item.total || cost * qty || 0);
        const current = map.get(sku) || { qty: 0, total: 0 };
        map.set(sku, {
          qty: current.qty + qty,
          total: current.total + total
        });
      });
    });
    return map;
  }, [comprasDelPeriodo]);

  // 4. Cálculos Financieros del Balance de Efectivo
  const efectivoManualNum = parseFloat(manualCashInput) || 0;
  // Flujo generado por el proveedor = Ventas en efectivo - Compras pagadas
  const flujoGeneradoEsperado = ventasStats.montoEfectivoVendido - totalComprasMonto;
  // Diferencia contra lo que tienes en físico: Efectivo Manual - Flujo Esperado
  const diferenciaEfectivo = efectivoManualNum - flujoGeneradoEsperado;

  // Filtrado de la tabla por término de búsqueda
  const filteredTableProducts = useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    if (!q) return providerProducts;
    return providerProducts.filter(p => 
      p.sku.toUpperCase().includes(q) || 
      p.name.toUpperCase().includes(q) ||
      (p.category && p.category.toUpperCase().includes(q))
    );
  }, [providerProducts, searchTerm]);

  // Exportar a Excel
  const handleExportExcel = () => {
    const rows = filteredTableProducts.map(p => {
      const sku = (p.sku || '').trim().toUpperCase();
      const v = ventasStats.ventasPorSku.get(sku) || { qty: 0, total: 0 };
      const c = comprasPorSku.get(sku) || { qty: 0, total: 0 };
      return {
        SKU: p.sku,
        PRODUCTO: p.name,
        CATEGORIA: p.category || 'General',
        'COSTO UNIT': p.cost || 0,
        'PRECIO VENTA': p.price || 0,
        'STOCK ACTUAL': p.stock || 0,
        'VALOR STOCK COSTO': +((p.cost || 0) * (p.stock || 0)).toFixed(2),
        'VALOR STOCK VENTA': +((p.price || 0) * (p.stock || 0)).toFixed(2),
        'PIEZAS COMPRADAS': c.qty,
        'TOTAL COMPRAS': c.total,
        'PIEZAS VENDIDAS': v.qty,
        'TOTAL VENTAS': v.total
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidacion_' + selectedProvider);
    XLSX.writeFile(wb, `Liquidacion_${selectedProvider}_${selectedDate}.xlsx`);
  };

  // Navegar días
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${day}`;
    setSelectedDate(newDateStr);
    setSelectedMonth(`${y}-${m}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-100 overflow-y-auto pb-16 custom-scrollbar">
      
      {/* 🌟 HEADER PRINCIPAL */}
      <div className="bg-nexus-900 border-b border-nexus-800 p-4 shrink-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>LIQUIDACIÓN & CONTROL POR PROVEEDOR</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold">
                  EN VIVO
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Auditoría diaria de compras, ventas en efectivo y arqueo manual por marca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>EXCEL</span>
            </button>
          </div>
        </div>

        {/* 📅 SELECTOR DE PERÍODO & PROVEEDOR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-nexus-800/80">
          
          {/* Selector de Fecha */}
          <div className="bg-nexus-950/80 border border-nexus-800 rounded-xl p-2 flex items-center justify-between gap-2">
            <button 
              onClick={() => changeDateByDays(-1)} 
              className="p-1 text-slate-400 hover:text-white hover:bg-nexus-800 rounded-lg"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <input 
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedMonth(e.target.value.slice(0, 7));
                }}
                className="bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer"
              />
            </div>
            <button 
              onClick={() => changeDateByDays(1)} 
              className="p-1 text-slate-400 hover:text-white hover:bg-nexus-800 rounded-lg"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Modo de Vista: Día o Mes */}
          <div className="bg-nexus-950/80 border border-nexus-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('DIA')}
              className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all ${
                viewMode === 'DIA' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              DÍA ESPECÍFICO
            </button>
            <button
              onClick={() => setViewMode('MES')}
              className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-all ${
                viewMode === 'MES' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              MES COMPLETO
            </button>
          </div>

          {/* Proveedor Input / Select */}
          <div className="bg-nexus-950/80 border border-nexus-800 rounded-xl px-3 py-1.5 flex items-center gap-2 col-span-1 sm:col-span-2">
            <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <input 
              type="text"
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value.toUpperCase())}
              placeholder="Buscar o escribir proveedor..."
              className="bg-transparent text-white font-bold text-xs w-full outline-none uppercase placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Botones rápidos de marcas comunes */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar mt-2 pt-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            PROVEEDORES RÁPIDOS:
          </span>
          {quickProviders.map(qp => (
            <button
              key={qp.label}
              onClick={() => setSelectedProvider(qp.label)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedProvider.includes(qp.query)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : 'bg-nexus-800/80 text-slate-400 hover:text-white hover:bg-nexus-800'
              }`}
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 💵 PANEL DE 4 TARJETAS: BALANCE DE EFECTIVO */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* TARJETA 1: VENTAS EN EFECTIVO */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-nexus-900 border border-emerald-900/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> VENTAS EN EFECTIVO
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-800/40">
              {ventasStats.piezasVendidas} pz
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              ${ventasStats.montoEfectivoVendido.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Total Vendido (todas formas):</span>
              <span className="font-mono font-bold text-slate-300">${ventasStats.montoTotalVendido.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: COMPRAS PAGADAS */}
        <div className="bg-gradient-to-br from-red-950/40 to-nexus-900 border border-red-900/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> COMPRAS REALIZADAS
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-800/40">
              {comprasDelPeriodo.length} notas
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-red-300 font-mono">
              ${totalComprasMonto.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {comprasDelPeriodo.length === 0 ? 'Sin compras en el período' : `Pagado al repartidor de ${selectedProvider}`}
            </div>
          </div>
        </div>

        {/* TARJETA 3: RECUADRO DE EFECTIVO MANUAL (EDITABLE DÍA A DÍA) */}
        <div className="bg-gradient-to-br from-blue-950/50 to-nexus-900 border-2 border-blue-500/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> EFECTIVO MANUAL (FÍSICO)
            </span>
            {savedSuccess && (
              <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded animate-pulse">
                GUARDADO
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 my-1">
            <span className="text-xl font-black text-blue-400 font-mono">$</span>
            <input 
              type="number"
              step="any"
              value={manualCashInput}
              onChange={e => setManualCashInput(e.target.value)}
              placeholder="0.00"
              className="bg-nexus-950 border border-blue-500/50 rounded-xl px-3 py-1.5 text-xl font-black text-white font-mono w-full outline-none focus:border-blue-400"
            />
            <button
              onClick={handleSaveManualCash}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/30 active:scale-95 transition-all shrink-0"
              title="Guardar efectivo de este día"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          <input 
            type="text"
            value={manualNotes}
            onChange={e => setManualNotes(e.target.value)}
            placeholder="Nota o motivo del dinero (opcional)..."
            className="bg-transparent border-b border-nexus-700/60 text-[10px] text-slate-300 py-0.5 outline-none placeholder:text-slate-600"
          />
        </div>

        {/* TARJETA 4: BALANCE NETO / CUADRE */}
        <div className={`bg-gradient-to-br rounded-2xl p-4 shadow-lg flex flex-col justify-between border ${
          diferenciaEfectivo >= 0 
            ? 'from-emerald-950/50 to-nexus-900 border-emerald-500/50' 
            : 'from-amber-950/50 to-nexus-900 border-amber-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
              diferenciaEfectivo >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <DollarSign className="w-3.5 h-3.5" /> 
              {diferenciaEfectivo >= 0 ? 'SOBRANTE / EN REGLA' : 'FALTANTE / DIFERENCIA'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-nexus-950 px-2 py-0.5 rounded-full border border-nexus-800">
              CUADRE
            </span>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono ${
              diferenciaEfectivo >= 0 ? 'text-emerald-300' : 'text-amber-300'
            }`}>
              ${Math.abs(diferenciaEfectivo).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Flujo Esperado (Vtas - Compras):</span>
              <span className="font-mono font-bold text-slate-300">
                ${flujoGeneradoEsperado.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 📊 RESUMEN DE COMPRAS DEL PERÍODO */}
      {comprasDelPeriodo.length > 0 && (
        <div className="px-4 mb-3">
          <div className="bg-nexus-900/60 border border-nexus-800 rounded-2xl p-3">
            <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-red-400" />
              <span>COMPRAS / NOTAS REGISTRADAS DE {selectedProvider} ({comprasDelPeriodo.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {comprasDelPeriodo.map((compra, idx) => (
                <div key={idx} className="bg-nexus-950/80 border border-nexus-800 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-400 block">{compra.folio}</span>
                    <span className="text-[10px] text-slate-400">{compra.date?.slice(0, 10)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-red-400 block">${(compra.total || 0).toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500">{(compra.items || []).length} productos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📦 TABLA DETALLADA DE PRODUCTOS DEL PROVEEDOR */}
      <div className="px-4 flex-1 flex flex-col">
        <div className="bg-nexus-900 border border-nexus-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          
          {/* Header de la tabla y buscador */}
          <div className="p-3 bg-nexus-950/60 border-b border-nexus-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                CATÁLOGO DE PRODUCTOS ({filteredTableProducts.length})
              </span>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por SKU o nombre..."
                className="w-full bg-nexus-900 border border-nexus-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tabla Responsive */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-nexus-950/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-nexus-800">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">PRODUCTO</th>
                  <th className="py-3 px-2 text-center">CATEGORÍA</th>
                  <th className="py-3 px-2 text-right">COSTO U.</th>
                  <th className="py-3 px-2 text-right">PRECIO V.</th>
                  <th className="py-3 px-2 text-center">STOCK</th>
                  <th className="py-3 px-2 text-center bg-red-950/20 text-red-400">COMPRADO</th>
                  <th className="py-3 px-2 text-center bg-emerald-950/20 text-emerald-400">VENDIDO</th>
                  <th className="py-3 px-3 text-right">VALOR STOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800/60 font-medium">
                {filteredTableProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">
                      No se encontraron productos para {selectedProvider}.
                    </td>
                  </tr>
                ) : (
                  filteredTableProducts.map(prod => {
                    const sku = (prod.sku || '').trim().toUpperCase();
                    const v = ventasStats.ventasPorSku.get(sku) || { qty: 0, total: 0 };
                    const c = comprasPorSku.get(sku) || { qty: 0, total: 0 };
                    const stockVal = (prod.price || 0) * (prod.stock || 0);

                    return (
                      <tr key={prod.id || prod.sku} className="hover:bg-nexus-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-[11px] whitespace-nowrap">
                          {prod.sku}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white max-w-[200px] truncate" title={prod.name}>
                          {prod.name}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[9px] bg-nexus-800 text-slate-400 px-2 py-0.5 rounded-full border border-nexus-700/60 font-bold">
                            {prod.category || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                          ${(prod.cost || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-400">
                          ${(prod.price || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                            (prod.stock || 0) <= 0 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : (prod.stock || 0) <= 5
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {prod.stock || 0} pz
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-red-400 bg-red-950/10">
                          {c.qty > 0 ? `+${c.qty} pz` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10">
                          {v.qty > 0 ? `${v.qty} pz` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          ${stockVal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer totales de la tabla */}
          <div className="bg-nexus-950/90 p-3 border-t border-nexus-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-400">
            <div>
              <span>Mostrando {filteredTableProducts.length} productos de {selectedProvider}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Total Piezas Compradas: <strong className="text-red-400 font-mono">
                  {Array.from(comprasPorSku.values()).reduce((s, x) => s + x.qty, 0)} pz
                </strong>
              </span>
              <span>
                Total Piezas Vendidas: <strong className="text-emerald-400 font-mono">
                  {ventasStats.piezasVendidas} pz
                </strong>
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
