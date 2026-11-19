import re

with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Add import
if 'import Monedero from' not in c:
    c = c.replace("import Crm from './pages/Crm';", "import Crm from './pages/Crm';\nimport Monedero from './pages/Monedero';")

# Update switch
old_case = "case 'crm': return <Crm />;"
new_case = """case 'crm':
          if (activeSubMenu === 'Monedero Electrónico') return <Monedero />;
          return <Crm />;"""

if old_case in c:
    c = c.replace(old_case, new_case)
else:
    # Just in case there is some other formatting
    c = re.sub(r"case 'crm':[\s\S]*?(?=case 'config':)", new_case + "\n        ", c)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('App routing fixed for Monedero')
