import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add states for Abonar
states_add = """
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [selectedClientAbono, setSelectedClientAbono] = useState<any>(null);
  const [abonoAmount, setAbonoAmount] = useState('');
"""
# insert near the top of Reports component
c = c.replace("const [showFolioModal, setShowFolioModal] = useState(false);", "const [showFolioModal, setShowFolioModal] = useState(false);\n" + states_add)

# Add handler for abonar
handler_add = """
  const handleAbonar = async () => {
    if (!selectedClientAbono) return;
    const abono = parseFloat(abonoAmount);
    if (isNaN(abono) || abono <= 0) {
      alert("Ingrese una cantidad válida.");
      return;
    }
    if (abono > selectedClientAbono.credito) {
      alert("El abono no puede ser mayor a la deuda.");
      return;
    }

    try {
      await db.clients.update(selectedClientAbono.id as number, {
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

# Insert handler before return
c = c.replace("  const renderFoliosTable = () => {", handler_add + "\n  const renderFoliosTable = () => {")

# Update the CREDITOS tab HTML
old_creditos = """
            {activeTab === 'CRÉDITOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr><th className="p-4 text-[10px] text-slate-500 uppercase">CLIENTE</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">LÍMITE DE CRÉDITO</th><th className="p-4 text-[10px] text-slate-500 text-right uppercase">SALDO MONEDERO</th></tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {clients.filter(c => c.credito > 0 || c.monedero > 0).map((c, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{c.name}</td>
                      <td className="p-4 text-xs font-black text-orange-400 text-right">${(c.credito || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs font-black text-emerald-400 text-right">${(c.monedero || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {clients.filter(c => c.credito > 0 || c.monedero > 0).length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-bold">No hay clientes con crédito o monedero activo.</td></tr>}
                </tbody>
              </table>
            )}
"""

new_creditos = """
            {activeTab === 'CRÉDITOS' && (
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800">
                  <tr>
                    <th className="p-4 text-[10px] text-slate-500 uppercase">CLIENTE</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">DEUDA (CRÉDITO)</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">SALDO MONEDERO</th>
                    <th className="p-4 text-[10px] text-slate-500 text-right uppercase">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {clients.filter(c => (c.credito || 0) > 0 || (c.monedero || 0) > 0).map((c, i) => (
                    <tr key={i} className="hover:bg-nexus-800/50">
                      <td className="p-4 text-xs font-bold text-white">{c.name}</td>
                      <td className="p-4 text-xs font-black text-orange-400 text-right">${(c.credito || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs font-black text-emerald-400 text-right">${(c.monedero || 0).toFixed(2)}</td>
                      <td className="p-4 text-xs text-right">
                        {(c.credito || 0) > 0 && (
                          <button 
                            onClick={() => { setSelectedClientAbono(c); setAbonoAmount(c.credito.toString()); setShowAbonoModal(true); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            LIQUIDAR / ABONAR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clients.filter(c => (c.credito || 0) > 0 || (c.monedero || 0) > 0).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">No hay clientes con crédito o monedero activo.</td></tr>}
                </tbody>
              </table>
            )}
"""

# Try both encoded and utf8 versions
c = re.sub(r"\{activeTab === 'CR[É]DITOS' && \([\s\S]*?No hay clientes con cr[é]dito[\s\S]*?<\/table>[\s]*\)\}", new_creditos.strip(), c)


# Add Abono Modal at the end
modal_abono = """
      {/* ABONO MODAL */}
      {showAbonoModal && selectedClientAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="w-[400px] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col p-6 animate-in zoom-in">
            <h3 className="text-xl font-black text-white tracking-widest mb-2">ABONAR A CRÉDITO</h3>
            <p className="text-slate-400 text-sm mb-6">Cliente: <span className="font-bold text-white">{selectedClientAbono.name}</span></p>
            
            <div className="bg-[#0b1120] rounded-xl p-4 mb-6 border border-nexus-800 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DEUDA ACTUAL</p>
              <p className="text-3xl font-black text-orange-400">${(selectedClientAbono.credito || 0).toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MONTO A ABONAR</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input 
                  type="number" 
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  className="w-full bg-[#0b1120] border border-nexus-700 text-white pl-8 pr-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowAbonoModal(false)}
                className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors"
              >
                CANCELAR
              </button>
              <button 
                onClick={handleAbonar}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-600/20 transition-colors"
              >
                PROCESAR PAGO
              </button>
            </div>
          </div>
        </div>
      )}
"""

c = c.replace("    </div>\n  );\n}", modal_abono + "\n    </div>\n  );\n}")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Abonos modal added to Reports")
