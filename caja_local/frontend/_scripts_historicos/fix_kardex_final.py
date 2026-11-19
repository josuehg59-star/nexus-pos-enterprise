import os
import re

with open('src/pages/KardexReport.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the nested scope issue for date filtering
bad_scope = """       let matchStart = true;
      let matchEnd = true;
      if (fechaInicio || fechaFin) {"""

code = code.replace(bad_scope, "")
code = code.replace("return matchSearch && matchStart && matchEnd;", "return matchSearch && matchStart && matchEnd;\n    });")

# We might have left an extra `}` because we removed an `if` but didn't remove its closing bracket.
# Let's cleanly replace the entire filtered logic.
old_filtered = r"const filtered = movements\.filter\(m => \{[\s\S]*?return matchSearch && matchStart && matchEnd;\s*\}\);"

new_filtered = """const filtered = movements.filter(m => {
      const matchSearch = !searchTerm ||
        (m.productName && m.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        
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
      return matchSearch && matchStart && matchEnd;
    });"""

if re.search(r"const filtered = movements\.filter", code):
    code = re.sub(old_filtered, new_filtered, code)

# Let's add a "Reconstruir Kardex" button so the user can sync old sales easily.
button_inject = r'<h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE KARDEX</h2>'
button_replacement = """<div className="flex gap-4 items-center">
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE KARDEX</h2>
                  <button onClick={async () => {
                    if(!confirm('¿Reconstruir Kardex desde el historial de ventas?')) return;
                    const tickets = await db.tickets.toArray();
                    const newKardex: any[] = [];
                    for (const t of tickets) {
                      if (t.items) {
                        for (const item of t.items) {
                           newKardex.push({
                             tipo: 'SALIDA',
                             sku: item.sku || 'N/A',
                             productName: item.name,
                             cantidad: item.cartQty - (item.returnedQty || 0),
                             fecha: t.date,
                             costo: item.cost || (item.price * 0.7),
                             precio: item.price,
                             total: item.price * (item.cartQty - (item.returnedQty || 0)),
                             folio: t.id,
                             proveedor: item.supplier_id || item.category || 'SIN PROVEEDOR'
                           });
                        }
                      }
                    }
                    if (newKardex.length > 0) {
                      await db.kardex.where('tipo').equals('SALIDA').delete();
                      await db.kardex.bulkAdd(newKardex);
                      alert('Kardex reconstruido exitosamente con ' + newKardex.length + ' movimientos de salida.');
                    }
                  }} className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-colors">
                    Sincronizar Ventas
                  </button>
                </div>"""
code = code.replace(button_inject, button_replacement)

with open('src/pages/KardexReport.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Kardex date filtering fixed and Sincronizar button added.")
