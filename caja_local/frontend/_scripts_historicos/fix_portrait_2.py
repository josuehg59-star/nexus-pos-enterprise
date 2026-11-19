import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Replace pageStyle again to just 'portrait' and margin 0
new_page_style = """
    pageStyle: formato === '58mm'
      ? `
        @page {
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 48mm !important; }
          html { margin: 0; padding: 0; width: 48mm !important; }
          .print-page { page-break-after: always; width: 48mm !important; margin: 0 auto; }
        }
      `
      : `
"""

c = re.sub(
    r"    pageStyle: formato === '58mm'\n      \? `\n        @page \{\n          size: 58mm 210mm portrait;\n          margin: 0;\n        \}\n        @media print \{\n          body \{ -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 48mm !important; \}\n          html \{ margin: 0; padding: 0; width: 48mm !important; \}\n        \}\n      `\n      : `\n",
    new_page_style[1:], 
    c,
    flags=re.DOTALL
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated to rely on driver orientation')
