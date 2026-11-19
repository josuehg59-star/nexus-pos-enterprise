import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add barcode2 state
code = code.replace("const [category, setCategory] = useState('Sin Categoría');", "const [category, setCategory] = useState('Sin Categoría');\n  const [barcode2, setBarcode2] = useState('');")

# Update edit button to set barcode2
old_edit_btn = r"setEditId\(item\.id \|\| null\); setSku\(item\.sku\); setName\(item\.name\); setCategory\(item\.category \|\| \"\"\);"
new_edit_btn = r'setEditId(item.id || null); setSku(item.sku); setName(item.name); setCategory(item.category || ""); setBarcode2(item.barcode2 || "");'
code = re.sub(old_edit_btn, new_edit_btn, code)

# Update handleSaveProduct to save barcode2
old_save_update = r"stock: parseFloat\(stock\) \|\| 0,\n\s*category: category \|\| \"Sin Categoría\",\n\s*supplier_id: supplier"
new_save_update = 'stock: parseFloat(stock) || 0,\n            category: category || "Sin Categoría",\n            supplier_id: supplier,\n            barcode2: barcode2'
code = re.sub(old_save_update, new_save_update, code)

old_save_add = r"supplier_id: supplier,\n\s*price: parseFloat\(price\) \|\| 0,\n\s*cost: parseFloat\(cost\) \|\| 0,\n\s*stock: parseFloat\(stock\) \|\| 0,\n\s*status: 'ACTIVO'"
new_save_add = "supplier_id: supplier,\n            barcode2: barcode2,\n            price: parseFloat(price) || 0,\n            cost: parseFloat(cost) || 0,\n            stock: parseFloat(stock) || 0,\n            status: 'ACTIVO'"
code = re.sub(old_save_add, new_save_add, code)

# Also clear barcode2 when Edit is cancelled/saved
code = code.replace("setStock('');", "setStock('');\n      setBarcode2('');")

# Bind the input
old_input = r'<input type="text" placeholder="Separa por comas..." className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />'
new_input = '<input type="text" value={barcode2} onChange={e=>setBarcode2(e.target.value)} placeholder="Separa por comas..." className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />'
code = code.replace(old_input, new_input)

# Update Inventory search to include barcode2
old_search = r"p\.sku\.toLowerCase\(\)\.includes\(query\)"
new_search = "p.sku.toLowerCase().includes(query) || (p.barcode2 && p.barcode2.toLowerCase().includes(query))"
code = re.sub(old_search, new_search, code)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Inventory.tsx updated for barcode2.")
