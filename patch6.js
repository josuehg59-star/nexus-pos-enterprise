const fs = require('fs');

const missingFunctions = `
  const handlePaymentClick = (method: string) => {
    setPaymentMethod(method);
  };

  const handleCobrar = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    const methodToUse = paymentMethod;

    if (methodToUse === 'MERCADO PAGO') {
      await triggerMercadoPagoPayment();
    } else {
      setIsProcessing(true);
      setProcessMsg('Procesando pago con ' + methodToUse + '...');
    }
  };

  const finalizeSaleWithMethod = async (methodToUse: string) => {
    let parsedRecibido = parseFloat(montoRecibido);
    let validRecibido = methodToUse === 'EFECTIVO' && !isNaN(parsedRecibido) && parsedRecibido > 0 ? parsedRecibido : undefined;
    
    if (methodToUse === 'EFECTIVO' && montoRecibido !== '' && (parseFloat(montoRecibido) || 0) < total) {
      alert('El monto recibido ($' + (parseFloat(montoRecibido) || 0).toFixed(2) + ') es menor al total ($' + total.toFixed(2) + ').');
      setIsProcessing(false);
      return;
    }

    const { processSale, lastError } = usePosStore.getState();
    const ticket = await processSale(methodToUse, client.name, validRecibido);
    
    if (ticket) {
      setLastTicket(ticket);
      setIsProcessing(false);
      setShowTicketModal(true);
      setMontoRecibido('');
      setPaymentMethod('EFECTIVO');
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    } else {
      setIsProcessing(false);
      alert('Error al procesar la venta: ' + lastError);
    }
  };

  const printTicket = () => {
    const el = document.getElementById('ticket-print');
    if (!el) return;
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return alert('Permite ventanas emergentes para imprimir el ticket.');
    w.document.write('<html><head><title>Ticket</title></head><body>');
    w.document.write(el.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const sendWhatsapp = async () => {
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
          fsLib.writeFileSync(savedPath, new Uint8Array(pdfBuffer));
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
  };

`;

const posFile = 'caja_local/frontend/src/pages/PosTerminal.tsx';
let posContent = fs.readFileSync(posFile, 'utf8');

posContent = posContent.replace('  const handlePausar = () => {', missingFunctions + '  const handlePausar = () => {');

fs.writeFileSync(posFile, posContent);
console.log('Functions restored!');
