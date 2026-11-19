import re

with open('src/pages/Providers.tsx', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "import { db, Provider } from '../store/database';",
    "import { db } from '../store/database';\nimport type { Provider } from '../store/database';"
)

with open('src/pages/Providers.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed import in Providers.tsx')
