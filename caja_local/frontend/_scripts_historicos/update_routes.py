import re

with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Add import if not exists
if 'import ImpresionEtiquetas from' not in c:
    c = c.replace(
        "import Recargas from './pages/Recargas';",
        "import Recargas from './pages/Recargas';\nimport ImpresionEtiquetas from './pages/ImpresionEtiquetas';"
    )

# Add route
route_code = "if (activeMenu === 'inventario' && activeSubMenu === 'Auditorías Físicas') return <Auditoria />;"
new_route = route_code + "\n    if (activeMenu === 'inventario' && activeSubMenu === 'Impresión Etiquetas') return <ImpresionEtiquetas />;"

if 'Impresión Etiquetas' not in c[c.find('renderContent'):]:
    c = c.replace(route_code, new_route)

# Add standard subItems fixing if missing
if "if (activeSubMenu === 'Impresión Etiquetas') return <ImpresionEtiquetas />;" not in c:
    c = c.replace(
        "if (activeSubMenu === 'Auditoras Fsicas') return <Auditoria />;",
        "if (activeSubMenu === 'Auditoras Fsicas') return <Auditoria />;\n        if (activeSubMenu === 'Impresión Etiquetas' || activeSubMenu === 'Impresin Etiquetas') return <ImpresionEtiquetas />;"
    )
    
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('App.tsx routing updated')
