import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    code = f.read()

# Fix encoding
code = code.replace("'CR%DITO'", "'CRÉDITO'")
code = code.replace("'CR\ufffd%DITO'", "'CRÉDITO'")

# Fix the cart mapping by replacing the quantity block
cart_item_block_old = """<div className="w-12 h-12 bg-nexus-800 rounded-xl flex items-center justify-center font-black text-lg text-emerald-400 shrink-0">
                      {item.cartQty}
                    </div>"""

cart_item_block_new = """<div className="flex items-center justify-center gap-1 bg-nexus-900 border border-nexus-700 rounded-xl p-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id!, item.cartQty - 1); }} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black text-xl">-</button>
                      <span className="w-8 text-center font-black text-white text-lg">{item.cartQty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id!, item.cartQty + 1); }} className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black text-xl">+</button>
                    </div>"""

code = code.replace(cart_item_block_old, cart_item_block_new)

# Ensure updateQuantity is extracted from usePosStore
if "updateQuantity" not in code.split("usePosStore();")[0]:
    code = code.replace("const { cart, total, addToCart, removeFromCart, processSale, clearCart, restoreCart } = usePosStore();",
                        "const { cart, total, addToCart, removeFromCart, updateQuantity, processSale, clearCart, restoreCart } = usePosStore();")

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PosTerminal updated!")
