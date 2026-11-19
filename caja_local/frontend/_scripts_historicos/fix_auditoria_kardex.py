import os
import re

# 1. FIX AUDITORIA
with open('src/pages/Auditoria.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the supplier field filtering
code = code.replace(
    "results = results.filter(p => p.category === proveedor || p.proveedor === proveedor || (p as any).brand === proveedor);",
    "results = results.filter(p => p.category === proveedor || p.proveedor === proveedor || (p as any).brand === proveedor || p.supplier_id === proveedor);"
)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(code)


# 2. FIX KARDEX BY AUTO-MIGRATING OLD SALES IF EMPTY
with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    code_k = f.read()

migration_code = """
  import { useEffect } from 'react';
  
  // Inside component:
  useEffect(() => {
    const migrateSalesToKardex = async () => {
      const kardexCount = await db.kardex.count();
      if (kardexCount === 0) {
        console.log("Migrating old tickets to Kardex...");
        const tickets = await db.tickets.toArray();
        const newKardex = [];
        for (const t of tickets) {
          if (t.items) {
            for (const item of t.items) {
               newKardex.push({
                 tipo: 'SALIDA',
                 sku: item.sku || 'N/A',
                 productName: item.name,
                 cantidad: item.cartQty - (item.returnedQty || 0),
                 fecha: t.date,
                 costoUnitario: item.cost || (item.price * 0.7),
                 precioVenta: item.price,
                 total: item.price * (item.cartQty - (item.returnedQty || 0)),
                 folio: t.id,
                 proveedor: item.supplier_id || item.category || 'SIN PROVEEDOR'
               });
            }
          }
        }
        if (newKardex.length > 0) {
          await db.kardex.bulkAdd(newKardex);
          console.log(`Migrated ${newKardex.length} items to Kardex.`);
        }
      }
    };
    migrateSalesToKardex();
  }, []);
"""

if "migrateSalesToKardex" not in code_k:
    # Inject it right after `export default function KardexReport() {`
    inject_point = "export default function KardexReport() {"
    replacement = "export default function KardexReport() {\n" + migration_code.replace("import { useEffect } from 'react';\n  \n  // Inside component:", "")
    code_k = code_k.replace(inject_point, replacement)
    
    # Also ensure useEffect is imported
    if "useEffect" not in code_k.split("from 'react'")[0]:
        code_k = code_k.replace("import { useState }", "import { useState, useEffect }")
        code_k = code_k.replace("import { useState,", "import { useState, useEffect,")

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(code_k)

print("Fixed Auditoria provider check and added Kardex auto-migration!")
