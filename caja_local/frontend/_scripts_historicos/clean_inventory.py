import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# The exact injected string (Note: the original might have had different encoding, let's check)
# The output showed "Categora". Let's just remove the exact bytes or use regex.
import re

# Match the injected garbage: category: category || "Sin Categoría",\n        supplier_id: supplier,
# Since encoding might be weird, we match the prefix and suffix and ignore the funny character
garbage_regex = re.compile(r'category: category \|\| "Sin Categor.a",\n\s*supplier_id: supplier,')

cleaned_code = garbage_regex.sub('', code)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(cleaned_code)

print("Cleaned!")
