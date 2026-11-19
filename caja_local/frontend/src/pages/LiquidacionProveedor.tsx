import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';
import { db, type Product, type Ticket, type Compra, type KardexMovement } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import * as XLSX from 'xlsx';

// Normalizador de cadenas para comparación limpia
function cleanStr(s: any): string {
  return String(s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Analizador universal de fechas idéntico al de Reportes para coincidencia exacta al milisegundo
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

export default function LiquidacionProveedor() {
  const getTodayStr = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState(getTodayStr().slice(0, 7)); // YYYY-MM
  const [viewMode, setViewMode] = useState<'DIA' | 'MES'>('DIA');
  const [selectedProvider, setSelectedProvider] = useState<string>('COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)');
  const [providerSearchInput, setProviderSearchInput] = useState('');
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCashInput, setManualCashInput] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  // 🔄 Carga reactiva e instantánea de datos desde Dexie
  const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  const allTickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const allCompras = useLiveQuery(() => db.compras.toArray(), []) || [];
  const allKardex = useLiveQuery(() => db.kardex.toArray(), []) || [];
  const allProviders = useLiveQuery(() => db.providers.toArray(), []) || [];
  const allDailyCash = useLiveQuery(() => db.dailyCashEntries.toArray(), []) || [];

  // Mapeo O(1) de ID de proveedor a Nombre formal
  const provIdToName = useMemo(() => {
    const map = new Map<string, string>();
    allProviders.forEach(p => {
      if (p.id != null) map.set(String(p.id), p.name.trim().toUpperCase());
      if (p.name) map.set(p.name.trim().toUpperCase(), p.name.trim().toUpperCase());
    });
    return map;
  }, [allProviders]);

  // Lista única de todos los proveedores registrados
  const availableProviders = useMemo(() => {
    const set = new Set<string>();
    allProviders.forEach(p => {
      if (p.name && p.name.trim()) set.add(p.name.trim().toUpperCase());
    });
    allProducts.forEach(p => {
      const suppStr = String(p.supplier_id || '').trim();
      const resolved = provIdToName.get(suppStr) || (isNaN(Number(suppStr)) && suppStr ? suppStr.toUpperCase() : '');
      if (resolved && resolved !== 'SIN PROVEEDOR') set.add(resolved);
      const direct = String((p as any).supplier || (p as any).proveedor || (p as any).supplier_name || '').trim().toUpperCase();
      if (direct && isNaN(Number(direct)) && direct !== 'SIN PROVEEDOR') set.add(direct);
    });
    return Array.from(set).sort();
  }, [allProviders, allProducts, provIdToName]);

  // Proveedores filtrados por la barra de búsqueda de proveedores
  const filteredProvidersList = useMemo(() => {
    if (!providerSearchInput.trim()) return availableProviders;
    const q = cleanStr(providerSearchInput);
    return availableProviders.filter(p => cleanStr(p).includes(q));
  }, [availableProviders, providerSearchInput]);

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target as Node)) {
        setIsProviderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Proveedores rápidos sugeridos
  const quickProviders = [
    { label: 'COCA COLA', query: 'COCA' },
    { label: 'SABRITAS', query: 'SABRITAS' },
    { label: 'BIMBO', query: 'BIMBO' },
    { label: 'BARCEL', query: 'BARCEL' },
    { label: 'PEPSI', query: 'PEPSI' },
    { label: 'LALA', query: 'LALA' }
  ];

  // Función para seleccionar un proveedor por atajo rápido
  const handleQuickProvider = (query: string) => {
    const qClean = cleanStr(query);
    const found = availableProviders.find(p => cleanStr(p).includes(qClean));
    if (found) {
      setSelectedProvider(found);
    } else {
      setSelectedProvider(query);
    }
    setIsProviderOpen(false);
    setProviderSearchInput('');
  };

  // Resuelve el proveedor asignado formal a un producto
  const getProductProvider = (p: Product): string => {
    const pAny = p as any;
    // 1. Probar por supplier_id numérico
    const suppIdStr = String(p.supplier_id || '').trim();
    if (suppIdStr) {
      const resolved = provIdToName.get(suppIdStr);
      if (resolved && resolved !== 'SIN PROVEEDOR') return resolved;
      if (isNaN(Number(suppIdStr))) return suppIdStr.toUpperCase();
    }
    // 2. Probar por proveedor / supplier directo
    const direct = String(pAny.proveedor || p.supplier || pAny.supplier_name || pAny.provider || '').trim();
    if (direct) {
      const resolved = provIdToName.get(direct.toUpperCase()) || direct.toUpperCase();
      if (resolved && resolved !== 'SIN PROVEEDOR') return resolved;
    }
    return '';
  };

  // Valida si un producto pertenece ESTRICTAMENTE al proveedor seleccionado
  const isProductOfSelectedProvider = (p: Product, targetQuery: string): boolean => {
    const pProv = getProductProvider(p);
    if (!pProv) return false;

    const pClean = cleanStr(pProv);
    const tClean = cleanStr(targetQuery);
    if (!tClean) return false;

    if (pClean === tClean || pClean.includes(tClean)) return true;

    const tWords = tClean.split(' ').filter(w => w.length > 2);
    if (tWords.length > 0 && tWords.every(w => pClean.includes(w))) {
      return true;
    }

    return false;
  };

  // 1. Productos asignados exclusivamente al proveedor seleccionado (ej. los 116 de Coca Cola)
  const providerProducts = useMemo(() => {
    return allProducts.filter(p => isProductOfSelectedProvider(p, selectedProvider));
  }, [allProducts, selectedProvider, provIdToName]);

  // Mapas en memoria O(1) de los productos del proveedor
  const providerProductMaps = useMemo(() => {
    const byId = new Map<number, Product>();
    const bySku = new Map<string, Product>();
    const byName = new Map<string, Product>();

    providerProducts.forEach(p => {
      if (p.id != null) byId.set(Number(p.id), p);
      if (p.sku) bySku.set(cleanStr(p.sku), p);
      if (p.name) byName.set(cleanStr(p.name), p);

      const extractCodes = (rawVal: any) => {
        if (!rawVal) return;
        const parts = String(rawVal).split(/[,|;\s]+/).map(cleanStr).filter(Boolean);
        for (const part of parts) {
          bySku.set(part, p);
        }
      };
      extractCodes(p.barcode2);
      extractCodes(p.barcode3);
    });

    return { byId, bySku, byName };
  }, [providerProducts]);

  // Rango de tiempo milimétrico (Timestamp Start & End) según vista DÍA o MES
  const { startTimestamp, endTimestamp } = useMemo(() => {
    if (viewMode === 'DIA') {
      const start = new Date(selectedDate + 'T00:00:00').getTime();
      const end = new Date(selectedDate + 'T23:59:59.999').getTime();
      return { startTimestamp: start, endTimestamp: end };
    } else {
      const [yStr, mStr] = selectedMonth.split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10);
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0).getTime();
      const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      return { startTimestamp: start, endTimestamp: end };
    }
  }, [selectedDate, selectedMonth, viewMode]);

  // Cargar el efectivo manual guardado SEPARADO POR PROVEEDOR
  useEffect(() => {
    const targetClean = cleanStr(selectedProvider);
    const entry = allDailyCash.find(e => {
      return e.dateKey === selectedDate && cleanStr(e.provider) === targetClean;
    });
    if (entry) {
      setManualCashInput(entry.cashAmount.toString());
      setManualNotes(entry.notes || '');
    } else {
      setManualCashInput('');
      setManualNotes('');
    }
  }, [selectedDate, selectedProvider, allDailyCash]);

  // Guardar efectivo manual en Dexie de forma 100% INDEPENDIENTE por proveedor
  const handleSaveManualCash = async () => {
    const amount = parseFloat(manualCashInput) || 0;
    try {
      const targetClean = cleanStr(selectedProvider);
      const allEntries = await db.dailyCashEntries.where('dateKey').equals(selectedDate).toArray();
      const existing = allEntries.find(e => cleanStr(e.provider) === targetClean);

      if (existing && existing.id) {
        await db.dailyCashEntries.update(existing.id, {
          cashAmount: amount,
          notes: manualNotes,
          provider: selectedProvider,
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

  // 2. 🛒 VENTAS DÍA A DÍA EXACTAS DE PRODUCTOS DE ESTE PROVEEDOR
  const ventasStats = useMemo(() => {
    let piezasVendidas = 0;
    let montoTotalVendido = 0;
    let montoEfectivoVendido = 0;
    const ventasPorProductId = new Map<number, { qty: number; total: number }>();
    const ventasPorSku = new Map<string, { qty: number; total: number }>();

    const ticketsDelPeriodo = allTickets.filter(t => {
      if (t.status === 'CANCELADO') return false;
      const tTime = parseUniversalTimestamp(t.date);
      return tTime >= startTimestamp && tTime <= endTimestamp;
    });

    ticketsDelPeriodo.forEach(t => {
      const methodUpper = String(t.paymentMethod || 'EFECTIVO').toUpperCase();
      const isEfectivo = methodUpper === 'EFECTIVO' || methodUpper === 'CASH';
      const isMixto = methodUpper === 'MIXTO';
      const efectivoRatio = isEfectivo ? 1 : (isMixto && t.total > 0 && (t.montoEfectivo || 0) > 0 ? ((t.montoEfectivo || 0) / t.total) : 0);

      (t.items || []).forEach((item: any) => {
        let matchedProd: Product | undefined = undefined;

        if (item.id != null && !isNaN(Number(item.id))) {
          matchedProd = providerProductMaps.byId.get(Number(item.id));
        }
        if (!matchedProd) {
          const itemSku = cleanStr(item.sku || item.barcode || item.codigo);
          if (itemSku) matchedProd = providerProductMaps.bySku.get(itemSku);
        }
        if (!matchedProd && item.name) {
          matchedProd = providerProductMaps.byName.get(cleanStr(item.name));
        }

        if (matchedProd) {
          const qty = Number(item.cartQty || item.qty || item.cantidad || 0) - Number(item.returnedQty || 0);
          if (qty > 0) {
            const price = Number(item.price || matchedProd.price || 0);
            const lineTotal = Number(item.lineTotal || (price * qty));

            piezasVendidas += qty;
            montoTotalVendido += lineTotal;
            montoEfectivoVendido += lineTotal * efectivoRatio;

            if (matchedProd.id != null) {
              const current = ventasPorProductId.get(matchedProd.id) || { qty: 0, total: 0 };
              ventasPorProductId.set(matchedProd.id, {
                qty: current.qty + qty,
                total: current.total + lineTotal
              });
            }
            const skuKey = cleanStr(matchedProd.sku);
            if (skuKey) {
              const current = ventasPorSku.get(skuKey) || { qty: 0, total: 0 };
              ventasPorSku.set(skuKey, {
                qty: current.qty + qty,
                total: current.total + lineTotal
              });
            }
          }
        }
      });
    });

    return {
      piezasVendidas,
      montoTotalVendido,
      montoEfectivoVendido,
      ventasPorProductId,
      ventasPorSku
    };
  }, [allTickets, providerProductMaps, startTimestamp, endTimestamp]);

  // 3. 📦 COMPRAS, ENTRADAS Y FACTURAS DÍA A DÍA
  const comprasStats = useMemo(() => {
    let piezasCompradas = 0;
    let montoCompras = 0;
    const comprasPorProductId = new Map<number, { qty: number; total: number }>();
    const comprasPorSku = new Map<string, { qty: number; total: number }>();
    const relevantComprasMap = new Map<string, {
      folio: string;
      date: string;
      provider: string;
      totalProv: number;
      itemsCount: number;
    }>();
    const countedFolios = new Set<string>();

    const targetProvClean = cleanStr(selectedProvider);

    // A) Revisar db.compras
    allCompras.forEach(c => {
      const cTime = parseUniversalTimestamp(c.date);
      if (cTime < startTimestamp || cTime > endTimestamp) return;
      if (c.status === 'PENDIENTE' || c.status === 'ORDEN') return;

      const folioKey = String(c.folio || c.id || '').trim();
      const compProvClean = cleanStr(c.provider || '');
      const isTargetProviderOrder = compProvClean && (compProvClean.includes(targetProvClean) || targetProvClean.includes(compProvClean));

      let compraHasProviderItems = false;
      let totalAmountThisProvider = 0;
      let itemsCountThisProvider = 0;

      (c.items || []).forEach((item: any) => {
        let matchedProd: Product | undefined = undefined;
        if (item.id != null && !isNaN(Number(item.id))) {
          matchedProd = providerProductMaps.byId.get(Number(item.id));
        }
        if (!matchedProd) {
          const itemSku = cleanStr(item.sku || item.barcode || item.codigo);
          if (itemSku) matchedProd = providerProductMaps.bySku.get(itemSku);
        }
        if (!matchedProd && item.name) {
          matchedProd = providerProductMaps.byName.get(cleanStr(item.name));
        }

        if (matchedProd || isTargetProviderOrder) {
          compraHasProviderItems = true;
          const qty = Number(item.qty || item.entradaQty || item.cantidad || 0);
          const cost = Number(item.cost || item.costo || matchedProd?.cost || 0);
          const itemTotal = Number(item.total || (cost * qty));

          if (qty > 0) {
            piezasCompradas += qty;
            montoCompras += itemTotal;
            totalAmountThisProvider += itemTotal;
            itemsCountThisProvider += 1;

            if (matchedProd && matchedProd.id != null) {
              const cur = comprasPorProductId.get(matchedProd.id) || { qty: 0, total: 0 };
              comprasPorProductId.set(matchedProd.id, {
                qty: cur.qty + qty,
                total: cur.total + itemTotal
              });
            }
            if (matchedProd && matchedProd.sku) {
              const skuKey = cleanStr(matchedProd.sku);
              const cur = comprasPorSku.get(skuKey) || { qty: 0, total: 0 };
              comprasPorSku.set(skuKey, {
                qty: cur.qty + qty,
                total: cur.total + itemTotal
              });
            }
          }
        }
      });

      if (compraHasProviderItems || isTargetProviderOrder) {
        if (folioKey) countedFolios.add(folioKey);
        relevantComprasMap.set(folioKey || String(Math.random()), {
          folio: folioKey || 'SIN FOLIO',
          date: c.date,
          provider: c.provider || selectedProvider,
          totalProv: totalAmountThisProvider > 0 ? totalAmountThisProvider : Number(c.total || 0),
          itemsCount: itemsCountThisProvider > 0 ? itemsCountThisProvider : (c.items || []).length
        });
      }
    });

    // B) Revisar db.kardex para movimientos de tipo ENTRADA
    allKardex.forEach(k => {
      if (k.tipo !== 'ENTRADA') return;
      const kTime = parseUniversalTimestamp(k.fecha);
      if (kTime < startTimestamp || kTime > endTimestamp) return;

      const folioKey = String(k.folio || '').trim();
      if (folioKey && countedFolios.has(folioKey)) return;

      let matchedProd: Product | undefined = undefined;
      const kSku = cleanStr(k.sku);
      if (kSku) matchedProd = providerProductMaps.bySku.get(kSku);
      if (!matchedProd && k.productName) {
        matchedProd = providerProductMaps.byName.get(cleanStr(k.productName));
      }

      const kProvClean = cleanStr(k.proveedor || k.provider || '');
      const isTargetProv = kProvClean && (kProvClean.includes(targetProvClean) || targetProvClean.includes(kProvClean));

      if (matchedProd || isTargetProv) {
        const qty = Number(k.cantidad || 0);
        const cost = Number(k.costo || k.costoUnitario || matchedProd?.cost || 0);
        const itemTotal = Number(k.total || (cost * qty));

        if (qty > 0) {
          piezasCompradas += qty;
          montoCompras += itemTotal;

          if (matchedProd && matchedProd.id != null) {
            const cur = comprasPorProductId.get(matchedProd.id) || { qty: 0, total: 0 };
            comprasPorProductId.set(matchedProd.id, {
              qty: cur.qty + qty,
              total: cur.total + itemTotal
            });
          }
          if (matchedProd && matchedProd.sku) {
            const skuKey = cleanStr(matchedProd.sku);
            const cur = comprasPorSku.get(skuKey) || { qty: 0, total: 0 };
            comprasPorSku.set(skuKey, {
              qty: cur.qty + qty,
              total: cur.total + itemTotal
            });
          }

          if (folioKey && !relevantComprasMap.has(folioKey)) {
            relevantComprasMap.set(folioKey, {
              folio: folioKey,
              date: k.fecha,
              provider: k.proveedor || selectedProvider,
              totalProv: itemTotal,
              itemsCount: 1
            });
          }
        }
      }
    });

    return {
      piezasCompradas,
      montoCompras,
      comprasPorProductId,
      comprasPorSku,
      notasList: Array.from(relevantComprasMap.values())
    };
  }, [allCompras, allKardex, providerProductMaps, selectedProvider, startTimestamp, endTimestamp]);

  // 4. BALANCES Y CUADRE
  const efectivoManualNum = parseFloat(manualCashInput) || 0;
  const flujoGeneradoEsperado = ventasStats.montoTotalVendido - comprasStats.montoCompras;
  const diferenciaEfectivo = efectivoManualNum - flujoGeneradoEsperado;

  // Filtrado del catálogo de este proveedor por búsqueda de texto
  const filteredTableProducts = useMemo(() => {
    const q = cleanStr(searchTerm);
    if (!q) return providerProducts;
    return providerProducts.filter(p => {
      const skuClean = cleanStr(p.sku);
      const nameClean = cleanStr(p.name);
      const catClean = cleanStr(p.category);
      return skuClean.includes(q) || nameClean.includes(q) || catClean.includes(q);
    });
  }, [providerProducts, searchTerm]);

  // Exportar a Excel
  const handleExportExcel = () => {
    const rows = filteredTableProducts.map(p => {
      const v = (p.id != null ? ventasStats.ventasPorProductId.get(p.id) : null) || 
                ventasStats.ventasPorSku.get(cleanStr(p.sku)) || 
                { qty: 0, total: 0 };
      const c = (p.id != null ? comprasStats.comprasPorProductId.get(p.id) : null) || 
                comprasStats.comprasPorSku.get(cleanStr(p.sku)) || 
                { qty: 0, total: 0 };

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
        'TOTAL COMPRAS ($)': +c.total.toFixed(2),
        'PIEZAS VENDIDAS': v.qty,
        'TOTAL VENTAS ($)': +v.total.toFixed(2)
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidacion_' + cleanStr(selectedProvider).slice(0, 20));
    XLSX.writeFile(wb, `Liquidacion_${cleanStr(selectedProvider).slice(0, 25)}_${selectedDate}.xlsx`);
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
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  EN VIVO AL INSTANTE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Auditoría exacta día a día: solo los artículos asignados al proveedor seleccionado
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

        {/* 📅 SELECTOR DE PERÍODO & BUSCADOR DE PROVEEDOR */}
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
                style={{ backgroundColor: 'transparent', color: '#ffffff' }}
                className="font-mono font-bold text-xs outline-none cursor-pointer"
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

          {/* 🔍 Buscador y Selector de Proveedor Oficial (100% Oscuro sin fondos blancos) */}
          <div className="relative col-span-1 sm:col-span-2" ref={providerDropdownRef}>
            <div 
              style={{ backgroundColor: '#090d16' }}
              className="border border-nexus-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer focus-within:border-blue-500 shadow-inner"
            >
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <input 
                type="text"
                value={isProviderOpen ? providerSearchInput : selectedProvider}
                onFocus={() => {
                  setIsProviderOpen(true);
                  setProviderSearchInput('');
                }}
                onChange={e => {
                  setProviderSearchInput(e.target.value);
                  if (!isProviderOpen) setIsProviderOpen(true);
                }}
                placeholder="Escribir o buscar proveedor..."
                style={{ backgroundColor: 'transparent', color: '#ffffff' }}
                className="font-bold text-xs w-full outline-none uppercase placeholder:text-slate-500 truncate"
              />
              <button 
                type="button"
                onClick={() => setIsProviderOpen(!isProviderOpen)}
                className="text-slate-400 hover:text-white p-0.5 text-xs shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Menú desplegable flotante de proveedores */}
            {isProviderOpen && (
              <div 
                style={{ backgroundColor: '#0f172a' }}
                className="absolute left-0 right-0 top-full mt-1.5 z-50 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
              >
                <div className="p-2 border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider flex justify-between items-center bg-nexus-950">
                  <span>Seleccionar Proveedor ({filteredProvidersList.length})</span>
                  <button 
                    onClick={() => setIsProviderOpen(false)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                {filteredProvidersList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-bold">
                    No se encontró "{providerSearchInput}".
                  </div>
                ) : (
                  filteredProvidersList.map(prov => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(prov);
                        setIsProviderOpen(false);
                        setProviderSearchInput('');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                        prov === selectedProvider 
                          ? 'bg-blue-600/30 text-blue-300 font-black border-l-4 border-blue-500' 
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{prov}</span>
                      {prov === selectedProvider && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
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
              onClick={() => handleQuickProvider(qp.query)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                cleanStr(selectedProvider).includes(qp.query)
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
        
        {/* TARJETA 1: VENTAS TOTALES DEL PROVEEDOR */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-nexus-900 border border-emerald-900/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> VENTAS TOTALES ({viewMode === 'DIA' ? 'DÍA' : 'MES'})
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-800/40 font-mono">
              {ventasStats.piezasVendidas} pz
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-300 font-mono tracking-tight">
              ${ventasStats.montoTotalVendido.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>En Efectivo:</span>
              <span className="font-mono font-bold text-emerald-400">${ventasStats.montoEfectivoVendido.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: COMPRAS REALIZADAS */}
        <div className="bg-gradient-to-br from-red-950/40 to-nexus-900 border border-red-900/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> COMPRAS REALIZADAS
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-800/40 font-mono">
              {comprasStats.notasList.length} notas / {comprasStats.piezasCompradas} pz
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-red-300 font-mono tracking-tight">
              ${comprasStats.montoCompras.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {comprasStats.notasList.length === 0 ? 'Sin compras en el período' : `Inversión total en productos de ${selectedProvider}`}
            </div>
          </div>
        </div>

        {/* TARJETA 3: RECUADRO DE EFECTIVO MANUAL (100% SEPARADO POR PROVEEDOR, FONDO OSCURO) */}
        <div className="bg-gradient-to-br from-blue-950/50 to-nexus-900 border-2 border-blue-500/40 rounded-2xl p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> EFECTIVO SEPARADO ({cleanStr(selectedProvider).split(' ')[0]})
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
              style={{ backgroundColor: '#090d16', color: '#34d399' }}
              className="border border-blue-500/50 rounded-xl px-3 py-1.5 text-2xl font-black font-mono w-full outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
            />
            <button
              onClick={handleSaveManualCash}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/30 active:scale-95 transition-all shrink-0"
              title={`Guardar efectivo específico para ${selectedProvider}`}
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          <input 
            type="text"
            value={manualNotes}
            onChange={e => setManualNotes(e.target.value)}
            placeholder={`Nota o motivo del dinero...`}
            style={{ backgroundColor: 'transparent', color: '#e2e8f0' }}
            className="border-b border-nexus-700/60 text-[10px] py-0.5 outline-none placeholder:text-slate-600 w-full"
          />
        </div>

        {/* TARJETA 4: BALANCE NETO / CUADRE */}
        <div className={`bg-gradient-to-br rounded-2xl p-4 shadow-lg flex flex-col justify-between border ${
          Math.abs(diferenciaEfectivo) < 0.01 
            ? 'from-blue-950/50 to-nexus-900 border-blue-500/50'
            : diferenciaEfectivo >= 0 
              ? 'from-emerald-950/50 to-nexus-900 border-emerald-500/50' 
              : 'from-amber-950/50 to-nexus-900 border-amber-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
              Math.abs(diferenciaEfectivo) < 0.01 ? 'text-blue-400' : (diferenciaEfectivo >= 0 ? 'text-emerald-400' : 'text-amber-400')
            }`}>
              <DollarSign className="w-3.5 h-3.5" /> 
              {Math.abs(diferenciaEfectivo) < 0.01 
                ? 'CUADRE EXACTO' 
                : (diferenciaEfectivo >= 0 ? 'SOBRANTE / EN REGLA' : 'FALTANTE / DIFERENCIA')}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-nexus-950 px-2 py-0.5 rounded-full border border-nexus-800">
              CUADRE
            </span>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono ${
              Math.abs(diferenciaEfectivo) < 0.01 ? 'text-blue-300' : (diferenciaEfectivo >= 0 ? 'text-emerald-300' : 'text-amber-300')
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

      {/* 📊 RESUMEN DE COMPRAS / ENTRADAS / FACTURAS DEL PERÍODO */}
      {comprasStats.notasList.length > 0 && (
        <div className="px-4 mb-3">
          <div className="bg-nexus-900/60 border border-nexus-800 rounded-2xl p-3">
            <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-400" />
                <span>ENTRADAS Y FACTURAS CON PRODUCTOS DE {selectedProvider} ({comprasStats.notasList.length})</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-red-400">
                Total Invertido: ${comprasStats.montoCompras.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {comprasStats.notasList.map((compra, idx) => (
                <div key={idx} className="bg-nexus-950/80 border border-nexus-800 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-black text-blue-400">{compra.folio}</span>
                      <span className="text-[9px] bg-nexus-800 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase truncate max-w-[120px]" title={`Registrado como proveedor: ${compra.provider}`}>
                        {compra.provider}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{compra.date?.slice(0, 10)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-red-400 block">${compra.totalProv.toFixed(2)}</span>
                    <span className="text-[9px] text-slate-500">{compra.itemsCount} producto(s)</span>
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
                style={{ backgroundColor: '#090d16', color: '#ffffff' }}
                className="w-full border border-nexus-700 rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder:text-slate-500 outline-none focus:border-blue-500"
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
                    const v = (prod.id != null ? ventasStats.ventasPorProductId.get(prod.id) : null) || 
                              ventasStats.ventasPorSku.get(cleanStr(prod.sku)) || 
                              { qty: 0, total: 0 };
                    const c = (prod.id != null ? comprasStats.comprasPorProductId.get(prod.id) : null) || 
                              comprasStats.comprasPorSku.get(cleanStr(prod.sku)) || 
                              { qty: 0, total: 0 };
                    const stockVal = (prod.price || 0) * (prod.stock || 0);

                    return (
                      <tr key={prod.id || prod.sku} className={`hover:bg-nexus-800/40 transition-colors ${v.qty > 0 ? 'bg-emerald-950/10' : ''}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400 text-[11px] whitespace-nowrap">
                          {prod.sku}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white max-w-[220px] truncate" title={prod.name}>
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
                          {c.qty > 0 ? (
                            <span title={`Comprado: ${c.qty} pz ($${c.total.toFixed(2)})`}>
                              +{c.qty} pz
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10">
                          {v.qty > 0 ? (
                            <span title={`Vendido: ${v.qty} pz ($${v.total.toFixed(2)})`} className="bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded">
                              {v.qty} pz
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
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
              <span>Mostrando {filteredTableProducts.length} productos asignados a {selectedProvider}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Total Piezas Compradas: <strong className="text-red-400 font-mono">
                  {comprasStats.piezasCompradas} pz
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
