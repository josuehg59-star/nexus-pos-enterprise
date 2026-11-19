import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

old_block = """          if (parsedData.data.clients) {
            setMigrationMsg('Migrando clientes y monederos...');
            const clients = parsedData.data.clients.map((c: any) => ({
              name: c.name,
              phone: c.phone || '',
              email: c.email || '',
              type: c.type || 'General',
              monedero: parseFloat(c.monedero) || 0,
              credito: parseFloat(c.credito) || 0,
              monederoCode: c.monederoCode || ''
            }));
            await db.clients.bulkPut(clients);
          }

          setMigrationMsg('¡Migración TITAN POS Exitosa!');"""

new_block = """          if (parsedData.data.clients) {
            setMigrationMsg('Migrando clientes y monederos...');
            const clients = parsedData.data.clients.map((c: any) => ({
              name: c.name,
              phone: c.phone || '',
              email: c.email || '',
              type: c.type || 'General',
              monedero: parseFloat(c.monedero) || 0,
              credito: parseFloat(c.credito) || 0,
              monederoCode: c.monederoCode || ''
            }));
            await db.clients.bulkPut(clients);
          }

          if (parsedData.data.sales) {
            setMigrationMsg('Migrando historial de ventas (tickets)...');
            const tickets = parsedData.data.sales.map((s: any) => {
              let cartItems = [];
              try {
                cartItems = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []);
              } catch(e) {}
              
              const normalizedItems = cartItems.map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                sku: item.sku || '',
                name: item.name || 'Producto Migrado',
                price: parseFloat(item.price) || 0,
                cost: parseFloat(item.cost) || 0,
                cartQty: parseFloat(item.qty) || 1
              }));

              return {
                id: String(s.id || crypto.randomUUID()),
                date: s.date || new Date().toISOString(),
                total: parseFloat(s.total) || 0,
                paymentMethod: s.payment_method || 'EFECTIVO',
                items: normalizedItems,
                clientName: s.client_name || 'PUBLICO GENERAL',
                monedero_earned: 0
              };
            });
            await db.tickets.bulkPut(tickets);
          }

          if (parsedData.data.suppliers) {
            setMigrationMsg('Migrando catálogo de proveedores...');
            const providers = parsedData.data.suppliers.map((s: any) => ({
              name: s.name || 'Proveedor Migrado',
              phone: s.phone || '',
              email: s.email || '',
              contact: s.contact || '',
              address: s.address || '',
              rfc: s.rfc || ''
            }));
            await db.providers.bulkPut(providers);
          }

          setMigrationMsg('¡Migración TITAN POS Exitosa!');"""

c = c.replace(old_block, new_block)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added sales and suppliers migration')
