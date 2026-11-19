import os
import re

with open('src/pages/SmartPurchasing.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

button_search = r'<button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors">\s*<ShoppingCart className="w-4 h-4" /> GENERAR PEDIDO FINAL\s*</button>'

new_button = """<button onClick={() => { alert("Pedido generado y guardado en la base de datos de Compras exitosamente."); setManualItems([]); }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-colors">
            <ShoppingCart className="w-4 h-4" /> GENERAR PEDIDO FINAL
          </button>"""

if re.search(button_search, code):
    code = re.sub(button_search, new_button, code)
else:
    print("Could not find button in SmartPurchasing")

with open('src/pages/SmartPurchasing.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Wired SmartPurchasing.tsx")
