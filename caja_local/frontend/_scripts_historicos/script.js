const fs = require('fs');
let file = fs.readFileSync('src/pages/PosTerminal.tsx', 'utf8');

const scanReplacement = \
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handlePaymentClick = (met: string) => {
    if ((met === 'MONEDERO' || met === 'CRÉDITO') && client.name === 'PUBLICO GENERAL') {
      alert('Para pagar con ' + met + ' debes seleccionar un cliente primero.');
      setShowClientModal(true);
    } else {
      setPaymentMethod(met);
    }
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const q = scanInput.trim().toLowerCase();
      
      // 1. Búsqueda exacta por SKU
      let matches = await db.products.filter(p => p.sku.toLowerCase() === q).toArray();
      
      // 2. Si no hay SKU exacto, búsqueda múltiple (Nombre, Categoría, SKU parcial)
      if (matches.length === 0) {
        matches = await db.products.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.sku.toLowerCase().includes(q) || 
          (p.category && p.category.toLowerCase().includes(q))
        ).toArray();
      }

      if (matches.length === 1) {
        addToCart(matches[0]);
        setScanInput('');
      } else if (matches.length > 1) {
        setSearchResults(matches);
        setShowSearchModal(true);
      } else {
        alert('Producto no encontrado: ' + scanInput);
      }
    }
  };
\;

file = file.replace(/const handleScan = async \([^\}]+\};/s, scanReplacement);

const keyboardReplacement = \
  // Atajos de teclado (F12 para cobrar, Enter para finalizar ticket, F6-F11 Pagos)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      }
      if (e.key === 'F6') { e.preventDefault(); handlePaymentClick('EFECTIVO'); }
      if (e.key === 'F7') { e.preventDefault(); handlePaymentClick('TARJETA'); }
      if (e.key === 'F8') { e.preventDefault(); handlePaymentClick('TRANSFERENCIA'); }
      if (e.key === 'F9') { e.preventDefault(); handlePaymentClick('CRÉDITO'); }
      if (e.key === 'F10') { e.preventDefault(); handlePaymentClick('MERCADO PAGO'); }
      if (e.key === 'F11') { e.preventDefault(); handlePaymentClick('MONEDERO'); }
      if (e.key === 'F12') {
        e.preventDefault();
        handleCobrar();
      }
      if (e.key === 'Enter' && showTicketModal) {
        e.preventDefault();
        setShowTicketModal(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, paymentMethod, client.name, showTicketModal]);
\;

file = file.replace(/\/\/ Atajos de teclado.*?, \[cart, paymentMethod, client\.name, showTicketModal\]\);/s, keyboardReplacement);

const searchModalCode = \
      {/* SEARCH RESULTS MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-[600px] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col p-6 max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-black text-white tracking-widest">RESULTADOS DE BÚSQUEDA</h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-nexus-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar space-y-2">
              {searchResults.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    addToCart(p);
                    setScanInput('');
                    setShowSearchModal(false);
                  }}
                  className="p-4 bg-[#0b1120] hover:bg-emerald-600/20 border border-nexus-800 hover:border-emerald-500 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">SKU: {p.sku} | CAT: {p.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase">Precio</div>
                    <div className="font-black text-emerald-400">$\</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
\;

file = file.replace(/\{\/\* CLIENT SEARCH MODAL \*\/\}/, searchModalCode + '\n      {/* CLIENT SEARCH MODAL */}');

fs.writeFileSync('src/pages/PosTerminal.tsx', file);
console.log('Successfully patched PosTerminal.tsx with search and shortcuts');
