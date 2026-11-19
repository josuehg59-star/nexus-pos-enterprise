import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

date_logic = """
    const filteredTickets = useMemo(() => {
      const start = new Date(startDate + "T00:00:00").getTime();
      const end = new Date(endDate + "T23:59:59.999").getTime();
      
      const parseLocalToTimestamp = (dateString: string) => {
        // If it's already an ISO string or valid format
        let ts = new Date(dateString).getTime();
        if (!isNaN(ts)) return ts;
        
        // Handle DD/MM/YYYY, HH:MM:SS
        try {
          const [datePart, timePart] = dateString.split(', ');
          const [day, month, year] = datePart.split('/');
          if (day && month && year) {
            // ISO format: YYYY-MM-DD
            const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
            ts = new Date(isoStr).getTime();
            if (!isNaN(ts)) return ts;
          }
        } catch(e) {}
        return 0; // fallback
      };

      return tickets.filter(t => {
        const tTime = parseLocalToTimestamp(t.date);
        return tTime >= start && tTime <= end;
      });
    }, [tickets, startDate, endDate]);
"""

old_logic_pattern = r'const filteredTickets = useMemo\(\(\) => \{[\s\S]*?return tTime >= start && tTime <= end;\s*\}\);\s*\}, \[tickets, startDate, endDate\]\);'

if re.search(old_logic_pattern, code):
    code = re.sub(old_logic_pattern, date_logic.strip(), code)
else:
    print("Could not find filteredTickets logic to replace.")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Date parsing logic fixed in Reports.tsx")
