import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update libre search
old_libre = r"p\.sku\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\)\)\);"
new_libre = "p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode2 && p.barcode2.toLowerCase().includes(searchQuery.toLowerCase()))))));"
code = re.sub(old_libre, new_libre, code)

# Update regular search
old_reg = r"p\.sku\.toLowerCase\(\)\.includes\(q\)\);"
new_reg = "p.sku.toLowerCase().includes(q) || (p.barcode2 && p.barcode2.toLowerCase().includes(q)));"
code = re.sub(old_reg, new_reg, code)

# Update report filter
old_rep = r"p\.sku\.toLowerCase\(\)\.includes\(filterText\.toLowerCase\(\)\)\)\.map"
new_rep = "p.sku.toLowerCase().includes(filterText.toLowerCase()) || (p.barcode2 && p.barcode2.toLowerCase().includes(filterText.toLowerCase())))).map"
code = re.sub(old_rep, new_rep, code)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria.tsx updated for barcode2.")
