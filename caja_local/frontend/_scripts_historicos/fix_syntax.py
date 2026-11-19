import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the dangling const declaration
c = c.replace("\n  const handleDevolverParcial\n", "\n")
c = c.replace("\n  const handleDevolverParcial\n\n", "\n")

# Just in case, let's use regex for any `const handleDevolverParcial\s*$` at the end of a block
c = re.sub(r"const handleDevolverParcial\s*\n\s*const handleDevolverParcial", "const handleDevolverParcial", c)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed syntax error")
