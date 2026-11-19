const fs = require('fs');
const path = require('path');

const posPath = path.join(__dirname, 'caja_local/frontend/src/pages/PosTerminal.tsx');
let posCode = fs.readFileSync(posPath, 'utf8');

// Replace the current printTicket function
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
    }, 500);
  };
`;

posCode = posCode.replace(/const printTicket = async \(\) => \{[\s\S]*?alert\('Error generando PDF'\);\s*\}\s*\};/m, newPrintTicket.trim());

// Also change Reports.tsx reimprimirTicket back to a robust print function instead of PDF, since they want to print directly to thermal
const reportsPath = path.join(__dirname, 'caja_local/frontend/src/pages/Reports.tsx');
let reportsCode = fs.readFileSync(reportsPath, 'utf8');

const newReimprimir = `
  const reimprimirTicket = (ticket: any) => {
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MI TIENDITA';
    const logoUrl = localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';
    const folioStr = String(ticket.folio || ticket.id || '').replace(/\\D/g, '') || '000001';
    
    const w = window.open('', '_blank', 'width=350,height=600');
    if (!w) return alert('Permite ventanas emergentes para imprimir el ticket.');
    
    w.document.write('<html><head><title>Ticket</title></head><body style="margin:0;padding:0;display:flex;justify-content:center;background:white;">');
    w.document.write(\`
      <div style="width:180px; max-width:180px; font-family:monospace; font-size:10px; font-weight:900; color:#000; padding:4px; border:1px solid #000;">
        \${logoUrl ? \`<div style="text-align:center; margin-bottom:4px;"><img src="\${logoUrl}" style="max-height:40px; max-width:120px;" /></div>\` : ''}
        <div style="text-align:center; font-weight:900; font-size:12px; margin-bottom:4px; text-transform:uppercase;">\${companyName}</div>
        <hr style="border-top: 2px dashed #000; margin: 4px 0;" />
        <div style="font-weight:900; margin-bottom:4px; line-height:1.2;">
          <p style="margin:0;">FECHA: \${ticket.date}</p>
          <p style="margin:0;">FOLIO: #\${folioStr}</p>
        </div>
        <hr style="border-top: 2px dashed #000; margin: 4px 0;" />
        <table style="width:100%; font-size:9px; font-weight:900; border-collapse:collapse; margin-bottom:4px;">
          \${(ticket.items || []).map((i:any) => {
            const qty = i.cartQty || i.qty || 1;
            const price = i.price || 0;
            const totalLine = i.total !== undefined ? i.total : (qty * price);
            const nameStr = (i.name || i.productName || 'PRODUCTO').toUpperCase();
            return \`
              <tr style="vertical-align:top;">
                <td style="width:15%; text-align:center; padding:1px 0; font-weight:900;">\${qty}</td>
                <td style="width:55%; padding:1px 0; font-weight:900; word-break:break-word;">\${nameStr}</td>
                <td style="width:30%; text-align:right; padding:1px 0; font-weight:900;">$\${totalLine.toFixed(2)}</td>
              </tr>
            \`;
          }).join('')}
        </table>
        <hr style="border-top: 2px solid #000; margin: 4px 0;" />
        <p style="text-align:center; font-size:14px; font-weight:900; margin: 4px 0;">TOTAL: $\${Number(ticket.total||0).toFixed(2)}</p>
        <hr style="border-top: 2px dashed #000; margin: 4px 0;" />
        <p style="text-align:center; font-size:10px; font-weight:900; margin-top:8px;">* GRACIAS POR SU COMPRA *</p>
      </div>
    \`);
    w.document.write('</body><script>setTimeout(function(){ window.print(); }, 300);</script></html>');
    w.document.close();
  };
`;

reportsCode = reportsCode.replace(/const reimprimirTicket = async \(ticket: any\) => \{[\s\S]*?w\.document\.close\(\);\s*\};/m, newReimprimir.trim());
fs.writeFileSync(reportsPath, reportsCode);
console.log('Fixed printing.');
