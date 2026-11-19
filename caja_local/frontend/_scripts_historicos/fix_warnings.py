import re

# 1. CajaZ
with open('src/pages/CajaZ.tsx', encoding='utf-8') as f:
    c = f.read()
c = c.replace("const [comprasDelDia, _setComprasDelDia]", "const [comprasDelDia]")
c = c.replace("const [comprasDelDia, setComprasDelDia]", "const [comprasDelDia]")
with open('src/pages/CajaZ.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. Inventory
with open('src/pages/Inventory.tsx', encoding='utf-8') as f:
    inv = f.read()
inv = inv.replace("const [editId, setEditId] = useState", "const [_editId, setEditId] = useState")
with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(inv)

# 3. useStore
with open('src/store/useStore.ts', encoding='utf-8') as f:
    us = f.read()
us = re.sub(r'import \{ Ticket \}', 'import {}', us)
us = re.sub(r'import \{ Ticket, ', 'import { ', us)
with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(us)

print("Cleaned up unused vars")
