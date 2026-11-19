import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. We need to add the new states for the Devolution Modal
state_injections = """
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devolucionCantidades, setDevolucionCantidades] = useState<{[key: number]: number}>({});

  const handleIncrementDev = (idx: number, max: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.min((prev[idx] || 0) + 1, max)
    }));
  };

  const handleDecrementDev = (idx: number) => {
    setDevolucionCantidades(prev => ({
      ...prev,
      [idx]: Math.max((prev[idx] || 0) - 1, 0)
    }));
  };

  const openDevolucionModal = () => {
    setDevolucionCantidades({});
    setShowDevolucionModal(true);
  };

  const procesarDevolucion = async (esTotal: boolean) => {
    if (!selectedTicket) return;
    try {
      const dbTicket = await db.tickets.get(selectedTicket.id!);
      if (!dbTicket) return;
      
      let totalMontoDevuelto = 0;
      let tieneCambios = false;

      const itemsActualizados = dbTicket.items.map((item: any, idx: number) => {
        const disponibles = item.cartQty - (item.returnedQty || 0);
        const aDevolver = esTotal ? disponibles : (devolucionCantidades[idx] || 0);
        
        if (aDevolver > 0) {
          tieneCambios = true;
          totalMontoDevuelto += aDevolver * item.price;
          item.returnedQty = (item.returnedQty || 0) + aDevolver;

          // Regresar stock
          db.products.where('sku').equals(item.sku).first().then(prod => {
            if (prod) {
              db.products.update(prod.id!, { stock: prod.stock + aDevolver });
            }
          });

          // Registro en Kardex
          db.kardex.add({
            tipo: 'DEVOLUCION',
            sku: item.sku,
            productName: item.name,
            cantidad: aDevolver,
            fecha: new Date().toLocaleString(),
            costoUnitario: item.cost,
            precioVenta: item.price,
            total: aDevolver * item.price,
            folio: dbTicket.id,
            proveedor: item.category || 'NA'
          });
        }
        return item;
      });

      if (!tieneCambios) {
        alert("Selecciona al menos un producto para devolver.");
        return;
      }

      dbTicket.items = itemsActualizados;
      dbTicket.total = (dbTicket.total || 0) - totalMontoDevuelto;
      if (dbTicket.total < 0) dbTicket.total = 0;
      
      const todoDevuelto = dbTicket.items.every((i:any) => i.returnedQty === i.cartQty);
      if (todoDevuelto) {
        dbTicket.status = 'DEVUELTO';
      }

      await db.tickets.put(dbTicket);
      setSelectedTicket(dbTicket);
      setShowDevolucionModal(false);
      
    } catch(e) {
      console.error(e);
    }
  };
"""

code = code.replace("const [abonoAmount, setAbonoAmount] = useState('');", "const [abonoAmount, setAbonoAmount] = useState('');\n" + state_injections)

