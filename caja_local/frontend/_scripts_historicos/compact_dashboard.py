import os
import re

with open('src/pages/DashboardBI.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Compact header and add shrink-0
c = c.replace('<div className="flex justify-between items-start mb-8">', '<div className="flex justify-between items-start mb-4 shrink-0">')
c = c.replace('text-4xl', 'text-2xl')

# 2. Fix the KPI row
old_kpi_row = '<div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">'
new_kpi_row = '<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6 shrink-0">'
c = c.replace(old_kpi_row, new_kpi_row)

# 3. Compact KPI cards inside the map
old_card = 'className={`flex-1 min-w-[140px] bg-[#111827] border ${kpi.color} rounded-2xl p-4 shadow-lg shadow-black/50`}'
new_card = 'className={`bg-[#111827] border ${kpi.color} rounded-xl p-3 shadow-lg shadow-black/50`}'
c = c.replace(old_card, new_card)

# 4. Compact the value text
c = c.replace('className={`text-2xl font-black ${kpi.text} tracking-tighter`}', 'className={`text-lg font-black ${kpi.text} tracking-tighter truncate`}')

# 5. Compact Quick Access
c = c.replace('<div className="bg-[#111827] border border-nexus-800 rounded-3xl p-6 mb-8 shadow-xl">', '<div className="bg-[#111827] border border-nexus-800 rounded-2xl p-4 mb-6 shadow-xl shrink-0">')
c = c.replace('<h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">ACCESOS RÁPIDOS</h3>', '<h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ACCESOS RÁPIDOS</h3>')
c = c.replace('py-4 px-2 rounded-xl', 'py-2 px-2 rounded-lg')

# 6. Compact History & Panels
c = c.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">', '<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">')
c = c.replace('rounded-3xl p-6', 'rounded-2xl p-4')
c = c.replace('mb-8', 'mb-4')
c = c.replace('text-xl', 'text-sm')

with open('src/pages/DashboardBI.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Compacted DashboardBI")
