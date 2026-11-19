import os

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

if "const subtotal =" not in c:
    c = c.replace("const updateEntrada =", "const subtotal = entradas.reduce((acc, item) => acc + ((item.cost || 0) * (item.entradaQty || 1)), 0);\n\n  const updateEntrada =")
    with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Fixed missing subtotal")
else:
    print("subtotal already present")
