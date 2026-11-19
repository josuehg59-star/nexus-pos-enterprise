import os
import re

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r"import\s*\{[^}]*useState[^}]*\}\s*from\s*'react';", "import { useState, useEffect, useRef } from 'react';", c)
# And we also need `useLiveQuery` since we used `useLiveQuery(() => db.providers.toArray())`
if "useLiveQuery" not in c:
    c = c.replace("import { db } from '../store/database';", "import { useLiveQuery } from 'dexie-react-hooks';\nimport { db } from '../store/database';")

with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Kardex imports fixed")
