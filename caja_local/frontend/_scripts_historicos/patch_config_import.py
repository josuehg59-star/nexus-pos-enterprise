import os

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("Search, Save", "Search, Save, CreditCard")

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("CreditCard imported in Config")
