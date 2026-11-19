const fs = require('fs');
const reportsFile = 'caja_local/frontend/src/pages/Reports.tsx';
let reportsContent = fs.readFileSync(reportsFile, 'utf8');

const helperFunction = `
  const getTicketHtmlString = (ticket: any) => {
    const settings = useSettings.getState();
    const companyName = settings.nombreNegocio || 'MI TIENDITA';
    const slogan = settings.eslogan || '';
    const address = settings.direccion || '';
    const phone = settings.telefono || '';
    const rfcVal = settings.rfc || '';
    const logoUrl = localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';
    const folioStr = String(ticket.folio || ticket.id || '').replace(/\\D/g, '') || '000001';
    const dateObj = new Date(ticket.date);
    const dateStr = isNaN(dateObj.getTime()) ? String(ticket.date) : dateObj.toLocaleString('es-MX');

    const itemRows = (ticket.items || []).map((i: any) => {
      const qty = i.cartQty || i.qty || 1;
      const price = i.price || 0;
      const totalLine = i.total !== undefined ? i.total : (qty * price);
      return \`<div style="display:flex; justify-content:space-between; font-size:9px; font-weight:900; margin:2px 0;">
        <span style="width:12%; text-align:center;">\${qty}</span>
        <span style="width:58%; text-align:left;">\${(i.name || i.productName || '').toUpperCase()}</span>
        <span style="width:30%; text-align:right;">$\${totalLine.toFixed(2)}</span>
      </div>\`;
    }).join('');

    const recibido = ticket.recibido !== undefined ? ticket.recibido : ticket.total;
    const cambio = ticket.cambio !== undefined ? ticket.cambio : Math.max(0, recibido - ticket.total);

    return \`
      <div id="ticket-print-temp" style="width: 44mm; padding: 1mm; font-family: Arial, sans-serif; font-size: 9px; font-weight: 900; color: #000; background: #fff; word-break: break-word;">
        \${logoUrl ? \`<img src="\${logoUrl}" style="max-height:50px; max-width:140px; display:block; margin:0 auto 4px auto;" />\` : ''}
        <div style="text-align:center; font-weight:900; text-transform:uppercase;">
          <p style="margin:0; font-size:12px;">\${companyName}</p>
          \${slogan ? \`<p style="margin:0;">\${slogan}</p>\` : ''}
          \${address ? \`<p style="margin:0;">\${address}</p>\` : ''}
          \${phone ? \`<p style="margin:0;">TEL: \${phone}</p>\` : ''}
          \${rfcVal ? \`<p style="margin:0;">RFC: \${rfcVal}</p>\` : ''}
        </div>
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <div style="font-weight:900;">
          <p style="margin:0;">FECHA: \${dateStr}</p>
          <p style="margin:0;">FOLIO: #\${folioStr}</p>
          <p style="margin:0;">CLIENTE: \${(ticket.clientName || ticket.client || 'PUBLICO GENERAL').toUpperCase()}</p>
          <p style="margin:0;">MÉTODO: \${(ticket.paymentMethod || 'EFECTIVO').toUpperCase()}</p>
        </div>
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:9px;">
          <span style="width:12%; text-align:center;">CT</span>
          <span style="width:58%; text-align:left;">DESCRIPCIÓN</span>
          <span style="width:30%; text-align:right;">TOTAL</span>
        </div>
        <div style="border-top:2px solid #000; margin:2px 0;"></div>
        \${itemRows}
        <div style="border-top:2px solid #000; margin:2px 0;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
          <span>TOTAL:</span><span>$\${(ticket.total || 0).toFixed(2)}</span>
        </div>
        \${(ticket.paymentMethod || 'EFECTIVO').toUpperCase() === 'EFECTIVO' ? \`
          <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
            <span>RECIBIDO:</span><span>$\${recibido.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:900; margin:2px 0;">
            <span>CAMBIO:</span><span>$\${cambio.toFixed(2)}</span>
          </div>
        \` : ''}
        <hr style="border:0; border-top:1.5px dashed #000; margin:4px 0;" />
        <p style="text-align:center; font-weight:900; margin-top:4px;">* GRACIAS POR SU COMPRA *</p>
      </div>
    \`;
  };
`;
reportsContent = reportsContent.replace('const reimprimirTicket = (ticket: any) => {', helperFunction + '\n  const reimprimirTicket = (ticket: any) => {');
fs.writeFileSync(reportsFile, reportsContent);
