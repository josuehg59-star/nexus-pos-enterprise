import re

with open('src/pages/SmartPurchasing.tsx', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "import { db, Product } from '../store/database';",
    "import { db } from '../store/database';\nimport type { Product } from '../store/database';"
)

with open('src/pages/SmartPurchasing.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed import in SmartPurchasing')
