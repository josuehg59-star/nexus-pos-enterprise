import re

with open('src/store/database.ts', encoding='utf-8') as f:
    c = f.read()

# Add Provider interface
provider_interface = """
export interface Provider {
  id?: number;
  name: string;
  phone: string;
  email: string;
  contact: string;
  address: string;
}

"""

if 'export interface Provider' not in c:
    c = c.replace('export interface Compra', provider_interface + 'export interface Compra')

# Add providers to NexusDatabase class
if 'providers!: Table<Provider, number>;' not in c:
    c = c.replace('kardex!: Table<KardexMovement, number>;', 'kardex!: Table<KardexMovement, number>;\n  providers!: Table<Provider, number>;')

# Update version to 5 and add stores
if 'this.version(4).stores({' in c:
    c = c.replace('this.version(4).stores({', 'this.version(5).stores({\n      providers: \'++id, name\',')

with open('src/store/database.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print("Database updated to v5 with providers table.")
