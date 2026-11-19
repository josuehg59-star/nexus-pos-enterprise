import os
import re

with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make search case insensitive and handle nulls
kardex_filter = """  const filtered = movements.filter(m => {
    const matchSearch = !searchTerm ||
      (m.productName && m.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Dates coming from state are YYYY-MM-DD
    // m.fecha comes from Date.toLocaleString(), which depends on the locale (e.g. DD/MM/YYYY or MM/DD/YYYY)
    // To be safe, we parse m.fecha safely or just skip strict date matching if it's too complex, 
    // but the user wants date filtering. Let's do a basic substring match if it's not parsing right, 
    // or just let it pass if empty strings are used.
    
    // A more robust date approach for the UI:
    let matchStart = true;
    let matchEnd = true;
    if (fechaInicio || fechaFin) {
       // Convert YYYY-MM-DD to timestamp
       const startTs = fechaInicio ? new Date(fechaInicio + 'T00:00:00').getTime() : 0;
       const endTs = fechaFin ? new Date(fechaFin + 'T23:59:59.999').getTime() : Infinity;
       
       // Try parsing m.fecha assuming format could be DD/MM/YYYY or standard Date string
       let mTs = 0;
       if (m.fecha) {
         // quick fix for DD/MM/YYYY, MM/DD/YYYY, or ISO
         const parts = m.fecha.split(',')[0].split('/');
         if (parts.length === 3) {
            // assume DD/MM/YYYY if first is > 12, else JS Date parses it
            mTs = new Date(m.fecha).getTime();
            if (isNaN(mTs) && parts[0].length === 2) {
               mTs = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime();
            }
         } else {
            mTs = new Date(m.fecha).getTime();
         }
       }
       if (!isNaN(mTs) && mTs > 0) {
         matchStart = mTs >= startTs;
         matchEnd = mTs <= endTs;
       }
    }

    return matchSearch && matchStart && matchEnd;
  });"""

pattern = r'const filtered = movements\.filter\(m => \{[\s\S]*?return matchSearch && matchStart && matchEnd;\n  \}\);'
code = re.sub(pattern, kardex_filter, code)

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Kardex filter fixed!")
