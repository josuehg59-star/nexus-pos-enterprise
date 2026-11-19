import { useState, useRef } from 'react';
import { useSettings } from '../store/useSettings';
import { compressImageFile } from '../utils/imageCompressor';
import { useLiveQuery } from 'dexie-react-hooks';

import { Server, ShieldCheck, SmartphoneNfc, Download, AlertTriangle, UploadCloud, Search, Save, CreditCard, Wifi, Radio, RefreshCw } from 'lucide-react';
import { downloadProductsFromMaster } from '../store/syncClient';
import { db } from '../store/database';
import { buildBackup, downloadBackupFile, restoreBackup, backupToDisk } from '../store/backup';

export default function Config() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualBackupRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey, clipSecretKey, clipSerialNumber, clipModo, bancoDefault, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey: clipApiKey || '', clipSecretKey: clipSecretKey || '', clipSerialNumber: clipSerialNumber || '', clipModo: clipModo || 'MANUAL', bancoDefault: bancoDefault || 'BBVA / BANCOMER' });
  const [testConnStatus, setTestConnStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testConnMsg, setTestConnMsg] = useState('');
  const [syncProdsStatus, setSyncProdsStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [syncProdsMsg, setSyncProdsMsg] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMINISTRADOR' | 'CAJERO' | 'AUDITOR'>('CAJERO');
  const [newUserPin, setNewUserPin] = useState('0000');
  const [clipTesting, setClipTesting] = useState(false);
  const [clipTestResult, setClipTestResult] = useState<{ ok?: boolean; message?: string } | null>(null);

  const recentLogs = useLiveQuery(() => db.kardex.reverse().limit(15).toArray(), []) || [];


  // MIGRACIÓN TITAN POS (Lo usaremos para el botón "Restaurar Respaldo" si es Titan, o dejaremos que "Restaurar Respaldo" sea inteligente)

  
  const handleTestConnection = async () => {
    const ip = (localSettings.servidorIp || '').trim();
    if (!ip) {
      alert('Ingresa la dirección IP de la Caja 1 Principal (ejemplo: 192.168.100.38:3008)');
      return;
    }
    setTestConnStatus('LOADING');
    setTestConnMsg('Probando conexión con el Servidor de la Caja 1...');
    try {
      let cleanIp = ip.endsWith('/') ? ip.slice(0, -1) : ip;
      if (!cleanIp.includes(':')) cleanIp = `${cleanIp}:3008`;
      const baseUrl = cleanIp.startsWith('http') ? cleanIp : `http://${cleanIp}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      let res = await fetch(`${baseUrl}/api/health`, { signal: controller.signal }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${baseUrl}/api/ping`, { signal: controller.signal }).catch(() => null);
      }
      clearTimeout(timer);
      if (!res || !res.ok) throw new Error(`HTTP ${res?.status || 'Error'}`);
      const data = await res.json();
      setTestConnStatus('SUCCESS');
      setTestConnMsg(`✅ ¡Conexión Exitosa! Servidor Caja 1 ONLINE${data.productsCount !== undefined ? ` (${data.productsCount} productos disponibles)` : ' y respondiendo'}.`);
    } catch (err: any) {
      setTestConnStatus('ERROR');
      setTestConnMsg(`❌ No se pudo conectar con ${ip}. Verifica que la Caja 1 esté encendida, con el sistema abierto y en la misma red Wi-Fi.`);
    }
  };

  const handleSyncCatalogFromMaster = async () => {
    const ip = (localSettings.servidorIp || '').trim();
    if (!ip) {
      alert('Ingresa la dirección IP de la Caja 1 Principal');
      return;
    }
    if (!window.confirm(`¿Deseas descargar y sincronizar el catálogo de productos desde la Caja 1 (${ip})?`)) return;
    setSyncProdsStatus('LOADING');
    setSyncProdsMsg('Descargando catálogo maestro desde la Caja 1...');
    try {
      const result = await downloadProductsFromMaster();
      if (!result.success || result.count === 0) {
        setSyncProdsStatus('ERROR');
        setSyncProdsMsg(`⚠️ Error al sincronizar: ${result.error || 'La Caja 1 no devolvió productos.'}`);
        return;
      }
      setSyncProdsStatus('SUCCESS');
      setSyncProdsMsg(`✅ ¡Catálogo Sincronizado! Se descargaron y actualizaron ${result.count} productos desde la Caja 1.`);
    } catch (err: any) {
      setSyncProdsStatus('ERROR');
      setSyncProdsMsg(`❌ Error descargando catálogo: ${err.message}`);
    }
  };

  const handleSaveNetworkBoxSettings = () => {
    setSettings({
      cajaNombre: localSettings.cajaNombre,
      servidorIp: localSettings.servidorIp
    });
    alert(`✅ Configuración de Caja Móvil Guardada Exitosamente:\n\n  Terminal: ${localSettings.cajaNombre}\n  IP Servidor Principal: ${localSettings.servidorIp}`);
  };

  const handleRestablecerTodo = async () => {
    if (window.confirm("¿ESTÁS SEGURO? ESTO BORRARÁ TODA LA BASE DE DATOS. SE GUARDARÁ UN RESPALDO ANTES DE BORRAR.")) {
      try {
        const data = await buildBackup();
        downloadBackupFile(data);
        await backupToDisk();
      } catch (e) {
        if (!window.confirm('No se pudo crear el respaldo previo. ¿Borrar de todos modos?')) return;
      }
      await Promise.all([db.products, db.clients, db.providers, db.tickets, db.kardex, db.cortes, db.turnos].map(t => t.clear()));
      alert("SISTEMA RESTABLECIDO. EL RESPALDO PREVIO FUE DESCARGADO Y GUARDADO.");
      window.location.reload();
    }
  };

  const handleSmartRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMigrating(true);
    setMigrationMsg('Analizando archivo de respaldo (esto puede tardar unos segundos con archivos grandes)...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedData = JSON.parse(text);
        
        // 1. Detectar si es TITAN
        if (parsedData.data && parsedData.data.products) {
          
          setMigrationMsg('Mapeando categorías y proveedores...');
          const categoryIdToName = new Map<string, string>();
          if (Array.isArray(parsedData.data.categories)) {
            for (const cat of parsedData.data.categories) {
              if (cat.id !== undefined && cat.name) {
                categoryIdToName.set(String(cat.id), String(cat.name).trim());
              }
            }
          }

          const existingProducts = await db.products.toArray();
          const skuToId = new Map(existingProducts.map(p => [p.sku.toLowerCase(), p.id]));
          const nameToId = new Map(existingProducts.map(p => [p.name.trim().toUpperCase(), p.id]));
          
          const existingClients = await db.clients.toArray();
          const clientNameToId = new Map(existingClients.map(c => [String(c.name).trim().toUpperCase(), c.id]));
          
          const existingProviders = await db.providers.toArray();
          const providerNameToId = new Map(existingProviders.map(p => [String(p.name).trim().toUpperCase(), p.id]));
          const providerIdToName = new Map<string, string>();

          // Procesar proveedores PRIMERO para resolver IDs numéricos como 33 -> "AGUA CIEL / COCA COLA"
          if (Array.isArray(parsedData.data.suppliers)) {
            setMigrationMsg('Actualizando catálogo de proveedores...');
            for (const s of parsedData.data.suppliers) {
              const provName = String(s.name || s.company || 'Proveedor Migrado').trim().toUpperCase();
              const existingId = providerNameToId.get(provName);
              const savedId = await db.providers.put({
                ...(existingId ? { id: existingId } : {}),
                name: provName,
                company: s.company || provName,
                phone: s.phone || '',
                email: s.email || '',
                contact: s.contact_name || s.contact || '',
                address: s.address || '',
                rfc: s.rfc || ''
              });
              providerNameToId.set(provName, savedId);
              if (s.id !== undefined && s.id !== null) {
                providerIdToName.set(String(s.id), provName);
              }
              providerIdToName.set(provName, provName);
            }
          }

          // Procesar productos en lotes
          if (Array.isArray(parsedData.data.products)) {
            const rawProds = parsedData.data.products;
            setMigrationMsg(`Sincronizando ${rawProds.length} productos...`);
            const BATCH_SIZE = 500;
            for (let i = 0; i < rawProds.length; i += BATCH_SIZE) {
              const chunk = rawProds.slice(i, i + BATCH_SIZE);
              const productsBatch = [];
              for (const p of chunk) {
                const finalSku = String(p.sku || p.barcode || String(p.id)).trim();
                const nameUpper = String(p.name || '').trim().toUpperCase();
                if (!nameUpper) continue;

                const existingId = skuToId.get(finalSku.toLowerCase()) || nameToId.get(nameUpper);

                const rawSupp = String(p.supplier_id || p.supplier_name || p.supplier || '').trim();
                const resolvedSupplier = providerIdToName.get(rawSupp) || (isNaN(Number(rawSupp)) && rawSupp ? rawSupp.toUpperCase() : 'GENERAL');

                let categoryClean = categoryIdToName.get(String(p.category_id)) || String(p.category || p.departamento || '').trim();
                if (!categoryClean || !isNaN(Number(categoryClean))) {
                  categoryClean = 'General';
                }

                const altSet = new Set<string>();
                if (p.barcode && String(p.barcode).trim() !== finalSku) {
                  altSet.add(String(p.barcode).trim());
                }
                if (p.alias) {
                  String(p.alias).split(',').forEach(a => {
                    const cleanA = a.trim();
                    if (cleanA && cleanA !== finalSku) altSet.add(cleanA);
                  });
                }
                const altArray = Array.from(altSet);
                const b2 = altArray.length > 0 ? altArray.join(', ') : undefined;

                productsBatch.push({
                  ...(existingId ? { id: existingId } : {}),
                  sku: finalSku,
                  name: nameUpper,
                  category: categoryClean,
                  supplier_id: resolvedSupplier,
                  price: parseFloat(p.price) || 0,
                  cost: parseFloat(p.cost) || 0,
                  stock: parseFloat(p.stock) || 0,
                  unit_measure: p.unit_measure || 'PZA',
                  min_stock: parseFloat(p.min_stock) || 1,
                  max_stock: parseFloat(p.max_stock) || 10,
                  status: 'ACTIVO',
                  description: p.description || nameUpper,
                  promo_qty: parseFloat(p.promoQty || p.promo_qty) || undefined,
                  promo_price: parseFloat(p.promoPrice || p.promo_price) || undefined,
                  barcode2: b2
                });
              }
              await db.products.bulkPut(productsBatch);
              await new Promise(r => setTimeout(r, 0));
            }
          }

          // Procesar clientes
          if (Array.isArray(parsedData.data.clients)) {
            setMigrationMsg('Actualizando clientes y monederos...');
            const clients = parsedData.data.clients.map((c: any) => {
              const existingId = clientNameToId.get(String(c.name).trim().toUpperCase());
              return {
                ...(existingId ? { id: existingId } : {}),
                name: c.name,
                phone: c.phone || '',
                email: c.email || '',
                type: c.type || 'General',
                monedero: parseFloat(c.monedero) || 0,
                credito: parseFloat(c.credito) || 0,
                monederoCode: c.monederoCode || ''
              };
            });
            await db.clients.bulkPut(clients);
          }

          // Procesar ventas en lotes (batch size = 500) para evitar timeouts en archivos de 30,000+ tickets
          if (Array.isArray(parsedData.data.sales)) {
            const rawSales = parsedData.data.sales;
            const totalSalesCount = rawSales.length;
            const BATCH_SIZE = 500;

            for (let i = 0; i < totalSalesCount; i += BATCH_SIZE) {
              const chunk = rawSales.slice(i, i + BATCH_SIZE);
              const ticketBatch = chunk.map((s: any) => {
                let cartItems = [];
                try {
                  cartItems = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []);
                } catch(e) {}

                const normalizedItems = cartItems.map((item: any) => ({
                  id: item.product_id || item.id || crypto.randomUUID(),
                  sku: item.sku || String(item.product_id || ''),
                  name: item.product_name || item.name || 'Producto Migrado',
                  price: parseFloat(item.price) || 0,
                  cost: parseFloat(item.cost) || 0,
                  cartQty: parseFloat(item.qty || item.cartQty) || 1,
                  lineTotal: parseFloat(item.subtotal || item.total) || ((parseFloat(item.price) || 0) * (parseFloat(item.qty || item.cartQty) || 1))
                }));

                let dateFormatted = new Date().toISOString();
                if (s.date) {
                  const d = typeof s.date === 'number' ? new Date(s.date) : new Date(s.date);
                  if (!isNaN(d.getTime())) dateFormatted = d.toISOString();
                }

                let met = String(s.payment_method || 'EFECTIVO').toUpperCase();
                if (met === 'CASH') met = 'EFECTIVO';
                else if (met === 'CARD') met = 'TARJETA';
                else if (met === 'TRANSFER') met = 'TRANSFERENCIA';
                else if (met === 'CREDIT') met = 'CRÉDITO';

                return {
                  id: s.id ? String(s.id) : `tkt-${dateFormatted}-${s.total}`.replace(/[^a-zA-Z0-9-]/g, ''),
                  folio: typeof s.id === 'number' ? s.id : parseInt(String(s.id).replace(/\D/g, '')) || undefined,
                  date: dateFormatted,
                  total: parseFloat(s.total) || 0,
                  paymentMethod: met,
                  items: normalizedItems,
                  clientName: s.client_name || 'PUBLICO GENERAL',
                  status: 'COMPLETADO',
                  monedero_earned: 0
                };
              });

              await db.tickets.bulkPut(ticketBatch);
              const processed = Math.min(totalSalesCount, i + BATCH_SIZE);
              const pct = Math.round((processed / totalSalesCount) * 100);
              setMigrationMsg(`Importando ventas: ${processed.toLocaleString()} / ${totalSalesCount.toLocaleString()} (${pct}%)...`);
              await new Promise(r => setTimeout(r, 5));
            }
          }

          // Procesar Cortes de Caja (cash_cuts)
          if (Array.isArray(parsedData.data.cash_cuts)) {
            setMigrationMsg('Sincronizando cortes de caja...');
            const cortesBatch = parsedData.data.cash_cuts.map((c: any) => ({
              ...(c.id ? { id: typeof c.id === 'number' ? c.id : undefined } : {}),
              date: c.date ? new Date(c.date).toISOString() : new Date().toISOString(),
              fondoInicial: parseFloat(c.initial_fund || c.fondo_inicial) || 0,
              ventasEfectivo: parseFloat(c.cash_sales || c.ventas_efectivo) || 0,
              ventasTarjeta: parseFloat(c.card_sales || c.ventas_tarjeta) || 0,
              ventasTransferencia: parseFloat(c.transfer_sales || c.ventas_transferencia) || 0,
              totalVentas: parseFloat(c.total_sales || c.total_ventas) || 0,
              totalFisico: parseFloat(c.physical_total || c.total_fisico) || 0,
              ticketsCount: parseFloat(c.tickets_count) || 0
            }));
            await db.cortes.bulkPut(cortesBatch);
          }

          // Procesar Compras / Entradas de Inventario (purchases, compras, inventory_movements, kardex, entradas)
          const kardexBatch: any[] = [];
          const comprasBatch: any[] = [];

          const rawPurchases = parsedData.data.purchases || parsedData.data.compras || parsedData.purchases || parsedData.compras || [];
          if (Array.isArray(rawPurchases) && rawPurchases.length > 0) {
            setMigrationMsg('Sincronizando entradas de mercancía y compras...');
            for (const pur of rawPurchases) {
              let dateStr = new Date().toISOString().split('T')[0];
              if (pur.date || pur.fecha || pur.created_at) {
                const d = new Date(pur.date || pur.fecha || pur.created_at);
                if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
              }

              const rawSupp = String(pur.supplier_name || pur.supplier || pur.provider || pur.supplier_id || '').trim();
              const resolvedSupp = providerIdToName.get(rawSupp) || (isNaN(Number(rawSupp)) && rawSupp ? rawSupp.toUpperCase() : 'GENERAL');
              const folioStr = String(pur.folio || pur.id || `COMP-${Date.now()}`);

              let itemsArr: any[] = [];
              if (Array.isArray(pur.items)) {
                itemsArr = pur.items;
              } else if (typeof pur.items === 'string') {
                try { itemsArr = JSON.parse(pur.items); } catch(e) {}
              }

              if (itemsArr.length > 0) {
                for (const item of itemsArr) {
                  const itemSku = String(item.sku || item.barcode || item.product_id || '').trim();
                  const itemName = String(item.name || item.product_name || 'PRODUCTO MIGRADO').trim().toUpperCase();
                  const qty = parseFloat(item.qty || item.quantity || item.cantidad) || 1;
                  const cost = parseFloat(item.cost || item.costo || item.price) || 0;
                  const total = parseFloat(item.total || item.subtotal) || (qty * cost);

                  kardexBatch.push({
                    fecha: dateStr,
                    tipo: 'ENTRADA',
                    sku: itemSku,
                    productName: itemName,
                    cantidad: qty,
                    costo: cost,
                    precio: parseFloat(item.price || item.precio) || cost,
                    total: total,
                    folio: folioStr,
                    proveedor: resolvedSupp
                  });
                }

                comprasBatch.push({
                  folio: folioStr,
                  date: dateStr,
                  provider: resolvedSupp,
                  items: itemsArr,
                  subtotal: parseFloat(pur.subtotal) || parseFloat(pur.total) || 0,
                  total: parseFloat(pur.total) || 0
                });
              } else if (pur.sku || pur.product_name || pur.productName || pur.name) {
                const qty = parseFloat(pur.qty || pur.quantity || pur.cantidad) || 1;
                const cost = parseFloat(pur.cost || pur.costo) || 0;
                kardexBatch.push({
                  fecha: dateStr,
                  tipo: 'ENTRADA',
                  sku: String(pur.sku || '').trim(),
                  productName: String(pur.product_name || pur.productName || pur.name || '').trim().toUpperCase(),
                  cantidad: qty,
                  costo: cost,
                  precio: parseFloat(pur.price || pur.precio) || cost,
                  total: parseFloat(pur.total) || (qty * cost),
                  folio: folioStr,
                  proveedor: resolvedSupp
                });
              }
            }
          }

          const rawMovements = parsedData.data.inventory_movements || parsedData.data.kardex || parsedData.data.entradas || parsedData.inventory_movements || parsedData.kardex || parsedData.entradas || [];
          if (Array.isArray(rawMovements) && rawMovements.length > 0) {
            setMigrationMsg('Sincronizando movimientos de inventario...');
            for (const mov of rawMovements) {
              let dateStr = new Date().toISOString().split('T')[0];
              if (mov.fecha || mov.date || mov.created_at) {
                const d = new Date(mov.fecha || mov.date || mov.created_at);
                if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
              }
              const rawSupp = String(mov.proveedor || mov.supplier || mov.provider || '').trim();
              const resolvedSupp = providerIdToName.get(rawSupp) || (isNaN(Number(rawSupp)) && rawSupp ? rawSupp.toUpperCase() : 'GENERAL');
              
              let rawTipo = String(mov.tipo || mov.type || 'ENTRADA').toUpperCase();
              if (rawTipo === 'IN' || rawTipo === 'PURCHASE' || rawTipo === 'COMPRA') rawTipo = 'ENTRADA';
              else if (rawTipo === 'OUT' || rawTipo === 'WASTE' || rawTipo === 'LOSS') rawTipo = 'MERMA';
              else if (rawTipo === 'RETURN') rawTipo = 'DEVOLUCION';

              const qty = parseFloat(mov.cantidad || mov.qty || mov.quantity) || 1;
              const cost = parseFloat(mov.costo || mov.cost) || 0;

              kardexBatch.push({
                fecha: dateStr,
                tipo: rawTipo,
                sku: String(mov.sku || mov.barcode || '').trim(),
                productName: String(mov.productName || mov.product_name || mov.name || 'PRODUCTO MIGRADO').trim().toUpperCase(),
                cantidad: qty,
                costo: cost,
                precio: parseFloat(mov.precio || mov.price) || cost,
                total: parseFloat(mov.total) || (qty * cost),
                folio: String(mov.folio || mov.id || ''),
                proveedor: resolvedSupp
              });
            }
          }

          if (kardexBatch.length > 0) {
            await db.kardex.bulkPut(kardexBatch);
          }
          if (comprasBatch.length > 0) {
            await db.compras.bulkPut(comprasBatch);
          }

          setMigrationMsg('¡Respaldo TITAN sincronizado y actualizado con éxito sin duplicar!');
          setTimeout(() => {
            setIsMigrating(false);
            setMigrationMsg('');
          }, 3000);
          return;
        }

        // 2. Si es formato NEXUS (Copia directa)
        if (parsedData.version && parsedData.type === 'nexus_backup') {
          setMigrationMsg('Formato NEXUS detectado. Restaurando...');
          await restoreBackup(parsedData, false);
          
          setMigrationMsg('¡Restauración completa!');
          setTimeout(() => {
            setIsMigrating(false);
            setMigrationMsg('');
          }, 3000);
        } else {
          throw new Error("Formato no reconocido");
        }
      } catch (err) {
        console.error(err);
        setMigrationMsg('Error: El archivo no es un respaldo válido de TITAN o NEXUS.');
        setTimeout(() => setIsMigrating(false), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLogoUploading(true);
        const compressed = await compressImageFile(file, 350, 350, 0.85);
        setLocalSettings(prev => ({ ...prev, logo: compressed }));
        setSettings({ logo: compressed });
        setLogoMsg('✅ ¡Logo guardado exitosamente!');
        setTimeout(() => setLogoMsg(''), 4000);
      } catch (err: any) {
        alert('Error al procesar la imagen: ' + (err.message || 'Formato no válido'));
      } finally {
        setLogoUploading(false);
      }
    }
    e.target.value = '';
  };

  const removeLogo = () => {
    setLocalSettings(prev => ({ ...prev, logo: '' }));
    setSettings({ logo: '' });
  };

  const downloadManualBackup = async () => {
    downloadBackupFile(await buildBackup());
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-y-auto custom-scrollbar p-8">
      
      {/* HEADER TIPO VIEJO DISEÑO */}
      <div className="mb-8">
        <h2 className="font-black text-3xl tracking-wider text-white">13. PANEL DE <span className="text-white">CONTROL</span></h2>
        <p className="text-slate-400 text-xs tracking-widest mt-1">PERSONALIZA TU TERMINAL Y GESTIONA TUS DATOS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-6">
          {/* MIGRACIÓN TITAN */}
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-blue-900/50 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Server className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Migrador Inteligente TITAN POS</h3>
                  <p className="text-slate-400 text-xs mt-1 mb-4 leading-relaxed max-w-md">
                    Carga tus respaldos viejos en formato JSON de Titan. El motor convertirá el catálogo completo (con promos y códigos) y tus ventas.
                  </p>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleSmartRestore} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isMigrating} className="bg-[#2a68ff] hover:bg-[#1a55e6] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" /> {isMigrating ? migrationMsg : 'SUBIR RESPALDO TITAN (.JSON)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          
          {/* SINCRONIZACIÓN Y RED LOCAL */}
          <div className="bg-nexus-900/30 border border-blue-900/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Server className="text-blue-500 w-5 h-5" />
              <h3 className="font-black text-blue-500 uppercase tracking-widest text-sm">SINCRONIZACIÓN Y RED LOCAL</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">NOMBRE DE ESTA TERMINAL</label>
                <input type="text" defaultValue="Terminal-Principal" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ROL DE OPERACIÓN</label>
                <select className="w-full bg-nexus-900 border border-nexus-700 text-yellow-500 px-4 py-3 rounded-xl font-black focus:border-blue-500 outline-none appearance-none cursor-pointer">
                  <option value="maestro">👑 SERVIDOR MAESTRO</option>
                  <option value="esclavo">ESCLAVO (CAJA SECUNDARIA)</option>
                </select>
              </div>
            </div>
            <button onClick={() => alert("Ajustes de red guardados correctamente.")} className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> GUARDAR AJUSTES DE RED
            </button>
          </div>

          {/* DATOS DEL NEGOCIO */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="mb-6">
               <h3 className="font-black text-white text-xl tracking-widest">DATOS DEL NEGOCIO</h3>
               <p className="text-slate-400 text-xs">Información general y configuración de pagos</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">NOMBRE COMERCIAL</label>
                  <input type="text" value={localSettings.nombreNegocio} onChange={e=>setLocalSettings({...localSettings, nombreNegocio: e.target.value})} className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">IDENTIFICACIÓN FISCAL / RFC</label>
                  <input type="text" value={localSettings.rfc} onChange={e=>setLocalSettings({...localSettings, rfc: e.target.value})} className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">SLOGAN / FRASE DEL TICKET</label>
                  <input type="text" value={localSettings.eslogan} onChange={e=>setLocalSettings({...localSettings, eslogan: e.target.value})} className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold outline-none" />
                </div>
                
                <div className="mt-4 inline-flex items-center gap-2 bg-emerald-900/20 border border-emerald-900/50 text-emerald-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> MODO ESCRITORIO ACTIVADO
                </div>
              </div>

              {/* LOGO BOX */}
              <div className="w-full sm:w-44 shrink-0 flex flex-col items-center p-4 bg-nexus-950/80 rounded-2xl border border-nexus-700">
                <label className="text-[11px] font-black text-amber-400 uppercase tracking-wider block mb-2 text-center">
                  LOGOTIPO DEL NEGOCIO
                </label>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-2 mb-3 cursor-pointer border-2 border-dashed border-amber-400/50 hover:border-amber-400 transition-colors overflow-hidden relative shadow-lg"
                >
                  {localSettings.logo ? (
                    <img src={localSettings.logo} alt="Logo Negocio" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-slate-400 font-bold text-center flex flex-col items-center">
                      <span className="text-3xl mb-1">📸</span>
                      <span className="text-[10px] uppercase font-black">SIN LOGO</span>
                    </div>
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-white text-xs font-black">
                      Guardando...
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()} 
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>📷</span> <span>{localSettings.logo ? 'CAMBIAR LOGO' : 'SUBIR LOGO'}</span>
                  </button>
                  {localSettings.logo && (
                    <button 
                      type="button"
                      onClick={removeLogo} 
                      className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 py-1.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                    >
                      QUITAR LOGO
                    </button>
                  )}
                  {logoMsg && (
                    <span className="text-[10px] text-emerald-400 font-bold text-center">{logoMsg}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CONFIGURACIÓN DE CAJAS MÚLTIPLES (1 A 10 CAJAS) Y ROLES DE USUARIO */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="font-black text-white text-xl tracking-widest uppercase">CONFIGURACIÓN DE CAJAS Y USUARIOS</h3>
              <p className="text-slate-400 text-xs">Gestión de Terminales Cajas (1 a 10) y Perfiles de Cajeros/Administradores</p>
            </div>

            <div className="space-y-6">
              {/* SELECCIÓN DE CAJA TERMINAL Y ENLACE DE RED */}
              <div className="bg-[#0b1120] border border-blue-500/40 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-white font-black text-sm uppercase">CONEXIÓN A CAJA 1 (SERVIDOR MAESTRO)</h4>
                      <p className="text-slate-400 text-[10px]">Enlace para sincronizar catálogo, descontar inventario y registrar ventas</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    TERMINAL SATÉLITE
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1.5">
                      NOMBRE DE ESTA TERMINAL / CAJA
                    </label>
                    <select
                      value={localSettings.cajaNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalSettings(prev => ({ ...prev, cajaNombre: val }));
                        setSettings({ cajaNombre: val });
                      }}
                      className="w-full bg-nexus-900 border border-nexus-700 text-yellow-400 px-4 py-3 rounded-xl font-black text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="CAJA MÓVIL (CELULAR)">📱 CAJA MÓVIL (CELULAR)</option>
                      <option value="CAJA MÓVIL 2 (TABLET)">📱 CAJA MÓVIL 2 (TABLET)</option>
                      <option value="CAJA 2">💻 CAJA 2 (SECUNDARIA)</option>
                      <option value="CAJA 3">💻 CAJA 3 (SECUNDARIA)</option>
                      <option value="CAJA 4">💻 CAJA 4 (SECUNDARIA)</option>
                      <option value="CAJA 5">💻 CAJA 5 (SECUNDARIA)</option>
                      <option value="CAJA 6">💻 CAJA 6 (SECUNDARIA)</option>
                      <option value="CAJA 7">💻 CAJA 7 (SECUNDARIA)</option>
                      <option value="CAJA 8">💻 CAJA 8 (SECUNDARIA)</option>
                      <option value="CAJA 9">💻 CAJA 9 (SECUNDARIA)</option>
                      <option value="CAJA 10">💻 CAJA 10 (SECUNDARIA)</option>
                      <option value="CAJA 1 - PRINCIPAL">👑 CAJA 1 - PRINCIPAL (SOLO PC CENTRAL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      DIRECCIÓN IP DE LA CAJA 1 (PUERTO :3008)
                    </label>
                    <input
                      type="text"
                      value={localSettings.servidorIp}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalSettings(prev => ({ ...prev, servidorIp: val }));
                        setSettings({ servidorIp: val });
                      }}
                      placeholder="192.168.100.38:3008"
                      className="w-full bg-[#030712] border border-nexus-700 text-emerald-400 font-mono font-black text-sm px-4 py-3 rounded-xl focus:border-blue-500 outline-none"
                    />
                    <p className="text-[9px] text-slate-500 mt-1 italic">
                      * Escribe la IP de la computadora donde corre la Caja 1 Principal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testConnStatus === 'LOADING'}
                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 py-3 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {testConnStatus === 'LOADING' ? 'Probando...' : 'Probar Conexión'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncCatalogFromMaster}
                    disabled={syncProdsStatus === 'LOADING'}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-3 px-3 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncProdsStatus === 'LOADING' ? 'animate-spin' : ''}`} />
                    {syncProdsStatus === 'LOADING' ? 'Descargando...' : 'Descargar Catálogo'}
                  </button>
                </div>

                {testConnStatus !== 'IDLE' && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold ${
                    testConnStatus === 'SUCCESS' ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300' : 'bg-red-950/60 border border-red-700/50 text-red-300'
                  }`}>
                    {testConnMsg}
                  </div>
                )}

                {syncProdsStatus !== 'IDLE' && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold ${
                    syncProdsStatus === 'SUCCESS' ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300' : 'bg-red-950/60 border border-red-700/50 text-red-300'
                  }`}>
                    {syncProdsMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveNetworkBoxSettings}
                  className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" /> GUARDAR AJUSTES DE CAJA Y RED
                </button>
              </div>

              {/* SEGURIDAD DE ACCESO Y PIN OPCIONAL */}
              <div className="bg-[#0b1120] border border-nexus-700 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-black text-sm uppercase">SOLICITAR PIN / CONTRASEÑA AL CAMBIAR USUARIOS</h4>
                    <p className="text-slate-400 text-xs">Si está desactivado (Recomendado), el cambio de cajero se realiza con 1 solo clic sin contraseña.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.requirePasswordLogin}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setLocalSettings(prev => ({ ...prev, requirePasswordLogin: checked }));
                      setSettings({ requirePasswordLogin: checked });
                    }}
                    className="w-6 h-6 rounded border-slate-700 bg-slate-800 text-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* CATÁLOGO DE USUARIOS */}
              <div className="bg-[#0b1120] border border-nexus-700 rounded-2xl p-4 space-y-4">
                <h4 className="text-slate-300 font-black text-sm uppercase tracking-widest flex items-center justify-between">
                  <span>USUARIOS Y CAJEROS REGISTRADOS</span>
                  <span className="text-xs text-blue-400 font-bold">{localSettings.usersList?.length || 0} Usuarios</span>
                </h4>

                {/* LISTA DE USUARIOS */}
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {(localSettings.usersList || []).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-nexus-900 border border-nexus-800 rounded-xl">
                      <div>
                        <span className="font-black text-white text-xs uppercase block">{u.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role} | PIN: ••••</span>
                      </div>
                      {u.id !== '1' && (
                        <button
                          onClick={() => {
                            const updated = localSettings.usersList.filter(x => x.id !== u.id);
                            setLocalSettings(prev => ({ ...prev, usersList: updated }));
                            setSettings({ usersList: updated });
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 bg-red-500/10 rounded"
                        >
                          ELIMINAR
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* AGREGAR NUEVO USUARIO */}
                <div className="pt-3 border-t border-nexus-800 grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="Nombre..."
                    className="bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  />
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl text-xs font-bold focus:border-blue-500 outline-none"
                  >
                    <option value="CAJERO">CAJERO</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="AUDITOR">AUDITOR</option>
                  </select>
                  <input
                    type="password"
                    value={newUserPin}
                    onChange={e => setNewUserPin(e.target.value)}
                    placeholder="PIN..."
                    className="bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl text-xs font-mono font-bold focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!newUserName.trim()) return alert('Escribe el nombre del usuario');
                      const newUser = {
                        id: Date.now().toString(),
                        name: newUserName.trim().toUpperCase(),
                        role: newUserRole,
                        pin: newUserPin || '0000'
                      };
                      const updated = [...(localSettings.usersList || []), newUser];
                      setLocalSettings(prev => ({ ...prev, usersList: updated }));
                      setSettings({ usersList: updated });
                      setNewUserName('');
                      setNewUserPin('0000');
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase py-2 rounded-xl transition-colors"
                  >
                    + CAJERO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* INTEGRACIÓN DE TERMINALES (PAYMENT GATEWAYS) */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="font-black text-white text-xl tracking-widest uppercase">Integración de Terminales</h3>
              <p className="text-slate-400 text-xs">Configuración de Pasarelas de Pago Bancarias y Mercado Pago</p>
            </div>
            
            <div className="space-y-6">
              
              {/* MERCADO PAGO POINT */}
              <div className="bg-[#0b1120] border border-blue-900/50 rounded-2xl p-4">
                <h4 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <SmartphoneNfc className="w-4 h-4" /> MERCADO PAGO POINT (API / WEBHOOKS)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ACCESS TOKEN (PRODUCCIÓN / TEST)</label>
                    <input 
                      type="password" 
                      value={localSettings.mercadoPagoToken} 
                      onChange={e => setLocalSettings({...localSettings, mercadoPagoToken: e.target.value})}
                      placeholder="APP_USR-7550911274372329..."
                      className="w-full bg-nexus-900 border border-nexus-700 text-emerald-400 px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ID DE SUCURSAL / CAJA</label>
                      <input type="text" defaultValue="SUC_001_CAJA_MAESTRA" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ID DE TERMINAL (POINT DEVICE ID)</label>
                      <input 
                        type="text" 
                        value={localSettings.mercadoPagoDeviceId}
                        onChange={e => setLocalSettings({...localSettings, mercadoPagoDeviceId: e.target.value})}
                        placeholder="POINT_SMART_01" 
                        className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button onClick={async () => {
                      if (!localSettings.mercadoPagoToken) {
                        return alert("Debes ingresar el Access Token de Mercado Pago primero.");
                      }
                      try {
                        // Buscar en v1/devices o point/integration-api/devices
                        let response = await fetch("https://api.mercadopago.com/point/integration-api/devices", {
                          headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken }
                        });
                        
                        let data = await response.json();
                        
                        if (!response.ok || !data.devices) {
                            // Fallback if the endpoint is different
                            response = await fetch("https://api.mercadopago.com/v1/pos", {
                                headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken }
                            });
                            data = await response.json();
                        }

                        const devices = data.devices || data.results || [];
                        if (devices.length === 0) {
                          alert("No se encontraron terminales vinculadas a este token.\n\nSi recién la vinculaste, asegúrate de haberla asignado a un local/caja en tu panel de Mercado Pago, o ingresa el DEVICE ID manualmente.");
                          return;
                        }

                        let msg = "Terminales encontradas:\n";
                        devices.forEach((d: any, i: number) => {
                           msg += `${i + 1}. ${d.id} (${d.operating_mode || d.name || 'Terminal'})
`;
                        });
                        msg += "\nSe vinculará automáticamente a la primera terminal encontrada si confirmas. ¿Deseas vincular " + devices[0].id + "?";
                        
                        if (window.confirm(msg)) {
                           setLocalSettings({...localSettings, mercadoPagoDeviceId: devices[0].id || devices[0].device_id});
                           alert("¡Terminal vinculada! Recuerda Guardar la configuración abajo.");
                        }
                      } catch (e) {
                        alert("Error de conexión con Mercado Pago: " + (e as Error).message);
                      }
                    }} className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
                      <Search className="w-3 h-3" /> BUSCAR TERMINALES
                    </button>
                    <button onClick={async () => {
                      if (!localSettings.mercadoPagoToken || !localSettings.mercadoPagoDeviceId) {
                        return alert("Debes ingresar el Token y el ID de Terminal.");
                      }
                      try {
                        // Changed to a POST intent of 500 to test connection properly
const response = await fetch(`https://api.mercadopago.com/point/integration-api/devices/${localSettings.mercadoPagoDeviceId}/payment-intents`, {
  method: 'POST',
  headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken, "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 500 })
});
                        const data = await response.json();
                        if (response.ok) {
                          alert("¡Conexión API Exitosa!\nLa terminal está lista y conectada:\n" + JSON.stringify(data, null, 2));
                        } else {
                          alert("Fallo la conexión:\n" + (data.message || JSON.stringify(data)));
                        }
                      } catch (e) {
                        alert("Error de conexión: " + (e as Error).message);
                      }
                    }} className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors">
                      PROBAR CONEXIÓN API
                    </button>
                  </div>
                </div>
              </div>

              {/* INTEGRACIÓN DE TERMINALES: MERCADO PAGO, CLIP Y BANCOS */}
              <div className="bg-[#0b1120] border border-nexus-800 rounded-2xl p-5 space-y-6">
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> VINCULACIÓN DE TERMINALES DE PAGO (MULTIPROVEEDOR)
                  </h4>
                  <p className="text-xs text-slate-400">Configura tus maquinitas de cobro. Mercado Pago y Clip operan sin interferir entre sí.</p>
                </div>

                {/* 1. MERCADO PAGO POINT */}
                <div className="bg-nexus-900/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase">
                      💙 1. TERMINAL MERCADO PAGO POINT (SMART / AIR)
                    </span>
                    <span className="text-[10px] bg-blue-900/50 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-700">API ACTIVA</span>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MERCADO PAGO ACCESS TOKEN</label>
                    <input
                      type="text"
                      value={localSettings.mercadoPagoToken}
                      onChange={e => setLocalSettings({...localSettings, mercadoPagoToken: e.target.value})}
                      placeholder="APP_USR-7550911274372329..."
                      className="w-full bg-[#0b1120] border border-nexus-700 text-emerald-400 px-3 py-2 rounded-lg font-mono text-xs font-bold focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">DEVICE ID (NÚMERO DE TERMINAL POINT)</label>
                    <input
                      type="text"
                      value={localSettings.mercadoPagoDeviceId}
                      onChange={e => setLocalSettings({...localSettings, mercadoPagoDeviceId: e.target.value})}
                      placeholder="POINT_SMART_01"
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. TERMINAL CLIP */}
                <div className="bg-nexus-900/80 border border-amber-500/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase">
                      🧡 2. TERMINAL CLIP (TOTAL / PRO / STAND / PLUS 2)
                    </span>
                    <span className="text-[10px] bg-amber-900/50 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-700">COMPATIBLE</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MODO DE OPERACIÓN CLIP</label>
                      <select
                        value={localSettings.clipModo}
                        onChange={e => setLocalSettings({...localSettings, clipModo: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-amber-300 px-3 py-2 rounded-lg font-bold text-xs focus:border-amber-500 outline-none"
                      >
                        <option value="MANUAL">💳 MODO DIRECTO / MANUAL (DIGITAR EN TERMINAL - ULTRA-RÁPIDO Y RECOMENDADO)</option>
                        <option value="API_NUBE">☁️ MODO NUBE PINPAD (AUTOMÁTICO VÍA WIFI / INTERNET)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">NO. DE SERIE O SERIAL CLIP</label>
                      <input
                        type="text"
                        value={localSettings.clipSerialNumber}
                        onChange={e => setLocalSettings({...localSettings, clipSerialNumber: e.target.value})}
                        placeholder="Ej. AA61B532620402393"
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">API KEY DE CLIP (MODO NUBE)</label>
                      <input
                        type="text"
                        value={localSettings.clipApiKey}
                        onChange={e => setLocalSettings({...localSettings, clipApiKey: e.target.value})}
                        placeholder="Ej. c4fa1c30-635f-412c-b4ae-52c4b911d30a"
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-mono text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CLAVE SECRETA CLIP (OPCIONAL)</label>
                      <input
                        type="password"
                        value={localSettings.clipSecretKey}
                        onChange={e => setLocalSettings({...localSettings, clipSecretKey: e.target.value})}
                        placeholder="Clave secreta dashboard.clip.mx"
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-mono text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* BOTÓN PROBAR CONEXIÓN CLIP PINPAD */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-amber-900/40">
                    <button
                      type="button"
                      disabled={clipTesting}
                      onClick={async () => {
                        setClipTesting(true);
                        setClipTestResult(null);
                        try {
                          const hostUrl = localSettings.servidorIp ? ("http://" + (localSettings.servidorIp.includes(":") ? localSettings.servidorIp : localSettings.servidorIp + ":3008")) : "http://127.0.0.1:3008";
                          const res = await fetch(`${hostUrl}/api/clip/test-connection`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              apiKey: localSettings.clipApiKey,
                              serialNumber: localSettings.clipSerialNumber
                            })
                          }).catch(async () => {
                            return await fetch("http://127.0.0.1:3008/api/clip/test-connection", {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                apiKey: localSettings.clipApiKey,
                                serialNumber: localSettings.clipSerialNumber
                              })
                            }).catch(() => null);
                          });

                          if (!res) {
                            const errM = "No se pudo conectar con el servidor local en puerto :3008. Verifica que esté activo.";
                            setClipTestResult({ ok: false, message: errM });
                            alert(errM);
                            return;
                          }

                          const data = await res.json().catch(() => ({}));
                          setClipTestResult({
                            ok: data.success,
                            message: data.message || (data.success ? 'Conexión exitosa' : 'Respuesta recibida')
                          });
                          alert(data.message || (data.success ? "¡Conexión Exitosa con Terminal Clip!" : "Diagnóstico de conexión Clip"));
                        } catch (err: any) {
                          const msg = "Error: " + (err?.message || "Fallo de conexión");
                          setClipTestResult({ ok: false, message: msg });
                          alert(msg);
                        } finally {
                          setClipTesting(false);
                        }
                      }}
                      className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      {clipTesting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                          DIAGNOSTICANDO TERMINAL CLIP...
                        </>
                      ) : (
                        <>
                          <Wifi className="w-4 h-4" /> PROBAR CONEXIÓN CON PINPAD CLIP
                        </>
                      )}
                    </button>

                    {clipTestResult && (
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${clipTestResult.ok ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-amber-950/60 border-amber-500/50 text-amber-300'}`}>
                        {clipTestResult.ok ? '✅ Terminal en línea y autorizada' : '⚠️ ' + (clipTestResult.message || "").substring(0, 45) + '...'}
                      </span>
                    )}
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 text-[10px] text-amber-200/90 leading-relaxed">
                    💡 <strong>Guía de operación Clip:</strong>
                    <br />
                    • <strong>Modo Directo / Manual (Ultra-rápido):</strong> Cobras digitando el total directamente en tu maquinita Clip. El cliente pasa su tarjeta y al salir el voucher, presionas <strong>CONFIRMAR PAGO (F12)</strong> en Nexus POS. ¡Instantáneo, sin esperas ni caídas de internet!
                    <br />
                    • <strong>Modo Nube PinPad:</strong> Envía la orden por internet a terminales Clip Total o Pro. Requiere tener la app <em>Clip PinPad</em> activada en tu cuenta por Clip (solicítala enviando tu número de serie a <strong>sdk@payclip.com</strong>).
                  </div>
                </div>

                {/* 3. TERMINALES BANCARIAS TRADICIONALES */}
                <div className="bg-nexus-900/80 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase">
                      🏛️ 3. TERMINAL BANCARIA (BBVA, BANORTE, CITIBANAMEX, HSBC, INBURSA, SANTANDER)
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-600">PINPAD / TPV</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">BANCO DE LA TERMINAL</label>
                      <select
                        value={localSettings.bancoDefault}
                        onChange={e => setLocalSettings({...localSettings, bancoDefault: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                      >
                        <option value="BBVA / BANCOMER">BBVA (BANCOMER)</option>
                        <option value="BANORTE">BANORTE (PAYWORKS)</option>
                        <option value="CITIBANAMEX">CITIBANAMEX</option>
                        <option value="HSBC">HSBC</option>
                        <option value="INBURSA">INBURSA</option>
                        <option value="SANTANDER">SANTANDER (GETNET)</option>
                        <option value="SCOTIABANK">SCOTIABANK</option>
                        <option value="NETPAY">NETPAY / SMART POS</option>
                        <option value="OTRO BANCO">OTRO BANCO NACIONAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MODO DE REGISTRO</label>
                      <select
                        value={localSettings.terminalBancariaModo}
                        onChange={e => setLocalSettings({...localSettings, terminalBancariaModo: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                      >
                        <option value="TERMINAL_MANUAL_PINPAD">REGISTRO MANUAL CON VOUCHER</option>
                        <option value="TERMINAL_INTEGRADA_PINPAD">PINPAD BANCARIO INTEGRADO</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => { setSettings(localSettings); alert("Configuración general y Token de Mercado Pago guardados correctamente."); }} className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors mt-4">
                GUARDAR CONFIGURACIÓN
              </button>
            </div>
          </div>

          {/* BITÁCORA DE ACCIONES (AUDITORÍA) */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-4 h-4 bg-nexus-700 rounded-sm flex flex-col gap-[2px] p-[3px] justify-center">
                <span className="w-full h-[2px] bg-white rounded-full"></span>
                <span className="w-full h-[2px] bg-white rounded-full"></span>
                <span className="w-full h-[2px] bg-white rounded-full"></span>
              </span>
              BITÁCORA DE ACCIONES (AUDITORÍA)
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay registros aún en la bitácora.</p>
              ) : recentLogs.map((log, idx) => (
                <div key={log.id || idx} className="flex items-start gap-3 pb-3 border-b border-nexus-800/50 last:border-0">
                  <span className="text-blue-400 font-mono text-[10px] font-bold shrink-0 pt-0.5">
                    {log.fecha?.includes(',') ? log.fecha.split(',')[1] : log.fecha?.slice(11, 16) || log.fecha}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-xs uppercase">{log.tipo}</span>
                      <span className="text-[9px] font-bold text-amber-400 font-mono">{log.folio}</span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">{log.usuario || 'ADMINISTRADOR'}</span>
                    </div>
                    <p className="text-slate-300 text-xs font-black uppercase mt-0.5">{log.productName} ({log.sku})</p>
                    <p className="text-slate-500 text-[10px] italic">
                      Cant: {log.cantidad} | {log.caja || 'CAJA 1'} | {log.detalles || 'Movimiento de inventario'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="col-span-1 space-y-6">
          
          {/* ACCESO MÓVIL */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <SmartphoneNfc className="text-blue-400 w-5 h-5" />
              <h3 className="font-black text-blue-400 uppercase tracking-widest text-sm">ACCESO MÓVIL / TABLET</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mb-4 relative z-10">USA TUS DISPOSITIVOS PARA VENDER EN CASO DE APAGÓN (REQUIERE CONEXIÓN AL MISMO WIFI).</p>
            <div className="bg-[#0b1120] border border-nexus-700 rounded-xl p-4 mb-4 relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DIRECCIÓN IP / ENLACE CELULAR (EDITABLE):</p>
              <input
                type="text"
                value={localSettings.servidorIp}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSettings(prev => ({ ...prev, servidorIp: val }));
                  setSettings({ servidorIp: val });
                }}
                className="w-full bg-nexus-900 border border-nexus-700 text-emerald-400 font-mono font-black text-lg px-3 py-2 rounded-xl focus:border-blue-500 outline-none"
              />
              <p className="text-[9px] text-slate-500 mt-2 italic">* Tu PC debe estar encendida y en la misma red local.</p>
            </div>
            <button onClick={() => alert(`Enlace móvil actualizado a: ${localSettings.servidorIp}`)} className="w-full text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300 relative z-10">ACTUALIZAR CONEXIÓN</button>
          </div>

          {/* RESGUARDOS */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-emerald-400 w-5 h-5" />
              <h3 className="font-black text-white uppercase tracking-widest text-sm">RESGUARDOS</h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">SISTEMA DE SEGURIDAD AUTOMÁTICO ACTIVO.</p>
            <ul className="space-y-2 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3" /> RESPALDO AUTOMÁTICO A DISCO CADA 1 MIN (SI HAY CAMBIOS)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3" /> ESPEJO DE RESPALDOS CONSERVANDO ÚLTIMOS 10</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3" /> RECUPERACIÓN AUTOMÁTICA SI LA BASE LOCAL ESTÁ VACÍA</li>
            </ul>
            <div className="space-y-3">
              <button onClick={() => fetch('/api/open-folder').catch(() => alert('Abre la app con INICIAR_NUEVA_CAJA.bat para usar esta función.'))} className="w-full bg-blue-900/10 border border-blue-900/30 text-blue-400 hover:bg-blue-900/20 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                Abrir Carpeta de Respaldos (Documentos)
              </button>
              <button onClick={() => alert("Para importar productos masivamente, por favor dirígete al módulo: Inventario > Catálogo Maestro, y usa el botón de subir Excel.")} className="w-full bg-[#3d2417]/50 border border-[#5c3722]/50 text-[#e08953] hover:bg-[#5c3722]/80 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                Importar Catálogo desde Excel (Escritorio)
              </button>
              <button onClick={() => downloadManualBackup()} disabled={isMigrating} className="w-full bg-emerald-900/10 border border-emerald-900/30 text-emerald-500 hover:bg-emerald-900/20 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Descargar Respaldo Manual
              </button>
              
              <input type="file" ref={manualBackupRef} className="hidden" accept=".json" onChange={handleSmartRestore} />
              <button onClick={() => manualBackupRef.current?.click()} disabled={isMigrating} className="w-full bg-blue-900/10 border border-blue-900/30 text-blue-500 hover:bg-blue-900/20 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4" /> {isMigrating ? migrationMsg : 'Restaurar / Migrar Respaldo (.JSON)'}
              </button>
            </div>
          </div>

          {/* PELIGRO */}
          <div className="bg-red-950/10 border border-red-900/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500 w-5 h-5" />
              <h3 className="font-black text-red-500 uppercase tracking-widest text-sm">PELIGRO</h3>
            </div>
            <p className="text-[10px] font-bold text-red-500/70 uppercase leading-relaxed mb-6">ESTA OPCIÓN BORRARÁ PERMANENTEMENTE TODA LA INFORMACIÓN. NO SE RECOMIENDA A MENOS QUE DESEE UN SISTEMA LIMPIO.</p>
            <button onClick={handleRestablecerTodo} className="w-full bg-red-950/50 hover:bg-red-900/80 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              RESTABLECER TODO
            </button>
          </div>

          {/* SISTEMA INFO */}
          <div className="bg-[#0b1329] border border-nexus-800 rounded-2xl p-5 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SISTEMA:</span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">NEXUS POS ENTERPRISE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VERSIÓN:</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">V2.0 MASTER SOLID</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-nexus-800/60">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROPIETARIO / DUEÑO:</span>
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">JOSUE HERNANDEZ GUTIERREZ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CONTACTO / TEL:</span>
              <span className="text-[11px] font-black text-sky-400 font-mono tracking-wider">9612765041</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Icono faltante
function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}