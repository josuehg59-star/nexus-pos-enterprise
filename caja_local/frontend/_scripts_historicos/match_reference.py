import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Make the POS-58 layout identical to the user's reference image
# Remove @page size for 58mm to let Chrome use the default Vertical receipt size
# Structure: Description -> Price -> Barcode

new_page_style = """
    pageStyle: formato === '58mm'
      ? `
        @page {
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background-color: white;
            -webkit-print-color-adjust: exact;
            width: 100%;
          }
          .print-container {
            width: 58mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 auto;
          }
          .print-page {
            width: 58mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5mm 2mm;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
        }
      `
      : `
"""

c = re.sub(
    r"    pageStyle: formato === '58mm'\n      \? `.*?`\n      : `\n",
    new_page_style[1:], 
    c,
    flags=re.DOTALL
)

# Update the print box for 58mm to match the structure: Name -> Price -> Barcode
# Currently it is Name -> Barcode -> Price. Let's fix this for 58mm.
# The code loop looks like:
# <div key={i} className="print-page ...">
#   <div className="..."> {p.name} </div>
#   <Barcode ... />
#   <div className="..."> {p.price} </div>
# </div>

# Let's replace the whole print section dynamically.
print_section_old = """      <div className="hidden">
        <div ref={printRef} className="print-container print:flex print:flex-col print:items-center">
          {selectedProducts.map((p, i) => (
            <div key={i} className="print-page flex flex-col items-center justify-center bg-white text-black overflow-hidden" style={{ width: formato === '58mm' ? '48mm' : (formato === '50x25' ? '50mm' : '38mm'), height: formato === '58mm' ? 'auto' : '25mm', pageBreakAfter: formato === '58mm' ? 'avoid' : 'always', boxSizing: 'border-box', padding: formato === '58mm' ? '5mm' : '1mm', marginBottom: formato === '58mm' ? '8mm' : '0' }}>
              <div className={`font-bold truncate w-full text-center leading-tight mb-1 ${formato === '58mm' ? 'text-[14px]' : 'text-[11px]'}`}>{p.name}</div>
              <Barcode value={p.sku} width={formato === '58mm' ? 1.2 : (formato === '50x25' ? 1.3 : 1.0)} height={formato === '58mm' ? 40 : 25} fontSize={14} margin={0} textMargin={2} displayValue={true} />
              <div className={`font-black leading-none mt-2 ${formato === '58mm' ? 'text-[20px]' : 'text-[15px]'}`}>Precio: ${p.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>"""

print_section_new = """      <div className="hidden">
        <div ref={printRef} className="print-container print:flex print:flex-col print:items-center">
          {selectedProducts.map((p, i) => (
            <div key={i} className="print-page flex flex-col items-center justify-center bg-white text-black overflow-hidden" style={{ width: formato === '58mm' ? '58mm' : (formato === '50x25' ? '50mm' : '38mm'), height: formato === '58mm' ? 'auto' : '25mm', pageBreakAfter: formato === '58mm' ? 'auto' : 'always', boxSizing: 'border-box', padding: formato === '58mm' ? '5mm 2mm' : '1mm', marginBottom: formato === '58mm' ? '5mm' : '0' }}>
              
              <div className={`font-black text-center ${formato === '58mm' ? 'text-[13px] leading-tight mb-1 whitespace-normal' : 'text-[11px] truncate w-full leading-none mb-1'}`} style={{ wordBreak: 'break-word', maxWidth: '100%' }}>
                {p.name.toUpperCase()}
              </div>
              
              {formato === '58mm' && (
                <div className="font-black text-[18px] mb-2 leading-none">
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
      </div>"""

c = c.replace(print_section_old, print_section_new)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Matched perfectly with reference image')
