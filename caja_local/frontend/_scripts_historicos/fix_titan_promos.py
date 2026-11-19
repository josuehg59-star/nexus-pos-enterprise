import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Update the product mapping
old_mapping = """          if (parsedData.data && parsedData.data.products) {
          setMigrationMsg('Formato TITAN detectado. Migrando catálogo...');
          const products = parsedData.data.products.map((p: any) => ({
            sku: p.sku || String(p.id),
            name: p.name,
            category: p.category || 'General',
            price: parseFloat(p.price) || 0,
            cost: parseFloat(p.cost) || 0,
            stock: parseFloat(p.stock) || 0,
            status: 'ACTIVO'
          }));
          await db.products.bulkPut(products);"""

new_mapping = """          if (parsedData.data && parsedData.data.products) {
          setMigrationMsg('Formato TITAN detectado. Migrando catálogo...');
          const products = parsedData.data.products.map((p: any) => ({
            sku: p.sku || p.barcode || String(p.id),
            name: p.name,
            category: p.category || 'General',
            price: parseFloat(p.price) || 0,
            cost: parseFloat(p.cost) || 0,
            stock: parseFloat(p.stock) || 0,
            status: 'ACTIVO',
            promo_qty: parseFloat(p.promoQty) || undefined,
            promo_price: parseFloat(p.promoPrice) || undefined,
            barcode2: p.barcode && p.barcode !== p.sku ? p.barcode : undefined,
            barcode3: p.alias && p.alias !== p.sku && p.alias !== p.barcode ? p.alias : undefined
          }));
          await db.products.bulkPut(products);"""

c = c.replace(old_mapping, new_mapping)

# 2. Add the Migrator box back to the UI at the top of the left column
migrator_box = """          {/* MIGRACIÓN TITAN */}
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
"""

# Insert right after {/* COLUMNA IZQUIERDA */}
if '{/* MIGRACIÓN TITAN */}' not in c:
    c = c.replace('{/* COLUMNA IZQUIERDA */}\n        <div className="space-y-6">',
                  '{/* COLUMNA IZQUIERDA */}\n        <div className="space-y-6">\n' + migrator_box)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated migration logic and UI')
