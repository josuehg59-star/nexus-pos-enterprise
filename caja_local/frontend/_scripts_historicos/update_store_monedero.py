import re

with open('src/store/useStore.ts', encoding='utf-8') as f:
    c = f.read()

c = c.replace('total * 0.05', 'total * 0.01')

with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated useStore.ts')
