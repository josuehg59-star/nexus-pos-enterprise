import { useState, useMemo, useEffect } from 'react';
import { BrainCircuit, Truck, ShoppingCart, AlertTriangle, Search, Plus, Trash2, TrendingUp, Package, FileSpreadsheet, MessageCircle, Printer, Filter, FileText, Edit3, X, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import type { Product } from '../store/database';
import * as XLSX from 'xlsx-js-style';
import { useSettings } from '../store/useSettings';
import { notifyDataMutation } from '../store/backup';

type Mode = 'ESTADISTICAS' | 'MINMAX' | 'MANUAL';

export default function SmartPurchasing() {
  const [mode, setMode] = useState<Mode>('ESTADISTICAS');
  const [providerFilter, setProviderFilter] = useState('TODOS LOS PROVEEDORES');

  // ESTADISTICAS State
  const [daysToAnalyze, setDaysToAnalyze] = useState(7);
  const [daysToCover, setDaysToCover] = useState(15);
  const [showAllForSupplier, setShowAllForSupplier] = useState(true);

  // MANUAL State
  const [manualSearch, setManualSearch] = useState('');
  const [manualCart, setManualCart] = useState<(Product & { orderQty: number })[]>([]);

  // Quantidades editadas manualmente por producto (id -> qty)
  const [customQuantities, setCustomQuantities] = useState<Record<number, number>>({});

  // EDIT & MODAL State
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingFolio, setEditingFolio] = useState<string>('');
  const [showSavedOrdersModal, setShowSavedOrdersModal] = useState<boolean>(false);
  const [savedOrdersSearch, setSavedOrdersSearch] = useState<string>('');
  const [ordersTab, setOrdersTab] = useState<'PENDIENTES' | 'RECIBIDAS'>('PENDIENTES');
  const [isLoaded, setIsLoaded] = useState(false);

  // Dexie Data
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const kardex = useLiveQuery(() => db.kardex.toArray()) || [];
  const tickets = useLiveQuery(() => db.tickets.toArray()) || [];
  const providers = useLiveQuery(() => db.providers.toArray()) || [];
  const savedCompras = useLiveQuery(() => db.compras.toArray()) || [];

  // Restaurar borrador de Órden de Compra al cargar
  useEffect(() => {
    const savedDraft = localStorage.getItem('nexus_pos_oc_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.manualCart && Array.isArray(draft.manualCart)) setManualCart(draft.manualCart);
        if (draft.customQuantities) setCustomQuantities(draft.customQuantities);
        if (draft.mode) setMode(draft.mode);
        if (draft.providerFilter) setProviderFilter(draft.providerFilter);
        if (draft.editingOrderId !== undefined) setEditingOrderId(draft.editingOrderId);
        if (draft.editingFolio) setEditingFolio(draft.editingFolio);
      } catch (e) {
        console.error('Error cargando borrador OC:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Persistir borrador ante cualquier cambio
  useEffect(() => {
    if (!isLoaded) return;
    if (manualCart.length > 0 || Object.keys(customQuantities).length > 0 || editingOrderId !== null) {
      localStorage.setItem('nexus_pos_oc_draft', JSON.stringify({
        manualCart,
        customQuantities,
        mode,
        providerFilter,
        editingOrderId,
        editingFolio
      }));
    } else {
      localStorage.removeItem('nexus_pos_oc_draft');
    }
  }, [manualCart, customQuantities, mode, providerFilter, editingOrderId, editingFolio, isLoaded]);

  // Mapeo Proveedor ID -> Nombre
  const provIdToName = useMemo(() => {
    const map = new Map<string, string>();
    providers.forEach(p => {
      if (p.id) map.set(String(p.id), p.name.trim().toUpperCase());
      if (p.name) map.set(p.name.trim().toUpperCase(), p.name.trim().toUpperCase());
    });
    return map;
  }, [providers]);

  // Proveedores Únicos
  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    set.add('TODOS LOS PROVEEDORES');
    providers.forEach(p => {
      if (p.name) set.add(p.name.trim().toUpperCase());
    });
    products.forEach(p => {
      const suppStr = String(p.supplier_id || '').trim();
      if (suppStr) {
        const resolved = provIdToName.get(suppStr) || (isNaN(Number(suppStr)) ? suppStr.toUpperCase() : null);
        if (resolved) set.add(resolved);
      }
    });
    return Array.from(set).sort();
  }, [providers, products, provIdToName]);

  // Ventas agrupadas por SKU en la ventana de dias (tickets + kardex)
  const salesBySku = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);
    const cutoffTs = cutoffDate.getTime();

    const salesMap: Record<string, number> = {};

    tickets.forEach(t => {
      let tTs = new Date(t.date).getTime();
      if (isNaN(tTs)) {
        try {
          const [datePart, timePart] = t.date.split(', ');
          const [day, month, year] = datePart.split('/');
          if (day && month && year) {
            tTs = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`).getTime();
          }
        } catch(e) {}
      }
      if (!isNaN(tTs) && tTs >= cutoffTs) {
        t.items?.forEach((item: any) => {
          const skuKey = String(item.sku || '').trim().toLowerCase();
          const cant = (item.cartQty || 0) - (item.returnedQty || 0);
          if (cant > 0 && skuKey) {
            salesMap[skuKey] = (salesMap[skuKey] || 0) + cant;
          }
        });
      }
    });

    kardex.forEach(k => {
      if (k.tipo === 'SALIDA' || k.tipo === 'VENTA') {
        let kTs = new Date(k.fecha).getTime();
        if (isNaN(kTs)) {
          try {
            const [datePart] = k.fecha.split(', ');
            const [day, month, year] = datePart.split('/');
            if (day && month && year) {
              kTs = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`).getTime();
            }
          } catch(e) {}
        }
        if (!isNaN(kTs) && kTs >= cutoffTs) {
          const skuKey = String(k.sku || '').trim().toLowerCase();
          if (skuKey && salesMap[skuKey] === undefined) {
            salesMap[skuKey] = (salesMap[skuKey] || 0) + (k.cantidad || 0);
          }
        }
      }
    });

    return salesMap;
  }, [tickets, kardex, daysToAnalyze]);

  // Filtrado de productos por proveedor
  const filteredProducts = useMemo(() => {
    if (providerFilter === 'TODOS LOS PROVEEDORES') return products;
    const targetProv = providerFilter.trim().toUpperCase();
    return products.filter(p => {
      const suppStr = String(p.supplier_id || '').trim();
      const resolved = provIdToName.get(suppStr) || (isNaN(Number(suppStr)) && suppStr ? suppStr.toUpperCase() : 'SIN PROVEEDOR');
      return resolved === targetProv;
    });
  }, [products, providerFilter, provIdToName]);

  // 1. SUGERENCIAS POR ESTADÍSTICAS DE VENTA
  const statSuggestions = useMemo(() => {
    if (mode !== 'ESTADISTICAS') return [];

    const suggestions: any[] = [];
    for (const p of filteredProducts) {
      const skuKey = String(p.sku || '').trim().toLowerCase();
      const sold = salesBySku[skuKey] || 0;

      const dailyAverage = sold / (daysToAnalyze || 1);
      const requiredForPeriod = Math.ceil(dailyAverage * daysToCover);
      const calculatedQty = Math.max(0, requiredForPeriod - p.stock);

      const customQty = customQuantities[p.id!];
      // Si no ha tenido ventas (sold === 0), la sugerencia por rotación es 0 (no forzamos 15 ni 5 pzas)
      const orderQty = customQty !== undefined ? customQty : calculatedQty;

      if (orderQty > 0 || sold > 0 || showAllForSupplier) {
        suggestions.push({
          ...p,
          sold,
          dailyAverage,
          calculatedQty,
          orderQty: orderQty
        });
      }
    }
    return suggestions.sort((a, b) => b.orderQty - a.orderQty || b.sold - a.sold);
  }, [mode, filteredProducts, salesBySku, daysToAnalyze, daysToCover, customQuantities, showAllForSupplier]);

  // 2. SUGERENCIAS MÍN / MÁX
  const minMaxSuggestions = useMemo(() => {
    if (mode !== 'MINMAX') return [];

    const list: any[] = [];
    for (const p of filteredProducts) {
      const min = p.min_stock !== undefined && p.min_stock !== null ? p.min_stock : 5;
      const max = p.max_stock !== undefined && p.max_stock !== null ? p.max_stock : Math.max(10, min * 2);
      
      // Solo se sugiere comprar si el stock actual está en o por debajo del mínimo
      const calculatedQty = p.stock <= min ? Math.max(0, max - p.stock) : 0;

      const customQty = customQuantities[p.id!];
      const orderQty = customQty !== undefined ? customQty : calculatedQty;

      if (p.stock <= min || orderQty > 0 || showAllForSupplier) {
        list.push({
          ...p,
          min,
          max,
          calculatedQty,
          orderQty: orderQty
        });
      }
    }
    return list.sort((a, b) => (a.stock - a.min) - (b.stock - b.min));
  }, [mode, filteredProducts, customQuantities, showAllForSupplier]);

  // 3. MANUAL LOGIC (Búsqueda)
  const searchResults = useMemo(() => {
    if (!manualSearch.trim()) return [];
    const s = manualSearch.toLowerCase();
    return filteredProducts.filter(p => {
      const skuMatch = p.sku.toLowerCase().includes(s);
      const nameMatch = p.name.toLowerCase().includes(s);
      const b2Match = p.barcode2 && p.barcode2.toLowerCase().includes(s);
      const b3Match = p.barcode3 && p.barcode3.toLowerCase().includes(s);
      return nameMatch || skuMatch || b2Match || b3Match;
    }).slice(0, 8);
  }, [manualSearch, filteredProducts]);

  const addToManualCart = (p: Product) => {
    if (!manualCart.find(item => item.id === p.id)) {
      setManualCart([...manualCart, { ...p, orderQty: 1 }]);
    }
    setManualSearch('');
  };

  const updateOrderQty = (id: number, qty: number) => {
    const val = Math.max(0, qty);
    setCustomQuantities(prev => ({ ...prev, [id]: val }));
    if (mode === 'MANUAL') {
      setManualCart(cart => cart.map(item => item.id === id ? { ...item, orderQty: val } : item));
    }
  };

  const removeManualItem = (id: number) => {
    setManualCart(cart => cart.filter(item => item.id !== id));
  };

  // Lista Activa según el modo seleccionado
  const activeList = mode === 'ESTADISTICAS' ? statSuggestions : (mode === 'MINMAX' ? minMaxSuggestions : manualCart);
  
  // Filtrar solo los productos que tienen cantidad a pedir > 0 para la orden final
  const itemsToOrder = useMemo(() => {
    return activeList.filter(i => (i.orderQty || 0) > 0);
  }, [activeList]);

  const totalCost = itemsToOrder.reduce((sum, item) => sum + ((item.cost || 0) * (item.orderQty || 0)), 0);
  const totalPieces = itemsToOrder.reduce((sum, item) => sum + (item.orderQty || 0), 0);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const generateOrder = async () => {
    if (itemsToOrder.length === 0) { 
      setToastMsg('⚠️ No hay productos con piezas a pedir en el pedido.');
      setTimeout(() => setToastMsg(null), 3000);
      return; 
    }
    const items = itemsToOrder.map(i => ({
      sku: i.sku,
      name: i.name,
      unit_measure: i.unit_measure || 'PZA',
      cost: i.cost || 0,
      price: i.price || 0,
      qty: i.orderQty || 0,
      total: (i.cost || 0) * (i.orderQty || 0)
    }));

    const folioToUse = editingFolio || ('OC-' + Date.now().toString().slice(-6));

    if (editingOrderId) {
      await db.compras.update(editingOrderId, {
        folio: folioToUse,
        date: new Date().toISOString(),
        provider: providerFilter,
        items,
        subtotal: totalCost,
        total: totalCost,
        status: 'ORDEN'
      });
      setToastMsg(`✅ ¡Orden de Compra #${folioToUse} actualizada con éxito (${totalPieces} piezas)!`);
    } else {
      await db.compras.add({
        folio: folioToUse,
        date: new Date().toISOString(),
        provider: providerFilter,
        items,
        subtotal: totalCost,
        total: totalCost,
        status: 'ORDEN'
      });
      setToastMsg(`✅ ¡Orden de Compra #${folioToUse} guardada con éxito (${totalPieces} piezas)!`);
    }
    notifyDataMutation();
    setTimeout(() => setToastMsg(null), 4000);

    setManualCart([]);
    setCustomQuantities({});
    setEditingOrderId(null);
    setEditingFolio('');
    localStorage.removeItem('nexus_pos_oc_draft');
  };

  const clearWorkingOrder = () => {
    setManualCart([]);
    setCustomQuantities({});
    setEditingOrderId(null);
    setEditingFolio('');
    localStorage.removeItem('nexus_pos_oc_draft');
  };

  const handleLoadSavedOrder = async (order: any) => {
    if (!order || !order.items) return;
    setEditingOrderId(order.id || null);
    setEditingFolio(order.folio || '');
    setProviderFilter(order.provider || 'TODOS LOS PROVEEDORES');
    setMode('MANUAL');

    const allProds = await db.products.toArray();
    const prodMap = new Map(allProds.map(p => [String(p.sku || '').toLowerCase(), p]));

    const loadedCart: (Product & { orderQty: number })[] = [];
    const newQuantities: Record<number, number> = {};

    order.items.forEach((item: any) => {
      const dbP = prodMap.get(String(item.sku || '').toLowerCase());
      if (dbP && dbP.id) {
        loadedCart.push({
          ...dbP,
          cost: item.cost ?? dbP.cost,
          orderQty: item.qty || 1
        });
        newQuantities[dbP.id] = item.qty || 1;
      } else {
        const tempId = Math.floor(Math.random() * -10000);
        const synthProd: Product & { orderQty: number } = {
          id: tempId,
          sku: item.sku || 'N/A',
          name: item.name || 'PRODUCTO',
          category: 'General',
          price: item.price || 0,
          cost: item.cost || 0,
          stock: 0,
          status: 'ACTIVO',
          orderQty: item.qty || 1
        };
        loadedCart.push(synthProd);
        newQuantities[tempId] = item.qty || 1;
      }
    });

    setManualCart(loadedCart);
    setCustomQuantities(newQuantities);
    setShowSavedOrdersModal(false);
  };

  const handleTransferToEntradas = async (order: any) => {
    if (!order || !order.items) return;
    const allProds = await db.products.toArray();
    const prodSkuMap = new Map(allProds.map(p => [String(p.sku || '').trim().toLowerCase(), p]));
    const prodNameMap = new Map(allProds.map(p => [String(p.name || '').trim().toLowerCase(), p]));

    const entradaItems = order.items.map((item: any) => {
      const cleanSku = String(item.sku || '').trim().toLowerCase();
      const cleanName = String(item.name || '').trim().toLowerCase();
      const dbP = prodSkuMap.get(cleanSku) || prodNameMap.get(cleanName);
      return {
        ...(dbP || {}),
        id: dbP?.id || item.id,
        sku: item.sku || dbP?.sku || '',
        name: item.name || dbP?.name || '',
        cost: item.cost || dbP?.cost || 0,
        price: item.price || dbP?.price || 0,
        entradaQty: item.qty || 1,
        ieps: dbP?.ieps !== undefined ? Number(dbP.ieps) : (Number(item.ieps) || 0),
        iva: dbP?.iva !== undefined ? Number(dbP.iva) : (Number(item.iva) || 0),
      };
    });

    localStorage.setItem('nexus_load_po_to_entrada', JSON.stringify({
      orderId: order.id,
      provider: order.provider,
      folio: order.folio,
      items: entradaItems
    }));

    alert(`¡Orden #${order.folio} lista para cargarse!\n\nHaz clic en "Entradas" en el menú de la izquierda para procesar la llegada.`);
    setShowSavedOrdersModal(false);
  };

  const handleDeleteSavedOrder = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta Orden de Compra guardada?')) {
      await db.compras.delete(id);
      notifyDataMutation();
    }
  };

  const handleMarkAsReceived = async (id: number) => {
    await db.compras.update(id, { 
      status: 'RECIBIDA',
      fechaRecepcion: new Date().toISOString()
    });
    notifyDataMutation();
  };

  // 1. Órdenes pendientes de pedir o surtir (NUNCA mostrar compras ya ingresadas al inventario 'COMPRA')
  const pendingOrders = useMemo(() => {
    return savedCompras.filter(c => {
      if (c.status === 'COMPRA' || c.status === 'RECIBIDA' || c.status === 'SURTIDA' || c.status === 'DEVOLUCION') {
        return false;
      }
      return c.status === 'ORDEN' || c.status === 'PENDIENTE' || (!c.status && String(c.folio || '').startsWith('OC-'));
    });
  }, [savedCompras]);

  // 2. Historial de órdenes ya recibidas / surtidas
  const receivedOrders = useMemo(() => {
    return savedCompras.filter(c => c.status === 'RECIBIDA' || c.status === 'SURTIDA');
  }, [savedCompras]);

  const filteredSavedOrders = useMemo(() => {
    const list = ordersTab === 'PENDIENTES' ? pendingOrders : receivedOrders;
    const q = savedOrdersSearch.trim().toLowerCase();
    const sorted = [...list].reverse();
    if (!q) return sorted;
    return sorted.filter(o =>
      String(o.folio || '').toLowerCase().includes(q) ||
      String(o.provider || '').toLowerCase().includes(q)
    );
  }, [ordersTab, pendingOrders, receivedOrders, savedOrdersSearch]);

  const handleExportExcel = () => {
    if (itemsToOrder.length === 0) return alert('No hay artículos con cantidad mayor a cero para exportar.');
    try {
      const settings = useSettings.getState();
      const companyName = settings.nombreNegocio || 'MISCELANEA BRITTANY';
      const address = settings.direccion || 'TUXTLA GUTIERREZ, CHIAPAS';

      const wsData: any[][] = [
        ["ORDEN DE COMPRA / PEDIDO DE MERCADERÍA"],
        ["Empresa:", companyName],
        ["Dirección:", address],
        ["Proveedor:", providerFilter],
        ["Fecha de Generación:", new Date().toLocaleString('es-MX')],
        [""],
        ["CÓDIGO (SKU)", "DESCRIPCIÓN DEL PRODUCTO", "STOCK ACTUAL", "CANTIDAD A PEDIR", "COSTO UNITARIO", "TOTAL LÍNEA"]
      ];

      itemsToOrder.forEach(item => {
        const itemTotal = (item.cost || 0) * (item.orderQty || 0);
        wsData.push([
          item.sku,
          item.name,
          item.stock,
          item.orderQty,
          item.cost || 0,
          itemTotal
        ]);
      });

      wsData.push(["TOTAL PEDIDO:", "", "", totalPieces, "", totalCost]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 18 },
        { wch: 45 },
        { wch: 15 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orden_Compra");
      XLSX.writeFile(wb, `Orden_Compra_${providerFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch(e) {
      console.error(e);
      alert('Error al generar Excel del pedido');
    }
  };

  const sendWhatsapp = () => {
    if (itemsToOrder.length === 0) return alert('No hay artículos con piezas a pedir en el pedido.');
    let phone = window.prompt('Número de WhatsApp del proveedor (10 dígitos):', '') || '';
    phone = phone.replace(/\D/g, '');
    if (phone.length < 10) return alert('Número de WhatsApp inválido');

    const lines = itemsToOrder.map(i => `• *${i.orderQty} pz* - ${i.name.toUpperCase()} (SKU: ${i.sku || 'N/A'}) @ $${(i.cost||0).toFixed(2)} = *$${((i.cost||0)*i.orderQty).toFixed(2)}*`).join('\n');
    const msg = `🧾 *ORDEN DE COMPRA* 🧾\n` +
      `🏢 *${(useSettings.getState().nombreNegocio || 'MISCELANEA BRITTANY').toUpperCase()}*\n` +
      `📦 *PROVEEDOR:* ${providerFilter}\n` +
      `📅 *FECHA:* ${new Date().toLocaleDateString('es-MX')}\n` +
      `----------------------------------------\n` +
      `🛒 *PRODUCTOS SOLICITADOS:*\n${lines}\n` +
      `----------------------------------------\n` +
      `📦 *TOTAL PIEZAS:* ${totalPieces}\n` +
      `💵 *INVERSIÓN ESTIMADA: $${totalCost.toFixed(2)} MXN*\n` +
      `----------------------------------------\n` +
      `✨ Favor de confirmar recepción de pedido.`;

    const waUrl = `https://wa.me/52${phone.slice(-10)}?text=${encodeURIComponent(msg)}`;

    try {
      if ((window as any).require) {
        const { shell } = (window as any).require('electron');
        if (shell && shell.openExternal) {
          shell.openExternal(waUrl);
        } else {
          window.open(waUrl, '_blank');
        }
      } else {
        window.open(waUrl, '_blank');
      }
    } catch(e) {
      window.open(waUrl, '_blank');
    }

    setTimeout(() => {
      handleExportPDF();
    }, 300);
  };

  const handlePrintTicket = () => {
    if (itemsToOrder.length === 0) return alert('No hay artículos con piezas a pedir en la orden.');
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MISCELANEA BRITTANY';
    const dateStr = new Date().toLocaleString('es-MX');

    const w = window.open('', '_blank', 'width=450,height=700');
    if (!w) return alert('Permite ventanas emergentes para imprimir el ticket de compra.');

    // Ticket compacto: solo CANT, DESCRIPCIÓN y PRECIO TOTAL por línea + TOTAL GENERAL al final
    const itemRows = itemsToOrder.map(i => `
      <tr>
        <td class="c-qty">${i.orderQty}</td>
        <td class="c-desc">${i.name}</td>
        <td class="c-tot">$${((i.cost || 0) * i.orderQty).toFixed(2)}</td>
      </tr>
    `).join('');

    w.document.write(`
      <html>
        <head>
          <title>Ticket Orden de Compra</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            * { color: #000000 !important; font-weight: 700 !important; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 8px;
              width: 54mm;
              margin: 0 auto;
              padding: 2mm 1mm;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2, h3, p { margin: 1px 0; text-align: center; text-transform: uppercase; }
            h2 { font-size: 10px; }
            h3 { font-size: 9px; }
            table { width: 100%; border-collapse: collapse; margin-top: 2px; font-size: 7.5px; table-layout: fixed; }
            th { border-bottom: 1px solid #000000 !important; text-align: left; padding: 1px 0; font-size: 7.5px; }
            td { padding: 1px 0; vertical-align: top; font-size: 7.5px; line-height: 1.15; }
            .c-qty { width: 14%; text-align: center; }
            .c-desc { width: 58%; text-transform: uppercase; word-break: break-word; padding: 1px 2px; }
            .c-tot { width: 28%; text-align: right; }
            .divider { border-top: 1px dashed #000000 !important; margin: 3px 0; }
            .grand { display: flex; justify-content: space-between; font-size: 11px; font-weight: 900 !important; margin-top: 2px; }
          </style>
        </head>
        <body>
          <h2>${companyName}</h2>
          <h3>ORDEN DE COMPRA</h3>
          <p>PROV: ${providerFilter} | ${dateStr}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th class="c-qty">CANT</th>
                <th class="c-desc">DESCRIPCIÓN</th>
                <th class="c-tot">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="grand"><span>TOTAL GENERAL:</span><span>$${totalCost.toFixed(2)}</span></div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleExportPDF = () => {
    if (itemsToOrder.length === 0) return alert('No hay artículos con piezas a pedir en la orden.');
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MISCELANEA BRITTANY';
    const address = settings.direccion || 'TUXTLA GUTIERREZ, CHIAPAS';
    const phone = settings.telefono || '';
    const dateStr = new Date().toLocaleString('es-MX');
    const folio = 'OC-' + Date.now().toString().slice(-6);

    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return alert('Permite ventanas emergentes para abrir la orden en PDF.');

    const rowsHtml = itemsToOrder.map((i, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 8px; font-family: monospace;">${i.sku || 'N/A'}</td>
        <td style="padding: 8px; font-weight: bold; text-transform: uppercase;">${i.name}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold;">${i.orderQty}</td>
        <td style="padding: 8px; text-align: right;">$${(i.cost || 0).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #059669;">$${((i.cost || 0) * i.orderQty).toFixed(2)}</td>
      </tr>
    `).join('');

    w.document.write(`
      <html>
        <head>
          <title>Orden_Compra_${folio}</title>
          <style>
            @page { size: letter; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
            .company-name { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .company-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .order-title { text-align: right; }
            .order-title h1 { margin: 0; font-size: 22px; color: #2563eb; font-weight: 900; }
            .order-title p { margin: 4px 0 0 0; font-size: 12px; font-family: monospace; font-weight: bold; color: #475569; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
            .info-grid strong { color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background-color: #1e293b; color: #ffffff; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { border-bottom: 1px solid #e2e8f0; }
            .summary-card { background: #ecfdf5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; text-align: right; width: 300px; margin-left: auto; }
            .summary-card p { margin: 4px 0; font-size: 12px; }
            .summary-card .total { font-size: 20px; font-weight: 900; color: #047857; margin-top: 8px; border-top: 1px solid #a7f3d0; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">${companyName}</div>
              <div class="company-sub">${address} ${phone ? ' | Tel: ' + phone : ''}</div>
            </div>
            <div class="order-title">
              <h1>ORDEN DE COMPRA</h1>
              <p>FOLIO: #${folio}</p>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <p><strong>PROVEEDOR:</strong> ${providerFilter}</p>
              <p><strong>FECHA EMISIÓN:</strong> ${dateStr}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>TOTAL PARTIDAS:</strong> ${itemsToOrder.length}</p>
              <p><strong>TOTAL PIEZAS:</strong> ${totalPieces} pzas</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 20%;">SKU</th>
                <th style="width: 45%;">DESCRIPCIÓN PRODUCTO</th>
                <th style="width: 10%; text-align: center;">CANT.</th>
                <th style="width: 12%; text-align: right;">COSTO U.</th>
                <th style="width: 13%; text-align: right;">TOTAL LÍNEA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary-card">
            <p>Subtotal: <strong>$${totalCost.toFixed(2)}</strong></p>
            <p>Total Piezas: <strong>${totalPieces} pzs</strong></p>
            <div class="total">TOTAL DE COMPRA: $${totalCost.toFixed(2)} MXN</div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">

      {/* HEADER */}
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">ÓRDENES DE COMPRA <span className="text-blue-500">(PRO)</span></h2>
            <p className="text-slate-400 text-sm uppercase font-bold">GENERA PEDIDOS CON INTELIGENCIA DE NEGOCIO Y ESTADÍSTICAS DE VENTA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavedOrdersModal(true)}
            className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 border border-nexus-700 px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-colors relative"
            title="Ver órdenes de compra guardadas"
          >
            <FileText className="w-4 h-4 text-blue-400" /> ÓRDENES GUARDADAS
            {pendingOrders.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                {pendingOrders.length}
              </span>
            )}
          </button>
          <button onClick={handlePrintTicket} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-colors">
            <Printer className="w-4 h-4" /> TICKET
          </button>
          <button onClick={handleExportPDF} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-colors">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleExportExcel} className="bg-[#25D366] hover:bg-[#20b858] text-white px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-[#25D366]/20 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> EXCEL
          </button>
          <button onClick={sendWhatsapp} className="bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 hover:bg-[#25D366]/30 transition-colors">
            <MessageCircle className="w-4 h-4" /> WHATSAPP
          </button>
          <button onClick={generateOrder} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-colors">
            <ShoppingCart className="w-4 h-4" /> {editingOrderId ? 'ACTUALIZAR ORDEN' : 'GUARDAR COMPRA'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">

        {/* NOTIFICACIÓN TOAST VISUAL SIN BLOQUEO NI CONGELAMIENTO */}
        {toastMsg && (
          <div className="bg-emerald-950 border border-emerald-500/60 p-4 rounded-2xl flex items-center justify-between text-emerald-200 text-sm font-black shrink-0 shadow-2xl animate-in fade-in duration-200">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* BANNER DE EDICIÓN DE ORDEN SI ESTÁ ACTIVO */}
        {editingOrderId && (
          <div className="bg-amber-950/80 border border-amber-500/50 p-3 rounded-2xl flex justify-between items-center text-amber-200 text-xs font-bold shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>EDITANDO ORDEN DE COMPRA: <strong className="text-white font-mono text-sm">#{editingFolio}</strong>. Puedes modificar cantidades, agregar más productos desde la lista o búsqueda y guardar los cambios.</span>
            </div>
            <button
              onClick={clearWorkingOrder}
              className="bg-amber-900/80 hover:bg-amber-800 border border-amber-500 text-amber-100 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-colors shrink-0"
            >
              Cancelar Edición
            </button>
          </div>
        )}

        {/* BARRA DE SELECCIÓN Y FILTRO POR PROVEEDOR */}
        <div className="flex justify-between items-center bg-nexus-900/40 border border-nexus-800 p-4 rounded-2xl shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => setMode('ESTADISTICAS')}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors ${mode === 'ESTADISTICAS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-nexus-900/80 text-slate-400 hover:bg-nexus-800'}`}
            >
              <TrendingUp className="w-4 h-4" /> OPCIÓN 1: ROTACIÓN / VENTAS (1-30 DÍAS)
            </button>
            <button
              onClick={() => setMode('MINMAX')}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors ${mode === 'MINMAX' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-nexus-900/80 text-slate-400 hover:bg-nexus-800'}`}
            >
              <AlertTriangle className="w-4 h-4" /> OPCIÓN 2: STOCK MÍN / MÁX
            </button>
            <button
              onClick={() => setMode('MANUAL')}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-colors ${mode === 'MANUAL' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-nexus-900/80 text-slate-400 hover:bg-nexus-800'}`}
            >
              <Package className="w-4 h-4" /> OPCIÓN 3: PEDIDO MANUAL
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" /> PROVEEDOR:
            </label>
            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="bg-nexus-900 border border-nexus-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs outline-none focus:border-blue-500 min-w-[240px]"
            >
              {uniqueProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* MAIN CONTENT AREA */}
          <div className="flex-[2] flex flex-col bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden">

            {/* ESTADISTICAS SETTINGS */}
            {mode === 'ESTADISTICAS' && (
              <div className="p-4 border-b border-nexus-800 bg-nexus-900/50 flex gap-6 items-center justify-between">
                <div className="flex gap-6 items-center">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Días Históricos Analizados</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 3, 7, 15, 30].map(d => (
                        <button
                          key={d}
                          onClick={() => setDaysToAnalyze(d)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${daysToAnalyze === d ? 'bg-blue-600 text-white' : 'bg-nexus-800 text-slate-400 hover:bg-nexus-700'}`}
                        >
                          {d}D
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={daysToAnalyze}
                        onChange={e => setDaysToAnalyze(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                        className="w-16 bg-nexus-800 border border-nexus-700 rounded-lg px-2 py-1 text-white text-center font-black outline-none focus:border-blue-500 text-xs"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Días</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Días Cobertura Stock</label>
                    <input
                      type="number"
                      value={daysToCover}
                      onChange={e => setDaysToCover(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 bg-nexus-800 border border-nexus-700 rounded-lg px-3 py-1 text-white text-center font-black outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAll"
                    checked={showAllForSupplier}
                    onChange={e => setShowAllForSupplier(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                  />
                  <label htmlFor="showAll" className="text-xs font-bold text-slate-300 cursor-pointer">
                    Mostrar catálogo completo del proveedor
                  </label>
                </div>
              </div>
            )}

            {/* MIN/MAX SETTINGS */}
            {mode === 'MINMAX' && (
              <div className="p-4 border-b border-nexus-800 bg-nexus-900/50 text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 w-4 h-4" />
                  Calcula mercancía necesaria para reponer el stock hasta el nivel Máximo cuando esté por debajo del Mínimo.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showAllMin"
                    checked={showAllForSupplier}
                    onChange={e => setShowAllForSupplier(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                  />
                  <label htmlFor="showAllMin" className="text-xs font-bold text-slate-300 cursor-pointer">
                    Mostrar catálogo completo
                  </label>
                </div>
              </div>
            )}

            {/* MANUAL SEARCH */}
            {mode === 'MANUAL' && (
              <div className="p-4 border-b border-nexus-800 bg-nexus-900/50 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU para agregar al pedido libre..."
                    value={manualSearch}
                    onChange={e => setManualSearch(e.target.value)}
                    className="w-full bg-nexus-800 border border-nexus-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-4 right-4 mt-1 bg-nexus-900 border border-nexus-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {searchResults.map(p => (
                      <div key={p.id} onClick={() => addToManualCart(p)} className="p-3 border-b border-nexus-800 hover:bg-nexus-800 cursor-pointer flex justify-between items-center transition-colors">
                        <div>
                          <p className="font-black text-white text-xs uppercase">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | Stock Actual: {p.stock} | Costo: ${(p.cost||0).toFixed(2)}</p>
                        </div>
                        <Plus className="text-emerald-400 w-5 h-5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIST AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-4">
                {activeList.map((item) => (
                  <div key={item.id} className="bg-[#0b1120] border border-nexus-800 p-4 rounded-2xl flex items-center gap-6 hover:border-nexus-700 transition-all">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode === 'ESTADISTICAS' ? 'bg-blue-900/30 text-blue-500 border border-blue-500/20' : mode === 'MINMAX' ? 'bg-amber-900/30 text-amber-500 border border-amber-500/20' : 'bg-emerald-900/30 text-emerald-500 border border-emerald-500/20'}`}>
                      {mode === 'MANUAL' ? <Package className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-black text-white text-sm uppercase">{item.name}</h4>
                      <p className="text-xs font-bold text-slate-400 font-mono mt-0.5">SKU: {item.sku} | Costo Unitario: ${(item.cost || 0).toFixed(2)}</p>
                      {mode === 'ESTADISTICAS' && (
                        <p className="text-[10px] font-bold text-blue-400 mt-1">
                          Ventas en {daysToAnalyze} días: <span className="text-white">{item.sold || 0} pzas</span> (Promedio: {(item.dailyAverage || 0).toFixed(1)} u/día)
                        </p>
                      )}
                      {mode === 'MINMAX' && (
                        <p className="text-[10px] font-bold text-amber-400 mt-1">
                          Mínimo: <span className="text-white">{item.min}</span> | Máximo: <span className="text-white">{item.max}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-center px-4 border-x border-nexus-800">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stock Actual</p>
                      <p className={`text-xl font-black ${item.stock <= (item.min_stock || 5) ? 'text-red-500' : 'text-slate-300'}`}>{item.stock}</p>
                    </div>

                    <div className="text-center px-4">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${mode === 'MANUAL' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        Cantidad a Pedir
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrderQty(item.id!, Math.max(0, (item.orderQty || 1) - 1))}
                          className="w-8 h-8 bg-nexus-900 border border-nexus-700 text-white rounded-lg font-black hover:bg-nexus-800 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.orderQty}
                          onChange={(e) => updateOrderQty(item.id!, Number(e.target.value))}
                          className="w-16 bg-nexus-900 border border-blue-500/50 text-white font-black text-center py-1 rounded-lg focus:outline-none focus:border-blue-400 text-base"
                        />
                        <button
                          onClick={() => updateOrderQty(item.id!, (item.orderQty || 0) + 1)}
                          className="w-8 h-8 bg-nexus-900 border border-nexus-700 text-white rounded-lg font-black hover:bg-nexus-800 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-xs text-slate-400 font-bold">PZAS</span>
                      </div>
                    </div>

                    <div className="text-right px-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Línea</p>
                      <p className="text-lg font-black text-emerald-400">${((item.cost || 0) * (item.orderQty || 1)).toFixed(2)}</p>
                    </div>

                    {mode === 'MANUAL' && (
                      <button onClick={() => removeManualItem(item.id!)} className="text-slate-500 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {activeList.length === 0 && (
                  <div className="py-20 text-center opacity-70">
                    <Truck className={`w-16 h-16 mx-auto mb-4 ${mode === 'MANUAL' ? 'text-emerald-500' : 'text-blue-500'}`} />
                    <h3 className={`text-xl font-black uppercase ${mode === 'MANUAL' ? 'text-emerald-500' : 'text-blue-500'}`}>
                      {mode === 'MANUAL' ? 'Pedido Libre Vacío' : 'Sin Sugerencias de Compra'}
                    </h3>
                    <p className="font-bold text-slate-400 mt-2 text-sm">
                      {mode === 'ESTADISTICAS' ? 'Selecciona un proveedor o marca "Mostrar catálogo completo" para solicitar mercancía.' :
                       mode === 'MINMAX' ? 'Todos los productos están sobre el stock mínimo.' :
                       'Busca y agrega productos para armar tu pedido libre.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PANEL LATERAL: RESUMEN Y ACCIONES */}
          <div className="w-80 flex flex-col gap-6">
            <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-black text-white uppercase tracking-widest text-xs mb-4">INVERSIÓN ESTIMADA</h3>
              <div className={`text-4xl font-black mb-2 ${mode === 'ESTADISTICAS' ? 'text-blue-400' : mode === 'MINMAX' ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${totalCost.toFixed(2)}
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 border-t border-nexus-800/80 pt-3 mt-3">
                <span>Partidas a pedir:</span>
                <span className="text-white font-black">{activeList.length}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
                <span>Total de Piezas:</span>
                <span className="text-emerald-400 font-black">{totalPieces} pzas</span>
              </div>
            </div>

            <div className="flex-1 bg-nexus-900/30 border border-nexus-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <Truck className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
              <h4 className="font-black text-white text-sm uppercase mb-2">ORDEN DE COMPRA INTELIGENTE</h4>
              <p className="text-xs font-bold text-slate-400 mb-6">El pedido se exportará formateado en Excel, WhatsApp o guardado en el módulo de Compras.</p>

              <div className="w-full space-y-3">
                <button onClick={handleExportExcel} className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-colors">
                  <FileSpreadsheet className="w-4 h-4" /> DESCARGAR EXCEL
                </button>
                <button onClick={sendWhatsapp} className="w-full bg-nexus-800 hover:bg-nexus-700 text-[#25D366] border border-[#25D366]/30 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors">
                  <MessageCircle className="w-4 h-4" /> ENVIAR POR WHATSAPP
                </button>
                <button onClick={generateOrder} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-colors">
                  <ShoppingCart className="w-4 h-4" /> GUARDAR EN COMPRAS
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE ÓRDENES GUARDADAS */}
      {showSavedOrdersModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-nexus-700 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-nexus-900/90 border-b border-nexus-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="w-7 h-7 text-blue-400" />
                <div>
                  <h3 className="font-black text-xl text-white uppercase tracking-wider">Órdenes de Compra Guardadas</h3>
                  <p className="text-slate-400 text-xs font-bold">CARGA, EDITA O ENVÍA PEDIDOS A ENTRADA DE MERCADERÍA</p>
                </div>
              </div>
              <button onClick={() => setShowSavedOrdersModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-nexus-800 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Filter & Tabs */}
            <div className="p-4 bg-nexus-900/50 border-b border-nexus-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Pestañas */}
              <div className="flex bg-nexus-950 p-1 rounded-xl border border-nexus-800">
                <button
                  onClick={() => setOrdersTab('PENDIENTES')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-colors ${
                    ordersTab === 'PENDIENTES'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PENDIENTES DE PEDIR ({pendingOrders.length})
                </button>
                <button
                  onClick={() => setOrdersTab('RECIBIDAS')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-colors ${
                    ordersTab === 'RECIBIDAS'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  HISTORIAL RECIBIDAS ({receivedOrders.length})
                </button>
              </div>

              {/* Buscador */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={savedOrdersSearch}
                  onChange={e => setSavedOrdersSearch(e.target.value)}
                  placeholder="Buscar por folio o proveedor..."
                  className="w-full bg-[#0b1120] border border-nexus-700 text-white pl-9 pr-4 py-2 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {filteredSavedOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-500 font-bold">
                  {ordersTab === 'PENDIENTES'
                    ? 'No hay pedidos pendientes de comprar. Las entradas ya recibidas se archivan en el almacén.'
                    : 'No hay órdenes recibidas registradas en el historial.'}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">FOLIO</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">FECHA</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">PROVEEDOR</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">PARTIDAS / PIEZAS</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">TOTAL</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800/60">
                    {filteredSavedOrders.map(ord => {
                      const pieces = (ord.items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0);
                      const itemsCount = (ord.items || []).length;
                      return (
                        <tr key={ord.id || ord.folio} className="hover:bg-nexus-800/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-400 text-xs">
                            {ord.folio}
                            {ord.status === 'RECIBIDA' && (
                              <span className="ml-2 text-[9px] bg-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/50">
                                SURTIDA
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 text-xs font-bold">{new Date(ord.date).toLocaleDateString('es-MX')}</td>
                          <td className="p-3 text-white text-xs font-black uppercase">{ord.provider || 'TODOS'}</td>
                          <td className="p-3 text-center text-xs font-bold text-slate-300">{itemsCount} part / {pieces} pzs</td>
                          <td className="p-3 text-right font-mono font-black text-emerald-400 text-xs">${(ord.total || 0).toFixed(2)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {ordersTab === 'PENDIENTES' ? (
                                <>
                                  <button
                                    onClick={() => handleLoadSavedOrder(ord)}
                                    className="bg-blue-900/40 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-700/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Cargar orden para modificar cantidades o agregar productos"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Editar
                                  </button>
                                  <button
                                    onClick={() => handleTransferToEntradas(ord)}
                                    className="bg-emerald-900/40 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700/50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Enviar esta orden a Entrada de Mercadería para recibir stock"
                                  >
                                    <Truck className="w-3.5 h-3.5" /> Cargar en Entradas
                                  </button>
                                  <button
                                    onClick={() => ord.id && handleMarkAsReceived(ord.id)}
                                    className="bg-purple-900/40 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-700/50 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                    title="Marcar orden como surtida/recibida sin pasar por almacén"
                                  >
                                    ✓ Recibida
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleLoadSavedOrder(ord)}
                                  className="bg-nexus-800 hover:bg-nexus-700 text-slate-300 hover:text-white border border-nexus-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                  title="Ver detalles o volver a usar como borrador"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Ver / Reusar
                                </button>
                              )}
                              <button
                                onClick={() => ord.id && handleDeleteSavedOrder(ord.id)}
                                className="p-1.5 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors border border-red-900/30"
                                title="Eliminar orden guardada"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
