const fs = require('fs');

function patchPosTerminal() {
  const file = 'caja_local/frontend/src/pages/PosTerminal.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add imports if not present
  if (!content.includes('import html2canvas')) {
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport html2canvas from 'html2canvas';\nimport { jsPDF } from 'jspdf';");
  }

  // Replace sendWhatsapp
  const sendWaRegex = /const sendWhatsapp = \(\) => \{[\s\S]*?setTimeout\(\(\) => \{\s*printTicket\(\);\s*\}, 300\);\s*\};/;
  
  const newSendWa = `const sendWhatsapp = async () => {
    if (!lastTicket) return;
    let phone = window.prompt('Número de WhatsApp del cliente (10 dígitos):', '') || '';
    phone = phone.replace(/\\D/g, '');
    if (phone.length < 10) { alert('Número de WhatsApp inválido. Debe tener 10 dígitos.'); return; }

    const el = document.getElementById('ticket-print');
    if (el) {
      try {
        const canvas = await html2canvas(el, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, canvas.height * (58 / canvas.width)] });
        pdf.addImage(imgData, 'PNG', 0, 0, 58, canvas.height * (58 / canvas.width));
        
        let savedPath = '';
        if ((window as any).require) {
          const fsLib = (window as any).require('fs');
          const pathLib = (window as any).require('path');
          const osLib = (window as any).require('os');
          const desktopPath = pathLib.join(osLib.homedir(), 'Desktop');
          const fileName = \`Ticket_\${lastTicket.folio}.pdf\`;
          savedPath = pathLib.join(desktopPath, fileName);
          const pdfBuffer = pdf.output('arraybuffer');
          fsLib.writeFileSync(savedPath, Buffer.from(pdfBuffer));
          alert(\`El PDF se ha guardado en tu Escritorio como: \${fileName}\\n\\nPor favor, adjúntalo en el chat de WhatsApp.\`);
        } else {
          pdf.save(\`Ticket_\${lastTicket.folio}.pdf\`);
          alert('El PDF se ha descargado. Por favor, adjúntalo en el chat de WhatsApp.');
        }
      } catch (e) {
        console.error("Error generando PDF:", e);
      }
    }

    const msg = \`🧾 *TICKET DE COMPRA* 🧾\\n📌 *FOLIO:* #\${lastTicket.folio}\\n💵 *TOTAL: $\${lastTicket.total.toFixed(2)} MXN*\\n\\nTe adjunto tu ticket en formato PDF. ¡Gracias por tu compra!\`;
    const waUrl = \`https://wa.me/52\${phone.slice(-10)}?text=\${encodeURIComponent(msg)}\`;
    try {
      if ((window as any).require) {
        const { shell } = (window as any).require('electron');
        if (shell && shell.openExternal) shell.openExternal(waUrl);
        else window.open(waUrl, '_blank');
      } else {
        window.open(waUrl, '_blank');
      }
    } catch(e) {
      window.open(waUrl, '_blank');
    }
  };`;

  content = content.replace(sendWaRegex, newSendWa);
  fs.writeFileSync(file, content, 'utf8');
}

function patchReports() {
  const file = 'caja_local/frontend/src/pages/Reports.tsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('import html2canvas')) {
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\nimport html2canvas from 'html2canvas';\nimport { jsPDF } from 'jspdf';");
  }

  // Find sendTicketWhatsapp
  const sendWaRegex = /const sendTicketWhatsapp = \(ticket: any\) => \{[\s\S]*?setTimeout\(\(\) => \{\s*reimprimirTicket\(ticket\);\s*\}, 300\);\s*\};/;
  
  const newSendWa = `const sendTicketWhatsapp = async (ticket: any) => {
    let phone = window.prompt('Número de WhatsApp del cliente (10 dígitos):', '') || '';
    phone = phone.replace(/\\D/g, '');
    if (phone.length < 10) return alert('Número de WhatsApp inválido');

    const folioStr = String(ticket.folio || ticket.id || '').replace(/\\D/g, '') || '000001';
    
    // Generar un div temporal invisible para el PDF
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = getTicketHtmlString(ticket);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const el = tempDiv.querySelector('#ticket-print-temp') as HTMLElement;
      if (el) {
        const canvas = await html2canvas(el, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [58, canvas.height * (58 / canvas.width)] });
        pdf.addImage(imgData, 'PNG', 0, 0, 58, canvas.height * (58 / canvas.width));
        
        let savedPath = '';
        if ((window as any).require) {
          const fsLib = (window as any).require('fs');
          const pathLib = (window as any).require('path');
          const osLib = (window as any).require('os');
          const desktopPath = pathLib.join(osLib.homedir(), 'Desktop');
          const fileName = \`Ticket_\${folioStr}.pdf\`;
          savedPath = pathLib.join(desktopPath, fileName);
          const pdfBuffer = pdf.output('arraybuffer');
          fsLib.writeFileSync(savedPath, Buffer.from(pdfBuffer));
          alert(\`El PDF se ha guardado en tu Escritorio como: \${fileName}\\n\\nPor favor, adjúntalo en el chat de WhatsApp.\`);
        } else {
          pdf.save(\`Ticket_\${folioStr}.pdf\`);
          alert('El PDF se ha descargado. Por favor, adjúntalo en el chat de WhatsApp.');
        }
      }
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      document.body.removeChild(tempDiv);
    }

    const msg = \`🧾 *TICKET DE COMPRA (REIMPRESIÓN)* 🧾\\n📌 *FOLIO:* #\${folioStr}\\n💵 *TOTAL: $\${(ticket.total || 0).toFixed(2)} MXN*\\n\\nTe adjunto tu ticket en formato PDF.\`;
    const waUrl = \`https://wa.me/52\${phone.slice(-10)}?text=\${encodeURIComponent(msg)}\`;
    try {
      if ((window as any).require) {
        const { shell } = (window as any).require('electron');
        if (shell && shell.openExternal) shell.openExternal(waUrl);
        else window.open(waUrl, '_blank');
      } else {
        window.open(waUrl, '_blank');
      }
    } catch(e) {
      window.open(waUrl, '_blank');
    }
  };`;

  content = content.replace(sendWaRegex, newSendWa);

  // We need to implement getTicketHtmlString for Reports
  if (!content.includes('getTicketHtmlString')) {
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
    content = content.replace('const reimprimirTicket = (ticket: any) => {', helperFunction + '\n  const reimprimirTicket = (ticket: any) => {');
  }

  // FIX THE PRINT ISSUE: remove window.close() inside reimprimirTicket so it doesn't close before print dialog
  content = content.replace('window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };', 'window.onload = function() { window.print(); };');

  fs.writeFileSync(file, content, 'utf8');
}

patchPosTerminal();
patchReports();
console.log('Patched correctly');
