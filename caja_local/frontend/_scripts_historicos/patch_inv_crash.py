import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_btn = 'setPrice(item.price.toString()); setCost(item.cost.toString()); setStock(item.stock.toString());'
new_btn = 'setPrice((item.price || 0).toString()); setCost((item.cost || 0).toString()); setStock((item.stock || 0).toString());'

c = c.replace(old_btn, new_btn)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Inventory crash patched")
