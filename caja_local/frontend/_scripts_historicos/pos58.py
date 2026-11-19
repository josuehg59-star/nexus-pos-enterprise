import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Update dropdown options
c = c.replace('<option value="38x25">PEQUEÑA (38x25 mm)</option>', 
              '<option value="38x25">PEQUEÑA (38x25 mm)</option>\n              <option value="58mm">TICKET POS-58 (Rollo 58mm)</option>')

# 2. Update pageStyle
c = re.sub(
    r"size: \$\{formato === '50x25' \? '50mm 25mm' : '38mm 25mm'\};",
    "size: ${formato === '50x25' ? '50mm 25mm' : formato === '38x25' ? '38mm 25mm' : '58mm auto'};",
    c
)

# 3. Update preview sizing
preview_w = "width: formato === '58mm' ? '220px' : (formato === '50x25' ? '188px' : '143px')"
preview_h = "height: formato === '58mm' ? 'auto' : '94px'"
preview_padding = "padding: formato === '58mm' ? '1rem' : '0.5rem'"
preview_mb = "marginBottom: formato === '58mm' ? '1rem' : '0'"
c = re.sub(
    r"style=\{\{ width: formato === '50x25' \? '188px' : '143px', height: '94px' \}\}",
    f"style={{{{ {preview_w}, {preview_h}, {preview_padding}, {preview_mb} }}}}",
    c
)

# 4. Update barcode settings in preview
c = re.sub(
    r"width=\{formato === '50x25' \? 1.3 : 1.0\} height=\{25\}",
    "width={formato === '58mm' ? 1.8 : (formato === '50x25' ? 1.3 : 1.0)} height={formato === '58mm' ? 40 : 25}",
    c
)

# 5. Update print sizing
print_w = "width: formato === '58mm' ? '58mm' : (formato === '50x25' ? '50mm' : '38mm')"
print_h = "height: formato === '58mm' ? 'auto' : '25mm'"
print_pb = "pageBreakAfter: formato === '58mm' ? 'auto' : 'always'"
print_p = "padding: formato === '58mm' ? '5mm' : '1mm'"
print_mb = "marginBottom: formato === '58mm' ? '5mm' : '0'"
c = re.sub(
    r"style=\{\{ width: formato === '50x25' \? '50mm' : '38mm', height: '25mm', pageBreakAfter: 'always', boxSizing: 'border-box', padding: '1mm' \}\}",
    f"style={{{{ {print_w}, {print_h}, {print_pb}, boxSizing: 'border-box', {print_p}, {print_mb} }}}}",
    c
)

# 6. Update barcode settings in print
c = re.sub(
    r"width=\{formato === '50x25' \? 1.2 : 0.9\} height=\{18\}",
    "width={formato === '58mm' ? 1.5 : (formato === '50x25' ? 1.2 : 0.9)} height={formato === '58mm' ? 30 : 18}",
    c
)

# 7. Update text sizing in print for POS-58
# Replace the description
c = c.replace(
    '<div className="font-bold text-[11px] truncate w-full text-center leading-tight mb-1">{p.name}</div>',
    '<div className={`font-bold truncate w-full text-center leading-tight mb-1 ${formato === \'58mm\' ? \'text-[14px]\' : \'text-[11px]\'}`}>{p.name}</div>'
)
# Replace the price
c = c.replace(
    '<div className="font-black text-[15px] leading-none mt-1">Precio: ${p.price.toFixed(2)}</div>',
    '<div className={`font-black leading-none mt-2 ${formato === \'58mm\' ? \'text-[20px]\' : \'text-[15px]\'}`}>Precio: ${p.price.toFixed(2)}</div>'
)


with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated for POS-58')
