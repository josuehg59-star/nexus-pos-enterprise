import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add paymentFilter state
if "const [paymentFilter, setPaymentFilter]" not in code:
    code = code.replace(
        "const [providerFilter, setProviderFilter] = useState('TODOS LOS PROVEEDORES');",
        "const [providerFilter, setProviderFilter] = useState('TODOS LOS PROVEEDORES');\n  const [paymentFilter, setPaymentFilter] = useState('TODOS');"
    )

# 2. Wire up the payment filter select
payment_select_search = r'<select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">\s*<option>TODOS</option>\s*<option>EFECTIVO</option>\s*<option>TRANSFERENCIA</option>\s*<option>TARJETA</option>\s*</select>'
payment_select_replace = r"""<select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)} className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold text-xs outline-none focus:border-nexus-accent">
                  <option>TODOS</option>
                  <option>EFECTIVO</option>
                  <option>TRANSFERENCIA</option>
                  <option>TARJETA</option>
                  <option>CRÉDITO</option>
                  <option>MERCADO PAGO</option>
                  <option>MONEDERO</option>
                </select>"""
code = re.sub(payment_select_search, payment_select_replace, code)

# 3. Rewrite filteredTickets logic to apply BOTH filters
old_filtered_tickets = r"const filteredTickets = useMemo\(\(\) => \{[\s\S]*?return tTime >= start && tTime <= end;\s*\}\);\s*\}, \[tickets, startDate, endDate\]\);"

new_filtered_tickets = """const filteredTickets = useMemo(() => {
        const start = new Date(startDate + "T00:00:00").getTime();
        const end = new Date(endDate + "T23:59:59.999").getTime();
        
        const parseLocalToTimestamp = (dateString: string) => {
          let ts = new Date(dateString).getTime();
          if (!isNaN(ts)) return ts;
          try {
            const [datePart, timePart] = dateString.split(', ');
            const [day, month, year] = datePart.split('/');
            if (day && month && year) {
              const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`;
              ts = new Date(isoStr).getTime();
              if (!isNaN(ts)) return ts;
            }
          } catch(e) {}
          return 0;
        };
  
        let result = tickets.filter(t => {
          const tTime = parseLocalToTimestamp(t.date);
          return tTime >= start && tTime <= end;
        });

        if (paymentFilter && paymentFilter !== 'TODOS') {
           result = result.filter(t => t.paymentMethod === paymentFilter);
        }

        if (providerFilter && providerFilter !== 'TODOS LOS PROVEEDORES') {
           result = result.map(t => {
              const newT = { ...t };
              if (newT.items) {
                 newT.items = newT.items.filter((item: any) => {
                    const pStr = JSON.stringify(item).toUpperCase();
                    return pStr.includes(providerFilter.toUpperCase());
                 });
              }
              return newT;
           }).filter(t => t.items && t.items.length > 0);
           
           result = result.map(t => {
              const newTotal = t.items.reduce((sum: number, item: any) => sum + (item.price * (item.cartQty - (item.returnedQty || 0))), 0);
              return { ...t, total: newTotal };
           });
        }

        return result;
      }, [tickets, startDate, endDate, providerFilter, paymentFilter]);"""

if re.search(old_filtered_tickets, code):
    code = re.sub(old_filtered_tickets, new_filtered_tickets, code)
else:
    print("Could not find filteredTickets logic to replace")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Filters completely wired in Reports.tsx!")
