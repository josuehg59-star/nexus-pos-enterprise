import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

missing_vars = """
  const kardex = useLiveQuery(() => db.kardex.toArray(), []) || [];
  const cortes = useLiveQuery(() => db.cortes.toArray(), []) || [];
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [];
"""

old_target = "const products = useLiveQuery(() => db.products.toArray(), []) || [];"

if "const kardex =" not in c:
    c = c.replace(old_target, old_target + "\n" + missing_vars)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Injected missing LiveQueries in Reports")
