import os
import re

with open('src/pages/DashboardBI.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Change title
c = c.replace('TITAN DASHBOARD', 'NEXUS BI DASHBOARD')

with open('src/pages/DashboardBI.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Changed Dashboard Title")
