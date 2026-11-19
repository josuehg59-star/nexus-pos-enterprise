import re

with open('src/pages/PosTerminal.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Update handleScan to check for client monedero first
scan_logic_old = """    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const q = scanInput.trim().toLowerCase();
      
      // Búsqueda estricta primero por SKU exacto
      let p = await db.products.where('sku').equals(scanInput.trim()).first();"""

scan_logic_new = """    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const val = scanInput.trim();
      const q = val.toLowerCase();
      
      // 1. Check if it's a Monedero Card
      const clientMatch = await db.clients.where('monederoCode').equals(val).first();
      if (clientMatch) {
        setClient(clientMatch);
        setScanInput('');
        return;
      }
      
      // 2. Búsqueda estricta primero por SKU exacto
      let p = await db.products.where('sku').equals(val).first();"""

if 'clientMatch' not in c:
    c = c.replace(scan_logic_old, scan_logic_new)

# 2. Add Monedero calculation on Checkout
# We need to find the `handleCheckout` function. Let's see what it looks like.
