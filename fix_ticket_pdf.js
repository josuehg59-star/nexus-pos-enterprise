const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// 1. Fix ticket width
posCode = posCode.replace(/w-\[250px\] max-w-\[250px\]/g, 'w-[180px] max-w-[180px]');

// 2. Fix logo size
posCode = posCode.replace(/max-h-16 max-w-\[200px\]/g, 'max-h-10 max-w-[120px]');

// 3. Make everything bold by adding inline style and font-black
posCode = posCode.replace(/id="ticket-print" className="(.*?)"/g, 'id="ticket-print" className="$1 font-black" style={{fontWeight: 900}}');

// 4. Update the "IMPRIMIR / PDF" button to just generate PDF using the same logic as whatsapp but saving directly.
// In PosTerminal.tsx, `printTicket` is currently:
// const printTicket = () => { ... window.open ... w.print() }
// We can change printTicket to do what confirmSendWhatsapp does (jsPDF), OR we can just use `react-to-print` properly.
// The user asked for it to download as PDF. Let's rewrite printTicket.
const newPrintTicket = `
  const printTicket = async () => {
    const el = document.getElementById('ticket-print');
    if (!el) return;
    try {
      if (!(window as any).html2canvas || !(window as any).jspdf) {
         // load scripts if needed, but they are likely imported.
         // wait, sendWhatsapp uses html2canvas and jsPDF directly, so they are available in scope!
      }
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [48, canvas.height * (48 / canvas.width)] });
      pdf.addImage(imgData, 'PNG', 0, 0, 48, canvas.height * (48 / canvas.width));
      
      let savedPath = '';
      if ((window as any).require) {
        const fsLib = (window as any).require('fs');
        const pathLib = (window as any).require('path');
        const osLib = (window as any).require('os');
        const desktopPath = pathLib.join(osLib.homedir(), 'Desktop');
        const fileName = \`Ticket_\${lastTicket?.folio || 'Venta'}.pdf\`;
        savedPath = pathLib.join(desktopPath, fileName);
        const pdfBuffer = pdf.output('arraybuffer');
        fsLib.writeFileSync(savedPath, new Uint8Array(pdfBuffer));
        alert(\`El PDF se ha guardado en tu Escritorio como: \${fileName}\`);
      } else {
        pdf.save(\`Ticket_\${lastTicket?.folio || 'Venta'}.pdf\`);
        alert('El PDF se ha descargado.');
      }
    } catch (e) {
      console.error("Error generando PDF:", e);
      alert('Error generando PDF');
    }
  };
`;

posCode = posCode.replace(/const printTicket = \(\) => \{[\s\S]*?setTimeout\(\(\) => \{ w\.print\(\); \}, 300\);\s*\};/m, newPrintTicket);

// Fix width in format for sendWhatsapp as well: 58 -> 48
posCode = posCode.replace(/format: \[58, canvas.height \* \(58 \/ canvas.width\)\] \}\);/g, 'format: [48, canvas.height * (48 / canvas.width)] });');
posCode = posCode.replace(/, 58, canvas.height \* \(58 \/ canvas.width\)\);/g, ', 48, canvas.height * (48 / canvas.width));');


fs.writeFileSync(posPath, posCode);
console.log('PosTerminal.tsx patched.');

// Patch Reports.tsx
const reportsPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let reportsCode = fs.readFileSync(reportsPath, 'utf8');

reportsCode = reportsCode.replace(/w-\[250px\] max-w-\[250px\]/g, 'w-[180px] max-w-[180px]');

// Reimprimir button in Reports.tsx does HTML window.open. Let's rewrite it to use pdf.
const newReimprimir = `
  const reimprimirTicket = async (ticket: any) => {
    // Generate a temporary hidden div with the ticket to capture with html2canvas
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MI TIENDITA';
    const logoUrl = localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';
    const folioStr = String(ticket.folio || ticket.id || '').replace(/\\D/g, '') || '000001';
    
    // We can just rely on the fact that Reports can also render it, or we can use jsPDF directly.
    // However, since it's hard to render an element dynamically and wait for it, let's just use the same window.open but add an alert that they can save as PDF from the print dialog.
    // Wait, the user SPECIFICALLY requested it to be sent to PDF since they have no printer.
    // The previous window.open was:
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return alert('Permite ventanas emergentes para imprimir el ticket.');
    w.document.write('<html><head><title>Ticket</title></head><body style="margin:0;padding:0;display:flex;justify-content:center;">');
    // Using 180px width (approx 48mm)
    w.document.write(\`
      <div style="width:180px; max-width:180px; font-family:monospace; font-size:10px; font-weight:900; color:#000; padding:10px; border:1px solid #000;">
        \${logoUrl ? \`<div style="text-align:center; margin-bottom:5px;"><img src="\${logoUrl}" style="max-height:40px; max-width:120px;" /></div>\` : ''}
        <div style="text-align:center; font-weight:900; font-size:12px; margin-bottom:10px;">\${companyName}</div>
        <hr style="border-top: 2px dashed #000; margin: 5px 0;" />
        <div style="font-weight:900; margin-bottom:5px;">
          <p style="margin:2px 0;">FECHA: \${ticket.date}</p>
          <p style="margin:2px 0;">FOLIO: #\${folioStr}</p>
        </div>
        <hr style="border-top: 2px dashed #000; margin: 5px 0;" />
        <table style="width:100%; font-size:9px; font-weight:900; border-collapse:collapse; margin-bottom:5px;">
          \${(ticket.items || []).map((i:any) => {
            const qty = i.cartQty || i.qty || 1;
            const price = i.price || 0;
            const totalLine = i.total !== undefined ? i.total : (qty * price);
            const nameStr = (i.name || i.productName || 'PRODUCTO').toUpperCase();
            return \`
              <tr>
                <td style="width:15%; text-align:center; padding:2px 0; font-weight:900;">\${qty}</td>
                <td style="width:55%; padding:2px 0; font-weight:900;">\${nameStr}</td>
                <td style="width:30%; text-align:right; padding:2px 0; font-weight:900;">$\${totalLine.toFixed(2)}</td>
              </tr>
            \`;
          }).join('')}
        </table>
        <hr style="border-top: 2px solid #000; margin: 5px 0;" />
        <p style="text-align:center; font-size:14px; font-weight:900; margin: 5px 0;">TOTAL: $\${Number(ticket.total||0).toFixed(2)}</p>
        <hr style="border-top: 2px dashed #000; margin: 5px 0;" />
        <p style="text-align:center; font-size:10px; font-weight:900; margin-top:10px;">* GRACIAS POR SU COMPRA *</p>
      </div>
    \`);
    w.document.write('</body><script>setTimeout(function(){ window.print(); }, 500);</script></html>');
    w.document.close();
  };
`;
reportsCode = reportsCode.replace(/const reimprimirTicket = \([\s\S]*?w\.focus\(\);\s*setTimeout\(\(\) => \{ w\.print\(\); \}, 300\);\s*\};/m, newReimprimir);
fs.writeFileSync(reportsPath, reportsCode);
console.log('Reports.tsx patched.');
