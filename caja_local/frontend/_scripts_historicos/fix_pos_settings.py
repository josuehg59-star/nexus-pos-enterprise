import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import_statement = "import { useSettings } from '../store/useSettings';\n"
if "useSettings" not in code:
    code = code.replace("import { useStore } from '../store/useStore';", "import { useStore } from '../store/useStore';\n" + import_statement)

# Inject hook
if "const { nombreNegocio } = useSettings();" not in code:
    code = code.replace("const [cart, addToCart, removeFromCart, updateCartQty", "const { nombreNegocio } = useSettings();\n  const [cart, addToCart, removeFromCart, updateCartQty")

# Replace hardcoded name in Header
code = re.sub(r'MI TIENDITA "MISCELANEA BRITTANY"', '{nombreNegocio.toUpperCase()}', code)

# Replace hardcoded name in Ticket Print
code = re.sub(r'TITAN POS PRO MASTER v2\.1', '{nombreNegocio}', code)

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PosTerminal.tsx wired to useSettings")
