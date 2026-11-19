import os
import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure providers is imported
if "const providers =" not in code:
    code = code.replace("const products = useLiveQuery(() => db.products.toArray()) || [];", "const products = useLiveQuery(() => db.products.toArray()) || [];\n  const providers = useLiveQuery(() => db.providers.toArray()) || [];")

# Add state for supplier
if "const [supplier, setSupplier]" not in code:
    code = code.replace("const [category, setCategory] = useState('');", "const [category, setCategory] = useState('');\n  const [supplier, setSupplier] = useState('');")

# Fix the Proveedor dummy select
dummy_prov_select = r'<select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">\s*<option>SELECCIONAR PROVEEDOR</option>\s*<option>COCA COLA</option>\s*<option>SABRITAS</option>\s*</select>'
new_prov_select = """<select value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
                        <option value="">SELECCIONAR PROVEEDOR</option>
                        {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>"""
code = re.sub(dummy_prov_select, new_prov_select, code)

# Fix category dummy options (replace with unique categories from products)
dummy_cat_select = r'<select value=\{category\} onChange=\{\(e\) => setCategory\(e\.target\.value\)\} className="w-full bg-\[\#0b1120\] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">\s*<option>Bebidas</option>\s*<option>Abarrotes</option>\s*<option>Dulces</option>\s*<option>Limpieza</option>\s*<option>Sin Categor.*a</option>\s*</select>'
new_cat_select = """<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                        <option value="Sin Categoría">Sin Categoría</option>
                        {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>"""
code = re.sub(dummy_cat_select, new_cat_select, code)

# Update handleSaveProduct to include supplier (saved as category or supplier_id?)
# In database schema Product does NOT have supplier_id. Only category. Wait!
# Actually, the user's titan DB uses supplier_id in JSON but my schema is:
# export interface Product { id?: number; sku: string; name: string; category: string; price: number; cost: number; stock: number; status: string; }
# So we can just save it into a dynamic field or just ignore it for now since schema doesn't have it.
# Let's add supplier_id to the save logic so dexie just accepts it.
old_save = r'category: category || "Sin Categor.a",'
new_save = 'category: category || "Sin Categoría",\n        supplier_id: supplier,'
code = re.sub(old_save, new_save, code)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Inventory.tsx wired to real providers and categories")
