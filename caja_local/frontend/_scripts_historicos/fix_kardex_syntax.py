import re

with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'\}\);\s*\}\);', '});', code)

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed syntax")
