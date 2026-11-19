import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add handleConfirmPayment function and change handleCobrar
old_cobrar_match = re.search(r"const handleCobrar = async \(\) => \{[\s\S]*?setClient\(\{ name: 'PUBLICO GENERAL', monedero: 0, id: 0 \}\);\n\s*\}\n\s*\};", c)

if old_cobrar_match:
    new_cobrar = """const handleCobrar = async () => {
    if (cart.length === 0) { 
      alert('El carrito está vacío. Agrega productos para cobrar.'); 
      return; 
    }
    
    if (paymentMethod !== 'EFECTIVO' && paymentMethod !== 'MONEDERO') {
      setIsProcessing(true);
      if (paymentMethod === 'MERCADO PAGO') {
        setProcessMsg('Conectando con Terminal Mercado Pago...');
      } else if (paymentMethod === 'TARJETA') {
        setProcessMsg('Enviando cobro a Terminal Bancaria...');
      } else if (paymentMethod === 'TRANSFERENCIA') {
        setProcessMsg('Verificando pago por Transferencia...');
      } else if (paymentMethod === 'CRÉDITO') {
        setProcessMsg('Autorizando Venta a Crédito...');
      } else {
        setProcessMsg('Procesando pago...');
      }
      return; // Detenemos aquí, la modal se encarga de confirmar o rechazar.
    }

    // Efectivo y Monedero pasan directo
    await finalizeSale();
  };

  const finalizeSale = async () => {
    const success = await processSale(paymentMethod, client.name);
    if (success) {
      setLastTicket({
        total,
        cart,
        date: new Date().toLocaleString(),
        paymentMethod
      });
      setShowTicketModal(true);
      setMontoRecibido('');
      setPaymentMethod('EFECTIVO');
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    }
    setIsProcessing(false);
  };"""
    
    c = c[:old_cobrar_match.start()] + new_cobrar + c[old_cobrar_match.end():]


# 2. Update the Processing Modal HTML
old_modal_match = re.search(r"\{\/\* PROCESSING MODAL \*\/\}[\s\S]*?\{\/\* MODAL VENTA FINALIZADA", c)

if old_modal_match:
    new_modal = """{/* PROCESSING MODAL (SIMULACIÓN DE ESPERA DE TERMINAL) */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="bg-nexus-900 border border-blue-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col items-center animate-in fade-in zoom-in duration-200 w-full max-w-md">
            
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            
            <h3 className="text-xl font-black text-white tracking-widest text-center mb-2">{processMsg}</h3>
            
            <p className="text-slate-400 text-sm font-bold text-center mb-8">
              {paymentMethod === 'MERCADO PAGO' || paymentMethod === 'TARJETA' 
                ? 'Por favor, pide al cliente que inserte o deslice su tarjeta en la terminal física.' 
                : 'Por favor, verifica manualmente que el pago haya sido recibido.'}
            </p>
            
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setIsProcessing(false)}
                className="flex-1 bg-red-950/50 hover:bg-red-900/80 border border-red-900/50 text-red-500 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                RECHAZAR PAGO
              </button>
              
              <button 
                onClick={finalizeSale}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-colors"
              >
                SIMULAR APROBADO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA FINALIZADA"""
    
    c = c[:old_modal_match.start()] + new_modal + c[old_modal_match.end():]

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("PosTerminal validation modal added")
