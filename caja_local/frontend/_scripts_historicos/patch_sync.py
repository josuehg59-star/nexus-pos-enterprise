import os

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "const handleSmartRestore =" in line:
        skip = True
        new_lines.append("""
  const handleSmartRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMigrating(true);
    setMigrationMsg('Analizando archivo de respaldo para actualización sin duplicados...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedData = JSON.parse(text);
        
        // 1. Detectar si es TITAN
        if (parsedData.data && parsedData.data.products) {
          
          setMigrationMsg('Mapeando base de datos existente para evitar duplicados...');
          const existingProducts = await db.products.toArray();
          const skuToId = new Map(existingProducts.map(p => [p.sku, p.id]));
          
          const existingClients = await db.clients.toArray();
          const clientNameToId = new Map(existingClients.map(c => [c.name, c.id]));
          
          const existingProviders = await db.providers.toArray();
          const providerNameToId = new Map(existingProviders.map(p => [p.name, p.id]));

          setMigrationMsg('Actualizando catálogo de productos...');
          const products = parsedData.data.products.map((p: any) => {
            const finalSku = p.sku || p.barcode || String(p.id);
            const existingId = skuToId.get(finalSku);
            return {
              ...(existingId ? { id: existingId } : {}), // SI EXISTE, TOMA SU ID PARA ACTUALIZAR (NO DUPLICAR)
              sku: finalSku,
              name: p.name,
              category: p.category || String(p.supplier_id) || 'General',
              price: parseFloat(p.price) || 0,
              cost: parseFloat(p.cost) || 0,
              stock: parseFloat(p.stock) || 0,
              status: 'ACTIVO',
              promo_qty: parseFloat(p.promoQty) || undefined,
              promo_price: parseFloat(p.promoPrice) || undefined,
              barcode2: (p.barcode && p.barcode !== p.sku) ? p.barcode : undefined,
              barcode3: (p.alias && p.alias !== p.sku && p.alias !== p.barcode) ? p.alias : undefined
            };
          });
          await db.products.bulkPut(products);

          if (parsedData.data.clients) {
            setMigrationMsg('Actualizando clientes y monederos...');
            const clients = parsedData.data.clients.map((c: any) => {
              const existingId = clientNameToId.get(c.name);
              return {
                ...(existingId ? { id: existingId } : {}),
                name: c.name,
                phone: c.phone || '',
                email: c.email || '',
                type: c.type || 'General',
                monedero: parseFloat(c.monedero) || 0,
                credito: parseFloat(c.credito) || 0,
                monederoCode: c.monederoCode || ''
              };
            });
            await db.clients.bulkPut(clients);
          }

          if (parsedData.data.sales) {
            setMigrationMsg('Actualizando historial de ventas...');
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
                id: String(s.id || crypto.randomUUID()), // Los tickets ya tienen IDs únicos como string, por lo que bulkPut siempre actualiza en lugar de duplicar.
                date: s.date || new Date().toISOString(),
                total: parseFloat(s.total) || 0,
                paymentMethod: s.payment_method || 'EFECTIVO',
                items: normalizedItems,
                clientName: s.client_name || 'PUBLICO GENERAL',
                status: 'COMPLETADO',
                monedero_earned: 0
              };
            });
            await db.tickets.bulkPut(tickets);
          }

          if (parsedData.data.suppliers) {
            setMigrationMsg('Actualizando catálogo de proveedores...');
            const providers = parsedData.data.suppliers.map((s: any) => {
              const existingId = providerNameToId.get(s.name);
              return {
                ...(existingId ? { id: existingId } : {}),
                name: s.name || 'Proveedor Migrado',
                phone: s.phone || '',
                email: s.email || '',
                company: s.company || s.name || ''
              };
            });
            await db.providers.bulkPut(providers);
          }

          setMigrationMsg('¡Respaldo sincronizado y actualizado con éxito sin duplicados!');
          setTimeout(() => {
            setIsMigrating(false);
            setMigrationMsg('');
          }, 3000);
          return;
        }

        // 2. Si es formato NEXUS (Copia directa)
        if (parsedData.version && parsedData.type === 'nexus_backup') {
          setMigrationMsg('Formato NEXUS detectado. Restaurando...');
          if (parsedData.collections.products) await db.products.bulkPut(parsedData.collections.products);
          if (parsedData.collections.clients) await db.clients.bulkPut(parsedData.collections.clients);
          if (parsedData.collections.tickets) await db.tickets.bulkPut(parsedData.collections.tickets);
          if (parsedData.collections.providers) await db.providers.bulkPut(parsedData.collections.providers);
          
          setMigrationMsg('¡Restauración completa!');
          setTimeout(() => {
            setIsMigrating(false);
            setMigrationMsg('');
          }, 3000);
        } else {
          throw new Error("Formato no reconocido");
        }
      } catch (err) {
        console.error(err);
        setMigrationMsg('Error: El archivo no es un respaldo válido de TITAN o NEXUS.');
        setTimeout(() => setIsMigrating(false), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
""")
        continue
    
    if skip:
        if "return (" in line:
            skip = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Smart Sync / Deduplication applied.")
