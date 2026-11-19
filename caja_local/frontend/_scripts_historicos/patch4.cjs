const fs = require('fs');
let file = fs.readFileSync('src/pages/PosTerminal.tsx', 'utf8');

if (!file.includes('const [isProcessing, setIsProcessing] = useState(false);')) {
  file = file.replace('const [showClientModal, setShowClientModal] = useState(false);', 'const [showClientModal, setShowClientModal] = useState(false);\n  const [isProcessing, setIsProcessing] = useState(false);\n  const [processMsg, setProcessMsg] = useState("");');
}

const newCobrar = "const handleCobrar = async () => {\n" +
"    if (cart.length === 0) return;\n" +
"    \n" +
"    if (paymentMethod === 'TARJETA' || paymentMethod === 'MERCADO PAGO') {\n" +
"      setIsProcessing(true);\n" +
"      setProcessMsg(paymentMethod === 'MERCADO PAGO' ? 'Conectando con Terminal Mercado Pago Point...' : 'Enviando cobro a Terminal Bancaria...');\n" +
"      await new Promise(resolve => setTimeout(resolve, 2500));\n" +
"      setIsProcessing(false);\n" +
"    }\n" +
"\n" +
"    const success = await processSale(paymentMethod, client.name);\n" +
"    if (success) {\n" +
"      setLastTicket({\n" +
"        total,\n" +
"        cart,\n" +
"        date: new Date().toLocaleString(),\n" +
"        paymentMethod\n" +
"      });\n" +
"      setShowTicketModal(true);\n" +
"      setMontoRecibido('');\n" +
"      setPaymentMethod('EFECTIVO');\n" +
"    }\n" +
"  };";

file = file.replace(/const handleCobrar = async \(\) => \{[\s\S]*?\n  \};\n/m, newCobrar + '\n\n');

const processingModal = "\n      {/* PROCESSING MODAL */}\n" +
"      {isProcessing && (\n" +
"        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md\">\n" +
"          <div className=\"bg-nexus-900 border border-blue-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col items-center animate-in fade-in zoom-in duration-200\">\n" +
"            <div className=\"w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4\"></div>\n" +
"            <h3 className=\"text-xl font-black text-white tracking-widest text-center\">{processMsg}</h3>\n" +
"            <p className=\"text-slate-400 mt-2 font-bold\">Por favor, pide al cliente que inserte o deslice su tarjeta.</p>\n" +
"          </div>\n" +
"        </div>\n" +
"      )}\n";

if (!file.includes('PROCESSING MODAL')) {
  file = file.replace('{/* MODAL VENTA FINALIZADA (TICKET) */}', processingModal + '\n      {/* MODAL VENTA FINALIZADA (TICKET) */}');
}

file = file.replace('placeholder="Escanea cdigo (Ej: 7501055310227)"', 'placeholder="Escanear o buscar (Ej: Coca, 7501...)"');
file = file.replace('placeholder="Escanea código (Ej: 7501055310227)"', 'placeholder="Escanear o buscar (Ej: Coca, 7501...)"');

fs.writeFileSync('src/pages/PosTerminal.tsx', file);
console.log('Success POS');
