import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add setSelectedTicket(null) to handleDevolver
c = re.sub(r"(alert\('Devoluci[^\n]+ stock restaurado\.'\);)", r"\1\n      setSelectedTicket(null);", c)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Forced modal close patch")
