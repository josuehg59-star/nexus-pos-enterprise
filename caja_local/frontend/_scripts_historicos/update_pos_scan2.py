import re

with open('src/pages/PosTerminal.tsx', encoding='utf-8') as f:
    c = f.read()

# Update monedero percentage to 1% (0.01)
c = c.replace('PORCENTAJE_MONEDERO = 0.05', 'PORCENTAJE_MONEDERO = 0.01')

# Update handleScan
if 'clientMatch' not in c:
    old_start = "if (e.key === 'Enter' && scanInput.trim() !== '') {"
    new_start = """if (e.key === 'Enter' && scanInput.trim() !== '') {
      const val = scanInput.trim();
      
      const clientMatch = await db.clients.where('monederoCode').equals(val).first();
      if (clientMatch) {
        setClient(clientMatch);
        setScanInput('');
        return;
      }
"""
    c = c.replace(old_start, new_start, 1)

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated PosTerminal.tsx')
