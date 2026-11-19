import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Update pageStyle to force portrait and prevent scaling
new_page_style = """
    pageStyle: formato === '58mm'
      ? `
        @page {
          size: 58mm 210mm portrait;
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 48mm !important; }
          html { margin: 0; padding: 0; width: 48mm !important; }
        }
      `
      : `
"""

c = re.sub(
    r"    pageStyle: formato === '58mm'\n      \? `\n        @page \{\n          size: 58mm 297mm;\n          margin: 0;\n        \}\n        @media print \{\n          body \{ -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 58mm; \}\n          html \{ margin: 0; padding: 0; width: 58mm; \}\n        \}\n      `\n      : `\n",
    new_page_style[1:], 
    c,
    flags=re.DOTALL
)

# 2. Adjust Barcode width to avoid squishing
# If width=1, lines might be too thin for 203dpi? Actually width=2 is standard. 
# But 12 characters * 11 modules * 2px = 264px. 48mm at 203dpi = 384 dots. So width=2 is PERFECT.
c = re.sub(
    r"width=\{formato === '58mm' \? 1\.8 : \(formato === '50x25' \? 1\.3 : 1\.0\)\} height=\{formato === '58mm' \? 40 : 25\}",
    "width={formato === '58mm' ? 1.5 : (formato === '50x25' ? 1.3 : 1.0)} height={formato === '58mm' ? 35 : 25}",
    c
)
c = re.sub(
    r"width=\{formato === '58mm' \? 1\.5 : \(formato === '50x25' \? 1\.2 : 0\.9\)\} height=\{formato === '58mm' \? 30 : 18\}",
    "width={formato === '58mm' ? 1.5 : (formato === '50x25' ? 1.2 : 0.9)} height={formato === '58mm' ? 30 : 18}",
    c
)

# 3. Ensure print container is strictly 48mm
c = c.replace(
    "width: formato === '58mm' ? '48mm' : (formato === '50x25' ? '50mm' : '38mm')",
    "width: formato === '58mm' ? '48mm' : (formato === '50x25' ? '50mm' : '38mm')"
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Adjusted page size and barcode width')
