import re

# ── Crm.tsx ──────────────────────────────────────────────────────────────────
lines = open('src/pages/Crm.tsx', encoding='utf-8').readlines()
# Remove lines 35-47 (handleRecarga function) - index 34 to 47
new_lines = lines[:34] + lines[47:]
open('src/pages/Crm.tsx', 'w', encoding='utf-8').writelines(new_lines)
print('Crm.tsx: removed handleRecarga')

# Fix onClick on line 114 (now shifted) - find and replace
c = open('src/pages/Crm.tsx', encoding='utf-8').read()
c = re.sub(r"onClick=\{\(\) => \{ setSelectedClient.*?setShowMonederoModal\(true\); \}\}", "onClick={() => {}}", c, flags=re.DOTALL)
open('src/pages/Crm.tsx', 'w', encoding='utf-8').write(c)
print('Crm.tsx: fixed onClick')

# ── Inventory.tsx ─────────────────────────────────────────────────────────────
lines = open('src/pages/Inventory.tsx', encoding='utf-8').readlines()
for i, l in enumerate(lines[20:30], 21): print(i, repr(l))
