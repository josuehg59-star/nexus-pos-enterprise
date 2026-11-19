import os
import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure we don't duplicate state declarations.
if "const [supplier, setSupplier] = useState('');" not in code:
    code = code.replace("const [category, setCategory] = useState('');", "const [category, setCategory] = useState('');\n  const [supplier, setSupplier] = useState('');")

# In update
code = code.replace(
"""          await db.products.update(_editId, {
            sku: sku || String(Date.now()),
            name: name.toUpperCase(),
            cost: parseFloat(cost) || 0,
            price: parseFloat(price) || 0,
            stock: parseFloat(stock) || 0,
            category: category
          });""",
"""          await db.products.update(_editId, {
            sku: sku || String(Date.now()),
            name: name.toUpperCase(),
            cost: parseFloat(cost) || 0,
            price: parseFloat(price) || 0,
            stock: parseFloat(stock) || 0,
            category: category || "Sin Categoría",
            supplier_id: supplier
          } as any);""")

# In add
code = code.replace(
"""          await db.products.add({
            sku: sku || String(Date.now()),
            name: name.toUpperCase(),
            category: category || "Sin Categoría",
            price: parseFloat(price) || 0,
            cost: parseFloat(cost) || 0,
            stock: parseFloat(stock) || 0,
            status: 'ACTIVO'
          });""",
"""          await db.products.add({
            sku: sku || String(Date.now()),
            name: name.toUpperCase(),
            category: category || "Sin Categoría",
            supplier_id: supplier,
            price: parseFloat(price) || 0,
            cost: parseFloat(cost) || 0,
            stock: parseFloat(stock) || 0,
            status: 'ACTIVO'
          } as any);""")

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Inventory save fixed.")
