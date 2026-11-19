import { useState } from 'react';
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
  const products = useLiveQuery(
    () => {
      if (searchQuery) {
        // Simple case-insensitive search by name or sku
        const term = searchQuery.toLowerCase();
        return db.products.filter(p => {
          const skuMatch = p.sku.toLowerCase().includes(term);
          const nameMatch = p.name.toLowerCase().includes(term);
          const b2Match = !!p.barcode2 && p.barcode2.toLowerCase().includes(term);
          const b3Match = !!p.barcode3 && p.barcode3.toLowerCase().includes(term);
          return nameMatch || skuMatch || b2Match || b3Match;
        }).toArray().then(arr => arr.sort((a,b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b.stock || 0) - (a.stock || 0)));
      }
      return db.products.toArray().then(arr => arr.sort((a,b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b.stock || 0) - (a.stock || 0)));
    },
    [searchQuery]
  );

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
      
      {/* HEADER ADAPTABLE CELULAR / ESCRITORIO */}
      <div className="bg-nexus-900/70 border-b border-nexus-800 shrink-0 p-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-lg tracking-wider text-white flex items-center gap-1.5">
                  CATÁLOGO <span className="text-blue-400">MAESTRO</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">({products?.length || 0})</span>
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">GESTIÓN CENTRALIZADA DE PRODUCTOS</p>
              </div>
            </div>

            {/* BOTÓN NUEVO PRODUCTO DESTACADO EN CELULAR */}
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="sm:hidden bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> NUEVO
            </button>
          </div>
          
          {/* BOTONES DE ACCIÓN (SCROLLABLE EN MÓVIL) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="hidden sm:flex bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-xs items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> NUEVO PRODUCTO
            </button>
            <label className='cursor-pointer bg-fuchsia-900/30 text-fuchsia-400 hover:bg-fuchsia-900/50 border border-fuchsia-800/60 px-3 py-2 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0'>
              <Download className='w-3.5 h-3.5' /> IMPORTAR EXCEL
              <input type='file' accept='.xlsx, .xls' className='hidden' onChange={handleImportExcel} />
            </label>
            <button onClick={() => setShowBarridoModal(true)} className='bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-800/50 px-3 py-2 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0'>
              <Activity className='w-3.5 h-3.5' /> BARRIDO
            </button>
            <button onClick={handleExportExcel} className='bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/60 px-3 py-2 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0'>
              <Download className='w-3.5 h-3.5' /> EXPORTAR
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2.5 sm:p-5 overflow-hidden w-full">
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código de barras, descripción..." 
              className="w-full bg-nexus-900/70 border border-nexus-700 text-white pl-9 pr-3 py-2 rounded-xl font-bold text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSortBy(sortBy === 'name' ? 'stock' : 'name')} className="flex-1 sm:flex-initial bg-nexus-900/60 border border-nexus-700 text-slate-300 px-3 py-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 hover:bg-nexus-800 transition-colors">
              <ArrowUpDown className="w-3.5 h-3.5" /> {sortBy === 'name' ? 'ALFABÉTICO' : 'POR STOCK'}
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL DE INVENTARIO */}
        <div className="flex-1 bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-nexus-900 sticky top-0 z-10 border-b border-nexus-800 shadow-md">
                <tr>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">SKU / CÓDIGO</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">DESCRIPCIÓN</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">CATEGORÍA</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">COSTO</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">PRECIO</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">UTILIDAD</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">STOCK</th>
                  <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800">
                {products?.map((item) => (
                  <tr key={item.id} className="hover:bg-nexus-800/50 transition-colors group">
                    <td className="p-3 font-mono text-xs font-bold text-slate-300">{item.sku}</td>
                    <td className="p-3 font-bold text-white text-xs">{item.name}</td>
                    <td className="p-3 text-center">
                      <span className="bg-nexus-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-nexus-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-500 text-right text-xs">${item.cost.toFixed(2)}</td>
                    <td className="p-3 font-mono font-black text-emerald-400 text-right text-xs">${item.price.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-blue-400 text-center text-xs">
                      {(((item.price - item.cost) / (item.cost || 1)) * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-black text-sm ${item.stock > 10 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity">
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
                        }} className="p-1.5 bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Editar Producto">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        <button onClick={() => handleDelete(item.id!)} className="p-1.5 bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Eliminar Producto">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products?.length === 0 && (
              <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
                <Box className="w-14 h-14 text-slate-500 mb-3" />
                <h3 className="text-sm sm:text-base font-black text-slate-300 uppercase tracking-wider">NO HAY PRODUCTOS EN LA BASE DE DATOS</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 mb-4">Comienza registrando tu primer producto en el catálogo</p>
                <button
                  onClick={() => { resetForm(); setShowAddModal(true); }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> REGISTRAR PRIMER PRODUCTO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTÓN FLOTANTE NUEVO PRODUCTO PARA MÓVIL */}
      <button
        onClick={() => { resetForm(); setShowAddModal(true); }}
        className="sm:hidden fixed bottom-5 right-5 z-40 bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-2xl shadow-2xl shadow-blue-600/50 flex items-center gap-1.5 font-black text-xs active:scale-95 transition-all border border-blue-400/40"
        title="Crear Nuevo Producto"
      >
        <Plus className="w-4 h-4" /> NUEVO PRODUCTO
      </button>

      {/* MODAL NUEVO PRODUCTO TITAN POS ESTILO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-2 sm:p-4">
          <div className="w-full max-w-4xl bg-nexus-900 border border-nexus-700 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-nexus-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 sm:p-2.5 rounded-xl">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">{_editId ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Catálogo Maestro Móvil</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors bg-nexus-800 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 custom-scrollbar">
              <div className="space-y-4 sm:space-y-6">
                
                {/* IDENTIFICACIÓN BÁSICA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Código de Barras (SKU) *</label>
                    <div className="flex relative">
                      <ScanBarcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Escanear o Escribir..." 
                        className="w-full bg-[#0b1120] border-2 border-blue-900 text-white pl-10 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-mono font-bold text-sm sm:text-base" 
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Descripción del Producto *</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: COCA COLA 600ML REGULAR" 
                      className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-sm sm:text-base uppercase" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Códigos Alternos</label>
                    <input type="text" value={barcode2} onChange={e=>setBarcode2(e.target.value)} placeholder="Separa por comas..." className="w-full bg-nexus-900 border border-nexus-700 text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Categoría</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs sm:text-sm">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Proveedor</label>
                    <select value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs sm:text-sm">
                        <option value="">SELECCIONAR PROVEEDOR</option>
                        {supplier && !providers.some(p => p.name === supplier) && (
                          <option value={supplier}>{supplier}</option>
                        )}
                        {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Unidad de Medida</label>
                  <select value={unitMeasure} onChange={e=>setUnitMeasure(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs sm:text-sm">
                    <option value="PZA">PZA (Pieza/Unidad)</option>
                    <option value="KG">KG (Kilogramos)</option>
                    <option value="LTS">LTS (Litros)</option>
                  </select>
                </div>

                {/* PRECIOS Y COSTOS */}
                <div className="border border-nexus-700 rounded-2xl p-3.5 sm:p-5 bg-nexus-900/50">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3">Precios y Rentabilidad</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Costo Compra</label>
                      <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$ 0.00" className="w-full bg-[#0b1120] border border-nexus-700 text-amber-400 font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 transition-colors text-base font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Precio Venta *</label>
                      <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$ 0.00" className="w-full bg-[#0b1120] border-2 border-emerald-900 text-emerald-400 font-black px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-lg font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Margen Calculado</label>
                      <div className="w-full bg-[#0b1120] border border-nexus-800 text-blue-400 font-black px-3 py-2 rounded-xl text-base flex items-center justify-center font-mono">
                         {cost && price ? (((parseFloat(price) - parseFloat(cost)) / (parseFloat(cost) || 1)) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Stock Actual</label>
                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-center text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mínimo</label>
                    <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="1" className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-center text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Máximo</label>
                    <input type="number" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} placeholder="10" className="w-full bg-nexus-900 border border-nexus-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-center text-sm" />
                  </div>
                </div>

                {/* PROMOCIONES ESPECIALES */}
                <div className="border border-fuchsia-900/50 bg-fuchsia-900/5 p-3.5 sm:p-4 rounded-2xl">
                  <h4 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-2.5">Promociones Especiales</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cant. Promo</label>
                      <input type="number" value={promoQty} onChange={(e) => setPromoQty(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold text-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Precio Promo ($)</label>
                      <input type="number" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold text-xs" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">% Descuento</label>
                      <div className="w-full bg-[#0b1120] border border-nexus-800 text-fuchsia-400 font-bold px-2 py-1.5 rounded-xl text-center text-xs">
                        {price && promoPrice && parseFloat(price) > 0 ? (((parseFloat(price) - parseFloat(promoPrice)) / parseFloat(price)) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* IMPUESTOS */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">IEPS %</label>
                    <div className="flex gap-1.5">
                      <input type="number" value={ieps} onChange={(e) => setIeps(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs" />
                      <button type="button" onClick={() => setIeps('8')} className="bg-nexus-800 border border-nexus-700 text-white px-2.5 rounded-xl font-black text-xs hover:bg-nexus-700 transition-colors">8%</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">IVA %</label>
                    <div className="flex gap-1.5">
                      <input type="number" value={iva} onChange={(e) => setIva(e.target.value)} placeholder="0" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs" />
                      <button type="button" onClick={() => setIva('16')} className="bg-nexus-800 border border-nexus-700 text-white px-2.5 rounded-xl font-black text-xs hover:bg-nexus-700 transition-colors">16%</button>
                    </div>
                  </div>
                </div>

                {/* AUTO-CONVERSIÓN */}
                <div className="border border-blue-900/50 bg-blue-900/5 p-3.5 sm:p-4 rounded-2xl">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2.5">Auto-Conversión (Abrir Caja)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Caja Padre</label>
                      <select 
                        value={parentSku} 
                        onChange={e => setParentSku(e.target.value)} 
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs uppercase"
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Piezas X Caja</label>
                      <input 
                        type="number" 
                        value={piezasXCaja} 
                        onChange={e => setPiezasXCaja(e.target.value)} 
                        placeholder="Ej: 4, 12, 24" 
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs" 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-nexus-800 bg-nexus-900/90 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-2.5">
              <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 hidden sm:flex">
                <Box className="w-3.5 h-3.5 text-blue-400" /> Los campos con (*) son obligatorios
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setShowAddModal(false)} className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-xs uppercase text-slate-300 bg-nexus-800 hover:bg-nexus-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveProduct} disabled={isSubmitting} className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-black text-xs uppercase text-white shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-1.5 active:scale-95">
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
