import re

with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Replace handlePrint configuration
new_handle_print = """
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: formato === '58mm'
      ? `
        @page {
          size: 58mm 297mm;
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 58mm; }
          html { margin: 0; padding: 0; width: 58mm; }
        }
      `
      : `
        @page {
          size: ${formato === '50x25' ? '50mm 25mm' : '38mm 25mm'};
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; }
        }
      `
  });
"""

# Use regex to replace the entire handlePrint declaration
c = re.sub(
    r"  const handlePrint = useReactToPrint\(\{.*?\}\);\n",
    new_handle_print[1:], # remove leading newline
    c,
    flags=re.DOTALL
)

# Also ensure the container width for 58mm is smaller so it fits within the printable area (48mm is safe for 58mm printers)
c = c.replace(
    "width: formato === '58mm' ? '58mm' : (formato === '50x25' ? '50mm' : '38mm')",
    "width: formato === '58mm' ? '48mm' : (formato === '50x25' ? '50mm' : '38mm')"
)

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated page styles for 58mm')
