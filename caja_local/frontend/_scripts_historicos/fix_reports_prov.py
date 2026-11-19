import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to inject skuToProvider Map inside useMemo for filteredTickets
old_filtered_tickets_start = r"const filteredTickets = useMemo\(\(\) => \{"
new_filtered_tickets_start = """const filteredTickets = useMemo(() => {
        const skuToProv = new Map(products.map(p => [String(p.sku), String((p as any).supplier_id || p.category || '').toUpperCase()]));
"""

code = re.sub(old_filtered_tickets_start, new_filtered_tickets_start, code)

# We need to modify the provider check to use the map
old_prov_check = r"const pStr = JSON\.stringify\(item\)\.toUpperCase\(\);\s*const provStr = providerFilter\.toUpperCase\(\);\s*const provFirstWord = provStr\.split\(' '\)\[0\];\s*return pStr\.includes\(provStr\) \|\| \(provFirstWord\.length > 2 && pStr\.includes\(provFirstWord\)\);"

new_prov_check = """
                    const itemProv = skuToProv.get(String(item.sku)) || '';
                    const pStr = (JSON.stringify(item) + ' ' + itemProv).toUpperCase();
                    const provStr = providerFilter.toUpperCase();
                    const provFirstWord = provStr.split(' ')[0];
                    return pStr.includes(provStr) || (provFirstWord.length > 2 && pStr.includes(provFirstWord));
"""

code = re.sub(old_prov_check, new_prov_check.strip(), code)

# Ensure products is in the dependency array
code = code.replace(", providerFilter, paymentFilter]);", ", providerFilter, paymentFilter, products]);")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Reports.tsx wired to dynamically map ticket items to product providers")
