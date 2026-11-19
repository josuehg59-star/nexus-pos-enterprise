import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Only emit 'size' for the die-cut labels. For 58mm, omit it so the printer driver decides (which handles it as a continuous vertical roll)
new_page_style = """
    pageStyle: `
      @page {
        ${formato !== '58mm' ? `size: ${formato === '50x25' ? '50mm 25mm' : '38mm 25mm'};` : ''}
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
          width: ${formato === '58mm' ? '58mm' : '100%'};
        }
        * {
          -webkit-print-color-adjust: exact;
          color: black !important;
        }
      }
    `
"""

c = re.sub(
    r"    pageStyle: `\n      @page \{\n        size: \$\{formato === '58mm' \? '58mm auto' : \(formato === '50x25' \? '50mm 25mm' : '38mm 25mm'\)\};\n        margin: 0;\n        padding: 0;\n      \}\n      @media print \{\n        body \{\n          margin: 0;\n          padding: 0;\n          background-color: white;\n          color: black;\n          font-family: Arial, sans-serif;\n          width: \$\{formato === '58mm' \? '58mm' : '100%'\};\n        \}\n        \* \{\n          -webkit-print-color-adjust: exact;\n          color: black !important;\n        \}\n      \}\n    `",
    new_page_style[1:],
    c
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Removed forced page size for 58mm')
