import os
import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_put_regex = re.compile(r"await db\.products\.put\(\{[\s\S]*?status: 'ACTIVO'\n\s*\}\);")
match = bad_put_regex.search(c)

if match:
    good_put_logic = """
            // Normalizar las llaves (keys) del Excel para evitar problemas con acentos y mayúsculas
            const normalizedRow: any = {};
            for (const key in row) {
              const cleanKey = key.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase();
              normalizedRow[cleanKey] = row[key];
            }

            const finalSku = String(normalizedRow['sku'] || normalizedRow['codigo'] || rawSku).trim() || crypto.randomUUID().substring(0,8);
            
            await db.products.put({
              sku: finalSku,
              name: String(rawName).trim().toUpperCase(),
              category: normalizedRow['categoria'] || normalizedRow['grupo'] || 'General',
              family: normalizedRow['grupofamilia'] || normalizedRow['familia'] || '',
              supplier_id: normalizedRow['proveedor'] || '',
              price: parseFloat(normalizedRow['precio venta'] || normalizedRow['precio']) || 0,
              cost: parseFloat(normalizedRow['costo']) || 0,
              stock: parseFloat(normalizedRow['stock actual'] || normalizedRow['stock']) || 0,
              unit_measure: normalizedRow['udm'] || normalizedRow['unidad'] || 'Pza',
              iva: parseFloat(normalizedRow['iva %'] || normalizedRow['iva']) || 0,
              min_stock: parseFloat(normalizedRow['stock minimo']) || 1,
              max_stock: parseFloat(normalizedRow['stock maximo']) || 10,
              description: normalizedRow['descripcion'] || rawName,
              barcode2: normalizedRow['codigos alternativos'] || normalizedRow['codigos alternos'] || '',
              status: 'ACTIVO'
            });
"""
    c = c[:match.start()] + good_put_logic.strip() + c[match.end():]

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Excel Import patched for unicode headers")
