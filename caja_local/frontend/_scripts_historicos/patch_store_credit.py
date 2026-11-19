import os

with open('src/store/useStore.ts', 'r', encoding='utf-8') as f:
    c = f.read()

old_logic = """
      if (clientObj) {
        if (paymentMethod === 'MONEDERO') {
          await db.clients.update(clientObj.id as number, {
            monedero: clientObj.monedero - total
          });
        } else {
          await db.clients.update(clientObj.id as number, {
            monedero: clientObj.monedero + newTicket.monedero_earned
          });
        }
      }
"""

new_logic = """
      if (clientObj) {
        if (paymentMethod === 'MONEDERO') {
          await db.clients.update(clientObj.id as number, {
            monedero: (clientObj.monedero || 0) - total
          });
        } else if (paymentMethod === 'CRÉDITO') {
          await db.clients.update(clientObj.id as number, {
            monedero: (clientObj.monedero || 0) + newTicket.monedero_earned,
            credito: (clientObj.credito || 0) + total
          });
        } else {
          await db.clients.update(clientObj.id as number, {
            monedero: (clientObj.monedero || 0) + newTicket.monedero_earned
          });
        }
      }
"""

c = c.replace(old_logic.strip(), new_logic.strip())

with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print("useStore patched for credit tracking")
