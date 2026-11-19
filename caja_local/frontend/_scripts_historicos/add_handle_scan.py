import re

with open('src/pages/Auditoria.tsx', encoding='utf-8') as f:
    content = f.read()

# Add a handleScan function
handle_scan_logic = """
  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (isLibre) {
        const term = searchQuery.trim().toLowerCase();
        const p = await db.products.filter(pr => pr.sku.toLowerCase() === term || pr.name.toLowerCase() === term).first();
        if (p && p.id) {
          setConteos(prev => ({
            ...prev,
            [p.id!]: (prev[p.id!] || 0) + 1
          }));
          setSearchQuery('');
        }
      }
    }
  };

  const handleGuardarAuditoria = async () => {
"""

content = content.replace("  const handleGuardarAuditoria = async () => {", handle_scan_logic)

# Add onKeyDown to input
content = content.replace(
    "onChange={e => setSearchQuery(e.target.value)}",
    "onChange={e => setSearchQuery(e.target.value)}\n              onKeyDown={handleScan}"
)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Added handleScan logic')
