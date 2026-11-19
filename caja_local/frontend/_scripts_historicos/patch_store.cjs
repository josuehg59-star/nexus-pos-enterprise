const fs = require('fs');
let file = fs.readFileSync('src/store/useStore.ts', 'utf8');

const newProcessSale = \processSale: async (paymentMethod, clientName) => {
    const { cart, total, clearCart } = get();
    if (cart.length === 0) return false;

    try {
      let clientObj = null;
      if (clientName !== 'PUBLICO GENERAL') {
        clientObj = await db.clients.where('name').equals(clientName).first();
      }

      if (paymentMethod === 'MONEDERO' && clientObj) {
        if (clientObj.monedero < total) {
           return false; // Not enough funds
        }
      }

      const newTicket = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        total: total,
        monedero_earned: paymentMethod === 'MONEDERO' ? 0 : total * 0.05,
        paymentMethod,
        items: cart,
        synced: false,
        clientName: clientName
      };

      await db.tickets.add(newTicket);

      for (const item of cart) {
        if (!item.id) continue;
        const product = await db.products.get(item.id);
        if (product) {
          await db.products.update(item.id, {
            stock: product.stock - item.cartQty
          });
        }
      }

      if (clientObj) {
        if (paymentMethod === 'MONEDERO') {
          await db.clients.update(clientObj.id, {
            monedero: clientObj.monedero - total
          });
        } else {
          await db.clients.update(clientObj.id, {
            monedero: clientObj.monedero + newTicket.monedero_earned
          });
        }
      }

      clearCart();
      return true;

    } catch (error) {
      console.error("Error al procesar la venta:", error);
      return false;
    }
  }\;

file = file.replace(/processSale: async \([\s\S]*\}\n  \}\n/m, newProcessSale + '\n');
fs.writeFileSync('src/store/useStore.ts', file);
console.log('Store patched');
