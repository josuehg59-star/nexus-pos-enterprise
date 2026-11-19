with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix the corrupted Kardex in subItems - replace any variant
import re
c = re.sub(r"'K[^\']rdex'", "'Kardex'", c)
c = re.sub(r'"K[^\"]+rdex"', '"Kardex"', c)

# Also fix routing to match
c = c.replace("activeSubMenu === 'Kardex'", "activeSubMenu === 'Kardex'")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Fixed')
