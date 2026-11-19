import os
import re

with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Apply the filter to the rendered list!
code = code.replace("{products.map((item: any) => {",
                    "{products.filter((p: any) => !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()) || p.sku.toLowerCase().includes(filterText.toLowerCase())).map((item: any) => {")

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Auditoria.tsx list filter bound successfully!")
