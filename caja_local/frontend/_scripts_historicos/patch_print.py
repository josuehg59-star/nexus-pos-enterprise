import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Replace EVERYTHING in the hidden print container safely.
# We will just split at `<div className="hidden">` and reconstruct the end of the file.

parts = c.split('<div className="hidden">')

new_bottom = """<div className="hidden">
        <div ref={printRef} className="print-container print:flex print:flex-col print:items-center">
          {selectedProducts.map((p, i) => (
            <div key={i} className="print-page flex flex-col items-center justify-center bg-white text-black overflow-hidden" style={{ width: formato === '58mm' ? '58mm' : (formato === '50x25' ? '50mm' : '38mm'), height: formato === '58mm' ? 'auto' : '25mm', pageBreakAfter: formato === '58mm' ? 'auto' : 'always', boxSizing: 'border-box', padding: formato === '58mm' ? '5mm 2mm' : '1mm', marginBottom: formato === '58mm' ? '5mm' : '0' }}>
              
              <div className={`font-black text-center ${formato === '58mm' ? 'text-[14px] leading-tight mb-1 whitespace-normal' : 'text-[11px] truncate w-full leading-none mb-1'}`} style={{ wordBreak: 'break-word', maxWidth: '100%' }}>
                {p.name.toUpperCase()}
              </div>
              
              {formato === '58mm' && (
                <div className="font-black text-[22px] mb-2 leading-none mt-1">
                  ${p.price.toFixed(2)}
                </div>
              )}

              <Barcode value={p.sku} width={formato === '58mm' ? 1.4 : (formato === '50x25' ? 1.3 : 1.0)} height={formato === '58mm' ? 45 : 25} fontSize={14} margin={0} textMargin={3} displayValue={true} />
              
              {formato !== '58mm' && (
                <div className="font-black text-[15px] leading-none mt-1">
                  Precio: ${p.price.toFixed(2)}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"""

c = parts[0] + new_bottom

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('File manually patched')
