import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

migration_code = """
  // Auto-recalcular deudas basado en tickets históricos para evitar errores de sincronización
  React.useEffect(() => {
    if (activeTab === 'CRÉDITOS') {
      const recalculateDebts = async () => {
        const allTickets = await db.tickets.toArray();
        const allClients = await db.clients.toArray();
        
        const clientDebts: Record<string, number> = {};
        allTickets.forEach(t => {
          if (t.paymentMethod === 'CRÉDITO' || t.paymentMethod === 'CR%DITO') {
             const clientName = (t.client || 'PUBLICO GENERAL').toUpperCase();
             clientDebts[clientName] = (clientDebts[clientName] || 0) + (t.total || 0);
          }
        });

        for (const c of allClients) {
          const cName = c.name.toUpperCase();
          if (clientDebts[cName] !== undefined) {
             if (c.credito !== clientDebts[cName]) {
               await db.clients.update(c.id as number, { credito: clientDebts[cName] });
             }
          }
        }
      };
      recalculateDebts();
    }
  }, [activeTab]);
"""

if "recalculateDebts" not in code:
    code = code.replace("const topProducts = useMemo(() => {", migration_code + "\n  const topProducts = useMemo(() => {")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Injected auto-recalculation for client debts in Reports.tsx")
