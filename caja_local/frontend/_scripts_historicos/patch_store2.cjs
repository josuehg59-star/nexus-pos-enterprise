const fs = require('fs');
let file = fs.readFileSync('src/store/useStore.ts', 'utf8');

const newProcessSale = "processSale: async (paymentMethod, clientName) => {\n" +
"    const { cart, total, clearCart } = get();\n" +
"    if (cart.length === 0) return false;\n" +
"\n" +
"    try {\n" +
"      let clientObj = null;\n" +
"      if (clientName !== 'PUBLICO GENERAL') {\n" +
"        clientObj = await db.clients.where('name').equals(clientName).first();\n" +
"      }\n" +
"\n" +
"      if (paymentMethod === 'MONEDERO' && clientObj) {\n" +
"        if (clientObj.monedero < total) {\n" +
"           return false; // Not enough funds\n" +
"        }\n" +
"      }\n" +
"\n" +
"      const newTicket = {\n" +
"        id: crypto.randomUUID(),\n" +
"        date: new Date().toISOString(),\n" +
"        total: total,\n" +
"        monedero_earned: paymentMethod === 'MONEDERO' ? 0 : total * 0.05,\n" +
"        paymentMethod,\n" +
"        items: cart,\n" +
"        synced: false,\n" +
"        clientName: clientName\n" +
"      };\n" +
"\n" +
"      await db.tickets.add(newTicket);\n" +
"\n" +
"      for (const item of cart) {\n" +
"        if (!item.id) continue;\n" +
"        const product = await db.products.get(item.id);\n" +
"        if (product) {\n" +
"          await db.products.update(item.id, {\n" +
"            stock: product.stock - item.cartQty\n" +
"          });\n" +
"        }\n" +
"      }\n" +
"\n" +
"      if (clientObj) {\n" +
"        if (paymentMethod === 'MONEDERO') {\n" +
"          await db.clients.update(clientObj.id, {\n" +
"            monedero: clientObj.monedero - total\n" +
"          });\n" +
"        } else {\n" +
"          await db.clients.update(clientObj.id, {\n" +
"            monedero: clientObj.monedero + newTicket.monedero_earned\n" +
"          });\n" +
"        }\n" +
"      }\n" +
"\n" +
"      clearCart();\n" +
"      return true;\n" +
"\n" +
"    } catch (error) {\n" +
"      console.error(\"Error:\", error);\n" +
"      return false;\n" +
"    }\n" +
"  }";

file = file.replace(/processSale: async \([\s\S]*\}\n  \}\n/m, newProcessSale + '\n');
fs.writeFileSync('src/store/useStore.ts', file);
console.log('Store patched');
