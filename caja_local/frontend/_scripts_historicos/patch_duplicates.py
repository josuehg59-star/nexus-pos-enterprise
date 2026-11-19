import os

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Make the migrator WIPE existing data so it doesn't duplicate.
old_migrator_start = """          if (parsedData.data && parsedData.data.products) {
          setMigrationMsg('Formato TITAN detectado. Migrando catálogo...');"""

new_migrator_start = """          if (parsedData.data && parsedData.data.products) {
          setMigrationMsg('Formato TITAN detectado. Limpiando datos antiguos para evitar duplicados...');
          await Promise.all([
            db.products.clear(),
            db.clients.clear(),
            db.providers.clear(),
            db.tickets.clear()
          ]);
          setMigrationMsg('Base de datos purgada. Migrando catálogo...');"""

if "Limpiando datos antiguos" not in c:
    c = c.replace(old_migrator_start, new_migrator_start)


# Ensure IDs are mapped for clients and suppliers
old_clients = """            const clients = parsedData.data.clients.map((c: any) => ({
              name: c.name || 'Cliente sin nombre',"""
new_clients = """            const clients = parsedData.data.clients.map((c: any) => ({
              id: c.id,
              name: c.name || 'Cliente sin nombre',"""
c = c.replace(old_clients, new_clients)

old_suppliers = """            const suppliers = parsedData.data.suppliers.map((p: any) => ({
              name: p.name || 'Proveedor sin nombre',"""
new_suppliers = """            const suppliers = parsedData.data.suppliers.map((p: any) => ({
              id: p.id,
              name: p.name || 'Proveedor sin nombre',"""
c = c.replace(old_suppliers, new_suppliers)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Migrator patched to prevent duplicates")
