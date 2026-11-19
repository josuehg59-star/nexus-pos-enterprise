import re

with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Add import if missing
if 'import Providers from' not in c:
    c = c.replace("import SmartPurchasing from './pages/SmartPurchasing';", "import SmartPurchasing from './pages/SmartPurchasing';\nimport Providers from './pages/Providers';")

# Replace switch case exactly
old_case = "case 'suministro': return <SmartPurchasing />;"
new_case = """case 'suministro':
        if (activeSubMenu === 'Proveedores y Socios') return <Providers />;
        return <SmartPurchasing />;"""

c = c.replace(old_case, new_case)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('App routing fixed')
