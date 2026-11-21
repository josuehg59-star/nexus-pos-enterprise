import { jsPDF } from 'jspdf';

export function generateDirectTicketPDF(ticket: any, customSettings?: any) {
  const settings = customSettings || {};
  const companyName = (settings.nombreNegocio || 'MI TIENDITA').toUpperCase();
  const slogan = (settings.eslogan || '').toUpperCase();
  const address = (settings.direccion || '').toUpperCase();
  const phone = settings.telefono || '';
  const rfcVal = (settings.rfc || '').toUpperCase();
  const folioStr = String(ticket.folio || ticket.id || '').replace(/\D/g, '') || '000001';
  const logoUrl = settings.logo || localStorage.getItem('ticketLogo') || (settings as any).ticketLogo || '';

  let dateStr = '';
  try {
    const d = new Date(ticket.date);
    dateStr = isNaN(d.getTime()) ? String(ticket.date || '') : d.toLocaleString('es-MX');
  } catch (e) {
    dateStr = String(ticket.date || '');
  }

  const items = ticket.items || ticket.cart || [];
  const clientName = (ticket.clientName || ticket.client || 'PUBLICO GENERAL').toUpperCase();
  const paymentMethod = (ticket.paymentMethod || 'EFECTIVO').toUpperCase();
  const cajaStr = (ticket.caja || settings.cajaNombre || 'CAJA 1 - PRINCIPAL').toUpperCase();
  const cajeroStr = (ticket.cajero || settings.activeUser?.name || 'ADMINISTRADOR').toUpperCase();

  // Ancho efectivo imprimible: 44mm (centrado en página de 58mm: x desde 4mm hasta 48mm)
  // Esto garantiza que en impresoras POS-58 de 32-35 columnas NADA salga cortado a la derecha
  const baseHeight = 115 + (logoUrl ? 18 : 0);
  const estimatedHeight = Math.max(130, baseHeight + items.length * 6.5);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, estimatedHeight]
  });

  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');

  let y = 6;
  const centerX = 29; // Centro exacto de página 58mm
  const leftX = 4;
  const rightX = 54;

  // 1. Logotipo si existe
  if (logoUrl && (logoUrl.startsWith('data:image') || logoUrl.startsWith('http') || logoUrl.startsWith('blob'))) {
    try {
      pdf.addImage(logoUrl, 'PNG', 17, y, 24, 13);
      y += 14.5;
    } catch (e) {
      console.warn('Detalle al renderizar logo en PDF:', e);
    }
  }

  // 2. Nombre del Negocio (máx 48mm de ancho, auto-wrap para que NUNCA se corte)
  pdf.setFontSize(8.5);
  const titleLines = pdf.splitTextToSize(companyName, 48);
  titleLines.forEach((line: string) => {
    pdf.text(line, centerX, y, { align: 'center' });
    y += 3.8;
  });

  // 3. Eslogan
  if (slogan) {
    pdf.setFontSize(7);
    const sloganLines = pdf.splitTextToSize(`"${slogan}"`, 48);
    sloganLines.forEach((line: string) => {
      pdf.text(line, centerX, y, { align: 'center' });
      y += 3.2;
    });
  }

  // 4. Dirección completa con salto automático
  if (address) {
    pdf.setFontSize(6.5);
    const addrLines = pdf.splitTextToSize(address, 48);
    addrLines.forEach((line: string) => {
      pdf.text(line, centerX, y, { align: 'center' });
      y += 3.2;
    });
  }

  // 5. Teléfono y RFC
  if (phone) {
    pdf.setFontSize(6.5);
    pdf.text(`TEL: ${phone}`, centerX, y, { align: 'center' });
    y += 3.2;
  }
  if (rfcVal) {
    pdf.setFontSize(6.5);
    pdf.text(`RFC: ${rfcVal}`, centerX, y, { align: 'center' });
    y += 3.2;
  }

  // Línea divisoria
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(leftX, y, rightX, y);
  y += 3.5;

  // 6. Datos del Ticket
  pdf.setFontSize(6.5);
  pdf.text(`FECHA: ${dateStr}`, leftX, y); y += 3.2;
  pdf.text(`FOLIO: #${folioStr}`, leftX, y); y += 3.2;
  pdf.text(`CAJA: ${cajaStr}`, leftX, y); y += 3.2;
  pdf.text(`CAJERO: ${cajeroStr}`, leftX, y); y += 3.2;
  
  const clientLines = pdf.splitTextToSize(`CLIENTE: ${clientName}`, 48);
  clientLines.forEach((cl: string) => {
    pdf.text(cl, leftX, y);
    y += 3.2;
  });
  
  pdf.text(`METODO: ${paymentMethod}`, leftX, y); y += 3.2;

  // 7. Encabezado de la tabla de productos (CT | DESCRIPCION | TOTAL)
  pdf.line(leftX, y, rightX, y);
  y += 3;
  pdf.setFontSize(6.5);
  pdf.text('CT', leftX, y);
  pdf.text('DESCRIPCION', leftX + 6, y);
  pdf.text('TOTAL', rightX, y, { align: 'right' });
  y += 2;
  pdf.setLineDashPattern([], 0);
  pdf.line(leftX, y, rightX, y);
  y += 3.5;

  // 8. Lista de Productos
  items.forEach((it: any) => {
    const qty = it.cartQty || it.qty || 1;
    const price = it.price || 0;
    const totalLine = it.total !== undefined ? it.total : (qty * price);
    const rawName = (it.name || it.productName || 'PRODUCTO').toUpperCase();
    const shortName = rawName.length > 21 ? rawName.substring(0, 20) + '..' : rawName;

    pdf.setFontSize(6.5);
    pdf.text(`${qty}`, leftX, y);
    pdf.text(shortName, leftX + 6, y);
    pdf.text(`$${totalLine.toFixed(2)}`, rightX, y, { align: 'right' });
    y += 3.2;

    if (qty > 1) {
      pdf.setFontSize(5.5);
      pdf.text(`(${qty} x $${price.toFixed(2)})`, leftX + 6, y);
      y += 2.8;
    }
  });

  pdf.line(leftX, y, rightX, y);
  y += 4;

  // 9. Total Grande y Negrita
  pdf.setFontSize(9.5);
  pdf.text('TOTAL:', leftX, y);
  pdf.text(`$${(ticket.total || 0).toFixed(2)}`, rightX, y, { align: 'right' });
  y += 4.5;

  const recibido = ticket.recibido !== undefined ? ticket.recibido : ticket.total;
  const cambio = ticket.cambio !== undefined ? ticket.cambio : Math.max(0, recibido - ticket.total);
  if (paymentMethod === 'EFECTIVO') {
    pdf.setFontSize(6.5);
    pdf.text('RECIBIDO:', leftX, y);
    pdf.text(`$${Number(recibido).toFixed(2)}`, rightX, y, { align: 'right' });
    y += 3.2;
    pdf.text('CAMBIO:', leftX, y);
    pdf.text(`$${Number(cambio).toFixed(2)}`, rightX, y, { align: 'right' });
    y += 3.8;
  }

  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(leftX, y, rightX, y);
  y += 4;

  // 10. Pie de Ticket Centrado
  pdf.setFontSize(6.5);
  pdf.text('* GRACIAS POR SU COMPRA *', centerX, y, { align: 'center' });

  const fileName = `Ticket_${folioStr}.pdf`;
  return { pdf, fileName, folioStr };
}
