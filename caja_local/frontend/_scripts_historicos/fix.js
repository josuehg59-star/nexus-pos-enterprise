const fs = require('fs');

// --- 1. PosTerminal.tsx ---
let posFile = fs.readFileSync('src/pages/PosTerminal.tsx', 'utf8');

const newPosScan = \const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const q = scanInput.trim().toLowerCase();
      // 1. Busqueda por SKU exacto
      let p = await db.products.where('sku').equals(scanInput.trim()).first();
      // 2. Busqueda múltiple
      if (!p) {
        const matches = await db.products.filter(prod => 
          prod.sku.toLowerCase().includes(q) || 
          prod.name.toLowerCase().includes(q) || 
          (prod.category && prod.category.toLowerCase().includes(q))
        ).toArray();
        if (matches.length > 0) p = matches[0]; // tomar el primero por simplicidad
      }

      if (p) {
        addToCart(p);
      } else {
        alert('Producto no encontrado: ' + scanInput);
      }
      setScanInput('');
    }
  };\;

posFile = posFile.replace(/const handleScan = async.*?setScanInput\(''\);\n      }\n    };/s, newPosScan);

const newPosKeys = \useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F6') { e.preventDefault(); setPaymentMethod('EFECTIVO'); }
      if (e.key === 'F7') { e.preventDefault(); setPaymentMethod('TARJETA'); }
      if (e.key === 'F8') { e.preventDefault(); setPaymentMethod('TRANSFERENCIA'); }
      if (e.key === 'F9') { e.preventDefault(); setPaymentMethod('CRÉDITO'); }
      if (e.key === 'F10') { e.preventDefault(); setPaymentMethod('MERCADO PAGO'); }
      if (e.key === 'F11') { e.preventDefault(); setPaymentMethod('MONEDERO'); }
      if (e.key === 'F12') { e.preventDefault(); handleCobrar(); }
      if (e.key === 'Enter' && showTicketModal) { e.preventDefault(); setShowTicketModal(false); }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, paymentMethod, client.name, showTicketModal]);\;

posFile = posFile.replace(/useEffect\(\(\) => \{\n    const handleGlobalKeyDown =.*?\}, \[cart, paymentMethod, client\.name, showTicketModal\]\);/s, newPosKeys);

fs.writeFileSync('src/pages/PosTerminal.tsx', posFile);


// --- 2. Kardex.tsx ---
let kardexFile = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

const newKardexScan = \const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim() !== '') {
      const q = scanInput.trim().toLowerCase();
      let p = await db.products.where('sku').equals(scanInput.trim()).first();
      
      if (!p) {
        const matches = await db.products.filter(prod => 
          prod.sku.toLowerCase().includes(q) || 
          prod.name.toLowerCase().includes(q) || 
          (prod.category && prod.category.toLowerCase().includes(q))
        ).toArray();
        if (matches.length > 0) p = matches[0];
      }

      if (p) {
        setEntradas(prev => {
          const existing = prev.find(i => i.id === p.id);
          if (existing) {
            return prev.map(i => i.id === p.id ? { ...i, entradaQty: i.entradaQty + 1 } : i);
          }
          return [...prev, { ...p, entradaQty: 1 }];
        });
      } else {
        alert('Producto no encontrado: ' + scanInput);
      }
      setScanInput('');
    }
  };\;

kardexFile = kardexFile.replace(/const handleScan = async.*?setScanInput\(''\);\n      }\n    };/s, newKardexScan);
fs.writeFileSync('src/pages/Kardex.tsx', kardexFile);


// --- 3. Auditoria.tsx ---
let audFile = fs.readFileSync('src/pages/Auditoria.tsx', 'utf8');
// En mi fix anterior de TS removí setIsAuditing del array porque "no se usaba". Necesito restaurarlo.
audFile = audFile.replace(/const \[, setIsAuditing\] = useState\(false\);/, "const [isAuditing, setIsAuditing] = useState(false);");
// En el input de conteos añadir disabled={!isAuditing}
audFile = audFile.replace(/<input \n                            type="number"/, "<input \n                            type=\"number\" \n                            disabled={!isAuditing}");
// En el Trash icon añadir onClick para borrar
audFile = audFile.replace(/<button className="p-2 bg-red-900\/10 text-red-500 hover:bg-red-900\/30 border border-red-900\/30 rounded-lg transition-colors">/, "<button onClick={() => clearConteo(item.id!)} className=\"p-2 bg-red-900/10 text-red-500 hover:bg-red-900/30 border border-red-900/30 rounded-lg transition-colors\">");

fs.writeFileSync('src/pages/Auditoria.tsx', audFile);


// --- 4. Inventory.tsx ---
let invFile = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');
// Tienen botones de Edit y Delete vacíos
invFile = invFile.replace(/<button className="p-2 bg-blue-900\/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">/, "<button onClick={() => { setEditId(item.id!); setFormData(item); setShowModal(true); }} className=\"p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors\">");
invFile = invFile.replace(/<button className="p-2 bg-red-900\/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors">/, "<button onClick={() => handleDelete(item.id!)} className=\"p-2 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors\">");
fs.writeFileSync('src/pages/Inventory.tsx', invFile);

console.log('ALL FIXES APPLIED');
