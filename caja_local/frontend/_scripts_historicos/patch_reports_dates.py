import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add paymentMethodFilter state
if "const [paymentFilter, setPaymentFilter]" not in c:
    c = c.replace("const [providerFilter, setProviderFilter] = useState('TODOS');",
                  "const [providerFilter, setProviderFilter] = useState('TODOS');\n  const [paymentFilter, setPaymentFilter] = useState('TODOS');")

# 2. Fix filteredTickets to use strict Timestamp boundaries and Payment Filter
old_filtered = """  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const tDate = typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0];
      return tDate >= startDate && tDate <= endDate;
    });
  }, [tickets, startDate, endDate]);"""

new_filtered = """  const filteredTickets = useMemo(() => {
    const start = new Date(startDate + "T00:00:00").getTime();
    const end = new Date(endDate + "T23:59:59.999").getTime();

    let arr = tickets.filter(t => {
      const tTime = new Date(t.date).getTime();
      return tTime >= start && tTime <= end;
    });
    
    if (paymentFilter !== 'TODOS') {
      arr = arr.filter(t => {
        const pm = (t.paymentMethod || '').toUpperCase();
        if (paymentFilter === 'EFECTIVO') return pm.includes('EFECTIVO') || pm.includes('CASH');
        if (paymentFilter === 'TARJETA') return pm.includes('TARJETA') || pm.includes('CARD') || pm.includes('DEBIT');
        if (paymentFilter === 'CREDITO') return pm.includes('CREDIT') && !pm.includes('CARD');
        if (paymentFilter === 'TRANSFERENCIA') return pm.includes('TRANSFER');
        return true;
      });
    }

    return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, startDate, endDate, paymentFilter]);"""

c = c.replace(old_filtered, new_filtered)

# 3. Add payment filter UI
old_filters = """          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proveedor</label>
            <select 
              value={providerFilter}"""

new_filters = """          <div className="w-48">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MÉTODO PAGO</label>
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-bold text-xs uppercase"
            >
              <option value="TODOS">Todos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Proveedor</label>
            <select 
              value={providerFilter}"""

if "MÉTODO PAGO" not in c:
    c = c.replace(old_filters, new_filters)

# 4. Fix table to show Date + Time instead of just Time!
c = c.replace("<th className=\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest\">Hora</th>", "<th className=\"p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest\">FECHA / HORA</th>")
c = c.replace("<td className=\"p-4 font-bold text-white text-xs\">{new Date(s.fecha).toLocaleTimeString()}</td>", "<td className=\"p-4 font-bold text-white text-xs\">{new Date(s.fecha).toLocaleString()}</td>")

# Also fix the sort in salesData so it strictly orders by date descending
old_sales = """        });
      });
      return sales;
    }, [filteredTickets, products, providerFilter]);"""

new_sales = """        });
      });
      return sales.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [filteredTickets, products, providerFilter]);"""

c = c.replace(old_sales, new_sales)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched Reports.tsx date filters and sorting")
