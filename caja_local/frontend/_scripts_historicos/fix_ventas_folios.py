import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will replace the combined VENTAS/FOLIOS block with separate blocks.
# First, extract the block.
start_idx = code.find("{['VENTAS', 'FOLIOS'].includes(activeTab) && (")
if start_idx != -1:
    end_idx = code.find("          {activeTab === 'ESTAD", start_idx)
    block = code[start_idx:end_idx]
    
    # We will split this logic into two independent tabs.
    ventas_block = block.replace("['VENTAS', 'FOLIOS'].includes(activeTab)", "activeTab === 'VENTAS'")
    ventas_block = ventas_block.replace("ventasView === 'CONSOLIDADO'", "false")
    
    folios_block = block.replace("['VENTAS', 'FOLIOS'].includes(activeTab)", "activeTab === 'FOLIOS'")
    folios_block = folios_block.replace("ventasView === 'CONSOLIDADO'", "true")
    
    # The VISTA dropdown is now redundant for these tabs. We can leave it or remove it from these blocks.
    # The user just wants VENTAS to be detail, and FOLIOS to be folios.
    
    new_code = code[:start_idx] + ventas_block + "\n\n" + folios_block + "\n\n" + code[end_idx:]
    
    with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as out:
        out.write(new_code)
    print("Separated VENTAS and FOLIOS tabs!")
else:
    print("Could not find the VENTAS/FOLIOS block")
