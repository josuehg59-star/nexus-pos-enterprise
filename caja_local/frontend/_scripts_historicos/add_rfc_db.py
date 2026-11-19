import re

with open('src/store/database.ts', encoding='utf-8') as f:
    c = f.read()

if 'rfc: string;' not in c:
    c = c.replace('address: string;', 'address: string;\n  rfc: string;')

with open('src/store/database.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added RFC to DB')
