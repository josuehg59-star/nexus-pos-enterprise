import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Aggressively replace handleExportExcel
c = re.sub(
    r"const handleExportExcel = async \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, 'Inventario\.xlsx'\);\n    \};",
    """const handleExportExcel = async () => {
      const allProducts = await db.products.toArray();
      const excelData = allProducts.map((p: any) => ({
        'Nombre': p.name || '',
        'SKU': p.sku || '',
        'Categoría': p.category || 'Abarrotes',
        'Grupo/Familia': p.family || '',
        'Proveedor': p.supplier_id || 'GENERAL',
        'Precio Venta': p.price || 0,
        'Costo': p.cost || 0,
        'Stock Actual': p.stock || 0,
        'UDM': p.unit_measure || 'Pza',
        'IVA %': p.iva || 0,
        'Stock Mínimo': p.min_stock || 1,
        'Stock Máximo': p.max_stock || 10,
        'Impuesto Compra %': 0,
        'Descripción': p.description || p.name || '',
        'Codigos Alternativos': p.barcode2 || ''
      }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, 'Catalogo_Productos.xlsx');
    };""",
    c
)

# Aggressively replace handleImportExcel
c = re.sub(
    r"const handleImportExcel = async \(e: any\) => \{[\s\S]*?reader\.readAsBinaryString\(file\);\n    \};",
    """const handleImportExcel = async (e: any) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = (evt.target as any).result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          let count = 0;
          for (const row of data as any[]) {
            const rawSku = row.SKU || row.sku || '';
            const rawName = row.Nombre || row.name || '';
            if (!rawName) continue;

            const finalSku = String(rawSku).trim() || crypto.randomUUID().substring(0,8);
            await db.products.put({
              sku: finalSku,
              name: String(rawName).trim().toUpperCase(),
              category: row['Categoría'] || row.category || 'General',
              family: row['Grupo/Familia'] || '',
              supplier_id: row.Proveedor || row.proveedor || '',
              price: parseFloat(row['Precio Venta'] || row.price) || 0,
              cost: parseFloat(row.Costo || row.cost) || 0,
              stock: parseFloat(row['Stock Actual'] || row.stock) || 0,
              unit_measure: row.UDM || 'Pza',
              iva: parseFloat(row['IVA %']) || 0,
              min_stock: parseFloat(row['Stock Mínimo']) || 1,
              max_stock: parseFloat(row['Stock Máximo']) || 10,
              description: row['Descripción'] || '',
              barcode2: row['Codigos Alternativos'] || '',
              status: 'ACTIVO'
            });
            count++;
          }
          alert(`¡Éxito! Se importaron ${count} productos con todo y códigos alternos.`);
        } catch (err) {
          console.error(err);
          alert('Error importando Excel.');
        }
      };
      reader.readAsBinaryString(file);
      e.target.value = '';
    };""",
    c
)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Aggressive Excel patching complete.")
