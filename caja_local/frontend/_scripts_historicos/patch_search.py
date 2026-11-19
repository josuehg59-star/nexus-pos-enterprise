import os
import re

def patch_file(filepath, old_str, new_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()
    if old_str in c:
        c = c.replace(old_str, new_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Patched {filepath}")
    else:
        print(f"Skipped {filepath} - string not found")


# PosTerminal.tsx
pos_old = """        // Búsqueda múltiple si no hay sku exacto
        const matches = await db.products.filter(prod => 
          prod.sku.toLowerCase().includes(q) || 
          prod.name.toLowerCase().includes(q) || 
          ((prod as any).category && String((prod as any).category).toLowerCase().includes(q))
        ).toArray();"""
pos_new = """        // Búsqueda múltiple estricta (SKU, nombre, categorías y códigos alternos multiformato)
        const matches = await db.products.filter(prod => {
          const skuMatch = prod.sku.toLowerCase().includes(q);
          const nameMatch = prod.name.toLowerCase().includes(q);
          const catMatch = (prod as any).category && String((prod as any).category).toLowerCase().includes(q);
          const b2Match = prod.barcode2 && prod.barcode2.toLowerCase().includes(q);
          const b3Match = prod.barcode3 && prod.barcode3.toLowerCase().includes(q);
          return skuMatch || nameMatch || catMatch || b2Match || b3Match;
        }).toArray();"""
patch_file('src/pages/PosTerminal.tsx', pos_old, pos_new)


# Inventory.tsx
inv_old = """        return db.products.filter(p => 
          p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
        ).toArray();"""
inv_new = """        return db.products.filter(p => {
          const skuMatch = p.sku.toLowerCase().includes(term);
          const nameMatch = p.name.toLowerCase().includes(term);
          const b2Match = p.barcode2 && p.barcode2.toLowerCase().includes(term);
          const b3Match = p.barcode3 && p.barcode3.toLowerCase().includes(term);
          return nameMatch || skuMatch || b2Match || b3Match;
        }).toArray();"""
patch_file('src/pages/Inventory.tsx', inv_old, inv_new)


# SmartPurchasing.tsx
smart_old = """return products.filter(p => p.name.toLowerCase().includes(s) || p.sku.includes(s)).slice(0, 5);"""
smart_new = """return products.filter(p => {
      const skuMatch = p.sku.toLowerCase().includes(s);
      const nameMatch = p.name.toLowerCase().includes(s);
      const b2Match = p.barcode2 && p.barcode2.toLowerCase().includes(s);
      const b3Match = p.barcode3 && p.barcode3.toLowerCase().includes(s);
      return nameMatch || skuMatch || b2Match || b3Match;
    }).slice(0, 5);"""
patch_file('src/pages/SmartPurchasing.tsx', smart_old, smart_new)


# Kardex.tsx (it uses an exact match first, then a find)
kardex_old = """      if (e.key === 'Enter' && scanInput.trim()) {
        const term = scanInput.trim().toUpperCase();
        const product = await db.products.where('sku').equals(term).first() || 
                        (await db.products.toArray()).find(p => p.name.toUpperCase().includes(term));"""
kardex_new = """      if (e.key === 'Enter' && scanInput.trim()) {
        const term = scanInput.trim().toUpperCase();
        const termLow = term.toLowerCase();
        
        // Búsqueda exhaustiva
        let product = await db.products.where('sku').equals(term).first();
        if (!product) {
          product = (await db.products.toArray()).find(p => 
            p.name.toUpperCase().includes(term) || 
            (p.barcode2 && p.barcode2.toLowerCase().includes(termLow)) || 
            (p.barcode3 && p.barcode3.toLowerCase().includes(termLow))
          );
        }"""
patch_file('src/pages/Kardex.tsx', kardex_old, kardex_new)
