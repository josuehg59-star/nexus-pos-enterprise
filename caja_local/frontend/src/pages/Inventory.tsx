import { useState, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Filter,
  ArrowUpDown, Download, ScanBarcode, Box, Layers, X, Printer, BarcodeIcon, Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import Barcode from 'react-barcode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import { notifyDataMutation } from '../store/backup';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showBarridoModal, setShowBarridoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // States for Add/Edit Product Modal
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('1');
  const [maxStock, setMaxStock] = useState('10');
  const [category, setCategory] = useState('General');
  const [barcode2, setBarcode2] = useState('');
  const [barcode3, setBarcode3] = useState('');
  const [family, setFamily] = useState('');
  const [unitMeasure, setUnitMeasure] = useState('PZA');
  const [iva, setIva] = useState('0');
  const [ieps, setIeps] = useState('0');
  const [promoQty, setPromoQty] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [parentSku, setParentSku] = useState('');
  const [piezasXCaja, setPiezasXCaja] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_editId, setEditId] = useState<number | null>(null);

  // Fetch real products from Dexie DB
  const providers = useLiveQuery(() => db.providers.toArray()) || [];
  const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  const products = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    let list = allProducts;
    if (term) {
      list = allProducts.filter(p => {
        const skuMatch = String(p.sku || '').toLowerCase().includes(term);
        const nameMatch = String(p.name || '').toLowerCase().includes(term);
        const b2Match = !!p.barcode2 && String(p.barcode2).toLowerCase().includes(term);
        const b3Match = !!p.barcode3 && String(p.barcode3).toLowerCase().includes(term);
        return nameMatch || skuMatch || b2Match || b3Match;
      });
    }
    return [...list].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b.stock || 0) - (a.stock || 0));
  }, [allProducts, searchQuery, sortBy]);

  const resetForm = () => {
    setEditId(null);
    setSku('');
    setName('');
    setCost('');
    setPrice('');
    setStock('');
    setMinStock('1');
    setMaxStock('10');
    setCategory('General');
    setBarcode2('');
    setBarcode3('');
    setFamily('');
    setUnitMeasure('PZA');
    setIva('0');
    setIeps('0');
    setPromoQty('');
    setPromoPrice('');
    setDescription('');
    setSupplier('');
    setParentSku('');
    setPiezasXCaja('');
  };

  const handleExportExcel = async () => {
    const allProducts = await db.products.toArray();
    const allProviders = await db.providers.toArray();
    const provMap = new Map<string, string>();
    allProviders.forEach(p => {
      if (p.id) provMap.set(String(p.id), p.name);
      if (p.name) provMap.set(p.name.toUpperCase(), p.name);
    });

    const excelData = allProducts.map((p: any) => {
      const suppStr = String(p.supplier_id || '').trim();
      const resolvedSupplier = provMap.get(suppStr) || (isNaN(Number(suppStr)) && suppStr ? suppStr : 'GENERAL');

      return {
        'Nombre': p.name || '',
        'SKU': p.sku || '',
        'Categoría': p.category || 'General',
        'Grupo/Familia': p.family || '',
        'Proveedor': resolvedSupplier,
        'Precio Venta': p.price || 0,
        'Costo': p.cost || 0,
        'Stock Actual': p.stock || 0,
        'Stock Mínimo': p.min_stock ?? 1,
        'Stock Máximo': p.max_stock ?? 10,
        'UDM': p.unit_measure || 'PZA',
        'IVA %': p.iva || 0,
        'IEPS %': p.ieps || 0,
        'Caja Padre': p.parent_sku || p.caja_padre || '',
        'Piezas x Caja': p.piezas_x_caja || '',
        'Cant Promo': p.promo_qty || 0,
        'Precio Promo': p.promo_price || 0,
        'Codigos Alternativos': p.barcode2 || '',
        'Codigo Alterno 3': p.barcode3 || '',
        'Descripción': p.description || p.name || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, 'Catalogo_Productos.xlsx');
  };

  const handleImportExcel = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        alert('El archivo Excel no contiene hojas de trabajo válidas.');
        return;
      }

      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (!data || data.length === 0) {
        alert('El archivo Excel está vacío o no contiene filas con encabezados.');
        return;
      }

      let count = 0;
      let newProvCount = 0;
      const foundProviders = new Set<string>();

      // Cargar catálogo existente para búsqueda por SKU y por Nombre
      const existingProducts = await db.products.toArray();
      const skuMap = new Map<string, any>();
      const nameMap = new Map<string, any>();
      existingProducts.forEach(p => {
        if (p.sku) skuMap.set(String(p.sku).trim().toLowerCase(), p);
        if (p.name) nameMap.set(String(p.name).trim().toUpperCase(), p);
      });

      // Cargar proveedores existentes
      const existingProviders = await db.providers.toArray();
      const providerSet = new Set<string>(existingProviders.map(p => String(p.name).trim().toUpperCase()));

      // Función para extraer valores probando llaves alfanuméricas limpias
      const getRowVal = (normMap: Record<string, any>, rawRow: any, keys: string[]): any => {
        for (const k of keys) {
          const clean = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normMap[clean] !== undefined && normMap[clean] !== null && String(normMap[clean]).trim() !== '') {
            return normMap[clean];
          }
          if (rawRow[k] !== undefined && rawRow[k] !== null && String(rawRow[k]).trim() !== '') {
            return rawRow[k];
          }
        }
        return undefined;
      };

      for (const row of data) {
        // Normalizar llaves quitando acentos y caracteres no alfanuméricos
        const normMap: Record<string, any> = {};
        for (const k in row) {
          const cleanK = String(k)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();
          normMap[cleanK] = row[k];
        }

        const rawName = getRowVal(normMap, row, ['nombre', 'descripcion', 'producto', 'articulo', 'descripcion del producto', 'name', 'nombre del producto', 'concepto']);
        if (!rawName) continue;

        const nameUpper = String(rawName).trim().toUpperCase();
        const rawSku = getRowVal(normMap, row, ['sku', 'codigo', 'codigo de barras', 'codigodebarras', 'barcode', 'clave', 'cod', 'codigodebarra', 'codigo de barra']);
        const skuClean = rawSku ? String(rawSku).trim() : '';

        // Coincidencia previa
        let existing = skuClean ? skuMap.get(skuClean.toLowerCase()) : undefined;
        if (!existing) {
          existing = nameMap.get(nameUpper);
        }

        const finalSku = skuClean || existing?.sku || crypto.randomUUID().substring(0, 8);

        // Proveedor
        const rawSupplier = getRowVal(normMap, row, ['proveedor', 'supplier', 'proveedor / marca', 'proveedormarca', 'marca', 'distribuidor', 'vendor', 'proovedor', 'prov', 'proveedores', 'supplier_id']);
        let supplierClean = rawSupplier ? String(rawSupplier).trim().toUpperCase() : '';

        if (supplierClean && !isNaN(Number(supplierClean))) {
          const matched = existingProviders.find(p => String(p.id) === supplierClean);
          if (matched) supplierClean = matched.name.toUpperCase();
        }

        if (supplierClean && supplierClean !== 'GENERAL' && supplierClean !== 'SIN PROVEEDOR') {
          foundProviders.add(supplierClean);
        }

        // Precios y datos numéricos
        const rawPrice = getRowVal(normMap, row, ['precio venta', 'precioventa', 'precio', 'pv', 'precio publico', 'preciopublico', 'price', 'precio de venta', 'pventa', 'p_venta']);
        const rawCost = getRowVal(normMap, row, ['costo', 'cost', 'costo compra', 'costocompra', 'costo unitario', 'costounitario', 'pcosto', 'p_costo']);
        const rawStock = getRowVal(normMap, row, ['stock actual', 'stockactual', 'stock', 'existencia', 'cant', 'cantidad', 'inventario', 'existencias', 'estoc', 'estoc actual']);

        const price = rawPrice !== undefined ? parseFloat(rawPrice) || 0 : (existing?.price || 0);
        const cost = rawCost !== undefined ? parseFloat(rawCost) || 0 : (existing?.cost || 0);
        const stock = rawStock !== undefined ? parseFloat(rawStock) || 0 : (existing?.stock ?? 0);

        const category = String(getRowVal(normMap, row, ['categoria', 'grupo', 'linea', 'departamento', 'category', 'familia/categoria', 'categoría', 'cat']) || existing?.category || 'General').trim();
        const family = String(getRowVal(normMap, row, ['grupofamilia', 'familia', 'subcategoria', 'subgrupo', 'family']) || existing?.family || '').trim();
        const barcode2 = String(getRowVal(normMap, row, ['codigos alternativos', 'codigos alternos', 'codigo alterno', 'alias', 'barcode2', 'codigosalternos', 'codigosalternativos', 'codigoalterno', 'codigos secundarios']) || existing?.barcode2 || '').trim();
        const barcode3 = String(getRowVal(normMap, row, ['barcode3', 'codigo alterno 3', 'codigoalterno3', 'alias3']) || existing?.barcode3 || '').trim();
        const unit_measure = String(getRowVal(normMap, row, ['udm', 'unidad', 'unidad de medida', 'unidades', 'unidadmedida', 'unit']) || existing?.unit_measure || 'PZA').trim();
        
        const rawIva = getRowVal(normMap, row, ['iva %', 'iva', 'impuesto', 'porcentaje iva', 'tax']);
        const rawMin = getRowVal(normMap, row, ['stock minimo', 'stockminimo', 'minimo', 'min_stock', 'estoc mini', 'stock mini', 'min', 'mínimo', 'estocmini', 'stockmini']);
        const rawMax = getRowVal(normMap, row, ['stock maximo', 'stockmaximo', 'maximo', 'max_stock', 'stoc maximo', 'stocmaximo', 'stock max', 'max', 'máximo', 'stoc max']);
        const rawPromoQty = getRowVal(normMap, row, ['promo_qty', 'mayoreo_cant', 'cant_mayoreo', 'cant promo', 'cantidad promo', 'promo cant', 'cantpromo']);
        const rawPromoPrice = getRowVal(normMap, row, ['promo_price', 'mayoreo_precio', 'precio_mayoreo', 'precio promo', 'promo precio', 'preciopromo']);

        const iva = rawIva !== undefined ? parseFloat(rawIva) || 0 : (existing?.iva || 0);
        const rawIeps = getRowVal(normMap, row, ['ieps %', 'ieps', 'porcentaje ieps']);
        const ieps = rawIeps !== undefined ? parseFloat(rawIeps) || 0 : ((existing as any)?.ieps || 0);
        const rawParent = getRowVal(normMap, row, ['caja padre', 'cajapadre', 'sku padre', 'skupadre', 'parent_sku']);
        const parent_sku = rawParent !== undefined && String(rawParent).trim() ? String(rawParent).trim() : undefined;
        const rawPzs = getRowVal(normMap, row, ['piezas x caja', 'piezasxcaja', 'piezas por caja', 'piezasporcaja', 'piezas_x_caja']);
        const piezas_x_caja = rawPzs !== undefined ? parseFloat(rawPzs) || undefined : undefined;
        const min_stock = rawMin !== undefined ? parseFloat(rawMin) || 1 : (existing?.min_stock || 1);
        const max_stock = rawMax !== undefined ? parseFloat(rawMax) || 10 : (existing?.max_stock || 10);
        const promo_qty = rawPromoQty !== undefined ? parseFloat(rawPromoQty) || undefined : existing?.promo_qty;
        const promo_price = rawPromoPrice !== undefined ? parseFloat(rawPromoPrice) || undefined : existing?.promo_price;

        const productData: any = {
          ...(existing || {}),
          ...(existing?.id ? { id: existing.id } : {}),
          ieps,
          ...(parent_sku ? { parent_sku, caja_padre: parent_sku } : {}),
          ...(piezas_x_caja ? { piezas_x_caja } : {}),
          sku: finalSku,
          name: nameUpper,
          category,
          family,
          supplier_id: supplierClean || existing?.supplier_id || 'GENERAL',
          price,
          cost,
          stock,
          unit_measure,
          iva,
          min_stock,
          max_stock,
          description: String(getRowVal(normMap, row, ['descripcion', 'description']) || rawName).trim(),
          barcode2: barcode2 || undefined,
          barcode3: barcode3 || undefined,
          promo_qty: promo_qty || undefined,
          promo_price: promo_price || undefined,
          status: 'ACTIVO'
        };

        const savedId = await db.products.put(productData);
        productData.id = savedId;
        skuMap.set(finalSku.toLowerCase(), productData);
        nameMap.set(nameUpper, productData);
        count++;
      }

      // Sincronizar directorio de proveedores en db.providers
      for (const provName of foundProviders) {
        if (!providerSet.has(provName)) {
          await db.providers.add({
            name: provName,
            company: provName,
            phone: '',
            email: '',
            contact: '',
            address: '',
            rfc: ''
          });
          providerSet.add(provName);
          newProvCount++;
        }
      }

      alert(`¡Éxito! Se actualizaron/procesaron ${count} productos del catálogo.\n` +
            (newProvCount > 0 ? `Se agregaron automáticamente ${newProvCount} proveedor(es) nuevo(s) al directorio.` : 'Todos los proveedores se sincronizaron correctamente.'));
      notifyDataMutation();

    } catch (err: any) {
      console.error("Error al importar Excel:", err);
      alert(`Error al procesar el archivo Excel: ${err.message || err}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProduct = async () => {
    if (!name || !price) {
      alert('Nombre y Precio son obligatorios');
      return;
    }
    if (parentSku && !(parseFloat(piezasXCaja) > 0)) {
      alert('Para la Auto-Conversión indica cuántas PIEZAS trae cada CAJA PADRE.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        sku: sku || String(Date.now()),
        name: name.toUpperCase(),
        cost: parseFloat(cost) || 0,
        price: parseFloat(price) || 0,
        stock: parseFloat(stock) || 0,
        min_stock: parseFloat(minStock) || 1,
        max_stock: parseFloat(maxStock) || 10,
        category: category || 'General',
        family: family || undefined,
        barcode2: barcode2 || undefined,
        barcode3: barcode3 || undefined,
        supplier_id: supplier || 'GENERAL',
        unit_measure: unitMeasure || 'PZA',
        iva: parseFloat(iva) || 0,
        ieps: parseFloat(ieps) || 0,
        promo_qty: parseFloat(promoQty) || undefined,
        promo_price: parseFloat(promoPrice) || undefined,
        description: description || name,
        parent_sku: parentSku ? String(parentSku) : undefined,
        caja_padre: parentSku ? String(parentSku) : undefined,
        piezas_x_caja: parentSku ? (parseFloat(piezasXCaja) || undefined) : undefined,
        status: 'ACTIVO'
      };

      if (_editId) {
        const oldProduct = await db.products.get(_editId);
        const oldStock = oldProduct?.stock ?? 0;
        const newStock = payload.stock;
        await db.products.update(_editId, payload);

        if (oldProduct && oldStock !== newStock) {
          const diff = newStock - oldStock;
          await db.kardex.add({
            fecha: new Date().toLocaleString('es-MX'),
            tipo: diff > 0 ? 'ENTRADA' : 'MERMA',
            sku: payload.sku,
            productName: payload.name,
            cantidad: Math.abs(diff),
            costo: payload.cost || 0,
            precio: payload.price || 0,
            total: Math.abs(diff) * (payload.cost || 0),
            folio: 'AJUSTE-CAT-' + Date.now().toString().slice(-6),
            proveedor: 'EDICIÓN MANUAL EN CATÁLOGO',
            stockAnterior: oldStock,
            stockNuevo: newStock,
            detalles: `Ajuste manual de stock de ${oldStock} a ${newStock} piezas`
          });
        }
      } else {
        await db.products.add(payload);
        if (payload.stock > 0) {
          await db.kardex.add({
            fecha: new Date().toLocaleString('es-MX'),
            tipo: 'ENTRADA',
            sku: payload.sku,
            productName: payload.name,
            cantidad: payload.stock,
            costo: payload.cost || 0,
            precio: payload.price || 0,
            total: payload.stock * (payload.cost || 0),
            folio: 'ALTA-CAT-' + Date.now().toString().slice(-6),
            proveedor: 'ALTA DE PRODUCTO NUEVO',
            stockAnterior: 0,
            stockNuevo: payload.stock,
            detalles: 'Alta de producto nuevo con existencia inicial'
          });
        }
      }
      notifyDataMutation();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert('Error guardando el producto');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      await db.products.delete(id);
      notifyDataMutation();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative">
      
      {/* HEADER TIPO DASHBOARD */}
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">CATÁLOGO <span className="text-blue-500">MAESTRO</span></h2>
            <p className="text-slate-400 text-sm">GESTIÓN CENTRALIZADA DE PRODUCTOS Y SERVICIOS</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <label className='cursor-pointer bg-fuchsia-900/30 text-fuchsia-500 hover:bg-fuchsia-900/50 border border-fuchsia-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>
  <Download className='w-4 h-4' /> IMPORTAR EXCEL
  <input type='file' accept='.xlsx, .xls' className='hidden' onChange={handleImportExcel} />
</label>
          <button onClick={() => setShowBarridoModal(true)} className='bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-800/50 px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20'>
  <Activity className='w-4 h-4' /> BARRIDO Y AUDITORÍA
</button>
<button onClick={handleExportExcel} className='bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 border border-emerald-900 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors'>
  <Download className='w-4 h-4' /> EXPORTAR EXCEL
</button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
          >
            <Plus className="w-5 h-5" /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="flex gap-4 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código de barras, descripción, categoría..." 
              className="w-full bg-nexus-900/50 border border-nexus-700 text-white pl-12 pr-4 py-3.5 rounded-xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button className="bg-nexus-900/50 border border-nexus-700 text-slate-300 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-nexus-800 transition-colors">
            <Filter className="w-4 h-4" /> CATEGORÍAS
          </button>
          <button onClick={() => setSortBy(sortBy === 'name' ? 'stock' : 'name')} className="bg-nexus-900/50 border border-nexus-700 text-slate-300 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-nexus-800 transition-colors">
              <ArrowUpDown className="w-4 h-4" /> ORDENAR ({sortBy === 'name' ? 'ALFABÉTICO' : 'STOCK'})
            </button>
        </div>

        {/* TABLA PRINCIPAL DE INVENTARIO */}
        <div className="flex-1 bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-nexus-900 sticky top-0 z-10 border-b border-nexus-800 shadow-md">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">SKU / CÓDIGO BARRAS</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">DESCRIPCIÓN DEL PRODUCTO</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">CATEGORÍA</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">COSTO</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">P. VENTA</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">UTILIDAD</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">STOCK</th>
                  <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800">
                {products?.map((item) => (
                  <tr key={item.id} className="hover:bg-nexus-800/50 transition-colors group">
                    <td className="p-4 font-mono text-sm font-bold text-slate-300">{item.sku}</td>
                    <td className="p-4 font-bold text-white">{item.name}</td>
                    <td className="p-4 text-center">
                      <span className="bg-nexus-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-nexus-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-500 text-right">${item.cost.toFixed(2)}</td>
                    <td className="p-4 font-mono font-black text-emerald-400 text-right">${item.price.toFixed(2)}</td>
                    <td className="p-4 font-mono font-bold text-blue-400 text-center">
                      {(((item.price - item.cost) / (item.cost || 1)) * 100).toFixed(0)}%
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-black text-lg ${item.stock > 10 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditId(item.id || null);
                          setSku(item.sku || "");
                          setName(item.name || "");
                          const catClean = (!item.category || !isNaN(Number(item.category))) ? "General" : item.category;
                          setCategory(catClean);
                          setBarcode2(item.barcode2 || "");
                          setBarcode3(item.barcode3 || "");
                          setFamily(item.family || "");
                          setDescription(item.description || item.name || "");
                          const suppStr = String(item.supplier_id || "");
                          const matchedProv = providers.find(p => String(p.id) === suppStr || p.name.toUpperCase() === suppStr.toUpperCase() || (p.company && p.company.toUpperCase() === suppStr.toUpperCase()));
                          setSupplier(matchedProv ? matchedProv.name : (suppStr && isNaN(Number(suppStr)) ? suppStr : ""));
                          setPrice((item.price || 0).toString());
                          setCost((item.cost || 0).toString());
                          setStock((item.stock || 0).toString());
                          setMinStock((item.min_stock ?? 1).toString());
                          setMaxStock((item.max_stock ?? 10).toString());
                          setPromoQty(item.promo_qty ? item.promo_qty.toString() : "");
                          setPromoPrice(item.promo_price ? item.promo_price.toString() : "");
                          setUnitMeasure(item.unit_measure || "PZA");
                          setIva((item.iva ?? 0).toString());
                          setIeps(((item as any).ieps ?? 0).toString());
                          setParentSku(String(item.parent_sku || item.caja_padre || ""));
                          setPiezasXCaja(item.piezas_x_caja ? item.piezas_x_caja.toString() : "");
                          setShowAddModal(true);
                        }} className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        <button onClick={() => handleDelete(item.id!)} className="p-2 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products?.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center opacity-50">
                <Box className="w-16 h-16 text-slate-500 mb-4" />
                <h3 className="text-xl font-black text-slate-400">NO HAY PRODUCTOS EN LA BASE DE DATOS</h3>
                <p className="text-slate-500 font-bold mt-2">Usa el botón "NUEVO PRODUCTO" para agregar uno.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVO PRODUCTO TITAN POS ESTILO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-nexus-800">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Box className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest">{_editId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración Avanzada (TITAN Engine)</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors bg-nexus-800 p-2 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-8">
                
                {/* IDENTIFICACIÓN BÁSICA */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Código de Barras (SKU) *</label>
                    <div className="flex relative">
                      <ScanBarcode className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Escanear o Escribir..." 
                        className="w-full bg-[#0b1120] border-2 border-blue-900 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-mono font-bold text-lg" 
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Descripción del Producto *</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: COCA COLA 600ML REGULAR" 
                      className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-lg uppercase" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Códigos Alternos</label>
                    <input type="text" value={barcode2} onChange={e=>setBarcode2(e.target.value)} placeholder="Separa por comas..." className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Categoría</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                        <option value="General">General</option>
                        <option value="Abarrotes">Abarrotes</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Lácteos">Lácteos</option>
                        <option value="Galletas y Pan">Galletas y Pan</option>
                        <option value="Botanas">Botanas</option>
                        <option value="Cuidado Personal">Cuidado Personal</option>
                        <option value="Limpieza">Limpieza</option>
                        <option value="Carnes y Embutidos">Carnes y Embutidos</option>
                        <option value="Frutas y Verduras">Frutas y Verduras</option>
                        <option value="Servicios">Servicios</option>
                        {Array.from(new Set((products || []).map(p => p.category).filter(c => c && isNaN(Number(c))))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proveedor</label>
                    <select value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                        <option value="">SELECCIONAR PROVEEDOR</option>
                        {supplier && !providers.some(p => p.name === supplier) && (
                          <option value={supplier}>{supplier}</option>
                        )}
                        {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Unidad de Medida</label>
                  <select value={unitMeasure} onChange={e=>setUnitMeasure(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                    <option value="PZA">PZA (Pieza/Unidad)</option>
                    <option value="KG">KG (Kilogramos)</option>
                    <option value="LTS">LTS (Litros)</option>
                  </select>
                </div>

                {/* PRECIOS Y COSTOS */}
                <div className="border border-nexus-700 rounded-2xl p-6 bg-nexus-900/50">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Módulo de Precios y Rentabilidad</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Costo Compra (Sin IVA)</label>
                      <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$ 0.00" className="w-full bg-[#0b1120] border border-nexus-700 text-amber-400 font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-xl" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Precio Venta (Final) *</label>
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$ 0.00" className="w-full bg-[#0b1120] border-2 border-emerald-900 text-emerald-400 font-black px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-2xl" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Margen Calculado</label>
                      <div className="w-full bg-[#0b1120] border border-nexus-800 text-blue-400 font-black px-4 py-3 rounded-xl text-xl flex items-center justify-center">
                         {cost && price ? (((parseFloat(price) - parseFloat(cost)) / (parseFloat(cost) || 1)) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Stock Actual</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mínimo</label>
                    <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="1" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Máximo</label>
                    <input type="number" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} placeholder="10" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold" />
                  </div>
                </div>

                {/* PROMOCIONES ESPECIALES */}
                <div className="border border-fuchsia-900/50 bg-fuchsia-900/5 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-4">Promociones Especiales</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Cant. Promo (Ej: 2)</label>
                      <input type="number" value={promoQty} onChange={(e) => setPromoQty(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Precio Promo ($)</label>
                      <input type="number" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">% Descuento</label>
                      <div className="w-full bg-[#0b1120] border border-nexus-800 text-fuchsia-400 font-bold px-4 py-3 rounded-xl text-center">
                        {price && promoPrice && parseFloat(price) > 0 ? (((parseFloat(price) - parseFloat(promoPrice)) / parseFloat(price)) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* IMPUESTOS */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">IEPS %</label>
                    <div className="flex gap-2">
                      <input type="number" value={ieps} onChange={(e) => setIeps(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold" />
                      <button type="button" onClick={() => setIeps('8')} className="bg-nexus-800 border border-nexus-700 text-white px-4 rounded-xl font-black text-xs hover:bg-nexus-700 transition-colors">8%</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">IVA %</label>
                    <div className="flex gap-2">
                      <input type="number" value={iva} onChange={(e) => setIva(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold" />
                      <button type="button" onClick={() => setIva('8')} className="bg-nexus-800 border border-nexus-700 text-white px-4 rounded-xl font-black text-xs hover:bg-nexus-700 transition-colors">8%</button>
                      <button type="button" onClick={() => setIva('16')} className="bg-nexus-800 border border-nexus-700 text-white px-4 rounded-xl font-black text-xs hover:bg-nexus-700 transition-colors">16%</button>
                    </div>
                  </div>
                </div>

                {/* AUTO-CONVERSIÓN */}
                <div className="border border-blue-900/50 bg-blue-900/5 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Auto-Conversión (Abrir Caja)</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Caja Padre</label>
                      <select 
                        value={parentSku} 
                        onChange={e => setParentSku(e.target.value)} 
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs uppercase"
                      >
                        <option value="">NO APLICA (Es producto base)</option>
                        {(products || []).filter(p => p.sku !== sku).map(p => (
                          <option key={p.id || p.sku} value={p.sku}>
                            {p.name.toUpperCase()} ({p.sku}) - STOCK: {p.stock}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Piezas X Caja</label>
                      <input 
                        type="number" 
                        value={piezasXCaja} 
                        onChange={e => setPiezasXCaja(e.target.value)} 
                        placeholder="Ej: 4, 12, 24" 
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs" 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-nexus-800 bg-nexus-900/80 rounded-b-3xl flex justify-between items-center">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Box className="w-4 h-4" /> Los campos con (*) son obligatorios
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowAddModal(false)} className="px-8 py-4 rounded-xl font-black text-sm uppercase text-slate-300 hover:bg-nexus-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveProduct} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-xl font-black text-sm uppercase text-white shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2">
                  Guardar Producto
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL IMPRESIÓN DE ETIQUETAS */}
      {showLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-nexus-800">
              <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <BarcodeIcon className="text-emerald-400" /> Personaliza y Crea Etiquetas
              </h2>
              <button onClick={() => setShowLabelModal(false)} className="text-slate-500 hover:text-white transition-colors bg-nexus-800 p-2 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Configuración</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Seleccionar Producto</label>
                    <select className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-xs">
                      {products?.slice(0, 50).map(p => <option key={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cantidad de Etiquetas</label>
                    <input type="number" defaultValue={20} className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Formato de Papel</label>
                    <select className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-xs">
                      <option>Térmico 58mm (Rollo)</option>
                      <option>Térmico 80mm (Rollo)</option>
                      <option>Hoja Carta (Planilla Avery)</option>
                    </select>
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 px-6 py-4 rounded-xl font-black text-sm uppercase text-white shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2 mt-4">
                    <Printer className="w-5 h-5" /> Generar e Imprimir
                  </button>
                </div>
              </div>
              <div className="bg-[#0b1120] rounded-2xl border border-nexus-700 p-6 flex flex-col items-center justify-center">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 w-full text-center">Previsualización (Tiempo Real)</h3>
                <div className="bg-white p-4 rounded text-black text-center w-full shadow-xl">
                  <p className="font-black text-[11px] mb-1 leading-tight uppercase">MI TIENDITA</p>
                  <p className="font-bold text-[9px] mb-2 leading-tight uppercase line-clamp-1">{products && products.length > 0 ? products[0].name : 'CÓDIGO DE BARRAS'}</p>
                  <div className="flex justify-center scale-90 origin-top">
                    <Barcode value={products && products.length > 0 ? products[0].sku : '75010001'} width={1.5} height={40} fontSize={12} font="monospace" />
                  </div>
                  <p className="font-black text-xl mt-1">${products && products.length > 0 ? products[0].price.toFixed(2) : '15.00'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
