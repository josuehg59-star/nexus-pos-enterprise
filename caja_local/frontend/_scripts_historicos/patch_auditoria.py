import os
import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    code = f.read()

# 1. Add providers to the database queries at the top
if "const dbProviders = useLiveQuery" not in code:
    pattern = r'(const products = useLiveQuery\([\s\S]*?\n  \}, \[searchQuery, modalidad, proveedor, isLibre, conteos\]\);\n)'
    replacement = r'\1\n  const dbProviders = useLiveQuery(() => db.providers.toArray()) || [];\n'
    code = re.sub(pattern, replacement, code)

# 2. Replace the hardcoded select options for Proveedor
hardcoded_select = """<select 
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="bg-[#131b2c] border border-nexus-700 text-white px-4 py-2 rounded-lg font-bold text-xs focus:outline-none focus:border-blue-500 w-56 appearance-none"
            >
              <option value="">SELECCIONAR PR...</option>
              <option value="ABARROTES">ABARROTES Y SALCHICHONERIA MIRIAM</option>
              <option value="AGUA CRISTAL">AGUA CRISTAL</option>
              <option value="AGUA ELECTRON">AGUA ELECTRON</option>
              <option value="AXENDER">AXENDER</option>
              <option value="BARCEL">BARCEL - GB11385517</option>
              <option value="COCA COLA">COCA COLA</option>
            </select>"""

dynamic_select = """<select 
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="bg-[#131b2c] border border-nexus-700 text-white px-4 py-2 rounded-lg font-bold text-xs focus:outline-none focus:border-blue-500 w-56 appearance-none"
            >
              <option value="">SELECCIONAR PR...</option>
              {dbProviders.map((prov: any) => (
                <option key={prov.id} value={prov.name}>{prov.name}</option>
              ))}
            </select>"""

code = code.replace(hardcoded_select, dynamic_select)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria.tsx modified to use dynamic providers!")
