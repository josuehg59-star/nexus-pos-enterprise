import re

with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Add import
if 'import Providers from' not in c:
    c = c.replace("import SmartPurchasing from './pages/SmartPurchasing';", "import SmartPurchasing from './pages/SmartPurchasing';\nimport Providers from './pages/Providers';")

# Update switch case
new_suministro_case = """        case 'suministro':
          if (activeSubMenu === 'Proveedores y Socios') return <Providers />;
          return <SmartPurchasing />;"""

c = re.sub(r"        case 'suministro': return <SmartPurchasing />;", new_suministro_case, c)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("App.tsx updated to include Providers route")
