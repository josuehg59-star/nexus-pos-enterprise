import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix UTC timezone offset bug for initial date state
local_date_logic = """
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());
"""

code = code.replace(
    "const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);\n  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);",
    local_date_logic.strip()
)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed UTC offset timezone bug in Reports.tsx")
