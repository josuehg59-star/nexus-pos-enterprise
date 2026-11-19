import os
import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

if "const dbProviders =" not in code:
    code = code.replace("const [conteos, setConteos] = useState<Record<number, number>>({});",
                        "const [conteos, setConteos] = useState<Record<number, number>>({});\n  const dbProviders = useLiveQuery(() => db.providers.toArray(), []) || [];")

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria.tsx dbProviders fixed!")
