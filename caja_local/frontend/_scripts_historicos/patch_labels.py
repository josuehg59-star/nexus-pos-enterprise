import os
import re

with open('src/pages/ImpresionEtiquetas.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old = """return arr.filter(p => p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s));"""
new = """return arr.filter(p => {
          const skuMatch = p.sku.toLowerCase().includes(s);
          const nameMatch = p.name.toLowerCase().includes(s);
          const b2Match = p.barcode2 && p.barcode2.toLowerCase().includes(s);
          const b3Match = p.barcode3 && p.barcode3.toLowerCase().includes(s);
          return skuMatch || nameMatch || b2Match || b3Match;
        });"""

c = c.replace(old, new)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched ImpresionEtiquetas.tsx")
