import os

with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the duplicate useEffect
code = code.replace("useEffect, useEffect", "useEffect")

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed duplicate useEffect in KardexReport.tsx")
