import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Instead of fetching uniqueProviders from products.category, let's fetch from db.providers!

new_unique_providers = """
  const uniqueProviders = useMemo(() => {
    const s = new Set<string>();
    s.add('TODOS');
    if (providers && providers.length > 0) {
      providers.forEach(p => s.add(p.name));
    } else {
      // Fallback
      products.forEach(p => {
        if(p.category && isNaN(Number(p.category))) s.add(p.category);
      });
    }
    return Array.from(s).sort();
  }, [products, providers]);
"""

c = re.sub(r"const uniqueProviders = useMemo\(\(\) => \{[\s\S]*?\}, \[products\]\);", new_unique_providers, c)

# Add providers to hooks
if "const providers =" not in c:
    c = c.replace("const products = useLiveQuery(() => db.products.toArray(), []) || [];", "const products = useLiveQuery(() => db.products.toArray(), []) || [];\n  const providers = useLiveQuery(() => db.providers.toArray(), []) || [];")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed provider filter to use actual providers")
