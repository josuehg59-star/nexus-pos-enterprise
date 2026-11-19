import re

with open('src/pages/PosTerminal.tsx', encoding='utf-8') as f:
    content = f.read()

# Add states for multi-search
state_logic = """
  const [multiSearchMatches, setMultiSearchMatches] = useState<any[]>([]);
  const [showMultiSearch, setShowMultiSearch] = useState(false);
"""

content = content.replace("  const [showTicketModal, setShowTicketModal] = useState(false);", "  const [showTicketModal, setShowTicketModal] = useState(false);\n" + state_logic)

# Replace handleScan
scan_logic = """
  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const q = scanInput.trim().toLowerCase();
      
      // Búsqueda estricta primero por SKU exacto
      let p = await db.products.where('sku').equals(scanInput.trim()).first();
      
      if (p) {
        addToCart(p);
        setScanInput('');
      } else {
        // Búsqueda múltiple si no hay sku exacto
        const matches = await db.products.filter(prod => 
          prod.sku.toLowerCase().includes(q) || 
          prod.name.toLowerCase().includes(q) || 
          ((prod as any).category && String((prod as any).category).toLowerCase().includes(q))
        ).toArray();
        
        if (matches.length === 1) {
          addToCart(matches[0]);
          setScanInput('');
        } else if (matches.length > 1) {
          // Mostrar modal de multi-búsqueda
          setMultiSearchMatches(matches);
          setShowMultiSearch(true);
        } else {
          alert('Producto no encontrado: ' + scanInput);
          setScanInput('');
        }
      }
    }
  };

  const handleSelectMultiSearch = (p: any) => {
    addToCart(p);
    setShowMultiSearch(false);
    setMultiSearchMatches([]);
    setScanInput('');
  };
"""

content = re.sub(
    r'  const handleScan = async .*?\n  };\n',
    scan_logic,
    content,
    flags=re.DOTALL
)

# Add MultiSearch Modal to the JSX
modal_jsx = """
      {/* MODAL MULTI BUSQUEDA */}
      {showMultiSearch && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl w-[800px] shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-nexus-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-white">BÚSQUEDA MÚLTIPLE</h3>
                <p className="text-slate-400 text-sm">Se encontraron {multiSearchMatches.length} resultados para "{scanInput}"</p>
              </div>
              <button onClick={() => { setShowMultiSearch(false); setScanInput(''); }} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-nexus-900 border-b border-nexus-800 sticky top-0">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase">SKU</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase">DESCRIPCIÓN</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">PRECIO</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">STOCK</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-center">ACCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-800/50">
                  {multiSearchMatches.map((m, idx) => (
                    <tr key={idx} className="hover:bg-nexus-800/50 transition-colors">
                      <td className="p-4 text-xs font-bold text-slate-300">{m.sku}</td>
                      <td className="p-4 text-xs font-black text-white">{m.name}</td>
                      <td className="p-4 text-center text-emerald-400 font-bold">${m.price.toFixed(2)}</td>
                      <td className="p-4 text-center text-blue-400 font-bold">{m.stock}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleSelectMultiSearch(m)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black">
                          SELECCIONAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
"""

# Insert modal right before the last closing div
content = content.replace("    </div>\n  );\n}\n", modal_jsx + "    </div>\n  );\n}\n")

# Import X from lucide-react if not present
if 'X,' not in content and '{ X' not in content:
    content = content.replace("Search, ", "Search, X, ")

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Multi search added to PosTerminal')
