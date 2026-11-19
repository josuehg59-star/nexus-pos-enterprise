import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Inject handleDevolverParcial after handleDevolver
devolver_regex = re.search(r"alert\('Devolución procesada exitosamente y stock restaurado.'\);\n\s*setSelectedTicket\(null\);\n\s*\}", c)
if devolver_regex:
    handle_parcial = """
  const handleDevolverParcial = async (ticket: any, itemIndex: number) => {
    const item = ticket.items[itemIndex];
    const availableToReturn = item.cartQty - (item.returnedQty || 0);
    
    if (availableToReturn <= 0) {
      alert('Ya se han devuelto todas las piezas de este producto en este ticket.');
      return;
    }
    
    const qtyToReturn = parseInt(prompt(`¿Cuántas piezas de ${item.name} deseas devolver? (Máximo: ${availableToReturn})`, '1') || '0');
    
    if (isNaN(qtyToReturn) || qtyToReturn <= 0 || qtyToReturn > availableToReturn) {
      if (qtyToReturn > 0) alert('Cantidad inválida.');
      return;
    }
    
    if(!window.confirm(`¿Confirmas la devolución de ${qtyToReturn} pz de ${item.name}? El stock se restaurará.`)) return;
    
    // 1. Update item returnedQty
    const newItems = [...ticket.items];
    newItems[itemIndex].returnedQty = (newItems[itemIndex].returnedQty || 0) + qtyToReturn;
    
    // 2. Add to kardex (Devolución)
    const fecha = new Date().toISOString().split('T')[0];
    await db.kardex.add({
      fecha,
      tipo: 'DEVOLUCION',
      sku: item.sku,
      productName: item.name,
      cantidad: qtyToReturn,
      costo: item.cost || 0,
      precio: item.price,
      total: item.price * qtyToReturn,
      folio: ticket.id,
      proveedor: 'CLIENTE (DEVOLUCIÓN PARCIAL)'
    });
    
    // 3. Restore stock
    const product = await db.products.where('sku').equals(item.sku).first();
    if(product) {
      await db.products.update(product.id, { stock: Number(product.stock) + qtyToReturn });
    }
    
    // 4. Calculate new total (just for visual record in the ticket, or we keep original total and add returned total? Let's reduce total)
    const amountRefunded = item.price * qtyToReturn;
    const newTotal = ticket.total - amountRefunded;
    const newStatus = newItems.every(i => (i.returnedQty || 0) >= i.cartQty) ? 'DEVOLUCION' : ticket.status;
    
    await db.tickets.update(ticket.id, { 
      items: newItems,
      total: newTotal,
      status: newStatus
    });
    
    alert(`Devolución parcial aplicada: ${qtyToReturn}pz de ${item.name} por $${amountRefunded.toFixed(2)}.`);
    
    // Refresh modal data
    const updatedTicket = await db.tickets.get(ticket.id);
    setSelectedTicket(updatedTicket);
  };
"""
    c = c[:devolver_regex.end()] + handle_parcial + c[devolver_regex.end():]

# 2. Modify renderModal to show partial return button
old_tr = re.search(r"\{selectedTicket\.items\?\.map\(\(item: any, i: number\) => \([\s\S]*?<\/tr>\n\s*\)\)}", c)
if old_tr:
    new_tr = """{selectedTicket.items?.map((item: any, i: number) => {
                    const returned = item.returnedQty || 0;
                    const available = item.cartQty - returned;
                    return (
                    <tr key={i} className={returned > 0 ? "opacity-75" : ""}>
                      <td className="py-3 font-bold">
                        {item.name}
                        {returned > 0 && <span className="ml-2 text-[9px] bg-red-900/50 text-red-400 px-1 py-0.5 rounded">DEVUELTO: {returned}pz</span>}
                      </td>
                      <td className="py-3 font-black text-right">{item.cartQty}</td>
                      <td className="py-3 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-3 font-black text-emerald-400 text-right flex items-center justify-end gap-2">
                        ${(item.cartQty * item.price).toFixed(2)}
                        {available > 0 && (
                          <button onClick={() => handleDevolverParcial(selectedTicket, i)} className="bg-red-900/30 hover:bg-red-900/80 text-red-400 text-[9px] px-2 py-1 rounded transition-colors" title="Devolver parcialmente este producto">
                            RETORNAR
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}"""
    c = c[:old_tr.start()] + new_tr + c[old_tr.end():]

# 3. Modify filtered filtering logic for Kardex and Cortes so they respect date filters.
filtered_logic = re.search(r"const filteredTickets = useMemo\(\(\) => \{[\s\S]*?\}, \[tickets, startDate, endDate\]\);", c)
if filtered_logic:
    new_filtered = """const filteredTickets = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return tickets.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [tickets, startDate, endDate]);

  const filteredKardex = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return kardex.filter(k => {
      if (!k.fecha) return true;
      const tTime = new Date(k.fecha).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [kardex, startDate, endDate]);
  
  const filteredCortes = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();
    return cortes.filter(c => {
      const tTime = new Date(c.date).getTime();
      return tTime >= start && tTime <= end;
    });
  }, [cortes, startDate, endDate]);"""
    c = c[:filtered_logic.start()] + new_filtered + c[filtered_logic.end():]

# 4. Replace arrays in rendering logic
c = c.replace("{kardex.filter((k:any) => k.tipo === 'ENTRADA')", "{filteredKardex.filter((k:any) => k.tipo === 'ENTRADA')")
c = c.replace("{kardex.filter((k:any) => k.tipo === 'MERMA')", "{filteredKardex.filter((k:any) => k.tipo === 'MERMA')")
c = c.replace("{cortes.map", "{filteredCortes.map")
c = c.replace("cortes.length === 0", "filteredCortes.length === 0")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
    print("Reports upgraded")
