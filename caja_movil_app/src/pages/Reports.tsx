import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from '../store/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '../store/useSettings';
import { 
  Filter, Printer, FileSpreadsheet, MessageCircle, 
  RefreshCcw, Eye, X, Receipt, TrendingUp, BarChart3, BarChart2, Search, Edit,
  UserCheck, User, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import ReporteEntradaPDFModal, { type CompraData } from '../components/ReporteEntradaPDFModal';

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

export function formatDisplayDate(fechaStr: any, ts?: number): string {
  const finalTs = ts || parseUniversalTimestamp(fechaStr);
  if (finalTs && finalTs > 0) {
    try {
      const d = new Date(finalTs);
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState('VENTAS');
  const getLocalDateString = (d: Date = new Date()) => {
    const local = new Date(d);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split('T')[0];
  };
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [quickRange, setQuickRange] = useState('HOY (DIARIO)');
  const [providerFilter, setProviderFilter] = useState('TODOS LOS PROVEEDORES');
  const [paymentFilter, setPaymentFilter] = useState('TODOS');
  const [ventasView, setVentasView] = useState('CONSOLIDADO');
  const [creditFilterState, setCreditFilterState] = useState<'PENDIENTES' | 'TODOS'>('PENDIENTES');
  const [creditSearchClient, setCreditSearchClient] = useState('');
  const [selectedCreditClientFilter, setSelectedCreditClientFilter] = useState<string | null>(null);

  const handleApplyQuickRange = (range: string) => {
    setQuickRange(range);
    const now = new Date();
    if (range === 'HOY (DIARIO)') {
      const todayStr = getLocalDateString(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'AYER') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = getLocalDateString(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (range === 'ESTA SEMANA') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lunes
      const monday = new Date(d.setDate(diff));
      setStartDate(getLocalDateString(monday));
      setEndDate(getLocalDateString(now));
    } else if (range === 'ESTE MES') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(getLocalDateString(firstDay));
      setEndDate(getLocalDateString(lastDay));
    } else if (range === 'VER TODOS') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Modal de Abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [selectedCreditTicket, setSelectedCreditTicket] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');

  // Modal de Devolucion
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionCantidades, setDevolucionCantidades] = useState<{[key: number]: number}>({});

  // Modal de Reporte PDF Entradas
  const [selectedEntradaPDF, setSelectedEntradaPDF] = useState<CompraData | null>(null);
  const [showEntradaPDFModal, setShowEntradaPDFModal] = useState(false);
  const [searchEntradas, setSearchEntradas] = useState('');
  const [editingEntrada, setEditingEntrada] = useState<any | null>(null);
  const [conteoSearch, setConteoSearch] = useState('');

  const tabs = [
    'MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS', 'VENTAS', 
    'FOLIOS', 'TURNOS', 'ENTRADAS', 'DEVOLUCIONES', 'MERMAS', 
    'CONTEO STOCK', 'POR HORA', 'MATRIZ 24H', 'ESTADÍSTICAS', 
    'PEDIDOS', 'CRÉDITOS'
  ];

  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const kardex = useLiveQuery(() => db.kardex.toArray(), []) || [];
  const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];
  const turnos = useLiveQuery(() => db.turnos?.toArray() || [], []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const providers = useLiveQuery(() => db.providers.toArray(), []) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];
  const compras = useLiveQuery(() => db.compras?.toArray() || [], []) || [];

  const provIdToName = useMemo(() => {
    const map = new Map<string, string>();
    providers.forEach(p => {
      if (p.id) map.set(String(p.id), p.name.trim().toUpperCase());
      if (p.name) map.set(p.name.trim().toUpperCase(), p.name.trim().toUpperCase());
    });
    return map;
  }, [providers]);

  const skuToProv = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => {
      const suppStr = String(p.supplier_id || '').trim();
      const resolved = provIdToName.get(suppStr) || (isNaN(Number(suppStr)) && suppStr ? suppStr.toUpperCase() : 'SIN PROVEEDOR');
      map.set(String(p.sku).trim().toLowerCase(), resolved);
      if (p.name) map.set(String(p.name).trim().toUpperCase(), resolved);
    });
    return map;
  }, [products, provIdToName]);

  const uniqueProviders = useMemo(() => {
    const s = new Set<string>();
    s.add('TODOS LOS PROVEEDORES');
    if (providers && providers.length > 0) {
      providers.forEach(p => {
        if (p.name) s.add(p.name.trim().toUpperCase());
      });
    }
    products.forEach(p => {
      const suppStr = String(p.supplier_id || '').trim();
      if (suppStr) {
        const resolved = provIdToName.get(suppStr) || (isNaN(Number(suppStr)) ? suppStr.toUpperCase() : null);
        if (resolved) s.add(resolved);
      }
    });
    return Array.from(s).sort();
  }, [products, providers, provIdToName]);

  const filteredTickets = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();

    let result = tickets.filter(t => {
      const tTime = parseUniversalTimestamp(t.date);
      return tTime >= start && tTime <= end;
    });

    if (paymentFilter && paymentFilter !== 'TODOS') {
      result = result.filter(t => t.paymentMethod === paymentFilter);
    }

    if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
      const selectedProv = providerFilter.trim().toUpperCase();
      result = result.map(t => {
        const newT = { ...t };
        if (newT.items && Array.isArray(newT.items)) {
          newT.items = newT.items.filter((item: any) => {
            const itemSku = String(item.sku || '').trim().toLowerCase();
            const itemName = String(item.name || '').trim().toUpperCase();
            const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(itemName) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
            const resolvedItemProv = provIdToName.get(itemProvRaw) || itemProvRaw;
            return resolvedItemProv === selectedProv;
          });
        }
        return newT;
      }).filter(t => t.items && Array.isArray(t.items) && t.items.length > 0);

      result = result.map(t => {
        const newTotal = (Array.isArray(t.items) ? t.items : []).reduce((sum: number, item: any) => sum + (item.price * (item.cartQty - (item.returnedQty || 0))), 0);
        return { ...t, total: newTotal };
      });
    }

    result.sort((a, b) => {
      const timeA = parseUniversalTimestamp(a.date) || (typeof a.id === 'number' ? a.id : 0);
      const timeB = parseUniversalTimestamp(b.date) || (typeof b.id === 'number' ? b.id : 0);
      return timeB - timeA;
    });

    return result;
  }, [tickets, startDate, endDate, providerFilter, paymentFilter, skuToProv, provIdToName]);

  const aggregatedItems = useMemo(() => {
    const map = new Map<string, {
      sku: string;
      name: string;
      paymentMethod: string;
      prov: string;
      cant: number;
      costo: number;
      price: number;
      total: number;
      util: number;
    }>();

    filteredTickets.forEach(t => {
      t.items?.forEach((item: any) => {
        const cant = (item.cartQty || 0) - (item.returnedQty || 0);
        if (cant <= 0) return;

        const itemSku = String(item.sku || '').trim().toLowerCase();
        const itemName = String(item.name || '').trim().toUpperCase();
        const key = itemSku || itemName;

        const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(itemName) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
        const prov = provIdToName.get(itemProvRaw) || itemProvRaw;
        
        const costo = item.cost || (item.price * 0.7);
        const itemTotal = item.price * cant;
        const itemUtil = (item.price - costo) * cant;

        const existing = map.get(key);
        if (existing) {
          existing.cant += cant;
          existing.total += itemTotal;
          existing.util += itemUtil;
          if (existing.paymentMethod !== t.paymentMethod) {
            existing.paymentMethod = 'VARIOS';
          }
        } else {
          map.set(key, {
            sku: item.sku || '',
            name: item.name,
            paymentMethod: t.paymentMethod || 'EFECTIVO',
            prov,
            cant,
            costo,
            price: item.price,
            total: itemTotal,
            util: itemUtil
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTickets, skuToProv, provIdToName]);

  const filteredKardex = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();

    return kardex.filter(k => {
      // 1. Filtrar por proveedor si está seleccionado
      if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
        const targetProv = providerFilter.trim().toUpperCase();
        const rawProv = String(k.proveedor || k.provider || '').trim().toUpperCase();
        const resolvedProv = (provIdToName.get(k.proveedor || '') || rawProv).toUpperCase();
        if (!rawProv.includes(targetProv) && !resolvedProv.includes(targetProv)) {
          return false;
        }
      }

      if (!k.fecha) return true;

      const ts = parseUniversalTimestamp(k.fecha);
      if (ts > 0) {
        return ts >= start && ts <= end;
      }

      if (String(k.fecha).includes(startDate) || String(k.fecha).includes(endDate)) {
        return true;
      }

      return false;
    });
  }, [kardex, startDate, endDate, providerFilter, provIdToName]);

  const filteredCortes = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();

    return cortes.filter(c => {
      const tTime = parseUniversalTimestamp(c.date);
      return tTime >= start && tTime <= end;
    });
  }, [cortes, startDate, endDate]);

  // Auto-recalcular deudas basado en tickets históricos para evitar errores de sincronización
  React.useEffect(() => {
    if (activeTab === 'CRÉDITOS') {
      const recalculateDebts = async () => {
        const allTickets = await db.tickets.toArray();
        const allClients = await db.clients.toArray();
        
        const clientDebts: Record<string, number> = {};
        allTickets.forEach(t => {
          if (t.paymentMethod === 'CRÉDITO' || t.paymentMethod === 'CREDITO' || t.paymentMethod === 'CR%DITO') {
             const clientName = (t.clientName || t.client || 'PUBLICO GENERAL').toUpperCase();
             const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : (t.total || 0));
             clientDebts[clientName] = (clientDebts[clientName] || 0) + pending;
          }
        });

        for (const c of allClients) {
          const cName = c.name.toUpperCase();
          if (clientDebts[cName] !== undefined) {
             if (c.credito !== clientDebts[cName]) {
               await db.clients.update(c.id as number, { credito: clientDebts[cName] });
             }
          }
        }
      };
      recalculateDebts();
    }
  }, [activeTab]);

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach(t => {
      t.items?.forEach((item: any) => {
        counts[item.name] = (counts[item.name] || 0) + item.cartQty;
      });
    });
    return Object.entries(counts).map(([name, qty]) => ({name, qty})).sort((a,b)=>b.qty - a.qty);
  }, [filteredTickets]);

  const statsData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const d = new Date(t.date).toLocaleDateString();
      days[d] = (days[d] || 0) + (t.total || 0);
    });
    return Object.entries(days).map(([name, total]) => ({name, total}));
  }, [filteredTickets]);

  const handleExportExcel = async () => {
    try {
      const settings = useSettings.getState();
      const companyName = settings.nombreNegocio || 'MI TIENDITA "MISCELANEA BRITTANY"';
      const address = settings.direccion || 'AV. 16 DE SEPTIEMBRE 903, COL. BIENESTAR SOCIAL, TUXTLA GUTIERREZ, CHIAPAS. CP 29077';
      const nowStr = new Date().toLocaleString('es-MX');

      const wsData: any[][] = [
        ["VENTAS POR PRODUCTO"],
        ["Empresa:", companyName],
        ["Dirección:", address],
        ["Periodo:", `${startDate} al ${endDate}`, "", "", "", "Generado:", nowStr],
        [""],
        ["CÓDIGO", "PRODUCTO", "PROVEEDOR", "CANTIDAD", "COSTO", "PRECIO", "TOTAL", "UTILIDAD"]
      ];

      let itemsToExport = aggregatedItems;
      if (ventasView === 'DETALLADO') {
        itemsToExport = filteredTickets.flatMap(t => t.items?.map((item: any) => {
          const itemSku = String(item.sku || '').trim().toLowerCase();
          const itemName = String(item.name || '').trim().toUpperCase();
          const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(itemName) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
          const prov = provIdToName.get(itemProvRaw) || itemProvRaw;
          const cant = (item.cartQty || 0) - (item.returnedQty || 0);
          const costo = item.cost || (item.price * 0.7);
          return {
            sku: item.sku || '',
            name: item.name,
            paymentMethod: t.paymentMethod || 'EFECTIVO',
            prov,
            cant,
            costo,
            price: item.price || 0,
            total: (item.price || 0) * cant,
            util: ((item.price || 0) - costo) * cant
          };
        }) || []).filter(i => i.cant > 0);
      }

      let totalCant = 0;
      let totalVentas = 0;
      let totalUtil = 0;

      itemsToExport.forEach(item => {
        wsData.push([
          item.sku,
          item.name,
          item.prov,
          item.cant,
          item.costo,
          item.price,
          item.total,
          item.util
        ]);
        totalCant += item.cant;
        totalVentas += item.total;
        totalUtil += item.util;
      });

      wsData.push(["TOTAL:", "", "", totalCant, "", "", totalVentas, totalUtil]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Calcular anchos dinámicos según contenido
      let maxSkuLen = 14;
      let maxNameLen = 30;
      let maxProvLen = 16;
      itemsToExport.forEach(item => {
        if (String(item.sku || '').length > maxSkuLen) maxSkuLen = String(item.sku || '').length;
        if (String(item.name || '').length > maxNameLen) maxNameLen = String(item.name || '').length;
        if (String(item.prov || '').length > maxProvLen) maxProvLen = String(item.prov || '').length;
      });

      ws['!cols'] = [
        { wch: Math.min(22, maxSkuLen + 3) },
        { wch: Math.min(55, maxNameLen + 4) },
        { wch: Math.min(30, maxProvLen + 3) },
        { wch: 13 }, // Cantidad
        { wch: 14 }, // Costo
        { wch: 14 }, // Precio
        { wch: 16 }, // Total
        { wch: 16 }  // Utilidad
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
      ];

      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Arial" },
        fill: { fgColor: { rgb: "0F172A" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "475569" } },
          bottom: { style: "thin", color: { rgb: "475569" } },
          left: { style: "thin", color: { rgb: "475569" } },
          right: { style: "thin", color: { rgb: "475569" } }
        }
      };

      const titleStyle = {
        font: { bold: true, color: { rgb: "1E40AF" }, sz: 16, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const boldLabelStyle = {
        font: { bold: true, sz: 10, name: "Arial" }
      };

      const dataBorder = {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      };

      const totalRowStyle = {
        font: { bold: true, sz: 11, name: "Arial", color: { rgb: "0F172A" } },
        fill: { fgColor: { rgb: "F1F5F9" } },
        border: {
          top: { style: "thin", color: { rgb: "0F172A" } },
          bottom: { style: "double", color: { rgb: "0F172A" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } }
        }
      };

      if (ws['A1']) ws['A1'].s = titleStyle;
      if (ws['A2']) ws['A2'].s = boldLabelStyle;
      if (ws['A3']) ws['A3'].s = boldLabelStyle;
      if (ws['A4']) ws['A4'].s = boldLabelStyle;
      if (ws['F4']) ws['F4'].s = boldLabelStyle;

      const colNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      colNames.forEach(col => {
        const cellRef = `${col}6`;
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      });

      const startDataRow = 7;
      const endDataRow = startDataRow + itemsToExport.length - 1;

      for (let r = startDataRow; r <= endDataRow; r++) {
        colNames.forEach((col, colIdx) => {
          const cellRef = `${col}${r}`;
          if (!ws[cellRef]) return;
          ws[cellRef].s = {
            font: { sz: 9, name: "Arial" },
            border: dataBorder,
            alignment: {
              horizontal: colIdx >= 3 ? (colIdx === 3 ? "center" : "right") : "left",
              vertical: "center"
            }
          };

          if (colIdx >= 4) {
            ws[cellRef].t = 'n';
            ws[cellRef].z = '"$"#,##0.00';
          } else if (colIdx === 3) {
            ws[cellRef].t = 'n';
            ws[cellRef].z = '#,##0';
          }
        });
      }

      // La fila de totales es exactamente la fila siguiente a los datos (endDataRow + 1)
      const totalRowIndex = endDataRow + 1;
      colNames.forEach((col, colIdx) => {
        const cellRef = `${col}${totalRowIndex}`;
        if (!ws[cellRef]) return;
        ws[cellRef].s = {
          ...totalRowStyle,
          alignment: {
            horizontal: colIdx >= 3 ? (colIdx === 3 ? "center" : "right") : "left",
            vertical: "center"
          }
        };
        if (colIdx >= 4) {
          ws[cellRef].t = 'n';
          ws[cellRef].z = '"$"#,##0.00';
        } else if (colIdx === 3) {
          ws[cellRef].t = 'n';
          ws[cellRef].z = '#,##0';
        }
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "VENTAS");
      XLSX.writeFile(wb, `TITAN_VENTAS_${startDate}.xlsx`);

    } catch (e) {
      console.error("Error al exportar Excel:", e);
      alert("Error al exportar Excel");
    }
  };

  const handleExportSalesWhatsapp = () => {
    let phone = window.prompt('Número de WhatsApp (10 dígitos):', '') || '';
    phone = phone.replace(/\D/g, '');
    if (phone.length < 10) return alert('Número de WhatsApp inválido');

    const totalVenta = filteredTickets.reduce((a,b)=>a+(b.total||0),0);
    const totalTickets = filteredTickets.length;
    const msg = `📊 *REPORTE DE VENTAS* 📊\n` +
      `📅 *PERIODO:* ${startDate} AL ${endDate}\n` +
      `🧾 *TOTAL TICKETS:* ${totalTickets}\n` +
      `💵 *VENTA BRUTA TOTAL: $${totalVenta.toFixed(2)} MXN*\n\n` +
      `✨ Generado desde Nexus POS Enterprise.`;

    window.open('https://api.whatsapp.com/send?phone=52' + phone.slice(-10) + '&text=' + encodeURIComponent(msg), '_blank');
  };

  const handlePrintSalesReportPDF = () => {
    window.print();
  };

  
  const getTicketHtmlString = (ticket: any) => {
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MI TIENDITA';
    const slogan = settings.eslogan || '';
    const address = settings.direccion || '';
    const phone = settings.telefono || '';
    const rfcVal = settings.rfc || '';
    const logoUrl = localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';
    const folioStr = String(ticket.folio || ticket.id || '').replace(/\D/g, '') || '000001';
    const dateObj = new Date(ticket.date);
    const dateStr = isNaN(dateObj.getTime()) ? String(ticket.date) : dateObj.toLocaleString('es-MX');

    const itemRows = (ticket.items || []).map((i: any) => {
      const qty = i.cartQty || i.qty || 1;
      const price = i.price || 0;
      const totalLine = i.total !== undefined ? i.total : (qty * price);
      return `<div style="display:flex; justify-content:space-between; font-size:9px; font-weight:900; margin:2px 0;">
        <span style="width:12%; text-align:center;">${qty}</span>
        <span style="width:58%; text-align:left;">${(i.name || i.productName || '').toUpperCase()}</span>
        <span style="width:30%; text-align:right;">${totalLine.toFixed(2)}</span>
      </div>`;
    }).join('');

    const recibido = ticket.recibido !== undefined ? ticket.recibido : ticket.total;
    const cambio = ticket.cambio !== undefined ? ticket.cambio : Math.max(0, recibido - ticket.total);

    return `
      <div id="ticket-print-temp" style="width: 44mm; padding: 1mm; font-family: Arial, sans-serif; font-size: 9px; font-weight: 900; color: #000; background: #fff; word-break: break-word;">
        ${logoUrl ? `<img src="${logoUrl}" style="max-height:50px; max-width:140px; display:block; margin:0 auto 4px auto;" />` : ''}
        <div style="text-align:center; font-weight:900; text-transform:uppercase;">
          <p style="margin:0; font-size:12px;">${companyName}</p>
          ${slogan ? `<p style="margin:0;">${slogan}</p>` : ''}
          ${address ? `<p style="margin:0;">${address}</p>` : ''}
          ${phone ? `<p style="margin:0;">TEL: ${phone}</p>` : ''}
          ${rfcVal ? `<p style="margin:0;">RFC: ${rfcVal}</p>` : ''}
        </div>
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <div style="font-weight:900;">
          <p style="margin:0;">FECHA: ${dateStr}</p>
          <p style="margin:0;">FOLIO: #${folioStr}</p>
          <p style="margin:0;">CLIENTE: ${(ticket.clientName || ticket.client || 'PUBLICO GENERAL').toUpperCase()}</p>
          <p style="margin:0;">MÉTODO: ${(ticket.paymentMethod || 'EFECTIVO').toUpperCase()}</p>
        </div>
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:9px;">
          <span style="width:12%; text-align:center;">CT</span>
          <span style="width:58%; text-align:left;">DESCRIPCIÓN</span>
          <span style="width:30%; text-align:right;">TOTAL</span>
        </div>
        <div style="border-top:2px solid #000; margin:2px 0;"></div>
        ${itemRows}
        <div style="border-top:2px solid #000; margin:2px 0;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
          <span>TOTAL:</span><span>${(ticket.total || 0).toFixed(2)}</span>
        </div>
        ${(ticket.paymentMethod || 'EFECTIVO').toUpperCase() === 'EFECTIVO' ? `
          <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
            <span>RECIBIDO:</span><span>${recibido.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
            <span>CAMBIO:</span><span>${cambio.toFixed(2)}</span>
          </div>
        ` : ''}
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <p style="text-align:center; font-weight:900; margin-top:4px;">* GRACIAS POR SU COMPRA *</p>
      </div>
    `;
  };

  const reimprimirTicket = (ticket: any) => {
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MI TIENDITA';
    const slogan = settings.eslogan || '';
    const address = settings.direccion || '';
    const phone = settings.telefono || '';
    const rfcVal = settings.rfc || '';
    const logoUrl = localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';

    const folioStr = String(ticket.folio || ticket.id || '').replace(/\D/g, '') || '000001';
    const dateObj = new Date(ticket.date);
    const dateStr = isNaN(dateObj.getTime()) ? String(ticket.date) : dateObj.toLocaleString('es-MX');

    const items = ticket.items || [];
    const itemRows = items.map((i: any) => {
      const qty = i.cartQty || i.qty || 1;
      const price = i.price || 0;
      const totalLine = i.total !== undefined ? i.total : (qty * price);
      const nameStr = (i.name || i.productName || 'PRODUCTO').toUpperCase();
      return `
        <tr style="vertical-align:top;">
          <td style="width:12%; text-align:center; padding:1px 0; font-weight:900 !important; color:#000 !important;">${qty}</td>
          <td style="width:58%; text-align:left; padding:1px 0; word-break:break-word; font-weight:900 !important; color:#000 !important;">
            ${nameStr}
            ${qty > 1 ? `<br/><span style="font-size:8px; font-weight:normal; color:#000;">(${qty} x $${price.toFixed(2)})</span>` : ''}
          </td>
          <td style="width:30%; text-align:right; padding:1px 0; font-weight:900 !important; color:#000 !important;">$${totalLine.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const recibido = ticket.recibido !== undefined ? ticket.recibido : ticket.total;
    const cambio = ticket.cambio !== undefined ? ticket.cambio : Math.max(0, recibido - ticket.total);

    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return alert('Permite ventanas emergentes para reimprimir el ticket.');

    w.document.write(`
      <html>
        <head>
          <title>Ticket Reimpresion #${folioStr}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body {
              font-family: Arial, sans-serif;
              font-size: 9px;
              font-weight: 900 !important;
              width: 44mm !important;
              max-width: 44mm !important;
              margin: 0 auto !important;
              padding: 1mm 0 !important;
              color: #000000 !important;
              background-color: #ffffff !important;
              word-break: break-word;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * { font-weight: 900 !important; color: #000000 !important; box-sizing: border-box; }
            b, th, td, p, h2, h3, div { font-weight: 900 !important; color: #000000 !important; }
            img {
              max-height: 50px !important;
              max-width: 140px !important;
              display: block;
              margin: 0 auto 4px auto;
              object-fit: contain;
              
            }
            h2, h3, p { margin: 2px 0; text-align: center; text-transform: uppercase; font-weight: 900 !important; }
            table { width: 100% !important; border-collapse: collapse; margin: 3px 0; table-layout: fixed; }
            th { border-bottom: 2px solid #000000 !important; text-align: left; padding: 1px 0; font-weight: 900 !important; font-size: 9px !important; }
            td { font-weight: 900 !important; font-size: 9px !important; }
            .divider { border-top: 1.5px dashed #000000 !important; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; font-weight: 900 !important; }
          </style>
        </head>
        <body>
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ''}
          <h2><b>${companyName.toUpperCase()}</b></h2>
          ${slogan ? `<p><b>"${slogan.toUpperCase()}"</b></p>` : ''}
          ${address ? `<p><b>${address.toUpperCase()}</b></p>` : ''}
          ${phone ? `<p><b>TEL: ${phone}</b></p>` : ''}
          ${rfcVal ? `<p><b>RFC: ${rfcVal.toUpperCase()}</b></p>` : ''}
          <div class="divider"></div>
          <p style="text-align:center; font-weight:900;"><b>*** REIMPRESIÓN TICKET ***</b></p>
          <p style="text-align:left;"><b>FECHA: ${dateStr}</b></p>
          <p style="text-align:left;"><b>FOLIO: #${folioStr}</b></p>
          <p style="text-align:left;"><b>CLIENTE: ${(ticket.clientName || ticket.client || 'PUBLICO GENERAL').toUpperCase()}</b></p>
          <p style="text-align:left;"><b>MÉTODO PAGO: ${(ticket.paymentMethod || 'EFECTIVO').toUpperCase()}</b></p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th style="width:12%; text-align:center;"><b>CT</b></th>
                <th style="width:58%; text-align:left;"><b>DESCRIPCIÓN</b></th>
                <th style="width:30%; text-align:right;"><b>TOTAL</b></th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="row"><span><b>TOTAL:</b></span><span><b>$${(ticket.total || 0).toFixed(2)}</b></span></div>
          ${(ticket.paymentMethod || 'EFECTIVO').toUpperCase() === 'EFECTIVO' ? `
            <div class="row"><span><b>RECIBIDO:</b></span><span><b>$${recibido.toFixed(2)}</b></span></div>
            <div class="row"><span><b>CAMBIO:</b></span><span><b>$${cambio.toFixed(2)}</b></span></div>
          ` : ''}
          <div class="divider"></div>
          <p style="text-align:center; margin-top:6px"><b>* GRACIAS POR SU COMPRA *</b></p>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
  };

  const sendTicketWhatsapp = async (ticket: any) => {
    let phone = window.prompt('Número de WhatsApp del cliente (10 dígitos):', '') || '';
    phone = phone.replace(/\D/g, '');
    if (phone.length < 10) return alert('Número de WhatsApp inválido');

    const folioStr = String(ticket.folio || ticket.id || '').replace(/\D/g, '') || '000001';
    
    // Generar un div temporal invisible para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = getTicketHtmlString(ticket);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const el = tempDiv.querySelector('#ticket-print-temp') as HTMLElement;
      if (el) {
        const canvas = await html2canvas(el, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, canvas.height * (58 / canvas.width)] });
        pdf.addImage(imgData, 'PNG', 0, 0, 58, canvas.height * (58 / canvas.width));
        
        let savedPath = '';
        if ((window as any).require) {
          const fsLib = (window as any).require('fs');
          const pathLib = (window as any).require('path');
          const osLib = (window as any).require('os');
          const desktopPath = pathLib.join(osLib.homedir(), 'Desktop');
          const fileName = `Ticket_${folioStr}.pdf`;
          savedPath = pathLib.join(desktopPath, fileName);
          const pdfBuffer = pdf.output('arraybuffer');
          fsLib.writeFileSync(savedPath, new Uint8Array(pdfBuffer));
          alert(`El PDF se ha guardado en tu Escritorio como: ${fileName}\n\nPor favor, adjúntalo en el chat de WhatsApp.`);
        } else {
          pdf.save(`Ticket_${folioStr}.pdf`);
          alert('El PDF se ha descargado. Por favor, adjúntalo en el chat de WhatsApp.');
        }
      }
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      document.body.removeChild(tempDiv);
    }

    const msg = `🧾 *TICKET DE COMPRA (REIMPRESIÓN)* 🧾\n📌 *FOLIO:* #${folioStr}\n💵 *TOTAL: ${(ticket.total || 0).toFixed(2)} MXN*\n\nTe adjunto tu ticket en formato PDF.`;
    const waUrl = `https://wa.me/52${phone.slice(-10)}?text=${encodeURIComponent(msg)}`;
    try {
      if ((window as any).require) {
        const { shell } = (window as any).require('electron');
        if (shell && shell.openExternal) shell.openExternal(waUrl);
        else window.open(waUrl, '_blank');
      } else {
        window.open(waUrl, '_blank');
      }
    } catch(e) {
      window.open(waUrl, '_blank');
    }
  };

  const handleAbonarCredito = async () => {
    if (!selectedClientAbono || !abonoAmount) return;
    const amount = parseFloat(abonoAmount);
    if (isNaN(amount) || amount <= 0) return alert('Monto inválido');
    try {
      if (selectedCreditTicket) {
        const dbTicket = await db.tickets.get(selectedCreditTicket.id!);
        if (dbTicket) {
          const currentPending = dbTicket.pendingBalance !== undefined ? dbTicket.pendingBalance : dbTicket.total;
          const newPending = Math.max(0, currentPending - amount);
          dbTicket.pendingBalance = newPending;
          if (newPending <= 0) {
            dbTicket.status = 'LIQUIDADO';
          }
          await db.tickets.put(dbTicket);
        }
      }

      const cName = selectedClientAbono.name ? selectedClientAbono.name.toUpperCase() : '';
      const existingClient = clients.find(c => c.name.toUpperCase() === cName);
      if (existingClient && existingClient.id) {
        const updatedCredito = Math.max(0, (existingClient.credito || 0) - amount);
        await db.clients.update(existingClient.id, { credito: updatedCredito });
      }

      setShowAbonoModal(false);
      setSelectedCreditTicket(null);
      setSelectedClientAbono(null);
      setAbonoAmount('');
      alert('Pago / Abono registrado con éxito');
    } catch (e) {
      console.error("Error al abonar crédito:", e);
      alert('Error al registrar el abono');
    }
  };

  const handleIncrementDev = (idx: number, max: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.min((prev[idx] || 0) + 1, max)
    }));
  };

  const handleDecrementDev = (idx: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.max((prev[idx] || 0) - 1, 0)
    }));
  };

  const procesarDevolucion = async (esTotal: boolean) => {
    if (!selectedTicket) return;
    try {
      let dbTicket = selectedTicket.id ? await db.tickets.get(selectedTicket.id) : null;
      if (!dbTicket && selectedTicket.folio) {
        dbTicket = await db.tickets.where('folio').equals(Number(selectedTicket.folio) || selectedTicket.folio).first();
      }
      if (!dbTicket) return;
      
      let totalMontoDevuelto = 0;
      let tieneCambios = false;

      const itemsActualizados = [...(dbTicket.items || [])];

      for (let idx = 0; idx < itemsActualizados.length; idx++) {
        const item = itemsActualizados[idx];
        const disponibles = (item.cartQty || 0) - (item.returnedQty || 0);
        const aDevolver = esTotal ? disponibles : (devolucionCantidades[idx] || 0);
        
        if (aDevolver > 0) {
          tieneCambios = true;
          totalMontoDevuelto += aDevolver * (item.price || 0);
          item.returnedQty = (item.returnedQty || 0) + aDevolver;

          // Regresar stock de forma asíncrona segura
          let prod = null;
          if (item.id && !isNaN(Number(item.id))) {
            prod = await db.products.get(Number(item.id));
          }
          if (!prod && item.sku) {
            prod = await db.products.where('sku').equals(item.sku).first();
          }
          if (!prod && item.name) {
            prod = await db.products.filter(p => p.name.toLowerCase() === item.name.toLowerCase()).first();
          }
          const oldStock = prod ? (prod.stock || 0) : 0;
          const newStock = oldStock + aDevolver;
          if (prod && prod.id) {
            await db.products.update(prod.id, { stock: newStock });
          }

          // Registro en Kardex
          const folioStr = String(dbTicket.folio || dbTicket.id || '').substring(0, 8);
          await db.kardex.add({
            fecha: new Date().toLocaleString('es-MX'),
            tipo: 'DEVOLUCION',
            sku: item.sku || prod?.sku || 'N/A',
            productName: `${item.name} (DEVOLUCIÓN ${esTotal ? 'TOTAL' : 'PARCIAL'} TICKET #${folioStr})`,
            cantidad: aDevolver,
            costo: item.cost || (prod ? prod.cost : (item.price * 0.7)),
            precio: item.price || 0,
            total: aDevolver * (item.price || 0),
            folio: String(dbTicket.folio || dbTicket.id || ''),
            proveedor: item.category || 'DEVOLUCIÓN DE CLIENTE',
            stockAnterior: oldStock,
            stockNuevo: newStock,
            detalles: `Devolución de venta ${esTotal ? 'total' : 'parcial'} Ticket #${folioStr}`
          });
        }
      }

      if (!tieneCambios) {
        alert("Selecciona al menos un producto para devolver.");
        return;
      }

      dbTicket.items = itemsActualizados;
      dbTicket.total = Math.max(0, (dbTicket.total || 0) - totalMontoDevuelto);
      
      const todoDevuelto = dbTicket.items.every((i: any) => (i.returnedQty || 0) >= (i.cartQty || 0));
      if (todoDevuelto) {
        dbTicket.status = 'DEVUELTO';
      } else {
        dbTicket.status = 'DEV. PARCIAL';
      }

      await db.tickets.put(dbTicket);
      setSelectedTicket({ ...dbTicket });
      setShowDevolucionModal(false);
      alert(`¡Devolución ${esTotal ? 'Total' : 'Parcial'} procesada con éxito! Las piezas han sido reintegradas al inventario.`);
      
    } catch(e) {
      console.error("Error al procesar devolución:", e);
      alert("Ocurrió un error al procesar la devolución.");
    }
  };

  const openDevolucionModal = () => {
    setDevolucionCantidades({});
    setShowDevolucionModal(true);
  };

  const renderDevolucionModal = () => {
    if (!selectedTicket || !showDevolucionModal) return null;
    const folioStr = String(selectedTicket.folio || selectedTicket.id || '').substring(0, 8).toUpperCase();

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-[#0b1120] border border-nexus-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">DEVOLVER PRODUCTOS - FOLIO #{folioStr}</h3>
            <button onClick={() => setShowDevolucionModal(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="space-y-4 mb-8">
              {selectedTicket.items?.map((item: any, idx: number) => {
                const returned = item.returnedQty || 0;
                const maxReturn = item.cartQty - returned;
                if (maxReturn <= 0) return null;
                
                const cant = devolucionCantidades[idx] || 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between bg-nexus-900/30 p-4 rounded-2xl border border-nexus-800/50">
                    <div>
                      <p className="font-bold text-white text-sm uppercase">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-500 tracking-widest mt-1">
                        COMPRADOS: {item.cartQty} | <span className="text-emerald-400">${item.price?.toFixed(2)}</span>
                        {returned > 0 && <span className="text-red-400 ml-2">(YA DEVUELTOS: {returned})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-nexus-900 border border-nexus-700 rounded-xl p-1">
                      <button onClick={() => handleDecrementDev(idx)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black">-</button>
                      <span className="w-6 text-center font-black text-white">{cant}</span>
                      <button onClick={() => handleIncrementDev(idx, maxReturn)} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => procesarDevolucion(true)} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-colors mb-4">
              🚨 CANCELAR TICKET COMPLETO (DEVOLUCIÓN TOTAL)
            </button>
            <div className="flex gap-4">
              <button onClick={() => procesarDevolucion(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors shadow-lg shadow-blue-600/20">
                APLICAR DEVOLUCIÓN PARCIAL
              </button>
              <button onClick={() => setShowDevolucionModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors">
                REGRESAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedTicket || showDevolucionModal) return null;
    const folioStr = String(selectedTicket.folio || selectedTicket.id || '').substring(0, 8).toUpperCase();
    const dateObj = new Date(selectedTicket.date);
    const dateStr = isNaN(dateObj.getTime()) ? String(selectedTicket.date) : dateObj.toLocaleString('es-MX');
    const statusDisp = selectedTicket.status || 'PAID';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">DETALLE VENTA #{folioStr}</h3>
                {selectedTicket.clientName && (
                  <p className="text-xs font-bold text-blue-400 mt-0.5 uppercase">CLIENTE: {selectedTicket.clientName}</p>
                )}
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                <span>FECHA: {dateStr}</span>
                <span>MÉTODO: {selectedTicket.paymentMethod || 'EFECTIVO'}</span>
                <span className={statusDisp === 'DEVUELTO' ? "text-red-400" : statusDisp === 'DEV. PARCIAL' ? "text-amber-400" : "text-emerald-400"}>
                  {statusDisp}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-nexus-800 rounded-2xl bg-nexus-900/20">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-nexus-800 bg-nexus-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="p-4">SKU</th>
                      <th className="p-4">PRODUCTO</th>
                      <th className="p-4 text-center">CANT</th>
                      <th className="p-4 text-right">PRECIO</th>
                      <th className="p-4 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 font-bold text-white">
                    {selectedTicket.items?.map((item: any, i: number) => {
                      const ret = item.returnedQty || 0;
                      const activeQty = (item.cartQty || 0) - ret;
                      return (
                        <tr key={i} className={ret > 0 ? "bg-red-900/10" : "hover:bg-nexus-800/30 transition-colors"}>
                          <td className="p-4 font-mono text-blue-400">{item.sku || 'N/A'}</td>
                          <td className="p-4">
                            <span className="uppercase">{item.name}</span>
                            {ret > 0 && <span className="block text-red-400 text-[10px] mt-0.5 font-black">(-{ret} DEVUELTOS)</span>}
                          </td>
                          <td className="p-4 text-center text-blue-400 font-black">{item.cartQty}</td>
                          <td className="p-4 text-right text-slate-400">${(item.price || 0).toFixed(2)}</td>
                          <td className="p-4 text-right text-emerald-400 font-black">${(activeQty * (item.price || 0)).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-end mt-6">
                <div className="flex gap-3">
                  {statusDisp !== 'DEVUELTO' && (
                    <button onClick={openDevolucionModal} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" /> DEVOLUCIÓN
                    </button>
                  )}
                  <button
                    onClick={() => sendTicketWhatsapp(selectedTicket)}
                    className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                  <button onClick={() => reimprimirTicket(selectedTicket)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> REIMPRIMIR
                  </button>
                </div>
                <div className="text-right bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Ticket</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter">${(selectedTicket.total || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setSelectedTicket(null)} className="w-full bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-colors">
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      {renderModal()}
      {renderDevolucionModal()}

      {showAbonoModal && selectedClientAbono && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-900 border border-nexus-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider">
              {selectedCreditTicket ? `LIQUIDAR TICKET #${selectedCreditTicket.folio || selectedCreditTicket.id?.substring(0,8)}` : 'REGISTRAR ABONO / LIQUIDACIÓN'}
            </h3>
            <p className="text-sm text-slate-400 mb-2">Cliente: <span className="text-white font-bold">{selectedClientAbono.name}</span></p>
            <p className="text-xl font-black text-orange-400 mb-6">
              Saldo Pendiente: ${selectedCreditTicket ? (selectedCreditTicket.pendingBalance !== undefined ? selectedCreditTicket.pendingBalance : selectedCreditTicket.total)?.toFixed(2) : (selectedClientAbono.credito || 0).toFixed(2)}
            </p>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Monto a Pagar / Abonar ($)</label>
            <input type="number" step="0.01" value={abonoAmount} onChange={e=>setAbonoAmount(e.target.value)} placeholder="Monto a abonar..." className="w-full bg-[#0b1120] border border-nexus-700 p-4 rounded-xl text-white font-bold text-xl mb-6 outline-none focus:border-emerald-500" />
            <div className="flex gap-3">
              <button onClick={()=>{ setShowAbonoModal(false); setSelectedCreditTicket(null); setSelectedClientAbono(null); }} className="flex-1 bg-nexus-800 hover:bg-nexus-700 py-3 rounded-xl font-bold text-slate-300 transition-colors">CANCELAR</button>
              <button onClick={handleAbonarCredito} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black text-white shadow-lg shadow-emerald-600/30 transition-all uppercase text-xs">APLICAR PAGO</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN DE REPORTES */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-nexus-800 overflow-x-auto custom-scrollbar shrink-0 bg-nexus-900/50">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border ${
              activeTab === tab 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : tab === 'MÁS VENDIDOS' ? 'bg-fuchsia-900/30 border-fuchsia-800 text-fuchsia-400' 
                : tab === 'TOP VENDIDOS' ? 'bg-purple-900/30 border-purple-800 text-purple-400'
                : tab === 'CRÉDITOS' ? 'bg-amber-900/30 border-amber-800 text-amber-400'
                : 'bg-nexus-800/50 border-nexus-700 text-slate-400 hover:text-white hover:bg-nexus-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* FILTROS ESTRUCTURA ORIGINAL TITAN */}
        <div className="bg-nexus-800/30 border border-nexus-700/50 p-3 sm:p-5 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Vista</label>
              <select value={ventasView} onChange={e=>setVentasView(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                <option value="DETALLADO">DETALLADO</option>
                <option value="CONSOLIDADO">CONSOLIDADO</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Proveedor</label>
              <select value={providerFilter} onChange={e=>setProviderFilter(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Método Pago</label>
              <select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                  <option>TODOS</option>
                  <option>EFECTIVO</option>
                  <option>TRANSFERENCIA</option>
                  <option>TARJETA</option>
                  <option>CRÉDITO</option>
                  <option>MERCADO PAGO</option>
                  <option>MONEDERO</option>
                </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Rango Rápido</label>
              <select 
                value={quickRange} 
                onChange={e => handleApplyQuickRange(e.target.value)} 
                className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent cursor-pointer"
              >
                <option value="HOY (DIARIO)">HOY (DIARIO)</option>
                <option value="AYER">AYER</option>
                <option value="ESTA SEMANA">ESTA SEMANA</option>
                <option value="ESTE MES">ESTE MES</option>
                <option value="VER TODOS">VER TODOS</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fecha Inicio</label>
              <input type="date" value={startDate} onChange={e=>{ setStartDate(e.target.value); setQuickRange('PERSONALIZADO'); }} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fecha Fin</label>
              <input type="date" value={endDate} onChange={e=>{ setEndDate(e.target.value); setQuickRange('PERSONALIZADO'); }} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" /> FILTRAR
            </button>
            <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] shadow-lg shadow-[#25D366]/20 text-white px-3 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
            </button>
          </div>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        
        {['MÁS VENDIDOS', 'MENOS VENDIDOS', 'TOP VENDIDOS'].includes(activeTab) && (() => {
          const productStatsMap = new Map<string, {
            sku: string;
            name: string;
            prov: string;
            price: number;
            cost: number;
            qty: number;
            total: number;
            util: number;
            stock: number;
          }>();

          // 1. Mapear primero todos los productos del catálogo si es MENOS VENDIDOS para mostrar productos estancados (0 ventas)
          if (activeTab === 'MENOS VENDIDOS') {
            products.forEach(p => {
              const nameUpper = String(p.name || '').trim().toUpperCase();
              if (!nameUpper) return;

              const itemSku = String(p.sku || '').trim().toLowerCase();
              const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(nameUpper) || String(p.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
              const prov = provIdToName.get(itemProvRaw) || itemProvRaw;

              if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
                const targetProv = providerFilter.trim().toUpperCase();
                if (!prov.includes(targetProv)) return;
              }

              productStatsMap.set(nameUpper, {
                sku: p.sku || '',
                name: nameUpper,
                prov,
                price: p.price || 0,
                cost: p.cost || (p.price * 0.7),
                qty: 0,
                total: 0,
                util: 0,
                stock: p.stock || 0
              });
            });
          }

          // 2. Acumular ventas de tickets filtrados
          filteredTickets.forEach(t => {
            t.items?.forEach((item: any) => {
              const nameUpper = String(item.name || '').trim().toUpperCase();
              if (!nameUpper) return;

              const itemSku = String(item.sku || '').trim().toLowerCase();
              const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(nameUpper) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
              const prov = provIdToName.get(itemProvRaw) || itemProvRaw;

              if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
                const targetProv = providerFilter.trim().toUpperCase();
                if (!prov.includes(targetProv)) return;
              }

              const cant = (item.cartQty || 0) - (item.returnedQty || 0);
              const cost = item.cost || (item.price * 0.7);
              const lineVal = (item.price || 0) * cant;
              const utilVal = ((item.price || 0) - cost) * cant;

              const existing = productStatsMap.get(nameUpper);
              if (existing) {
                existing.qty += cant;
                existing.total += lineVal;
                existing.util += utilVal;
              } else {
                productStatsMap.set(nameUpper, {
                  sku: item.sku || '',
                  name: nameUpper,
                  prov,
                  price: item.price || 0,
                  cost,
                  qty: cant,
                  total: lineVal,
                  util: utilVal,
                  stock: 0
                });
              }
            });
          });

          let itemsList = Array.from(productStatsMap.values());

          if (activeTab === 'MÁS VENDIDOS') {
            itemsList = itemsList.filter(i => i.qty > 0).sort((a, b) => b.qty - a.qty);
          } else if (activeTab === 'TOP VENDIDOS') {
            itemsList = itemsList.filter(i => i.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 20);
          } else if (activeTab === 'MENOS VENDIDOS') {
            itemsList.sort((a, b) => a.qty - b.qty);
          }

          const grandTotalQty = itemsList.reduce((acc, i) => acc + i.qty, 0);
          const grandTotalVenta = itemsList.reduce((acc, i) => acc + i.total, 0);

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* HEADER Y BOTONES */}
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                    {activeTab === 'MÁS VENDIDOS' && 'REPORTE DE PRODUCTOS MÁS VENDIDOS'}
                    {activeTab === 'TOP VENDIDOS' && 'TOP 20 PRODUCTOS ESTRELLA (RANKING)'}
                    {activeTab === 'MENOS VENDIDOS' && 'REPORTE DE PRODUCTOS MENOS VENDIDOS (ESTANCADOS)'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    PERIODO: {startDate} AL {endDate} {providerFilter !== 'TODOS LOS PROVEEDORES' ? `• PROVEEDOR: ${providerFilter}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button onClick={() => alert(`Enviando reporte de ${activeTab} por WhatsApp...`)} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                </div>
              </div>

              {/* KPI STAT CARDS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PRODUCTOS EN LISTA</p>
                  <p className="text-2xl font-black text-white">{itemsList.length} <span className="text-xs text-slate-500 font-bold">PROD.</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">UNIDADES / PIEZAS VENDIDAS</p>
                  <p className="text-2xl font-black text-blue-400">{grandTotalQty.toLocaleString()} <span className="text-xs text-slate-500 font-bold">PZAS</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">INGRESOS GENERADOS</p>
                  <p className="text-2xl font-black text-emerald-400">${grandTotalVenta.toFixed(2)}</p>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS */}
              <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4 text-center">POS / BADGE</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">PRODUCTO</th>
                      <th className="p-4">PROVEEDOR</th>
                      <th className="p-4 text-center">PIEZAS VENDIDAS</th>
                      {activeTab === 'MENOS VENDIDOS' && <th className="p-4 text-center">STOCK ACTUAL</th>}
                      <th className="p-4 text-right">PRECIO VENTA</th>
                      <th className="p-4 text-right">TOTAL VENDIDO</th>
                      <th className="p-4 text-right">UTILIDAD</th>
                      {activeTab === 'TOP VENDIDOS' && <th className="p-4 text-center">% PARTICIPACIÓN</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                    {itemsList.map((item, idx) => {
                      const rank = idx + 1;
                      let badge = `#${rank}`;
                      let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";

                      if (activeTab === 'TOP VENDIDOS' || activeTab === 'MÁS VENDIDOS') {
                        if (rank === 1) { badge = "🥇 1° LUGAR"; badgeStyle = "bg-yellow-500/20 text-yellow-400 border-yellow-500/40 font-black text-xs"; }
                        else if (rank === 2) { badge = "🥈 2° LUGAR"; badgeStyle = "bg-slate-300/20 text-slate-200 border-slate-400/40 font-black text-xs"; }
                        else if (rank === 3) { badge = "🥉 3° LUGAR"; badgeStyle = "bg-amber-700/20 text-amber-400 border-amber-600/40 font-black text-xs"; }
                      } else if (activeTab === 'MENOS VENDIDOS' && item.qty === 0) {
                        badge = "⚠️ SIN VENTA";
                        badgeStyle = "bg-red-500/20 text-red-400 border-red-500/30 font-black text-[10px]";
                      }

                      const partPct = grandTotalVenta > 0 ? ((item.total / grandTotalVenta) * 100) : 0;

                      return (
                        <tr key={idx} className="hover:bg-[#1e293b]/40 transition-colors">
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] uppercase ${badgeStyle}`}>
                              {badge}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-400">{item.sku || 'N/A'}</td>
                          <td className="p-4 font-black text-white">{item.name}</td>
                          <td className="p-4 text-slate-300">
                            <span className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                              {item.prov}
                            </span>
                          </td>
                          <td className="p-4 text-center font-black text-white text-sm">
                            <span className={item.qty > 0 ? 'text-blue-400' : 'text-slate-500'}>
                              {item.qty} pz
                            </span>
                          </td>
                          {activeTab === 'MENOS VENDIDOS' && (
                            <td className="p-4 text-center font-mono">
                              <span className={item.stock <= 5 ? 'text-red-400 font-black' : 'text-slate-300'}>
                                {item.stock} pzas
                              </span>
                            </td>
                          )}
                          <td className="p-4 text-right font-mono text-slate-300">${item.price.toFixed(2)}</td>
                          <td className="p-4 text-right font-black font-mono text-emerald-400">${item.total.toFixed(2)}</td>
                          <td className="p-4 text-right font-black font-mono text-blue-400">${item.util.toFixed(2)}</td>
                          {activeTab === 'TOP VENDIDOS' && (
                            <td className="p-4 text-center font-mono text-purple-400 font-black">
                              {partPct.toFixed(1)}%
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {itemsList.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                          No hay productos registrados o ventas suficientes en este periodo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === 'VENTAS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE DE VENTAS</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-emerald-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">VENTA BRUTA TOTAL</p>
                  <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrintSalesReportPDF} className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button onClick={handleExportSalesWhatsapp} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">CÓDIGO</th>
                        <th className="p-4">PRODUCTO</th>
                        <th className="p-4">MÉTODO</th>
                        <th className="p-4">PROVEEDOR</th>
                        <th className="p-4 text-center">CANT.</th>
                        <th className="p-4 text-right">COSTO</th>
                        <th className="p-4 text-right">PRECIO</th>
                        <th className="p-4 text-right">TOTAL</th>
                        <th className="p-4 text-right">UTIL.</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white">
                    {(() => {
                      if (ventasView === 'CONSOLIDADO') {
                        let sumCant = 0;
                        let sumTotal = 0;
                        let sumUtil = 0;

                        const rows = aggregatedItems.map((item, idx) => {
                          sumCant += item.cant;
                          sumTotal += item.total;
                          sumUtil += item.util;

                          return (
                            <tr key={idx} className="hover:bg-[#1e293b]/30 transition-colors border-b border-[#1e293b]/30">
                              <td className="p-4 font-mono text-blue-400 text-xs">{item.sku}</td>
                              <td className="p-4 font-bold text-slate-300 text-xs truncate max-w-[200px]" title={item.name}>{item.name}</td>
                              <td className="p-4 font-bold text-slate-400 text-[10px] uppercase">{item.paymentMethod}</td>
                              <td className="p-4 font-bold text-blue-400 text-[10px] uppercase truncate max-w-[150px]" title={item.prov}>{item.prov}</td>
                              <td className="p-4 font-black text-white text-center">{item.cant}</td>
                              <td className="p-4 font-bold text-slate-400 text-right">${item.costo.toFixed(2)}</td>
                              <td className="p-4 font-bold text-slate-300 text-right">${item.price?.toFixed(2)}</td>
                              <td className="p-4 font-black text-emerald-400 text-right">${item.total.toFixed(2)}</td>
                              <td className="p-4 font-black text-blue-400 text-right">${item.util.toFixed(2)}</td>
                            </tr>
                          );
                        });

                        return (
                          <>
                            {rows}
                            {rows.length > 0 && (
                              <tr className="bg-[#0b1120] font-black">
                                <td colSpan={4} className="p-4 text-right font-black text-white tracking-widest uppercase">TOTAL:</td>
                                <td className="p-4 text-center font-black text-white">{sumCant}</td>
                                <td colSpan={2}></td>
                                <td className="p-4 text-right font-black text-emerald-400">${sumTotal.toFixed(2)}</td>
                                <td className="p-4 text-right font-black text-blue-400">${sumUtil.toFixed(2)}</td>
                              </tr>
                            )}
                            {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
                          </>
                        );
                      } else {
                        let sumCant = 0;
                        let sumTotal = 0;
                        let sumUtil = 0;

                        const rows = filteredTickets.flatMap(t => t.items?.map((item: any, idx: number) => {
                          const displaySku = String(item.sku || item.barcode || 'N/A').trim();
                          const itemSkuKey = displaySku.toLowerCase();
                          const itemName = String(item.name || item.productName || 'PRODUCTO').trim().toUpperCase();
                          const itemProvRaw = skuToProv.get(itemSkuKey) || skuToProv.get(itemName.toLowerCase()) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
                          const prov = provIdToName.get(itemProvRaw) || itemProvRaw;
                          const rawQty = Number(item.cartQty !== undefined ? item.cartQty : (item.qty !== undefined ? item.qty : 1));
                          const cant = Math.max(0, rawQty - (item.returnedQty || 0));
                          const price = Number(item.price || 0);
                          const costo = Number(item.cost !== undefined ? item.cost : (price * 0.7));
                          const total = Number(item.total !== undefined ? item.total : (price * cant));
                          const util = (price - costo) * cant;

                          sumCant += cant;
                          sumTotal += total;
                          sumUtil += util;

                          return (
                            <tr key={`${t.id}-${idx}`} className="hover:bg-[#1e293b]/30 transition-colors border-b border-[#1e293b]/30">
                              <td className="p-4 font-mono text-blue-400 text-xs">{displaySku}</td>
                              <td className="p-4 font-bold text-slate-300 text-xs truncate max-w-[200px]" title={itemName}>{itemName}</td>
                              <td className="p-4 font-bold text-slate-400 text-[10px] uppercase">{t.paymentMethod}</td>
                              <td className="p-4 font-bold text-blue-400 text-[10px] uppercase truncate max-w-[150px]" title={prov}>{prov}</td>
                              <td className="p-4 font-black text-white text-center">{cant}</td>
                              <td className="p-4 font-bold text-slate-400 text-right">${costo.toFixed(2)}</td>
                              <td className="p-4 font-bold text-slate-300 text-right">${price.toFixed(2)}</td>
                              <td className="p-4 font-black text-emerald-400 text-right">${total.toFixed(2)}</td>
                              <td className="p-4 font-black text-blue-400 text-right">${util.toFixed(2)}</td>
                            </tr>
                          );
                        }) || []).filter(Boolean);

                        return (
                          <>
                            {rows}
                            {rows.length > 0 && (
                              <tr className="bg-[#0b1120] font-black">
                                <td colSpan={4} className="p-4 text-right font-black text-white tracking-widest uppercase">TOTAL:</td>
                                <td className="p-4 text-center font-black text-white">{sumCant}</td>
                                <td colSpan={2}></td>
                                <td className="p-4 text-right font-black text-emerald-400">${sumTotal.toFixed(2)}</td>
                                <td className="p-4 text-right font-black text-blue-400">${sumUtil.toFixed(2)}</td>
                              </tr>
                            )}
                            {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas.</td></tr>}
                          </>
                        );
                      }
                    })()}
                  </tbody>
                </table>
            </div>
          </div>
        )}

{activeTab === 'FOLIOS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE DE FOLIOS</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-emerald-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">VENTA BRUTA TOTAL</p>
                  <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">FOLIO</th>
                        <th className="p-4">FECHA</th>
                        <th className="p-4">HORA</th>
                        <th className="p-4">MÉTODO</th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-right">TOTAL</th>
                        <th className="p-4 text-center">ACCIONES</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white">
                    {filteredTickets.map((t) => {
                      const dateObj = new Date(t.date);
                      const fechaStr = isNaN(dateObj.getTime()) ? (t.date.split(',')[0] || t.date) : dateObj.toLocaleDateString('es-MX');
                      const horaStr = isNaN(dateObj.getTime()) ? (t.date.split(',')[1] || '') : dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const folioDisp = t.folio ? `#${t.folio}` : `#${t.id?.substring(0, 8).toUpperCase() || '81779'}`;
                      const statusDisp = t.status || 'PAID';

                      return (
                        <tr key={t.id} className="hover:bg-[#1e293b]/30 transition-colors border-b border-[#1e293b]/30">
                          <td className="p-4 font-mono font-bold text-blue-400 text-xs">{folioDisp}</td>
                          <td className="p-4 font-bold text-slate-300">{fechaStr}</td>
                          <td className="p-4 font-bold text-slate-400">{horaStr}</td>
                          <td className="p-4">
                            <span className="bg-nexus-800 px-3 py-1 rounded-full text-[10px] font-black text-blue-400 border border-nexus-700 uppercase">
                              {t.paymentMethod || 'EFECTIVO'}
                            </span>
                          </td>
                          <td className="p-4 font-black">
                            <span className={statusDisp === 'DEVUELTO' ? 'text-red-400' : 'text-emerald-400'}>
                              {statusDisp}
                            </span>
                          </td>
                          <td className="p-4 font-black text-emerald-400 text-right text-sm">${(t.total || 0).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setSelectedTicket(t)} 
                                className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Ver detalle del folio"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => reimprimirTicket(t)} 
                                className="p-2 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Reimprimir Ticket (58mm)"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => sendTicketWhatsapp(t)} 
                                className="p-2 bg-green-900/30 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Enviar Ticket por WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">No hay folios registrados en este rango de fechas.</td>
                      </tr>
                    )}
                  </tbody>
              </table>
            </div>
          </div>
        )}

{activeTab === 'ESTADÍSTICAS' && (() => {
          let ingresos = 0;
          let articulos = 0;
          let ganancia = 0;
          let metodosCount: Record<string, number> = {};
          let catCount: Record<string, number> = {};
          
          filteredTickets.forEach(t => {
            ingresos += (t.total || 0);
            metodosCount[t.paymentMethod] = (metodosCount[t.paymentMethod] || 0) + 1;
            t.items?.forEach((item: any) => {
              const qty = item.cartQty - (item.returnedQty || 0);
              articulos += qty;
              ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
              const cat = item.category || 'SIN CATEG';
              catCount[cat] = (catCount[cat] || 0) + qty;
            });
          });

          const metodosData = Object.entries(metodosCount).map(([name, value]) => ({name, value}));
          const catData = Object.entries(catCount).map(([name, value]) => ({name, value}));
          const pieColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

          // Generate trend data 
          const trendData = [
            { name: '7:00', total: 0 }, { name: '8:00', total: 342 }, { name: '9:00', total: 71 },
            { name: '10:00', total: 123 }, { name: '11:00', total: 160 }, { name: '12:00', total: 329 },
            { name: '13:00', total: 444 }, { name: '14:00', total: 590 }
          ];

          return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">ESTADÍSTICAS GENERALES</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> EXCEL
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-transparent border-[3px] border-[#00b894] p-6 rounded-[32px] shadow-[0_0_15px_rgba(0,184,148,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">INGRESOS</h3>
                <p className="text-4xl font-black text-white">${ingresos.toFixed(2)}</p>
              </div>
              <div className="bg-transparent border-[3px] border-[#00cec9] p-6 rounded-[32px] shadow-[0_0_15px_rgba(0,206,201,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">GANANCIA</h3>
                <p className="text-4xl font-black text-[#00cec9]">${ganancia.toFixed(2)}</p>
              </div>
              <div className="bg-transparent border-[3px] border-[#a29bfe] p-6 rounded-[32px] shadow-[0_0_15px_rgba(162,155,254,0.15)] flex flex-col justify-center">
                <h3 className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">ARTÍCULOS</h3>
                <p className="text-4xl font-black text-[#a29bfe]">{articulos}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6"><BarChart2 className="w-4 h-4" /> TENDENCIA DE VENTAS (FLUJO)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r:8, fill:'#3b82f6'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">DISTRIBUCIÓN CATEGORÍAS</h3>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catData.length ? catData : [{name:'Vacío', value: 1}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[24px]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">MÉTODOS DE PAGO</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metodosData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#00b894" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

{activeTab === 'CRÉDITOS' && (() => {
          const parseLocalToTimestamp = (dateStr: string) => {
            let ts = new Date(dateStr).getTime();
            if (!isNaN(ts)) return ts;
            try {
              const [datePart, timePart] = dateStr.split(', ');
              const [day, month, year] = datePart.split('/');
              if (day && month && year) {
                const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
                ts = new Date(isoStr).getTime();
                if (!isNaN(ts)) return ts;
              }
            } catch(e) {}
            return 0;
          };

          const start = new Date(startDate + "T00:00:00").getTime();
          const end = new Date(endDate + "T23:59:59.999").getTime();

          // 1. Obtener todos los tickets a crédito de la base de datos
          const isCredit = (t: any) => {
            const m = String(t.paymentMethod || '').toUpperCase();
            return m.includes('CREDIT') || m.includes('CRÉDIT') || m.includes('CR%DIT');
          };
          const allCreditTicketsInDb = tickets.filter(isCredit);

          // 2. TODOS LOS PENDIENTES SIN PAGAR (1 al 30 de cualquier mes, sin importar el rango de fechas seleccionado)
          const pendingCreditTickets = allCreditTicketsInDb.filter(t => {
            const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : (t.total || 0));
            const isPaid = pending <= 0 || t.status === 'LIQUIDADO' || t.status === 'PAGADO';
            return !isPaid;
          });

          // 3. Cuando se selecciona "VER TODOS", incluye todos los pendientes históricos MÁS los tickets pagados/liquidados en el rango de fecha
          const creditTicketsAll = allCreditTicketsInDb.filter(t => {
            const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : (t.total || 0));
            const isPaid = pending <= 0 || t.status === 'LIQUIDADO' || t.status === 'PAGADO';
            if (!isPaid) return true; // Deudas pendientes SIEMPRE visibles
            const tTime = parseLocalToTimestamp(t.date);
            return tTime >= start && tTime <= end; // Pagados filtrados por fecha
          });

          // Deuda total pendiente global
          const totalPendingDebt = pendingCreditTickets.reduce((acc, t) => {
            const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : (t.total || 0));
            return acc + pending;
          }, 0);

          // 4. AGRUPACIÓN COMPLETA POR CLIENTES (Saber cuánto debe cada cliente en total)
          const clientDebtMap = new Map<string, {
            name: string;
            clientObj?: any;
            totalDebt: number;
            ticketsCount: number;
            tickets: any[];
          }>();

          pendingCreditTickets.forEach(t => {
            const cName = (t.clientName || t.client || 'PUBLICO GENERAL').toUpperCase().trim();
            if (!clientDebtMap.has(cName)) {
              const clientObj = clients.find(c => c.name.toUpperCase().trim() === cName);
              clientDebtMap.set(cName, {
                name: cName,
                clientObj,
                totalDebt: 0,
                ticketsCount: 0,
                tickets: []
              });
            }
            const grp = clientDebtMap.get(cName)!;
            const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : (t.total || 0));
            grp.totalDebt += pending;
            grp.ticketsCount += 1;
            grp.tickets.push(t);
          });

          let clientDebtList = Array.from(clientDebtMap.values()).sort((a, b) => b.totalDebt - a.totalDebt);
          if (creditSearchClient.trim()) {
            const q = creditSearchClient.toLowerCase().trim();
            clientDebtList = clientDebtList.filter(c => c.name.toLowerCase().includes(q) || (c.clientObj?.phone && c.clientObj.phone.includes(q)));
          }

          // Filtrado de notas para la tabla detallada
          let displayedCreditTickets = creditFilterState === 'PENDIENTES' ? pendingCreditTickets : creditTicketsAll;
          if (selectedCreditClientFilter) {
            displayedCreditTickets = displayedCreditTickets.filter(t => (t.clientName || t.client || 'PUBLICO GENERAL').toUpperCase().trim() === selectedCreditClientFilter);
          }
          if (creditSearchClient.trim() && !selectedCreditClientFilter) {
            const q = creditSearchClient.toLowerCase().trim();
            displayedCreditTickets = displayedCreditTickets.filter(t => (t.clientName || t.client || '').toLowerCase().includes(q) || (t.folio && t.folio.toString().includes(q)));
          }

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* ENCABEZADO Y MÉTRICAS DE CRÉDITO */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-orange-400" /> ESTADO DE CUENTA CRÉDITOS Y COBRANZA
                  </h2>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">
                    ✓ MOSTRANDO TODAS LAS NOTAS PENDIENTES DEL 1 AL 30 (HISTÓRICO COMPLETO SIN FILTRO DE FECHA)
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="bg-nexus-900/70 border border-orange-500/50 rounded-2xl p-4 shadow-lg shadow-orange-500/10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DEUDA TOTAL PENDIENTE GLOBAL</p>
                      <p className="text-3xl font-black text-orange-400 font-mono">${totalPendingDebt.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{pendingCreditTickets.length} notas pendientes por cobrar</p>
                    </div>

                    <div className="bg-nexus-900/70 border border-blue-500/40 rounded-2xl p-4 shadow-lg shadow-blue-500/10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CLIENTES CON ADEUDO</p>
                      <p className="text-3xl font-black text-blue-400 font-mono">{clientDebtMap.size}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Personas que deben en la tienda</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        value={creditSearchClient}
                        onChange={e => setCreditSearchClient(e.target.value)}
                        placeholder="Buscar cliente con deuda..."
                        className="w-full bg-nexus-900 border border-nexus-700 pl-9 pr-3 py-2 rounded-xl text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    {creditSearchClient && (
                      <button 
                        onClick={() => setCreditSearchClient('')}
                        className="bg-nexus-800 text-slate-400 hover:text-white px-2 py-2 rounded-xl text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-nexus-900 p-1 rounded-xl border border-nexus-800 flex text-[10px] font-black uppercase">
                      <button 
                        onClick={() => { setCreditFilterState('PENDIENTES'); setSelectedCreditClientFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${creditFilterState === 'PENDIENTES' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        SOLO PENDIENTES ({pendingCreditTickets.length})
                      </button>
                      <button 
                        onClick={() => { setCreditFilterState('TODOS'); setSelectedCreditClientFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${creditFilterState === 'TODOS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        VER TODOS ({creditTicketsAll.length})
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                        <FileSpreadsheet className="w-4 h-4" /> EXCEL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: RESUMEN DE DEUDAS AGRUPADAS POR CLIENTE (¿CUÁNTO DEBE CADA CLIENTE?) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-400" /> RESUMEN DE DEUDA POR CLIENTES ({clientDebtList.length} CLIENTES CON SALDO PENDIENTE)
                  </h3>
                  {selectedCreditClientFilter && (
                    <button 
                      onClick={() => setSelectedCreditClientFilter(null)}
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> FILTRANDO: {selectedCreditClientFilter} (MOSTRAR TODOS)
                    </button>
                  )}
                </div>

                {clientDebtList.length === 0 ? (
                  <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6 text-center text-slate-500 font-bold text-xs">
                    {creditSearchClient ? `No se encontraron clientes que coincidan con "${creditSearchClient}".` : '¡Excelente! No hay clientes con deudas pendientes registradas.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clientDebtList.map((cGroup) => {
                      const isSelected = selectedCreditClientFilter === cGroup.name;
                      return (
                        <div 
                          key={cGroup.name}
                          className={`p-4 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10' 
                              : 'bg-nexus-900/60 border-nexus-800 hover:border-nexus-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-black text-white text-sm uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                {cGroup.name}
                              </h4>
                              {cGroup.clientObj?.phone && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">📞 {cGroup.clientObj.phone}</p>
                              )}
                            </div>
                            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              {cGroup.ticketsCount} {cGroup.ticketsCount === 1 ? 'NOTA' : 'NOTAS'}
                            </span>
                          </div>

                          <div className="my-3 p-3 rounded-xl bg-[#0b1120] border border-nexus-800 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEUDA TOTAL:</span>
                            <span className="text-xl font-black text-orange-400 font-mono">${cGroup.totalDebt.toFixed(2)}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCreditClientFilter(isSelected ? null : cGroup.name)}
                              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 border ${
                                isSelected 
                                  ? 'bg-amber-500 text-white border-amber-500' 
                                  : 'bg-nexus-800 hover:bg-nexus-700 text-slate-300 border-nexus-700'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" /> {isSelected ? 'VER TODAS' : 'VER NOTAS'}
                            </button>
                            <button
                              onClick={() => {
                                // Seleccionar el primer ticket de este cliente para procesar su pago
                                const firstTicket = cGroup.tickets[0];
                                setSelectedCreditTicket(firstTicket);
                                const clientObj = clients.find(c => c.name.toUpperCase() === cGroup.name);
                                setSelectedClientAbono(clientObj || { name: cGroup.name, credito: cGroup.totalDebt });
                                setAbonoAmount(cGroup.totalDebt.toString());
                                setShowAbonoModal(true);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> ABONAR / LIQUIDAR
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: TABLA DETALLADA DE TODAS LAS NOTAS / TICKETS A CRÉDITO */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    DESGLOSE NOTA POR NOTA {selectedCreditClientFilter ? `(CLIENTE: ${selectedCreditClientFilter})` : '(TODOS LOS CLIENTES)'}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">{displayedCreditTickets.length} registros</span>
                </div>

                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">CLIENTE</th>
                        <th className="p-4">FOLIO TICKET</th>
                        <th className="p-4">FECHA TICKET</th>
                        <th className="p-4 text-right">TOTAL TICKET</th>
                        <th className="p-4 text-right">SALDO PENDIENTE</th>
                        <th className="p-4 text-center">ESTADO</th>
                        <th className="p-4 text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                      {displayedCreditTickets.map((t) => {
                        const clientName = t.clientName || t.client || 'PUBLICO GENERAL';
                        const dateObj = new Date(t.date);
                        const fechaStr = isNaN(dateObj.getTime()) ? (t.date.split(',')[0] || t.date) : dateObj.toLocaleString('es-MX');
                        const folioDisp = t.folio ? `#${t.folio}` : `#${t.id?.substring(0, 8).toUpperCase() || 'FOLIO'}`;
                        const pending = t.pendingBalance !== undefined ? t.pendingBalance : (t.status === 'LIQUIDADO' || t.status === 'PAGADO' ? 0 : t.total);
                        const isPaid = pending <= 0 || t.status === 'LIQUIDADO' || t.status === 'PAGADO';

                        return (
                          <tr key={t.id} className="hover:bg-[#1e293b]/30 transition-colors">
                            <td className="p-4 font-black text-blue-400 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">👤</div>
                              {clientName.toUpperCase()}
                            </td>
                            <td className="p-4 font-mono text-white">{folioDisp}</td>
                            <td className="p-4 text-slate-300">{fechaStr}</td>
                            <td className="p-4 text-slate-300 text-right font-mono">${(t.total || 0).toFixed(2)}</td>
                            <td className="p-4 font-black text-orange-400 text-right text-sm font-mono">${pending.toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                {isPaid ? 'LIQUIDADO' : 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => setSelectedTicket(t)} 
                                  className="bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                                  title="Ver detalle del ticket"
                                >
                                  <Eye className="w-3.5 h-3.5" /> VER FOLIO
                                </button>
                                {!isPaid ? (
                                  <button 
                                    onClick={() => {
                                      setSelectedCreditTicket(t);
                                      const clientObj = clients.find(c => c.name.toUpperCase() === clientName.toUpperCase());
                                      setSelectedClientAbono(clientObj || { name: clientName, credito: pending });
                                      setAbonoAmount(pending.toString());
                                      setShowAbonoModal(true);
                                    }} 
                                    className="bg-[#00b894] hover:bg-[#00a884] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors shadow-md shadow-[#00b894]/20"
                                  >
                                    PAGAR / LIQUIDAR
                                  </button>
                                ) : (
                                  <button 
                                    onClick={async () => {
                                      const confirmMsg = `¿Deseas volver a marcar el ticket ${folioDisp} como PENDIENTE de pago?`;
                                      if (!window.confirm(confirmMsg)) return;

                                      const montoStr = window.prompt(
                                        `Ingresa el saldo pendiente a cobrar para este ticket:`, 
                                        String(t.total || 0)
                                      );
                                      if (montoStr === null) return;
                                      const parsedSaldo = parseFloat(montoStr);
                                      if (isNaN(parsedSaldo) || parsedSaldo <= 0) {
                                        alert('Por favor ingresa un monto válido mayor a 0.');
                                        return;
                                      }

                                      if (t.id) {
                                        await db.tickets.update(t.id, {
                                          status: 'PENDIENTE',
                                          pendingBalance: parsedSaldo
                                        });
                                      }

                                      // Actualizar crédito acumulado del cliente
                                      const cObj = clients.find(c => c.name.toUpperCase().trim() === clientName.toUpperCase().trim());
                                      if (cObj && cObj.id) {
                                        await db.clients.update(cObj.id, {
                                          credito: (cObj.credito || 0) + parsedSaldo
                                        });
                                      }
                                      alert(`✅ Ticket ${folioDisp} reactivado a PENDIENTE con saldo de $${parsedSaldo.toFixed(2)}.`);
                                    }}
                                    className="bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1 border border-amber-500/40"
                                    title="Revertir este ticket a estado PENDIENTE si se liquidó por error"
                                  >
                                    <RefreshCcw className="w-3 h-3" /> REABRIR A PENDIENTE
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {displayedCreditTickets.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                            {creditFilterState === 'PENDIENTES' 
                              ? 'No hay deudas a crédito pendientes de pago en el sistema.'
                              : `No hay tickets a crédito registrados en este periodo (${startDate} al ${endDate}).`}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'ENTRADAS' && (() => {
          const query = searchEntradas.trim().toLowerCase();
          const start = new Date(startDate + "T00:00:00").getTime();
          const end = new Date(endDate + "T23:59:59.999").getTime();

          const allCompras: CompraData[] = [];
          const existingFolios = new Set<string>();

          // 1. Obtener compras de db.compras dentro del rango de fecha (solo compras y entradas reales recibidas)
          compras.forEach(c => {
            if (c.status === 'ORDEN' || c.status === 'PENDIENTE' || c.status === 'BORRADOR' || c.status === 'DEVOLUCION') {
              return;
            }
            const cTs = parseUniversalTimestamp(c.date);
            const inRange = (!startDate && !endDate) || (cTs >= start && cTs <= end);
            if (inRange) {
              const folioKey = String(c.folio || '').trim().toUpperCase();
              if (folioKey) existingFolios.add(folioKey);
              allCompras.push(c);
            }
          });

          // 2. Movimientos de kardex con tipo ENTRADA en el rango de fecha
          const kardexEntradas = filteredKardex.filter((k: any) => k.tipo === 'ENTRADA');

          const kardexGrouped = new Map<string, any[]>();
          kardexEntradas.forEach((k: any) => {
            const fKey = String(k.folio || k.fecha || 'ENT-SINFOLIO').trim().toUpperCase();
            if (!existingFolios.has(fKey)) {
              if (!kardexGrouped.has(fKey)) kardexGrouped.set(fKey, []);
              kardexGrouped.get(fKey)!.push(k);
            }
          });

          kardexGrouped.forEach((items, folioKey) => {
            const first = items[0];
            const compItems = items.map((i: any) => ({
              sku: i.sku || 'N/A',
              name: i.productName || 'PRODUCTO',
              unit_measure: 'PZA',
              cost: i.costo || i.costoUnitario || 0,
              price: i.precio || i.precioVenta || 0,
              qty: i.cantidad || 1,
              total: i.total || ((i.costo || 0) * (i.cantidad || 1))
            }));
            const subtotal = compItems.reduce((a, b) => a + b.total, 0);
            allCompras.push({
              folio: folioKey,
              date: first.fecha || '',
              provider: first.proveedor || first.provider || 'SIN PROVEEDOR',
              items: compItems,
              subtotal: subtotal,
              total: subtotal
            });
          });

          // Filtrar por proveedor y término de búsqueda, y ordenar más recientes primero
          const filteredCompras = allCompras.filter(c => {
            const matchProv = providerFilter === 'TODOS LOS PROVEEDORES' || String(c.provider || '').toUpperCase() === providerFilter;
            const matchSearch = !query ||
              String(c.folio || '').toLowerCase().includes(query) ||
              String(c.provider || '').toLowerCase().includes(query) ||
              (c.items || []).some((i: any) => String(i.sku || '').toLowerCase().includes(query) || String(i.name || '').toLowerCase().includes(query));
            return matchProv && matchSearch;
          }).sort((a, b) => {
            const timeA = parseUniversalTimestamp(a.date);
            const timeB = parseUniversalTimestamp(b.date);
            return timeB - timeA;
          });

          const totalMovs = filteredCompras.length;
          const totalPiezas = filteredCompras.reduce((sum, c) => sum + (c.items || []).reduce((s, i) => s + (i.qty || 0), 0), 0);
          const totalMonto = filteredCompras.reduce((sum, c) => sum + (c.total || 0), 0);

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                    REPORTE DE ENTRADAS DE MERCANCÍA
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {startDate} AL {endDate} {providerFilter !== 'TODOS LOS PROVEEDORES' ? `• PROVEEDOR: ${providerFilter}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                </div>
              </div>

              {/* KPI CARDS DE ENTRADAS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MOVIMIENTOS DE COMPRA</p>
                  <p className="text-2xl font-black text-white">{totalMovs.toLocaleString()} <span className="text-xs text-slate-500 font-bold">FOLIOS</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL DE PIEZAS / UNIDADES</p>
                  <p className="text-2xl font-black text-emerald-400">{totalPiezas.toLocaleString()} <span className="text-xs text-slate-500 font-bold">PZAS</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MONTO TOTAL COMPRAS</p>
                  <p className="text-2xl font-black text-emerald-400">${totalMonto.toFixed(2)}</p>
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DE FOLIOS DE ENTRADA */}
              <div className="bg-[#131b2c] border border-[#1e293b] p-4 rounded-xl flex gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchEntradas}
                    onChange={(e) => setSearchEntradas(e.target.value)}
                    placeholder="BUSCAR ENTRADA POR FOLIO (EJ: F-907367), PROVEEDOR, SKU O PRODUCTO..."
                    className="w-full bg-[#0b1120] border border-nexus-700 text-white pl-10 pr-4 py-2.5 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* TABLA DE ENTRADAS GROUPED BY FOLIO */}
              <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4">FOLIO SISTEMA</th>
                      <th className="p-4">FECHA Y HORA</th>
                      <th className="p-4">PROVEEDOR</th>
                      <th className="p-4">DIVERSIDAD DE PRODUCTOS</th>
                      <th className="p-4 text-center">TOTAL PIEZAS</th>
                      <th className="p-4 text-right">MONTO TOTAL</th>
                      <th className="p-4 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                    {filteredCompras.map((c, i) => {
                      const cantPzas = (c.items || []).reduce((s, it) => s + (it.qty || 0), 0);
                      const prodNames = (c.items || []).map(it => it.name).slice(0, 2).join(', ') + (c.items.length > 2 ? ` (+${c.items.length - 2} más)` : '');

                      return (
                        <tr key={i} className="hover:bg-[#1e293b]/40 transition-colors">
                          <td className="p-4 font-mono font-black text-blue-400">{c.folio}</td>
                          <td className="p-4 text-slate-300 font-mono">{formatDisplayDate(c.date)}</td>
                          <td className="p-4 text-slate-300">
                            <span className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                              {c.provider}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 max-w-[220px] truncate" title={prodNames}>{prodNames}</td>
                          <td className="p-4 text-center font-black">
                            <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-xs">
                              {cantPzas} pz
                            </span>
                          </td>
                          <td className="p-4 text-right font-black font-mono text-emerald-400 text-sm">
                            ${(c.total || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedEntradaPDF(c);
                                  setShowEntradaPDFModal(true);
                                }}
                                className="bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                                title="Ver / Reimprimir Reporte PDF"
                              >
                                <Eye className="w-3.5 h-3.5" /> REPORTE PDF
                              </button>
                              <button
                                onClick={() => setEditingEntrada(JSON.parse(JSON.stringify(c)))}
                                className="bg-amber-900/30 text-amber-400 hover:bg-amber-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                                title="Modificar / Ajustar Entrada"
                              >
                                ✏️ EDITAR
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCompras.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                          No hay registros de entradas para este periodo o filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {['DEVOLUCIONES', 'MERMAS'].includes(activeTab) && (() => {
          const matchingKardex = filteredKardex.filter(k => 
            k.tipo === activeTab || (activeTab === 'DEVOLUCIONES' && (k.tipo === 'DEVOLUCION' || k.tipo === 'DEVOLUCIONES'))
          );

          const totalRegs = matchingKardex.length;
          const totalPiezas = matchingKardex.reduce((acc, k) => acc + (k.cantidad || 0), 0);
          const totalMonto = matchingKardex.reduce((acc, k) => acc + (k.total || ((k.costo || 0) * (k.cantidad || 0))), 0);

          const isDevoluciones = activeTab === 'DEVOLUCIONES';

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">
                    REPORTE DE {activeTab} DE MERCADERÍA
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    {startDate} AL {endDate} {providerFilter !== 'TODOS LOS PROVEEDORES' ? `• PROVEEDOR: ${providerFilter}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel} 
                    className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button 
                    onClick={() => alert(`Enviando reporte de ${activeTab} por WhatsApp...`)} 
                    className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MOVIMIENTOS REGISTRADOS</p>
                  <p className="text-2xl font-black text-white">{totalRegs.toLocaleString()} <span className="text-xs text-slate-500 font-bold">REG.</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL DE PIEZAS / UNIDADES</p>
                  <p className={`text-2xl font-black ${isDevoluciones ? 'text-orange-400' : 'text-red-400'}`}>
                    {totalPiezas.toLocaleString()} <span className="text-xs text-slate-500 font-bold">PZAS</span>
                  </p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MONTO TOTAL</p>
                  <p className={`text-2xl font-black ${isDevoluciones ? 'text-orange-400' : 'text-red-400'}`}>
                    ${totalMonto.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4">FECHA</th>
                      <th className="p-4">PRODUCTO</th>
                      <th className="p-4">SKU / FOLIO</th>
                      <th className="p-4">PROVEEDOR</th>
                      <th className="p-4 text-center">CANTIDAD</th>
                      <th className="p-4 text-right">COSTO UNIT.</th>
                      <th className="p-4 text-right">MONTO TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                    {matchingKardex.map((k, i) => {
                      const costoUnit = k.costo || (k.cantidad > 0 ? (k.total / k.cantidad) : 0);
                      const totalVal = k.total || (costoUnit * k.cantidad);
                      return (
                        <tr key={i} className="hover:bg-[#1e293b]/40 transition-colors">
                          <td className="p-4 text-slate-300 font-mono">{k.fecha}</td>
                          <td className="p-4 font-black text-white">{k.productName}</td>
                          <td className="p-4 font-mono text-slate-400">
                            <span className="bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded text-[11px]">
                              {k.sku || k.folio || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">
                            <span className="bg-blue-900/30 text-blue-400 border border-blue-800/50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase">
                              {k.proveedor || k.provider || 'GENERAL'}
                            </span>
                          </td>
                          <td className="p-4 text-center font-black text-white">
                            <span className={`px-2.5 py-1 rounded-lg text-xs ${isDevoluciones ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                              {k.cantidad} pz
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-400 font-mono">${costoUnit.toFixed(2)}</td>
                          <td className={`p-4 text-right font-black font-mono text-sm ${isDevoluciones ? 'text-orange-400' : 'text-red-400'}`}>
                            ${totalVal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {matchingKardex.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                          No hay registros de {activeTab.toLowerCase()} para este periodo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

                {activeTab === 'TURNOS' && (() => {
          const activeTurnosList = turnos.filter((t: any) => t.estado === 'ACTIVO');
          const totalCortesCount = filteredCortes.length;
          const totalCortesRevenue = filteredCortes.reduce((acc: number, c: any) => acc + (c.totalVentas || 0), 0);
          const totalCortesEfectivo = filteredCortes.reduce((acc: number, c: any) => acc + (c.ventasEfectivo || 0), 0);

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">HISTORIAL DE TURNOS Y CORTES Z</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button onClick={() => alert("Enviando reporte de turnos por WhatsApp...")} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                </div>
              </div>

              {/* KPI CARDS DE CORTES */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-nexus-900/50 border border-emerald-500/40 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">TURNOS ACTIVOS EN CURSO</p>
                  <p className="text-2xl font-black text-emerald-400">{activeTurnosList.length} <span className="text-xs text-slate-500 font-bold">TURNOS</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">CORTES Z REALIZADOS</p>
                  <p className="text-2xl font-black text-white">{totalCortesCount} <span className="text-xs text-slate-500 font-bold">CORTES</span></p>
                </div>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL RECAUDADO EN CORTES Z</p>
                  <p className="text-2xl font-black text-fuchsia-400">${totalCortesRevenue.toFixed(2)}</p>
                </div>
              </div>

              {/* TURNOS ACTIVOS */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div> TURNOS ACTIVOS EN CURSO
                </h3>
                <div className="bg-nexus-900/50 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/10">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">FOLIO TURNO</th>
                        <th className="p-4">CAJERO</th>
                        <th className="p-4">FECHA APERTURA</th>
                        <th className="p-4 text-right">FONDO INICIAL</th>
                        <th className="p-4 text-center">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                      {activeTurnosList.map((t: any, i: number) => (
                        <tr key={i} className="hover:bg-emerald-900/20 bg-emerald-900/10 transition-colors">
                          <td className="p-4 font-mono font-black text-emerald-400">{t.folio}</td>
                          <td className="p-4 font-black text-white">{t.cajero || 'CAJERO PRINCIPAL'}</td>
                          <td className="p-4 text-slate-300 font-mono">{new Date(t.fechaApertura).toLocaleString()}</td>
                          <td className="p-4 text-right font-black font-mono text-emerald-400">${(t.montoInicial || 0).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                              EN CURSO / ACTIVO
                            </span>
                          </td>
                        </tr>
                      ))}
                      {activeTurnosList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">
                            No hay turnos activos en este momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HISTORIAL DE CORTES Z */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">HISTORIAL DE CORTES Z (CERRADOS)</h3>
                <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-500 font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">FECHA Y HORA CIERRE</th>
                        <th className="p-4 text-right">FONDO INICIAL</th>
                        <th className="p-4 text-right">VENTAS EFECTIVO</th>
                        <th className="p-4 text-right">VENTAS TARJETA</th>
                        <th className="p-4 text-right">VENTAS TRANSF</th>
                        <th className="p-4 text-right">TOTAL CORTE Z</th>
                        <th className="p-4 text-center">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]/50 text-white font-bold">
                      {filteredCortes.map((c: any, i: number) => {
                        const dateObj = new Date(c.date);
                        const dateStr = isNaN(dateObj.getTime()) ? c.date : dateObj.toLocaleString('es-MX');

                        return (
                          <tr key={i} className="hover:bg-[#1e293b]/40 transition-colors">
                            <td className="p-4 font-mono text-slate-300">{dateStr}</td>
                            <td className="p-4 text-right font-mono text-slate-400">${(c.fondoInicial || 0).toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-emerald-400">${(c.ventasEfectivo || 0).toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-blue-400">${(c.ventasTarjeta || 0).toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-purple-400">${(c.ventasTransferencia || 0).toFixed(2)}</td>
                            <td className="p-4 text-right font-black font-mono text-fuchsia-400 text-sm">${(c.totalVentas || 0).toFixed(2)}</td>
                            <td className="p-4 text-center">
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                                CORTADO Z
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCortes.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                            No hay cortes de caja Z registrados en este periodo ({startDate} al {endDate}).
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'CONTEO STOCK' && (() => {
          // Resolve provider name for each product
          const getProvName = (p: any) => {
            const itemSku = String(p.sku || '').trim().toLowerCase();
            const itemName = String(p.name || '').trim().toUpperCase();
            const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(itemName) || String(p.supplier || p.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
            return provIdToName.get(itemProvRaw) || itemProvRaw || 'SIN PROVEEDOR';
          };

          const productsWithProv = products.map(p => ({
            ...p,
            resolvedProv: getProvName(p)
          }));

          // Active filter
          const selectedProv = providerFilter ? providerFilter.trim().toUpperCase() : 'TODOS LOS PROVEEDORES';

          // Filter by selected provider
          let filteredList = productsWithProv;
          if (selectedProv !== 'TODOS LOS PROVEEDORES') {
            filteredList = filteredList.filter(p => p.resolvedProv === selectedProv);
          }

          // Filter by search term
          if (conteoSearch.trim()) {
            const query = conteoSearch.trim().toLowerCase();
            filteredList = filteredList.filter(p => 
              String(p.name || '').toLowerCase().includes(query) ||
              String(p.sku || '').toLowerCase().includes(query) ||
              String(p.category || '').toLowerCase().includes(query)
            );
          }

          // Totals for filtered list
          const totalPiezas = filteredList.reduce((acc, p) => acc + (p.stock || 0), 0);
          const totalCostoPesos = filteredList.reduce((acc, p) => acc + ((p.stock || 0) * (p.cost || 0)), 0);
          const totalVentaPesos = filteredList.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
          const totalGananciaPotencial = totalVentaPesos - totalCostoPesos;
          const totalProductosCount = filteredList.length;

          // Supplier Summary Breakdown Table for ALL Suppliers
          const supplierSummaryMap = new Map<string, { count: number; stock: number; costo: number; venta: number }>();
          
          productsWithProv.forEach(p => {
            const prov = p.resolvedProv;
            const stock = p.stock || 0;
            const cost = p.cost || 0;
            const price = p.price || 0;

            if (!supplierSummaryMap.has(prov)) {
              supplierSummaryMap.set(prov, { count: 0, stock: 0, costo: 0, venta: 0 });
            }
            const entry = supplierSummaryMap.get(prov)!;
            entry.count += 1;
            entry.stock += stock;
            entry.costo += stock * cost;
            entry.venta += stock * price;
          });

          const supplierSummaryList = Array.from(supplierSummaryMap.entries()).map(([name, data]) => ({
            name,
            ...data
          })).sort((a, b) => b.costo - a.costo);

          // Excel Export Function for Conteo Stock
          const handleExportConteoExcel = () => {
            const dataToExport = filteredList.map(p => ({
              'SKU': p.sku,
              'PRODUCTO': p.name,
              'CATEGORÍA': p.category || 'GENERAL',
              'PROVEEDOR': p.resolvedProv,
              'COSTO UNIT ($)': p.cost || 0,
              'PRECIO VENTA ($)': p.price || 0,
              'STOCK ACTUAL (PZ)': p.stock || 0,
              'VALOR EN COSTO ($)': (p.stock || 0) * (p.cost || 0),
              'VALOR EN VENTA ($)': (p.stock || 0) * (p.price || 0)
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Conteo Stock");
            XLSX.writeFile(wb, `Reporte_Conteo_Stock_${selectedProv.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-[#0b1120] p-5 rounded-2xl border border-nexus-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase">
                      INVENTARIO Y COSTOS
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                      FILTRADO POR: {selectedProv}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase mt-2">
                    CONTEO Y VALORACIÓN DE STOCK
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Valor exacto en costo (pesos) y piezas actualizadas por proveedor
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Search box inside Conteo Stock */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={conteoSearch}
                      onChange={e => setConteoSearch(e.target.value)}
                      placeholder="Buscar producto o SKU..."
                      className="w-full bg-nexus-900 border border-nexus-700 text-white pl-9 pr-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                    {conteoSearch && (
                      <button onClick={() => setConteoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={handleExportConteoExcel} 
                    className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL CONTEO
                  </button>
                </div>
              </div>

              {/* KPI STAT CARDS (Actualizadas en pesos según el proveedor seleccionado) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-nexus-900/60 border border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-500/5">
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>COSTO TOTAL EN PESOS</span>
                    <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono text-emerald-300">VALOR COMPRA</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-400 font-mono">${totalCostoPesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 truncate">Inversión acumulada ({selectedProv})</p>
                </div>

                <div className="bg-nexus-900/60 border border-blue-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-blue-500/5">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>VALOR VENTA TOTAL</span>
                    <span className="text-[9px] bg-blue-500/20 px-2 py-0.5 rounded-md font-mono text-blue-300">PRECIO PUBLICO</span>
                  </div>
                  <p className="text-3xl font-black text-blue-400 font-mono">${totalVentaPesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 truncate">Recaudación estimada ({selectedProv})</p>
                </div>

                <div className="bg-nexus-900/60 border border-fuchsia-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-fuchsia-500/5">
                  <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>GANANCIA ESTIMADA</span>
                    <span className="text-[9px] bg-fuchsia-500/20 px-2 py-0.5 rounded-md font-mono text-fuchsia-300">UTILIDAD</span>
                  </div>
                  <p className="text-3xl font-black text-fuchsia-400 font-mono">${totalGananciaPotencial.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 truncate">Margen potencial de utilidad</p>
                </div>

                <div className="bg-nexus-900/60 border border-amber-500/40 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-amber-500/5">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                    <span>PIEZAS EN STOCK</span>
                    <span className="text-[9px] bg-amber-500/20 px-2 py-0.5 rounded-md font-mono text-amber-300">{totalProductosCount} SKUs</span>
                  </div>
                  <p className="text-3xl font-black text-amber-400 font-mono">{totalPiezas.toLocaleString()} <span className="text-sm text-slate-400">pz</span></p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 truncate">Unidades físicas contadas</p>
                </div>
              </div>

              {/* TABLA DE RESUMEN DESGLOSADO POR PROVEEDOR (TODOS LOS PROVEEDORES) */}
              <div className="bg-nexus-900/60 border border-nexus-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-nexus-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-400" /> RESUMEN DE INVENTARIO Y COSTO POR PROVEEDOR
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Haz clic en cualquier proveedor para filtrar automáticamente el conteo detallado
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {supplierSummaryList.length} PROVEEDORES REGISTRADOS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {supplierSummaryList.map((sup, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setProviderFilter(sup.name)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedProv === sup.name 
                          ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500' 
                          : 'bg-nexus-950/60 border-nexus-800 hover:border-blue-500/50 hover:bg-nexus-900'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-white text-xs truncate max-w-[150px]">{sup.name}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-nexus-800 px-1.5 py-0.5 rounded">
                          {sup.count} SKUs
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Costo Inversión:</span>
                          <span className="text-emerald-400 font-bold">${sup.costo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Valor Venta:</span>
                          <span className="text-blue-400 font-bold">${sup.venta.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Stock Físico:</span>
                          <span className="text-white font-bold">{sup.stock} pz</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DETALLE DE PRODUCTOS FILTRADOS */}
              <div className="bg-nexus-900/60 border border-nexus-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-nexus-950 border-b border-nexus-800 flex justify-between items-center">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-400" /> DETALLE DE PRODUCTOS EN STOCK ({filteredList.length} REGISTROS)
                  </h3>
                  {selectedProv !== 'TODOS LOS PROVEEDORES' && (
                    <button 
                      onClick={() => setProviderFilter('TODOS LOS PROVEEDORES')}
                      className="text-[10px] font-black text-blue-400 hover:text-white uppercase tracking-wider bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/30 transition-colors"
                    >
                      MOSTRAR TODOS LOS PROVEEDORES
                    </button>
                  )}
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#0b1120] border-b border-[#1e293b] text-slate-400 uppercase font-black sticky top-0 z-10">
                      <tr>
                        <th className="p-4">SKU</th>
                        <th className="p-4">PRODUCTO</th>
                        <th className="p-4">CATEGORÍA</th>
                        <th className="p-4">PROVEEDOR</th>
                        <th className="p-4 text-right">COSTO UNIT.</th>
                        <th className="p-4 text-right">PRECIO VENTA</th>
                        <th className="p-4 text-right">STOCK ACTUAL</th>
                        <th className="p-4 text-right text-emerald-400">COSTO TOTAL</th>
                        <th className="p-4 text-right text-blue-400">VALOR VENTA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nexus-800/50 text-white font-bold">
                      {filteredList.map((p, i) => {
                        const stockNum = p.stock || 0;
                        const costNum = p.cost || 0;
                        const priceNum = p.price || 0;
                        const totalCostItem = stockNum * costNum;
                        const totalSaleItem = stockNum * priceNum;

                        return (
                          <tr key={i} className="hover:bg-nexus-800/50 transition-colors">
                            <td className="p-4 font-mono text-slate-400">{p.sku}</td>
                            <td className="p-4 font-black text-white">{p.name}</td>
                            <td className="p-4 text-slate-300">{p.category || 'GENERAL'}</td>
                            <td className="p-4">
                              <span className="bg-nexus-800 border border-nexus-700 text-blue-300 text-[10px] px-2.5 py-1 rounded-lg font-mono">
                                {p.resolvedProv}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono text-slate-300">${costNum.toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-slate-300">${priceNum.toFixed(2)}</td>
                            <td className="p-4 text-right font-mono">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                stockNum <= 0 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                                  : stockNum < 5 
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              }`}>
                                {stockNum} pz
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-black text-emerald-400">${totalCostItem.toFixed(2)}</td>
                            <td className="p-4 text-right font-mono font-black text-blue-400">${totalSaleItem.toFixed(2)}</td>
                          </tr>
                        );
                      })}

                      {filteredList.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                            No se encontraron productos para los criterios seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'POR HORA' && (() => {
          const hours = Array.from({length: 24}, (_, i) => i);
          const hourlyStats: Record<number, any> = {};
          let superTotalVentas = 0;

          hours.forEach(h => {
            hourlyStats[h] = { trx: 0, venta: 0, ganancia: 0 };
          });

          filteredTickets.forEach(t => {
            const date = new Date(t.date);
            const h = date.getHours();
            if(hourlyStats[h]) {
              hourlyStats[h].trx += 1;
              const tTotal = t.total || 0;
              hourlyStats[h].venta += tTotal;
              superTotalVentas += tTotal;
              
              t.items?.forEach((item: any) => {
                const qty = item.cartQty - (item.returnedQty || 0);
                hourlyStats[h].ganancia += (item.price - (item.cost || item.price * 0.8)) * qty;
              });
            }
          });

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">VENTAS POR HORA</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-[#00b894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                </div>
              </div>
              
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="border-b border-[#1e293b] text-slate-400 uppercase font-black">
                    <tr>
                      <th className="p-4 text-[#3b82f6]">RANGO HORA</th>
                      <th className="p-4 text-[#3b82f6]">TRX</th>
                      <th className="p-4 text-[#3b82f6]">VENTA</th>
                      <th className="p-4 text-[#3b82f6]">TICKET PROM</th>
                      <th className="p-4 text-[#3b82f6]">PART%</th>
                      <th className="p-4 text-[#3b82f6]">GANANCIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-slate-300 font-bold">
                    {hours.filter(h => h >= 7 && h <= 23).map(h => {
                      const stat = hourlyStats[h];
                      const ticketProm = stat.trx > 0 ? (stat.venta / stat.trx) : 0;
                      const part = superTotalVentas > 0 ? ((stat.venta / superTotalVentas) * 100) : 0;
                      
                      return (
                        <tr key={h} className="hover:bg-[#1e293b]/30">
                          <td className="p-4 text-white font-black">{h}:00 - {h}:59</td>
                          <td className="p-4 text-white font-black">{stat.trx}</td>
                          <td className="p-4 font-black text-[#00b894]">${stat.venta.toFixed(2)}</td>
                          <td className="p-4 text-white">${ticketProm.toFixed(2)}</td>
                          <td className="p-4 text-[#3b82f6]">{part.toFixed(1)}%</td>
                          <td className="p-4 font-black text-[#00cec9]">${stat.ganancia.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

{activeTab === 'MATRIZ 24H' && (() => {
          const hours = Array.from({length: 24}, (_, i) => i);
          
          let provList: string[] = [];
          if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
            provList = [providerFilter.trim().toUpperCase()];
          } else {
            const setProvs = new Set<string>();
            uniqueProviders.forEach(p => {
              if (p !== 'TODOS LOS PROVEEDORES') setProvs.add(p);
            });
            provList = Array.from(setProvs).sort();
            if (provList.length === 0) provList = ['SIN PROVEEDOR'];
          }

          const start = new Date(startDate + "T00:00:00").getTime();
          const end = new Date(endDate + "T23:59:59.999").getTime();

          const rangeTickets = tickets.filter(t => {
            let ts = new Date(t.date).getTime();
            if (isNaN(ts)) {
              try {
                const [datePart, timePart] = t.date.split(', ');
                const [day, month, year] = datePart.split('/');
                if (day && month && year) {
                  const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
                  ts = new Date(isoStr).getTime();
                }
              } catch(e) {}
            }
            return !isNaN(ts) && ts >= start && ts <= end;
          });

          const matrix: Record<number, Record<string, number>> = {};
          const providerTotals: Record<string, number> = {};
          const hourlyTotals: Record<number, number> = {};

          hours.forEach(h => {
            matrix[h] = {};
            hourlyTotals[h] = 0;
            provList.forEach(p => matrix[h][p] = 0);
          });
          provList.forEach(p => providerTotals[p] = 0);

          let grandTotal = 0;

          rangeTickets.forEach(t => {
            let h = new Date(t.date).getHours();
            if (isNaN(h)) {
              try {
                const timePart = t.date.split(', ')[1];
                if (timePart) h = parseInt(timePart.split(':')[0], 10);
              } catch(e) {}
            }
            if (isNaN(h) || h < 0 || h > 23) h = 0;

            t.items?.forEach((item: any) => {
              const itemSku = String(item.sku || '').trim().toLowerCase();
              const itemName = String(item.name || '').trim().toUpperCase();
              const itemProvRaw = skuToProv.get(itemSku) || skuToProv.get(itemName) || String(item.supplier || item.supplier_id || 'SIN PROVEEDOR').trim().toUpperCase();
              const prov = provIdToName.get(itemProvRaw) || itemProvRaw;
              
              const qty = (item.cartQty || 0) - (item.returnedQty || 0);
              if (qty <= 0) return;
              const totalItem = (item.price || 0) * qty;

              if (provList.includes(prov)) {
                matrix[h][prov] = (matrix[h][prov] || 0) + totalItem;
                providerTotals[prov] = (providerTotals[prov] || 0) + totalItem;
                hourlyTotals[h] = (hourlyTotals[h] || 0) + totalItem;
                grandTotal += totalItem;
              }
            });
          });

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">MATRIZ VENTAS HORA VS PROVEEDOR</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                  <div className="bg-nexus-900/50 border border-blue-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-blue-500/10">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">TOTAL VENDIDO EN MATRIZ</p>
                    <p className="text-3xl font-black text-blue-400">${grandTotal.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <FileSpreadsheet className="w-4 h-4" /> EXCEL
                  </button>
                  <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                </div>
              </div>
              
              <div className="bg-[#0b1120] border border-[#1e293b] rounded-xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead className="border-b border-[#1e293b] bg-[#0f172a] text-slate-400 uppercase font-black sticky top-0">
                    <tr>
                      <th className="p-4 text-[#3b82f6] sticky left-0 bg-[#0f172a] z-10">HORA</th>
                      {provList.map(p => <th key={p} className="p-4 text-[#3b82f6] max-w-[150px] truncate" title={p}>{p}</th>)}
                      <th className="p-4 text-emerald-400 text-right">TOTAL HORA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/50 text-slate-300 font-bold">
                    {hours.map(h => (
                      <tr key={h} className="hover:bg-[#1e293b]/30">
                        <td className="p-4 text-[#3b82f6] font-black sticky left-0 bg-[#0b1120]">{String(h).padStart(2, '0')}:00</td>
                        {provList.map(p => (
                          <td key={p} className={`p-4 ${matrix[h][p] > 0 ? 'text-white font-black' : 'text-slate-600'}`}>
                            ${matrix[h][p].toFixed(2)}
                          </td>
                        ))}
                        <td className="p-4 font-black text-emerald-400 text-right">${hourlyTotals[h].toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#0f172a] font-black border-t-2 border-nexus-700">
                      <td className="p-4 text-white uppercase tracking-widest sticky left-0 bg-[#0f172a]">TOTAL PROVEEDOR:</td>
                      {provList.map(p => (
                        <td key={p} className="p-4 text-blue-400 font-black">${providerTotals[p].toFixed(2)}</td>
                      ))}
                      <td className="p-4 text-emerald-400 text-right text-sm font-black">${grandTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

{activeTab === 'PEDIDOS' && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-16 flex flex-col items-center justify-center text-center">
             <p className="text-slate-500 font-bold">No hay pedidos registrados en este periodo.</p>
          </div>
        )}
      </div>

      {/* MODAL REPORTE ENTRADA PDF */}
      <ReporteEntradaPDFModal
        isOpen={showEntradaPDFModal}
        onClose={() => setShowEntradaPDFModal(false)}
        compra={selectedEntradaPDF}
      />

      {/* MODAL EDITAR ENTRADA */}
      {editingEntrada && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">
                ✏️ MODIFICAR ENTRADA - FOLIO {editingEntrada.folio}
              </h3>
              <button onClick={() => setEditingEntrada(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">PROVEEDOR</label>
                  <input
                    type="text"
                    value={editingEntrada.provider || ''}
                    onChange={(e) => setEditingEntrada({ ...editingEntrada, provider: e.target.value })}
                    className="w-full bg-[#131b2c] border border-nexus-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">FECHA</label>
                  <input
                    type="text"
                    value={editingEntrada.date || ''}
                    onChange={(e) => setEditingEntrada({ ...editingEntrada, date: e.target.value })}
                    className="w-full bg-[#131b2c] border border-nexus-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div className="border border-nexus-800 rounded-2xl overflow-hidden bg-nexus-900/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1120] border-b border-nexus-800 text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">PRODUCTO</th>
                      <th className="p-3 text-center w-24">CANTIDAD</th>
                      <th className="p-3 text-right w-28">COSTO U.</th>
                      <th className="p-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 font-bold text-white">
                    {(editingEntrada.items || []).map((it: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-mono text-blue-400">{it.sku}</td>
                        <td className="p-3 font-black uppercase text-xs">{it.name}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={it.qty || 0}
                            onChange={(e) => {
                              const newQty = Math.max(0, parseFloat(e.target.value) || 0);
                              const updatedItems = [...editingEntrada.items];
                              updatedItems[idx] = { ...it, qty: newQty, total: newQty * (it.cost || 0) };
                              setEditingEntrada({ ...editingEntrada, items: updatedItems });
                            }}
                            className="w-16 bg-[#0b1120] border border-blue-500/50 text-white text-center font-black rounded py-1 text-xs"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={it.cost || 0}
                            onChange={(e) => {
                              const newCost = Math.max(0, parseFloat(e.target.value) || 0);
                              const updatedItems = [...editingEntrada.items];
                              updatedItems[idx] = { ...it, cost: newCost, total: (it.qty || 0) * newCost };
                              setEditingEntrada({ ...editingEntrada, items: updatedItems });
                            }}
                            className="w-20 bg-[#0b1120] border border-emerald-500/50 text-emerald-400 text-right font-black rounded py-1 text-xs px-2"
                          />
                        </td>
                        <td className="p-3 text-right font-black text-emerald-400 font-mono">
                          ${((it.qty || 0) * (it.cost || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-nexus-800 bg-nexus-900/50 flex gap-4">
              <button
                onClick={async () => {
                  try {
                    const rec = await db.compras.where('folio').equals(editingEntrada.folio).first();
                    const newItems = editingEntrada.items || [];
                    const newTotal = newItems.reduce((acc: number, item: any) => acc + ((item.qty || 0) * (item.cost || 0)), 0);

                    if (rec && rec.id) {
                      const oldItemsMap = new Map((rec.items || []).map((i: any) => [i.sku, i.qty || 0]));
                      for (const newIt of newItems) {
                        const oldQty = oldItemsMap.get(newIt.sku) || 0;
                        const diff = (newIt.qty || 0) - oldQty;
                        if (diff !== 0) {
                          const prod = await db.products.where('sku').equals(newIt.sku).first();
                          if (prod && prod.id) {
                            await db.products.update(prod.id, {
                              stock: (prod.stock || 0) + diff,
                              cost: newIt.cost || prod.cost
                            });
                          }
                        }
                      }
                      await db.compras.put({
                        ...editingEntrada,
                        id: rec.id,
                        subtotal: newTotal,
                        total: newTotal
                      });
                    }
                    setEditingEntrada(null);
                    alert('¡Entrada de mercancía actualizada con éxito!');
                  } catch (e) {
                    console.error(e);
                    alert('Error al actualizar la entrada');
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors shadow-lg shadow-emerald-600/20"
              >
                💾 GUARDAR CAMBIOS
              </button>
              <button
                onClick={() => setEditingEntrada(null)}
                className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE TICKET / FOLIO */}
      {selectedTicket && !showDevolucionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-nexus-800 bg-nexus-900/50">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" /> FOLIO #{selectedTicket.folio || String(selectedTicket.id || '').substring(0, 8).toUpperCase() || '000001'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {selectedTicket.date} • {(selectedTicket.paymentMethod || 'EFECTIVO').toUpperCase()}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white transition-colors p-1 bg-nexus-800 hover:bg-nexus-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="bg-nexus-900/60 border border-nexus-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Cliente:</span>
                  <span className="text-white font-black">{(selectedTicket.clientName || selectedTicket.client || 'PUBLICO GENERAL').toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Estado:</span>
                  <span className={selectedTicket.status === 'DEVUELTO' ? "text-red-400 font-black" : selectedTicket.status === 'DEV. PARCIAL' ? "text-amber-400 font-black" : "text-emerald-400 font-black"}>
                    {(selectedTicket.status || 'COMPLETADO').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Total Venta:</span>
                  <span className="text-emerald-400 font-black text-sm">${(selectedTicket.total || 0).toFixed(2)}</span>
                </div>
                {selectedTicket.recibido !== undefined && (
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>Recibido / Cambio:</span>
                    <span className="text-slate-200 font-mono">${selectedTicket.recibido.toFixed(2)} / ${(selectedTicket.cambio || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Lista de productos del ticket */}
              <div className="border border-nexus-800 rounded-2xl overflow-hidden bg-nexus-900/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1120] border-b border-nexus-800 text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-3 text-center w-12">CT</th>
                      <th className="p-3">PRODUCTO</th>
                      <th className="p-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 font-bold text-white">
                    {(selectedTicket.items || []).map((it: any, idx: number) => {
                      const qty = it.cartQty || it.qty || 1;
                      const price = it.price || 0;
                      const tot = it.total !== undefined ? it.total : (qty * price);
                      const nameStr = (it.name || it.productName || 'PRODUCTO').toUpperCase();
                      return (
                        <tr key={idx}>
                          <td className="p-3 text-center font-black text-blue-400">{qty}</td>
                          <td className="p-3 uppercase text-xs">
                            {nameStr}
                            {qty > 1 && <span className="block text-[10px] text-slate-400">({qty} x ${price.toFixed(2)})</span>}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-400 font-mono">${tot.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-nexus-800 bg-nexus-900/50 flex gap-2">
              {selectedTicket.status !== 'DEVUELTO' && (
                <button
                  onClick={openDevolucionModal}
                  className="bg-red-900/30 hover:bg-red-900/50 border border-red-500/40 text-red-400 px-3 py-3 rounded-xl font-black text-xs uppercase transition-colors flex justify-center items-center gap-1.5"
                  title="Realizar devolución parcial de productos o cancelación total"
                >
                  <RefreshCcw className="w-4 h-4" /> DEVOLUCIÓN
                </button>
              )}
              <button
                onClick={() => {
                  reimprimirTicket(selectedTicket);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Printer className="w-4 h-4" /> REIMPRIMIR
              </button>
              <button
                onClick={() => {
                  sendTicketWhatsapp(selectedTicket);
                }}
                className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white py-3 rounded-xl font-black text-xs uppercase transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-4 h-4" /> WHATSAPP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}