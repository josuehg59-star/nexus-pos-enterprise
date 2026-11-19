import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix Preview Box
preview_old = """<div className="font-black text-[10px] truncate w-full text-center">{p.name}</div>
                <Barcode value={p.sku} width={formato === '50x25' ? 1.5 : 1.2} height={40} fontSize={12} margin={0} displayValue={true} />
                <div className="font-black text-sm">${p.price.toFixed(2)}</div>"""

preview_new = """<div className="font-black text-xs truncate w-full text-center leading-tight mb-1">{p.name}</div>
                <Barcode value={p.sku} width={formato === '50x25' ? 1.3 : 1.0} height={25} fontSize={16} margin={0} textMargin={2} displayValue={true} />
                <div className="font-black text-lg mt-1">${p.price.toFixed(2)}</div>"""

c = c.replace(preview_old, preview_new)

# Fix Print Box
print_old = """<div className="font-bold text-[9px] truncate w-full text-center leading-none mb-1">{p.name}</div>
              <Barcode value={p.sku} width={formato === '50x25' ? 1.2 : 1} height={25} fontSize={10} margin={0} displayValue={true} />
              <div className="font-black text-xs leading-none mt-1">Precio: ${p.price.toFixed(2)}</div>"""

print_new = """<div className="font-bold text-[11px] truncate w-full text-center leading-tight mb-1">{p.name}</div>
              <Barcode value={p.sku} width={formato === '50x25' ? 1.2 : 0.9} height={18} fontSize={14} margin={0} textMargin={2} displayValue={true} />
              <div className="font-black text-[15px] leading-none mt-1">Precio: ${p.price.toFixed(2)}</div>"""

c = c.replace(print_old, print_new)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Etiquetas styles updated')
