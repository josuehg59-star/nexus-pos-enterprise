import re

with open('src/store/database.ts', encoding='utf-8') as f:
    c = f.read()

if 'monederoCode?: string;' not in c:
    c = c.replace('credito: number;', 'credito: number;\n  monederoCode?: string;')

with open('src/store/database.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added monederoCode to DB Client interface')
