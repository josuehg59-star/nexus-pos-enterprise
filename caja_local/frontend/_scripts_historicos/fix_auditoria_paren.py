import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will replace the ENTIRE 'if (searchQuery && !isLibre)' and 'else' block to be perfectly safe.

old_block = r"""\} else \{
        // En modo libre, solo mostramos si hay bǧsqueda o si ya se cont.*
        results = results\.filter\(p => conteos\[p\.id!\] !== undefined \|\| \(searchQuery && \(p\.name\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| p\.sku\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| \(p\.barcode2 && p\.barcode2\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\)\)\);
      \}

      // Filtro de Bǧsqueda
      if \(searchQuery && !isLibre\) \{
        const q = searchQuery\.toLowerCase\(\);
        results = results\.filter\(p => p\.name\.toLowerCase\(\)\.includes\(q\) \|\| p\.sku\.toLowerCase\(\)\.includes\(q\) \|\| \(p\.barcode2 && p\.barcode2\.toLowerCase\(\)\.includes\(q\)\)\);
      \}"""

# Fallback: Just replace the exact line 36
old_line = r"results = results\.filter\(p => conteos\[p\.id!\] !== undefined \|\| \(searchQuery && \(p\.name\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| p\.sku\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\| \(p\.barcode2 && p\.barcode2\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)\)\)\);"

new_line = """results = results.filter(p => {
          const matchFisico = conteos[p.id!] !== undefined;
          if (matchFisico) return true;
          if (!searchQuery) return false;
          
          const q = searchQuery.toLowerCase();
          const matchName = p.name && p.name.toLowerCase().includes(q);
          const matchSku = p.sku && p.sku.toLowerCase().includes(q);
          const matchB2 = p.barcode2 && p.barcode2.toLowerCase().includes(q);
          
          return matchName || matchSku || matchB2;
        });"""

code = re.sub(old_line, new_line, code)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Replaced Auditoria line with multiline version")
