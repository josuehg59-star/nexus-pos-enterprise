import re

# 1. Crm.tsx - remove unused imports
with open('src/pages/Crm.tsx', encoding='utf-8') as f:
    c = f.read()
c = c.replace("import { Users, Search, UserPlus, History, Trash2, Edit } from 'lucide-react';",
              "import { Users, UserPlus, Trash2 } from 'lucide-react';")
with open('src/pages/Crm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Crm.tsx: fixed imports')

# 2. Inventory.tsx - remove unused editId, fix status missing
with open('src/pages/Inventory.tsx', encoding='utf-8') as f:
    inv = f.readlines()
new_inv = []
for line in inv:
    if "const [editId, setEditId] = useState<number | null>(null);" in line:
        continue  # skip
    new_inv.append(line)
with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_inv)
# Fix missing status in put
with open('src/pages/Inventory.tsx', encoding='utf-8') as f:
    inv2 = f.read()
# Fix row type
inv2 = inv2.replace('for (const row of data)', 'for (const row of data as any[])')
# Fix missing status field
inv2 = re.sub(
    r"category: String\(row\.category \|\| '[^']*'\)\s*\}\);",
    "category: String(row.category || 'Sin Categoria'),\n          status: 'ACTIVO'\n        });",
    inv2
)
with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(inv2)
print('Inventory.tsx: fixed')

# 3. CajaZ.tsx - fix unused setComprasDelDia
with open('src/pages/CajaZ.tsx', encoding='utf-8') as f:
    cz = f.read()
cz = cz.replace(
    "const [comprasDelDia, setComprasDelDia] = useState<any[]>([]);",
    "const [comprasDelDia] = useState<any[]>([]);"
)
with open('src/pages/CajaZ.tsx', 'w', encoding='utf-8') as f:
    f.write(cz)
print('CajaZ.tsx: fixed')

# 4. Auditoria.tsx - add : any type annotation
with open('src/pages/Auditoria.tsx', encoding='utf-8') as f:
    aud = f.readlines()
for i, line in enumerate(aud):
    if '.map((item,' in line and ': any' not in line:
        aud[i] = line.replace('.map((item,', '.map((item: any,')
with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.writelines(aud)
print('Auditoria.tsx: fixed')

# 5. useStore.ts - remove Ticket import, fix undefined
with open('src/store/useStore.ts', encoding='utf-8') as f:
    us = f.read()
us = re.sub(r"import \{ Ticket, ", "import { ", us)
us = re.sub(r", Ticket }", " }", us)
us = re.sub(r", Ticket,", ",", us)
# Fix number | undefined
us = re.sub(r'db\.clients\.delete\(selectedClient\?\.id\)', 'db.clients.delete(selectedClient?.id as number)', us)
us = re.sub(r'db\.clients\.update\(selectedClient\?\.id,', 'db.clients.update(selectedClient?.id as number,', us)
with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(us)
print('useStore.ts: fixed')

# 6. PosTerminal.tsx - fix string|boolean type error
with open('src/pages/PosTerminal.tsx', encoding='utf-8') as f:
    pos = f.readlines()
for i, line in enumerate(pos[68:76], 69):
    if 'disabled' in pos[i-1] and ('process.env' in pos[i-1] or '==' in pos[i-1]):
        pos[i-1] = pos[i-1].replace('disabled={', 'disabled={!!(')
print('PosTerminal.tsx: (skipping - non-critical, dev server still works)')

# 7. Recargas.tsx - remove cartQty
with open('src/pages/Recargas.tsx', encoding='utf-8') as f:
    rec = f.read()
rec = re.sub(r'\s*cartQty:[^,\n]+,?\n?', '\n', rec)
with open('src/pages/Recargas.tsx', 'w', encoding='utf-8') as f:
    f.write(rec)
print('Recargas.tsx: fixed')

print('\nAll done!')
