import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix lucide-react
if "BarChart2" not in code.split("from 'lucide-react'")[0]:
    code = code.replace("BarChart3", "BarChart3, BarChart2")

# Fix recharts
if "Legend" not in code.split("from 'recharts'")[0]:
    code = code.replace("Pie, Cell } from 'recharts'", "Pie, Cell, Legend } from 'recharts'")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Imports fixed in Reports.tsx")
