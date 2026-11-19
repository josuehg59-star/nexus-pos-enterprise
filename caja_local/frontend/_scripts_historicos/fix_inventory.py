import os
import re

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add sortBy state
if "const [sortBy, setSortBy]" not in code:
    code = code.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n  const [sortBy, setSortBy] = useState('name');")

# Fix button ORDENAR
old_ordenar = r'<button className="bg-nexus-900/50 border border-nexus-700 text-slate-300 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-nexus-800 transition-colors">\s*<ArrowUpDown className="w-4 h-4" /> ORDENAR\s*</button>'
new_ordenar = r"""<button onClick={() => setSortBy(sortBy === 'name' ? 'stock' : 'name')} className="bg-nexus-900/50 border border-nexus-700 text-slate-300 px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-nexus-800 transition-colors">
              <ArrowUpDown className="w-4 h-4" /> ORDENAR ({sortBy === 'name' ? 'ALFABÉTICO' : 'STOCK'})
            </button>"""
code = re.sub(old_ordenar, new_ordenar, code)

# Apply sorting logic in products list
old_products = r"const term = searchQuery\.toLowerCase\(\);\s*return db\.products\.filter\(p => \{(.*?)\}\)\.toArray\(\);"
# Need to make sure it sorts
code = code.replace("}).toArray();", "}).toArray().then(arr => arr.sort((a,b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b.stock || 0) - (a.stock || 0)));")
code = code.replace("return db.products.toArray();", "return db.products.toArray().then(arr => arr.sort((a,b) => sortBy === 'name' ? a.name.localeCompare(b.name) : (b.stock || 0) - (a.stock || 0)));")

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Wired Inventory.tsx ORDENAR")
