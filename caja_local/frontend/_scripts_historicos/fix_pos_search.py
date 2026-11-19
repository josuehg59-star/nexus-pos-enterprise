import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix POS Terminal search to be bulletproof
old_filter = r"const matches = await db\.products\.filter\(prod => \{[\s\S]*?return skuMatch \|\| nameMatch \|\| catMatch \|\| !!b2Match \|\| !!b3Match;\s*\}\)\.limit\(15\)\.toArray\(\);"

new_filter = """
        const matches = await db.products.filter(prod => {
          const skuMatch = String(prod.sku || '').toLowerCase().includes(q);
          const nameMatch = String(prod.name || '').toLowerCase().includes(q);
          const catMatch = String((prod as any).category || '').toLowerCase().includes(q);
          const b2Match = String((prod as any).barcode2 || '').toLowerCase().includes(q);
          const b3Match = String((prod as any).barcode3 || '').toLowerCase().includes(q);
          return skuMatch || nameMatch || catMatch || b2Match || b3Match;
        }).limit(15).toArray();
"""

if re.search(old_filter, code):
    code = re.sub(old_filter, new_filter.strip(), code)
else:
    print("Could not find POS filter")
    
# Fix POS Terminal string again just in case (the previous script used node and might have missed something)
code = code.replace("CR%DITO", "CRÉDITO")

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PosTerminal search made bulletproof.")
