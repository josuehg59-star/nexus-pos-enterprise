import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix the CSS completely for POS-58
# By explicitly setting size to 58mm wide, and a very long height (e.g., 2000mm), we force Portrait.
# We also make sure the Barcode has width={1} or {1.2} so it's not amontonado.

new_page_style = """
    pageStyle: formato === '58mm'
      ? `
        @page {
          size: 58mm 210mm;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            width: 58mm !important;
            background-color: white;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 58mm !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .print-page {
            width: 52mm !important;
            margin: 0 auto 5mm auto;
            page-break-inside: avoid;
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

# Update the print container wrapper
c = c.replace(
    '<div ref={printRef} className="print:flex print:flex-col print:items-center">',
    '<div ref={printRef} className="print-container print:flex print:flex-col print:items-center">'
)

# Fix Barcode width to avoid squishing
# 1.2 is usually best for 203dpi, but let's do 1.2 for 58mm and height 40
c = re.sub(
    r"width=\{formato === '58mm' \? 1\.5 : \(formato === '50x25' \? 1\.3 : 1\.0\)\} height=\{formato === '58mm' \? 35 : 25\}",
    "width={formato === '58mm' ? 1.2 : (formato === '50x25' ? 1.3 : 1.0)} height={formato === '58mm' ? 40 : 25}",
    c
)
c = re.sub(
    r"width=\{formato === '58mm' \? 1\.5 : \(formato === '50x25' \? 1\.2 : 0\.9\)\} height=\{formato === '58mm' \? 30 : 18\}",
    "width={formato === '58mm' ? 1.2 : (formato === '50x25' ? 1.2 : 0.9)} height={formato === '58mm' ? 35 : 18}",
    c
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Adjusted print layout and barcode width')
