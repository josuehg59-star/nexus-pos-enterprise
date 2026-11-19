import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Let's completely rewrite the hidden print container and handlePrint to use bulletproof POS HTML/CSS.
# We will match the user's provided HTML structure exactly.

new_page_style = """
    pageStyle: `
      @page {
        margin: 0;
        padding: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background-color: white;
          color: black;
          font-family: Arial, sans-serif;
        }
        * {
          -webkit-print-color-adjust: exact;
          color: black !important;
        }
      }
    `
"""

c = re.sub(
    r"    pageStyle: formato === '58mm'\n      \? `.*?`\n      : `\n.*?`",
    new_page_style[1:], 
    c,
    flags=re.DOTALL
)

print_section_old = r'      <div className="hidden">.*?</div>\n    </div>\n  \);\n\}'

print_section_new = """      <div className="hidden">
        <div ref={printRef} style={{ width: formato === '58mm' ? '52mm' : '100%', margin: '0 auto', backgroundColor: 'white', padding: '0', color: 'black' }}>
          {selectedProducts.map((p, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              width: '100%',
              pageBreakAfter: formato === '58mm' ? 'auto' : 'always',
              marginBottom: formato === '58mm' ? '15px' : '0',
              paddingTop: formato === '58mm' ? '10px' : '0',
              fontFamily: 'Arial, sans-serif'
            }}>
              
              <div style={{ fontWeight: 700, fontSize: formato === '58mm' ? '14px' : '11px', marginBottom: '4px', lineHeight: '1.2' }}>
                {p.name.toUpperCase()}
              </div>
              
              {formato === '58mm' && (
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                  ${p.price.toFixed(2)}
                </div>
              )}

              <div style={{ margin: '0 auto' }}>
                <Barcode 
                  value={p.sku} 
                  width={formato === '58mm' ? 1.5 : (formato === '50x25' ? 1.3 : 1.0)} 
                  height={formato === '58mm' ? 40 : 25} 
                  fontSize={12} 
                  margin={0} 
                  textMargin={2} 
                  displayValue={true} 
                />
              </div>

              {formato !== '58mm' && (
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                  ${p.price.toFixed(2)}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}"""

c = re.sub(print_section_old, print_section_new, c, flags=re.DOTALL)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Applied exact HTML/CSS structure from reference')
