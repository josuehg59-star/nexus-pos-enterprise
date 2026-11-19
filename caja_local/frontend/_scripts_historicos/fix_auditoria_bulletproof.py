import os
import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make the provider filter bulletproof. It will stringify the object and check for the provider string anywhere.
old_filter = r"results = results\.filter\(p => p\.category === proveedor \|\| p\.proveedor === proveedor \|\| \(p as any\)\.brand === proveedor \|\| p\.supplier_id === proveedor\);"
new_filter = """
            results = results.filter(p => {
              const pStr = JSON.stringify(p).toUpperCase();
              return pStr.includes(proveedor.toUpperCase());
            });
"""

if re.search(old_filter, code):
    code = re.sub(old_filter, new_filter.strip(), code)
else:
    print("Could not find Auditoria provider filter")
    
with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria provider filter made bulletproof.")
