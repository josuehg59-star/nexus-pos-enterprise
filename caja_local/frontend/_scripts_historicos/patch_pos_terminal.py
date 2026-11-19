import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure updateQuantity is extracted from usePosStore
code = code.replace("const { cart, total, addToCart, removeFromCart, processSale, clearCart, restoreCart } = usePosStore();",
                    "const { cart, total, addToCart, removeFromCart, updateQuantity, processSale, clearCart, restoreCart } = usePosStore();")

# Replace the Cart Items Render
# The user's screenshot showed: 
#   <div className="bg-nexus-800 rounded-lg p-4 flex gap-4 relative">
#   <div className="bg-blue-600/20 text-blue-400 font-bold px-3 py-1 rounded flex items-center justify-center">1</div>

cart_item_replace = """<div className="flex flex-col gap-2 relative z-10 w-full pr-12">
                      <p className="font-bold text-white uppercase text-sm leading-tight">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku} • ${(item.price || 0).toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center justify-center gap-3 bg-nexus-900 border border-nexus-700 rounded-xl p-1 shrink-0 ml-auto mr-12 relative z-10">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.cartQty - 1); }} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black text-lg">-</button>
                      <span className="w-6 text-center font-black text-white text-lg">{item.cartQty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.cartQty + 1); }} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black text-lg">+</button>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id!); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/50 hover:text-red-500 transition-colors p-2 z-20"
                    >"""

# Find where the Cart item is rendered
if "className=\"bg-blue-600/20 text-blue-400 font-bold px-3 py-1 rounded flex items-center justify-center\"" in code:
    # Let's replace the whole structure of the cart item mapping
    # I'll use regex to match the item render block
    pattern = r'<div key=\{item.id\}.*?className="bg-nexus-800 rounded-2xl p-4 flex items-center gap-4 relative border border-transparent hover:border-nexus-700 transition-colors">[\s\S]*?<div className="bg-blue-600/20 text-blue-400 font-bold px-3 py-1 rounded-xl flex items-center justify-center shrink-0">[\s\S]*?\{item\.cartQty\}[\s\S]*?</div>[\s\S]*?<div className="flex flex-col gap-1 pr-12">[\s\S]*?<p className="font-bold text-white uppercase text-sm leading-tight">\{item\.name\}</p>[\s\S]*?<p className="text-xs text-slate-400">\{item\.sku\} • \$\{\(item\.price \|\| 0\)\.toFixed\(2\)\} c/u</p>[\s\S]*?</div>[\s\S]*?<button[\s\S]*?className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/50 hover:text-red-500 transition-colors p-2"[\s\S]*?>[\s\S]*?<X className="w-5 h-5" />[\s\S]*?</button>[\s\S]*?</div>'
    
    new_block = """<div key={item.id} className="bg-nexus-800 rounded-2xl p-4 flex items-center gap-4 relative border border-transparent hover:border-nexus-700 transition-colors">
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="font-bold text-white uppercase text-sm leading-tight">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku} • ${(item.price || 0).toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-nexus-900 border border-nexus-700 rounded-xl p-1 shrink-0 mr-8">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.cartQty - 1); }} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black text-lg">-</button>
                      <span className="w-6 text-center font-black text-white">{item.cartQty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.cartQty + 1); }} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black text-lg">+</button>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id!); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/50 hover:text-red-500 transition-colors p-2 z-20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>"""
    code = re.sub(pattern, new_block, code)

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated PosTerminal.tsx with quantity controls!")
