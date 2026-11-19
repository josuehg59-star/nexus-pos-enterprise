import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

states = """  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');
"""

if "const [showAbonoModal, setShowAbonoModal]" not in c:
    c = c.replace("const [showCreditModal, setShowCreditModal] = useState<any>(null);", "const [showCreditModal, setShowCreditModal] = useState<any>(null);\n" + states)

handler = """  const handleAbonar = async () => {
    if (!selectedClientAbono) return;
    const abono = parseFloat(abonoAmount);
    if (isNaN(abono) || abono <= 0) {
      alert("Ingrese una cantidad válida.");
      return;
    }
    if (abono > (selectedClientAbono.credito || 0)) {
      alert("El abono no puede ser mayor a la deuda.");
      return;
    }

    try {
      await db.clients.update(selectedClientAbono.id, {
        credito: selectedClientAbono.credito - abono
      });
      alert(`Abono de $${abono.toFixed(2)} registrado correctamente para ${selectedClientAbono.name}.`);
      setShowAbonoModal(false);
      setAbonoAmount('');
      setSelectedClientAbono(null);
    } catch(err) {
      console.error(err);
      alert("Error al procesar el abono.");
    }
  };
"""

if "const handleAbonar =" not in c:
    c = c.replace("const clients = useLiveQuery(() => db.clients.toArray(), []) || [];", "const clients = useLiveQuery(() => db.clients.toArray(), []) || [];\n\n" + handler)

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("States and handler injected")
