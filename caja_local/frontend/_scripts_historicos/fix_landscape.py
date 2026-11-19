import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix @page size for 58mm to explicitly define a Portrait dimension (Width 58mm x Height 1000mm)
# The invalid '58mm auto' makes Chrome fallback to the printer's default which might be flipped in the driver.
c = c.replace(
    "size: ${formato === '50x25' ? '50mm 25mm' : formato === '38x25' ? '38mm 25mm' : '58mm auto'};",
    "size: ${formato === '50x25' ? '50mm 25mm' : formato === '38x25' ? '38mm 25mm' : '58mm 210mm'};"
)

# Also ensure the container aligns them vertically
# Already has print:flex-col, but let's make sure it's tight
# Remove pageBreakAfter 'auto' and use 'avoid' so they stack on the same continuous ticket 
# or just add some margin between them.
c = c.replace(
    "pageBreakAfter: formato === '58mm' ? 'auto' : 'always',",
    "pageBreakAfter: formato === '58mm' ? 'avoid' : 'always',"
)

# Add a little bottom margin to separate the barcodes on the same ticket
c = c.replace(
    "marginBottom: formato === '58mm' ? '5mm' : '0'",
    "marginBottom: formato === '58mm' ? '8mm' : '0'"
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated page size to portrait for POS-58')
