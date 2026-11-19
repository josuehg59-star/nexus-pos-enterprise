import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the filteredCortes logic
new_cortes = """
    const filteredCortes = useMemo(() => {
      const start = new Date(startDate + "T00:00:00").getTime();
      const end = new Date(endDate + "T23:59:59.999").getTime();
      
      const parseLocalToTimestamp = (dateString: string) => {
        let ts = new Date(dateString).getTime();
        if (!isNaN(ts)) return ts;
        try {
          const [datePart, timePart] = dateString.split(', ');
          const [day, month, year] = datePart.split('/');
          if (day && month && year) {
            const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
            ts = new Date(isoStr).getTime();
            if (!isNaN(ts)) return ts;
          }
        } catch(e) {}
        return 0;
      };

      return cortes.filter(c => {
        const tTime = parseLocalToTimestamp(c.date);
        return tTime >= start && tTime <= end;
      });
    }, [cortes, startDate, endDate]);
"""

old_cortes_pattern = r'const filteredCortes = useMemo\(\(\) => \{[\s\S]*?return tTime >= start && tTime <= end;\s*\}\);\s*\}, \[cortes, startDate, endDate\]\);'

if re.search(old_cortes_pattern, code):
    code = re.sub(old_cortes_pattern, new_cortes.strip(), code)
else:
    print("Could not find filteredCortes logic to replace.")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Cortes date parsing logic fixed!")