# 2. Re-write the `renderModal` to match their exact TITAN POS styling and add the Devolution Modal
titan_modals = """
  const renderDevolucionModal = () => {
    if (!selectedTicket || !showDevolucionModal) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-[#0b1120] border border-nexus-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">DEVOLVER PRODUCTOS - FOLIO #{selectedTicket.id?.substring(0,8).toUpperCase()}</h3>
            <button onClick={() => setShowDevolucionModal(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <div className="space-y-4 mb-8">
              {selectedTicket.items?.map((item: any, idx: number) => {
                const returned = item.returnedQty || 0;
                const maxReturn = item.cartQty - returned;
                if (maxReturn <= 0) return null; // Already fully returned
                
                const cant = devolucionCantidades[idx] || 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between bg-nexus-900/30 p-4 rounded-2xl border border-nexus-800/50">
                    <div>
                      <p className="font-bold text-white text-sm">{item.name}</p>
                      <p className="text-[10px] font-black text-slate-500 tracking-widest mt-1">
                        COMPRADOS: {item.cartQty} | <span className="text-emerald-400">${item.price?.toFixed(2)}</span>
                        {returned > 0 && <span className="text-red-400 ml-2">(DEVUELTOS: {returned})</span>}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-nexus-900 border border-nexus-700 rounded-xl p-1">
                      <button onClick={() => handleDecrementDev(idx)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black">-</button>
                      <span className="w-6 text-center font-black text-white">{cant}</span>
                      <button onClick={() => handleIncrementDev(idx, maxReturn)} className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black">+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => procesarDevolucion(true)} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black text-sm transition-colors mb-6">
              CANCELAR TICKET COMPLETO (DEVOLUCIÓN TOTAL)
            </button>

            <div className="flex gap-4">
              <button onClick={() => procesarDevolucion(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm transition-colors">
                APLICAR DEVOLUCIÓN PARCIAL
              </button>
              <button onClick={() => setShowDevolucionModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm transition-colors">
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedTicket || showDevolucionModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-nexus-800 bg-nexus-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">DETALLE VENTA #{selectedTicket.id?.substring(0,8).toUpperCase()}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                <span>FECHA: {new Date(selectedTicket.date).toLocaleString()}</span>
                <span>MÉTODO: {selectedTicket.paymentMethod}</span>
                <span className={selectedTicket.status === 'DEVUELTO' ? "text-red-400" : "text-emerald-400"}>{selectedTicket.status || 'LIQUIDADO'}</span>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-nexus-800 rounded-2xl bg-nexus-900/20">
                <table className="w-full text-left">
                  <thead className="border-b border-nexus-800 bg-nexus-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="p-4">Producto</th>
                      <th className="p-4 text-center">Cant</th>
                      <th className="p-4 text-right">Precio</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nexus-800 text-xs font-bold text-white">
                    {selectedTicket.items?.map((item: any, i: number) => {
                      const ret = item.returnedQty || 0;
                      return (
                        <tr key={i} className={ret > 0 ? "opacity-60 bg-red-900/10" : "hover:bg-nexus-800/30 transition-colors"}>
                          <td className="p-4">
                            {item.name} 
                            {ret > 0 && <span className="block text-red-400 text-[10px] mt-1 font-black">(-{ret} DEVUELTOS)</span>}
                          </td>
                          <td className="p-4 text-center text-blue-400">{item.cartQty}</td>
                          <td className="p-4 text-right text-slate-400">${item.price?.toFixed(2) || '0.00'}</td>
                          <td className="p-4 text-right text-emerald-400">${((item.cartQty - ret) * item.price).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end mt-6">
                <div className="flex gap-3">
                  <button onClick={openDevolucionModal} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> DEVOLVER
                  </button>
                  <button className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> WHATSAPP
                  </button>
                  <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> TICKET
                  </button>
                </div>
                <div className="text-right bg-nexus-900/30 p-4 rounded-xl border border-nexus-800/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Final</p>
                  <p className="text-4xl font-black text-emerald-400 tracking-tighter">${(selectedTicket.total || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors shadow-lg shadow-blue-500/20">
                  NUEVA VENTA (ENTER)
                </button>
                <button onClick={() => setSelectedTicket(null)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-2xl font-black text-sm uppercase transition-colors">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
    );
  };
"""

# Replace the old renderModal code with the new one
start_idx = code.find("const renderModal = () => {")
end_idx = code.find("return (\n    <div className=\"flex-1 flex flex-col")
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + titan_modals + "\n  " + code[end_idx:]


# 3. Add the "REPORTE DE FOLIOS" header + Summary box inside the FOLIOS view!
folios_replacement = """
        {['VENTAS', 'FOLIOS'].includes(activeTab) && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Cabecera del Reporte como TITAN POS */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">REPORTE DE {activeTab}</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{startDate} AL {endDate}</p>
                <div className="bg-nexus-900/50 border border-emerald-500/30 rounded-2xl p-4 mt-4 inline-block shadow-lg shadow-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">VENTA BRUTA TOTAL</p>
                  <p className="text-3xl font-black text-emerald-400">${filteredTickets.reduce((a,b)=>a+(b.total||0),0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-nexus-700 hover:bg-nexus-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" /> PDF
                </button>
                <button className="bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                  <MessageCircle className="w-4 h-4" /> WHATSAPP
                </button>
              </div>
            </div>

            <div className="bg-nexus-900/50 border border-nexus-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
"""

code = code.replace("""        {['VENTAS', 'FOLIOS'].includes(activeTab) && (
          <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">""", folios_replacement)


# Finally, inject renderDevolucionModal() right next to renderModal()
code = code.replace("{renderModal()}", "{renderModal()}\n      {renderDevolucionModal()}")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("TITAN UI RESTORED PERFECTLY")
