import os

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

if "dexie-react-hooks" not in c:
    c = c.replace("import { db } from '../store/database';", "import { useLiveQuery } from 'dexie-react-hooks';\nimport { db } from '../store/database';")

with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Kardex imports FIXED properly")
