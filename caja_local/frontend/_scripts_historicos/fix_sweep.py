import os
import re

# We will apply a massive sweeping fix to all date and search issues across Reports, Kardex, Auditoria, Dashboard, etc.

# -----------------
# 1. KARDEXREPORT.TSX
# -----------------
with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    k_code = f.read()

k_date_logic_old = r"const startTs = fechaInicio \? new Date\(fechaInicio \+ 'T00:00:00'\)\.getTime\(\) : 0;[\s\S]*?matchEnd = mTs <= endTs;\s*\}"
k_date_logic_new = """
      let matchStart = true;
      let matchEnd = true;
      if (fechaInicio || fechaFin) {
         const startTs = fechaInicio ? new Date(fechaInicio + 'T00:00:00').getTime() : 0;
         const endTs = fechaFin ? new Date(fechaFin + 'T23:59:59.999').getTime() : Infinity;
         
         let mTs = new Date(m.fecha).getTime();
         if (isNaN(mTs)) {
           try {
             const [datePart] = m.fecha.split(', ');
             const [day, month, year] = datePart.split('/');
             if (day && month && year) {
               mTs = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`).getTime();
             }
           } catch(e) {}
         }
         
         if (!isNaN(mTs)) {
           matchStart = mTs >= startTs;
           matchEnd = mTs <= endTs;
         }
      }
"""
if re.search(r"const startTs = fechaInicio", k_code):
    k_code = re.sub(k_date_logic_old, k_date_logic_new.strip(), k_code)

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(k_code)

# -----------------
# 2. AUDITORIA.TSX
# -----------------
with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    a_code = f.read()

a_filter_old = r"results = results\.filter\(p => \{[\s\S]*?return pStr\.includes\(proveedor\.toUpperCase\(\)\);\s*\}\);"
a_filter_new = """
            results = results.filter(p => {
              const pStr = JSON.stringify(p).toUpperCase();
              const provStr = proveedor.toUpperCase();
              // Fuzzy match: match the exact string, or the first word of the provider (e.g. "BIMBO" from "BIMBO SA DE CV")
              const provFirstWord = provStr.split(' ')[0];
              return pStr.includes(provStr) || (provFirstWord.length > 2 && pStr.includes(provFirstWord));
            });
"""
if re.search(r"results = results\.filter\(p => \{[\s\S]*?return pStr", a_code):
    a_code = re.sub(a_filter_old, a_filter_new.strip(), a_code)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(a_code)

# -----------------
# 3. REPORTS.TSX
# -----------------
with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    r_code = f.read()

r_filter_old = r"const pStr = JSON\.stringify\(item\)\.toUpperCase\(\);\s*return pStr\.includes\(providerFilter\.toUpperCase\(\)\);"
r_filter_new = """
                    const pStr = JSON.stringify(item).toUpperCase();
                    const provStr = providerFilter.toUpperCase();
                    const provFirstWord = provStr.split(' ')[0];
                    return pStr.includes(provStr) || (provFirstWord.length > 2 && pStr.includes(provFirstWord));
"""
if re.search(r_filter_old, r_code):
    r_code = re.sub(r_filter_old, r_filter_new.strip(), r_code)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(r_code)

print("Massive date and fuzzy search sweep complete.")
