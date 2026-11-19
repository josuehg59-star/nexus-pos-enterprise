import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add providers to db hook if needed
if "const providers =" not in code:
    code = code.replace("const products = useLiveQuery(() => db.products.toArray()) || [];", "const products = useLiveQuery(() => db.products.toArray()) || [];\n  const providers = useLiveQuery(() => db.providers.toArray()) || [];")

old_cat_select = """                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                      <option>Bebidas</option>
                      <option>Abarrotes</option>
                      <option>Dulces</option>
                      <option>Limpieza</option>
                      <option>Sin Categoría</option>
                    </select>"""

new_cat_select = """                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold">
                      <option value="Sin Categoría">Sin Categoría</option>
                      {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>"""

code = code.replace(old_cat_select, new_cat_select)
# The file has "Sin Categora" due to encoding in the dummy options, we need to match it!
code = code.replace("""<option>Sin Categora</option>""", """<option value="Sin Categoría">Sin Categoría</option>
                      {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => <option key={cat} value={cat}>{cat}</option>)}""")

old_prov_select = """                    <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
                      <option>SELECCIONAR PROVEEDOR</option>
                      <option>COCA COLA</option>
                      <option>SABRITAS</option>
                    </select>"""

new_prov_select = """                    <select value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
                      <option value="">SELECCIONAR PROVEEDOR</option>
                      {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>"""

code = code.replace(old_prov_select, new_prov_select)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Dropdowns fixed safely")
