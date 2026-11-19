import os
import re

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

definition = """
  const handleRestablecerTodo = async () => {
    if (window.confirm("¿ESTÁS SEGURO? ESTO BORRARÁ TODA LA BASE DE DATOS Y NO SE PUEDE DESHACER.")) {
      await db.products.clear();
      await db.clients.clear();
      await db.providers.clear();
      await db.tickets.clear();
      await db.kardex.clear();
      await db.cortes.clear();
      alert("SISTEMA RESTABLECIDO Y PURGADO. AHORA PUEDES SUBIR TU RESPALDO LIMPIO.");
      window.location.reload();
    }
  };
"""

if "const handleRestablecerTodo" not in c:
    c = c.replace("const handleSmartRestore =", definition + "\n  const handleSmartRestore =")

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Restablecer function injected")
