import os

with open('src/pages/Inventory.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Limit the search results natively at the DB query level to instantly solve lag
old_query = """          }).toArray();
        }
      return db.products.toArray();"""

new_query = """          }).limit(50).toArray();
        }
      return db.products.limit(50).toArray();"""

c = c.replace(old_query, new_query)

# Also fix the duplicate dropdown that maps all products
old_options = "{products?.map(p => <option key={p.id}>{p.name}</option>)}"
new_options = "{products?.slice(0, 50).map(p => <option key={p.id}>{p.name}</option>)}"

c = c.replace(old_options, new_options)

with open('src/pages/Inventory.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched Inventory performance")
