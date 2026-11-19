import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add new state imports and logic to PosTerminal component

imports_add = """
  const { cart, total, addToCart, removeFromCart, processSale, clearCart, restoreCart } = usePosStore();
  
  // Terminal Linking & Paused Sales State
  const [terminalLinked, setTerminalLinked] = useState(() => localStorage.getItem('mpLinked') === 'true');
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [pausedSales, setPausedSales] = useState<any[]>(() => JSON.parse(localStorage.getItem('pausedSales') || '[]'));
  const [showPausedModal, setShowPausedModal] = useState(false);
"""
c = c.replace("const { cart, total, addToCart, removeFromCart, processSale, clearCart } = usePosStore();", imports_add)


# 2. Update handlePausar
new_pausar = """
  const handlePausar = () => {
    if (cart.length === 0) return;
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleTimeString(),
      cart: [...cart],
      client,
      total
    };
    const newPaused = [...pausedSales, newSale];
    setPausedSales(newPaused);
    localStorage.setItem('pausedSales', JSON.stringify(newPaused));
    clearCart();
    setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    alert("Venta guardada en espera.");
  };

  const handleRecuperar = (sale: any) => {
    restoreCart(sale.cart, sale.total);
    setClient(sale.client);
    const updated = pausedSales.filter(s => s.id !== sale.id);
    setPausedSales(updated);
    localStorage.setItem('pausedSales', JSON.stringify(updated));
    setShowPausedModal(false);
  };
"""

c = re.sub(r"const handlePausar = \(\) => \{[\s\S]*?\}\s*?\};\s*", new_pausar, c)


# 3. Update payment clicking logic to trigger terminal link
new_payment_click = """
  const handlePaymentClick = (met: string) => {
    if ((met === 'MONEDERO' || met === 'CRÉDITO') && client.name === 'PUBLICO GENERAL') {
      alert('Para pagar con ' + met + ' debes seleccionar un cliente primero.');
      setShowClientModal(true);
    } else if (met === 'MERCADO PAGO' && !terminalLinked) {
      setShowTerminalModal(true);
    } else {
      setPaymentMethod(met);
    }
  };
"""

c = re.sub(r"const handlePaymentClick = \(met: string\) => \{[\s\S]*?\}\s*?\};\s*", new_payment_click, c)

# 4. Add the modals UI at the end of the return statement before the final </div>
modals = """
      {/* TERMINAL LINK MODAL */}
      {showTerminalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-[400px] bg-nexus-900 border border-blue-500 rounded-3xl shadow-2xl flex flex-col p-8 text-center animate-in zoom-in">
            <h3 className="text-xl font-black text-white tracking-widest mb-4">VINCULAR TERMINAL</h3>
            <p className="text-slate-400 text-sm mb-6">Aún no has vinculado tu terminal Point Smart o Tarjeta. Para cobrar automáticamente, activa la terminal.</p>
            
            <div className="bg-white p-4 rounded-xl mx-auto mb-6 w-48 h-48 flex items-center justify-center border-4 border-dashed border-slate-300">
               <span className="text-slate-400 font-bold text-center text-xs">Simulación de<br/>Código QR</span>
            </div>

            <button 
              onClick={() => {
                setTerminalLinked(true);
                localStorage.setItem('mpLinked', 'true');
                setPaymentMethod('MERCADO PAGO');
                setShowTerminalModal(false);
                alert('Terminal vinculada exitosamente');
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase transition-colors shadow-lg shadow-blue-600/20 mb-3"
            >
              SIMULAR VINCULACIÓN
            </button>
            <button 
              onClick={() => setShowTerminalModal(false)}
              className="text-slate-500 hover:text-white font-bold transition-colors"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* PAUSED SALES MODAL */}
      {showPausedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="w-[600px] max-h-[80vh] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-nexus-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-white tracking-widest">VENTAS EN ESPERA</h3>
              <button onClick={() => setShowPausedModal(false)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-nexus-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
              {pausedSales.length === 0 ? (
                <p className="text-center text-slate-500 font-bold py-8">No hay ventas pausadas.</p>
              ) : (
                pausedSales.map(sale => (
                  <div key={sale.id} className="bg-[#0b1120] border border-nexus-800 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-lg">Cliente: {sale.client.name}</h4>
                      <p className="text-slate-500 text-sm font-mono">Pausado a las {sale.date} • {sale.cart.length} artículos</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-black text-emerald-400 text-xl">${sale.total.toFixed(2)}</p>
                      <button 
                        onClick={() => handleRecuperar(sale)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase"
                      >
                        RECUPERAR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
"""

c = c.replace("    </div>\n  );\n}", modals + "\n    </div>\n  );\n}")

# 5. Add "Ver Ventas Pausadas" button to the UI 
btn_ui = """
            <button onClick={handlePausar} className="w-full py-3 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-xl text-amber-500 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              <PauseCircle className="w-4 h-4" /> PAUSAR VENTA
            </button>
            {pausedSales.length > 0 && (
              <button onClick={() => setShowPausedModal(true)} className="w-full py-2 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-xl text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2">
                RECUPERAR ({pausedSales.length})
              </button>
            )}
"""

c = re.sub(r"<button onClick=\{handlePausar\}[\s\S]*?PAUSAR VENTA\s*</button>", btn_ui.strip(), c)


with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("PosTerminal modal updates added")
