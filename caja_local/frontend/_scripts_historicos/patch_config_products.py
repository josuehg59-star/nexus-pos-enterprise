import os
import re

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_map_regex = r"const products = parsedData\.data\.products\.map\(\(p: any\) => \(\{\s*sku: p\.sku \|\| String\(p\.id\),\s*name: p\.name,\s*category: p\.category \|\| 'General',\s*price: parseFloat\(p\.price\) \|\| 0,\s*cost: parseFloat\(p\.cost\) \|\| 0,\s*stock: parseFloat\(p\.stock\) \|\| 0,\s*status: 'ACTIVO'\s*\}\)\);"

new_map = """const products = parsedData.data.products.map((p: any) => ({
            sku: p.sku || p.barcode || String(p.id),
            name: p.name,
            category: p.category || String(p.supplier_id) || 'General',
            price: parseFloat(p.price) || 0,
            cost: parseFloat(p.cost) || 0,
            stock: parseFloat(p.stock) || 0,
            status: 'ACTIVO',
            promo_qty: parseFloat(p.promoQty) || undefined,
            promo_price: parseFloat(p.promoPrice) || undefined,
            barcode2: (p.barcode && p.barcode !== p.sku) ? p.barcode : undefined,
            barcode3: (p.alias && p.alias !== p.sku && p.alias !== p.barcode) ? p.alias : undefined
          }));"""

c = re.sub(old_map_regex, new_map, c)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Properly patched Config.tsx product mapping!")
