const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Fix syntax error (multiple style attributes)
posCode = posCode.replace(/style=\{\{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast\(200%\) grayscale\(100%\)" \}\}\s*style=\{\{fontWeight: 900\}\}/g, 'style={{ color: "#000000", fontWeight: "900", textShadow: "0px 0px 1px #000", filter: "contrast(200%) grayscale(100%)" }}');

// Completely rewrite printTicket to print using a popup window
const printCode = `
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

// It might be an async function currently generating a PDF. Let's find it.
posCode = posCode.replace(/const printTicket = async \(\) => \{[\s\S]*?alert\('Error al guardar el PDF: ' \+ e\.message\);\s*\}\s*\};/m, printCode.trim());

// Also replace the other variant just in case
posCode = posCode.replace(/const printTicket = async \(\) => \{[\s\S]*?console\.error\("Error generando PDF:", e\);\s*\}\s*\};/m, printCode.trim());

// And replace the buttons text
posCode = posCode.replace(/<button onClick=\{printTicket\}.*?>[\s\S]*?IMPRIMIR \/ PDF[\s\S]*?<\/button>/m, `<button onClick={printTicket} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2"> <Printer className="w-4 h-4" /> IMPRIMIR (TÉRMICA) </button>`);

fs.writeFileSync(posPath, posCode);
console.log('Fixed syntax and print logic.');
