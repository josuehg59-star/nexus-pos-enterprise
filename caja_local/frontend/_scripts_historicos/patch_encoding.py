import os

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix mangled text for CRÉDITO
c = c.replace("CRDITO", "CRÉDITO")
c = c.replace("CRDITO", "CRÉDITO")
c = c.replace("CR%DITO", "CRÉDITO")
c = c.replace("CRÃ‰DITO", "CRÉDITO")

# Let's write the file back
with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed mangled strings")
