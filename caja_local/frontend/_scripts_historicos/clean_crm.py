import re

with open('src/pages/Crm.tsx', encoding='utf-8') as f:
    c = f.read()

# Remove the UI block for NÚMERO DE TARJETA MONEDERO
start_str = "<div>\n                <label className=\"text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2\">NÚMERO DE TARJETA MONEDERO</label>"
end_str = "autoFocus={false} />\n              </div>" # rough guess, let's use regex

c = re.sub(r'<div>\s*<label[^>]*>NÚMERO DE TARJETA MONEDERO</label>\s*<input[^>]*>\s*</div>', '', c)

with open('src/pages/Crm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Cleaned up CRM.tsx')
