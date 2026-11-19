import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_line = "const finalSku = String(rawSku).trim() || crypto.randomUUID().substring(0,8);"
# Make sure we only remove the FIRST occurrence (the one right before normalization)
# Actually, the first one is the bad one. The second one is the one we want to keep.
c = c.replace(bad_line + "\n            // Normalizar", "// Normalizar")

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Removed duplicate finalSku")
