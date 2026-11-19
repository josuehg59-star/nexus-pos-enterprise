import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("const tDate = t.date.split('T')[0];", 
              "const tDate = typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0];")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched Reports.tsx")
