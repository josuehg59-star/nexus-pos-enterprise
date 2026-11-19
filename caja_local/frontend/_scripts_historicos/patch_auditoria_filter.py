import os
import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add a state for the filter
if "const [filterText, setFilterText]" not in code:
    code = code.replace("const [searchQuery, setSearchQuery] = useState('');",
                        "const [searchQuery, setSearchQuery] = useState('');\n  const [filterText, setFilterText] = useState('');")

# Bind the input to the state
input_pattern = r'<input\s+type="text"\s+placeholder="FILTRAR EN LISTA ACTUAL\.\.\."\s+className="[^"]+"[\s]*/>'
new_input = """<input 
                type="text" 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="FILTRAR EN LISTA ACTUAL..." 
                className="w-full bg-[#1e293b]/50 border border-[#334155]/50 text-white pl-10 pr-4 py-3 rounded-lg font-bold focus:outline-none focus:border-blue-500 text-xs italic placeholder-slate-500"
              />"""

if re.search(input_pattern, code):
    code = re.sub(input_pattern, new_input, code)
else:
    print("Could not find the filter input pattern")


# Apply the filter to the rendered list!
# Let's find where products is mapped: `products.map(p => (`
map_pattern = r'products\.map\(\(p\s*,\s*i\)\s*=>\s*\('
new_map = """products.filter((p: any) => !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()) || p.sku.toLowerCase().includes(filterText.toLowerCase())).map((p, i) => ("""

if re.search(map_pattern, code):
    code = re.sub(map_pattern, new_map, code)
else:
    # try simpler
    map_pattern2 = r'products\.map\(p => \('
    new_map2 = """products.filter((p: any) => !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()) || p.sku.toLowerCase().includes(filterText.toLowerCase())).map(p => ("""
    if re.search(map_pattern2, code):
        code = re.sub(map_pattern2, new_map2, code)
    else:
        print("Could not find the products map pattern")

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria.tsx list filter bound successfully!")
