import os
import re

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# We will just replace the exact line logic
old_regex = r"const product = await db\.products\.where\('sku'\)\.equals\(term\)\.first\(\) \|\| \n?\s*\(await db\.products\.toArray\(\)\)\.find\(p => p\.name\.toUpperCase\(\)\.includes\(term\)\);"

new_code = """const termLow = term.toLowerCase();
        let product = await db.products.where('sku').equals(term).first();
        if (!product) {
          product = (await db.products.toArray()).find(p => 
            p.name.toUpperCase().includes(term) || 
            (p.barcode2 && p.barcode2.toLowerCase().includes(termLow)) || 
            (p.barcode3 && p.barcode3.toLowerCase().includes(termLow))
          );
        }"""

c = re.sub(old_regex, new_code, c)

with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Kardex patched with regex")
