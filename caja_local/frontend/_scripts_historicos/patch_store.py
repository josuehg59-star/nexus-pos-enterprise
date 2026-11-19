import os
import re

with open('src/store/useStore.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Add updateQuantity to interface
if 'updateQuantity: (productId: number, qty: number)' not in code:
    code = code.replace("removeFromCart: (productId: number) => void;", "removeFromCart: (productId: number) => void;\n  updateQuantity: (productId: number, qty: number) => void;")

# Add updateQuantity implementation
update_qty_impl = """  updateQuantity: (productId, qty) => {
    const { cart } = get();
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, cartQty: qty } : item
    );
    const subtotal = newCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
    set({ cart: newCart, subtotal, total: subtotal });
  },
  
  clearCart"""
if 'updateQuantity: (productId, qty) => {' not in code:
    code = code.replace("clearCart", update_qty_impl)


# Update processSale to log to db.kardex
kardex_logging = """          if (product) {
            await db.products.update(item.id, {
              stock: product.stock - item.cartQty
            });
            await db.kardex.add({
              tipo: 'SALIDA',
              sku: item.sku,
              productName: item.name,
              cantidad: item.cartQty,
              fecha: new Date().toLocaleString(),
              costoUnitario: item.cost || (item.price * 0.7),
              precioVenta: item.price,
              total: item.price * item.cartQty,
              folio: newTicket.id,
              proveedor: item.category || 'SIN PROVEEDOR'
            });
          }"""

code = code.replace("""          if (product) {
            await db.products.update(item.id, {
              stock: product.stock - item.cartQty
            });
          }""", kardex_logging)

with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated useStore.ts (updateQuantity & kardex logging)")
