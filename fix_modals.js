const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// 1. Rewrite printTicket to do thermal printing
const newPrintTicket = `
  const printTicket = () => {
    const el = document.getElementById('ticket-print');
    if (!el) return;
    const w = window.open('', '_blank', 'width=350,height=600');
    if (!w) return alert('Permite ventanas emergentes para imprimir el ticket.');
    
    let styles = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
      styles += node.outerHTML;
    });

    w.document.write('<html><head><title>Ticket</title>' + styles + '</head><body style="margin:0; padding:0; background:white; display:flex; justify-content:center;">');
    w.document.write(el.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    
    w.focus();
    setTimeout(() => { 
      w.print(); 
      w.close();
    }, 500);
  };
`;

// It currently matches this block:
/*
  const printTicket = async () => {
    const el = document.getElementById('ticket-print');
...
      console.error("Error generando PDF:", e);
      alert('Error generando PDF');
    }
  };
*/
posCode = posCode.replace(/const printTicket = async \(\) => \{[\s\S]*?alert\('Error generando PDF'\);\s*\}\s*\};/m, newPrintTicket.trim());

// 2. Add showWaModal rendering code right before CLIENT SEARCH MODAL
const waModalCode = `
      {/* WHATSAPP MODAL */}
      {showWaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="bg-[#0b1120] border border-emerald-900/50 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-emerald-400 font-black text-lg mb-4 text-center">ENVIAR TICKET POR WHATSAPP</h3>
            <p className="text-slate-400 text-xs mb-4 text-center">Se guardará un PDF en el escritorio y se abrirá WhatsApp Web para que lo envíes.</p>
            <input type="text" placeholder="Número de WhatsApp (10 dígitos)" value={waPhone} onChange={e => setWaPhone(e.target.value)} className="w-full bg-[#0b1120] border border-emerald-900/50 text-white px-4 py-3 rounded-xl mb-4 font-mono text-center outline-none focus:border-emerald-500" />
            <div className="flex gap-2">
              <button onClick={confirmSendWhatsapp} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-600/20">ENVIAR</button>
              <button onClick={() => setShowWaModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT SEARCH MODAL */}
`;

posCode = posCode.replace(/\{\/\*\s*CLIENT SEARCH MODAL\s*\*\/\}/, waModalCode.trim());

// 3. Rename buttons (they might have already been renamed, but just in case)
posCode = posCode.replace(/<button onClick=\{printTicket\}[\s\S]*?<\/button>/m, `<button onClick={printTicket} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2"> <Printer className="w-4 h-4" /> IMPRIMIR (TÉRMICA) </button>`);

posCode = posCode.replace(/<button onClick=\{sendWhatsapp\}[\s\S]*?<\/button>/m, `<button onClick={sendWhatsapp} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-xs uppercase flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"> <Smartphone className="w-4 h-4" /> PDF / WHATSAPP </button>`);

fs.writeFileSync(posPath, posCode);
console.log('Fixed WhatsApp modal and print logic.');
