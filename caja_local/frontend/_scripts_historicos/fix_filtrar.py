import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add a toast state and onClick to FILTRAR button
if "const [showFilterToast, setShowFilterToast] = useState(false);" not in code:
    code = code.replace(
        "const [ventasView, setVentasView] = useState('CONSOLIDADO');",
        "const [ventasView, setVentasView] = useState('CONSOLIDADO');\n  const [showFilterToast, setShowFilterToast] = useState(false);"
    )

    toast_ui = """
      {showFilterToast && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-emerald-500/20 z-50 animate-in slide-in-from-top-2">
          Filtros aplicados correctamente
        </div>
      )}
      <div className="flex flex-col
    """
    code = code.replace('<div className="flex flex-col', toast_ui.strip(), 1)

    button_search = r'<button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">'
    button_replace = r'<button onClick={() => { setShowFilterToast(true); setTimeout(() => setShowFilterToast(false), 2000); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors">'
    code = re.sub(button_search, button_replace, code)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Added visual feedback to FILTRAR button")
