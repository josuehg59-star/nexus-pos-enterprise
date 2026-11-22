// Helper para generar comandos nativos ESC/POS para impresoras térmicas de tickets (58mm y 80mm)
// Compatible con POS-58, POS-80, Epson, Xprinter, Aronium Lite y cualquier impresora térmica estándar.

export interface TicketItem {
  cartQty?: number;
  qty?: number;
  name?: string;
  productName?: string;
  price: number;
  subtotal?: number;
  total?: number;
}

export interface TicketData {
  folio?: string | number;
  date?: string | Date;
  caja?: string;
  cajero?: string;
  clientName?: string;
  paymentMethod?: string;
  montoEfectivo?: number;
  montoTarjeta?: number;
  montoTransferencia?: number;
  metodoMixtoSecundario?: string;
  recibido?: number;
  cambio?: number;
  total: number;
  items: TicketItem[];
  isTest?: boolean;
}

export interface TicketSettings {
  nombreNegocio?: string;
  rfc?: string;
  eslogan?: string;
  telefono?: string;
  direccion?: string;
  logo?: string;
  ticketShowLogo?: boolean;
  cajaNombre?: string;
  activeUser?: { name: string };
  ticketCharsPerLine?: number;
  ticketWidth?: '58mm' | '80mm';
  ticketFeedLines?: number;
  ticketTitleSize?: number | string;
  ticketDetailSize?: number | string;
  ticketFontSize?: number | string;
  ticketTotalSize?: number | string;
  ticketFontWeight?: string;
  ticketHeaderAlign?: 'left' | 'center' | 'right';
  ticketWordWrap?: boolean;
}

export class EscPosBuilder {
  private buffer: number[] = [];
  public charsPerLine: number = 32;

  constructor(charsPerLine: number = 32) {
    this.charsPerLine = charsPerLine || 32;
    this.init();
  }

  // Inicializar impresora térmica
  init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @
    // Seleccionar tabla de caracteres multilingüe (CP850 / Latin-1)
    this.buffer.push(0x1B, 0x74, 0x02); // ESC t 2
    return this;
  }

  // Selección de fuente física: 'A' (12x24 estándar) o 'B' (9x17 condensada / pequeña)
  font(mode: 'A' | 'B' = 'A'): this {
    this.buffer.push(0x1B, 0x4D, mode === 'B' ? 0x01 : 0x00); // ESC M n
    return this;
  }

  // Alineación: 'left', 'center', 'right'
  align(alignMode: 'left' | 'center' | 'right' = 'left'): this {
    const val = alignMode === 'center' ? 0x01 : alignMode === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1B, 0x61, val); // ESC a n
    return this;
  }

  // Negrita: true / false
  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  // Tamaño de fuente: 'normal', 'double_h' (doble alto), 'double_w' (doble ancho), 'double_both' (gigante)
  size(mode: 'normal' | 'double_h' | 'double_w' | 'double_both' = 'normal'): this {
    let val = 0x00;
    if (mode === 'double_h') val = 0x01; // Doble altura (proporcionado y elegante)
    else if (mode === 'double_w') val = 0x10;
    else if (mode === 'double_both') val = 0x11;
    this.buffer.push(0x1D, 0x21, val); // GS ! n
    return this;
  }

  // Convertir caracteres en español a bytes CP850
  private encodeChar(char: string): number {
    const map: { [key: string]: number } = {
      'á': 0xA0, 'é': 0x82, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
      'Á': 0xB5, 'É': 0x90, 'Í': 0xD6, 'Ó': 0xE0, 'Ú': 0xE9,
      'ñ': 0xA4, 'Ñ': 0xA5, '¿': 0xA8, '¡': 0xAD, 'ü': 0x81, 'Ü': 0x9A,
      '°': 0xF8, 'º': 0xA7, 'ª': 0xA6
    };
    if (map[char]) return map[char];
    const code = char.charCodeAt(0);
    return code < 128 ? code : 0x3F; // '?' si no es mapeable
  }

  // Agregar texto crudo
  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\n') {
        this.buffer.push(0x0A);
      } else if (char === '\r') {
        // ignorar retorno de carro
      } else {
        this.buffer.push(this.encodeChar(char));
      }
    }
    return this;
  }

  // Agregar línea completa con salto
  line(str: string = ''): this {
    this.text(str + '\n');
    return this;
  }

  // Línea separadora continua (32 o 48 caracteres exactos)
  separator(char: string = '-'): this {
    this.line(char.repeat(this.charsPerLine));
    return this;
  }

  // Fila de 2 columnas ajustada exactamente al ancho del rollo (Izquierda / Derecha)
  row(left: string, right: string): this {
    const max = this.charsPerLine;
    const lStr = left.trim();
    const rStr = right.trim();
    const spaceNeeded = max - (lStr.length + rStr.length);
    if (spaceNeeded > 0) {
      this.line(lStr + ' '.repeat(spaceNeeded) + rStr);
    } else {
      this.line(lStr);
      this.align('right').line(rStr).align('left');
    }
    return this;
  }

  // Fila de 3 columnas (Cant, Descripción, Total) estilo Aronium Lite
  tableRow(cant: string | number, desc: string, total: string): this {
    const width = this.charsPerLine;
    const cStr = String(cant).trim().padEnd(4, ' ');
    const tStr = String(total).trim();
    const descAvail = width - (cStr.length + tStr.length + 1);

    if (desc.trim().length <= descAvail) {
      const dStr = desc.trim().padEnd(descAvail, ' ');
      this.line(cStr + dStr + ' ' + tStr);
    } else {
      this.line(cStr + desc.trim());
      const spaces = width - tStr.length;
      this.line(' '.repeat(Math.max(0, spaces)) + tStr);
    }
    return this;
  }

  // Agregar imagen raster (Logo) a partir de un elemento Canvas con Floyd-Steinberg dithering
  rasterImage(canvas: HTMLCanvasElement): this {
    const ctx = canvas.getContext('2d');
    if (!ctx) return this;
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const gray = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) * a + 255 * (1 - a);
      gray[i / 4] = luma;
    }

    const widthBytes = Math.ceil(width / 8);
    const bits = new Uint8Array(widthBytes * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = gray[idx];
        const newVal = oldVal < 140 ? 0 : 255;
        const err = oldVal - newVal;
        gray[idx] = newVal;

        if (newVal === 0) {
          const byteIdx = y * widthBytes + Math.floor(x / 8);
          const bitPos = 7 - (x % 8);
          bits[byteIdx] |= (1 << bitPos);
        }

        if (x + 1 < width) gray[idx + 1] += err * (7 / 16);
        if (x - 1 >= 0 && y + 1 < height) gray[idx + width - 1] += err * (3 / 16);
        if (y + 1 < height) gray[idx + width] += err * (5 / 16);
        if (x + 1 < width && y + 1 < height) gray[idx + width + 1] += err * (1 / 16);
      }
    }

    const xL = widthBytes & 0xFF;
    const xH = (widthBytes >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;

    this.align('center');
    this.buffer.push(0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH);
    for (let i = 0; i < bits.length; i++) {
      this.buffer.push(bits[i]);
    }
    this.line(); // Salto después de la imagen
    return this;
  }

  // Líneas de avance (feed)
  feed(lines: number = 3): this {
    this.buffer.push(0x1B, 0x64, Math.max(1, Math.min(10, lines))); // ESC d n
    return this;
  }

  // Corte de papel (parcial / total)
  cut(): this {
    this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V B 0
    return this;
  }

  // Convertir a Base64 para enviar a través de IPC en Electron
  toBase64(): string {
    const uint8 = new Uint8Array(this.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
}

// Cargar y agregar logotipo centrado perfectamente en el rollo
export async function addLogoToBuilder(
  builder: EscPosBuilder,
  logoSrc: string,
  ticketWidth: '58mm' | '80mm' = '58mm'
): Promise<void> {
  if (!logoSrc) return;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const totalDots = ticketWidth === '80mm' ? 576 : 384;
          const maxLogoW = ticketWidth === '80mm' ? 260 : 180;
          const maxLogoH = ticketWidth === '80mm' ? 120 : 85;

          const scale = Math.min(maxLogoW / img.width, maxLogoH / img.height, 1);
          const drawW = Math.max(16, Math.round(img.width * scale));
          const drawH = Math.max(16, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = totalDots; // Ancho completo para centrado garantizado al 100%
          canvas.height = drawH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, totalDots, drawH);

            const startX = Math.round((totalDots - drawW) / 2);
            ctx.drawImage(img, startX, 0, drawW, drawH);

            builder.rasterImage(canvas);
          }
        } catch (e) {
          console.warn('Detalle rasterizando logo:', e);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = logoSrc;
    } catch (e) {
      resolve();
    }
  });
}

function parseNum(val: any, def: number): number {
  if (typeof val === 'number') return isNaN(val) ? def : val;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? def : n;
}

// Generador completo de ticket ESC/POS con soporte dinámico para todas las configuraciones del usuario
export async function buildTicketEscPos(
  data: TicketData,
  settings: TicketSettings
): Promise<EscPosBuilder> {
  const is80 = settings.ticketWidth === '80mm';
  const chars = settings.ticketCharsPerLine || (is80 ? 48 : 32);
  const builder = new EscPosBuilder(chars);

  const titleSz = parseNum(settings.ticketTitleSize, 22);
  const detailSz = parseNum(settings.ticketDetailSize, 12);
  const contentSz = parseNum(settings.ticketFontSize, 12);
  const totalSz = parseNum(settings.ticketTotalSize, 22);
  const isBold = settings.ticketFontWeight !== 'normal';
  const headerAlign = settings.ticketHeaderAlign || 'center';

  // 1. Logotipo (si está activado y existe)
  const resolvedLogo = settings.logo || (typeof localStorage !== 'undefined' ? (localStorage.getItem('ticketLogo') || localStorage.getItem('logo') || '') : '');
  if (settings.ticketShowLogo !== false && resolvedLogo) {
    await addLogoToBuilder(builder, resolvedLogo, settings.ticketWidth || '58mm');
  }

  // 2. Encabezado de la Tienda (Alineación y Tamaños dinámicos del usuario)
  builder.align(headerAlign);

  // Tamaño del Título según la configuración numérica del usuario
  if (titleSz <= 13) {
    // Si puso tamaño chico (ej. 9-12 px)
    builder.font(titleSz < 11 ? 'B' : 'A').size('normal').bold(isBold);
  } else if (titleSz <= 22) {
    // Si puso tamaño medio (ej. 14-22 px) -> Doble altura elegante
    builder.font('A').size('double_h').bold(isBold);
  } else {
    // Si puso tamaño grande (> 22 px) -> Doble ancho y alto
    builder.font('A').size(is80 ? 'double_both' : 'double_h').bold(isBold);
  }

  const storeName = settings.nombreNegocio || 'MI TIENDITA';
  builder.line(storeName);

  // Datos de la Tienda (Eslogan, Dirección, Teléfono, RFC) con tamaño y negrita configurados
  builder.size('normal');
  builder.font(detailSz < 12 ? 'B' : 'A');
  builder.bold(isBold && detailSz >= 14);

  if (settings.eslogan) {
    builder.line(`"${settings.eslogan}"`);
  }
  if (settings.direccion) {
    builder.line(settings.direccion);
  }
  if (settings.telefono) {
    builder.line(`TEL: ${settings.telefono}`);
  }
  if (settings.rfc) {
    builder.line(`RFC: ${settings.rfc}`);
  }

  builder.bold(false);
  builder.font('A');
  builder.separator('-');

  // 3. Indicador si es ticket de prueba
  if (data.isTest) {
    builder.align('center').bold(true).line('*** TICKET DE PRUEBA ***').bold(false);
    builder.separator('-');
  }

  // 4. Metadatos del Ticket (Fecha, Folio, Caja, Cajero, Cliente)
  builder.align('left');
  builder.font(detailSz < 12 ? 'B' : 'A');
  builder.bold(isBold && detailSz >= 14);

  const dStr = data.date
    ? (typeof data.date === 'string' ? data.date : data.date.toLocaleString('es-MX'))
    : new Date().toLocaleString('es-MX');

  builder.line(`FECHA: ${dStr}`);
  builder.line(`FOLIO: #${data.folio || '0000'}`);
  builder.line(`CAJA: ${(data.caja || settings.cajaNombre || 'CAJA 1').toUpperCase()}`);
  builder.line(`CAJERO: ${(data.cajero || settings.activeUser?.name || 'ADMINISTRADOR').toUpperCase()}`);
  builder.line(`CLIENTE: ${(data.clientName || 'PUBLICO GENERAL').toUpperCase()}`);
  if (data.paymentMethod) {
    builder.line(`PAGO: ${data.paymentMethod}`);
  }

  builder.bold(false);
  builder.font('A');
  builder.separator('-');

  // 5. Encabezado de Productos
  builder.font(contentSz < 12 ? 'B' : 'A');
  builder.bold(isBold);
  if (is80) {
    builder.line('CANT DESCRIPCION                                 TOTAL');
  } else {
    builder.line('CT  DESCRIPCION            TOTAL');
  }
  builder.bold(false);
  builder.font('A');
  builder.separator('-');

  // 6. Lista de Artículos (adaptados al tamaño configurado)
  builder.font(contentSz < 12 ? 'B' : 'A');
  for (const item of (data.items || [])) {
    const qty = item.cartQty || item.qty || 1;
    const price = item.price || 0;
    const subtotal = item.subtotal !== undefined ? item.subtotal : ((item as any).total !== undefined ? (item as any).total : (qty * price));
    const totalStr = `$${Number(subtotal).toFixed(2)}`;
    const prodName = item.name || item.productName || 'PRODUCTO';

    builder.tableRow(qty, prodName, totalStr);
    if (qty > 1) {
      builder.line(`    (${qty} x $${Number(price).toFixed(2)})`);
    }
  }

  builder.font('A');
  builder.separator('=');

  // 7. Totales (según tamaño numérico de Total configurado por el usuario)
  builder.align('left');
  if (totalSz <= 13) {
    builder.font(totalSz < 11 ? 'B' : 'A').size('normal').bold(isBold);
  } else if (totalSz <= 22) {
    builder.font('A').size('double_h').bold(isBold);
  } else {
    builder.font('A').size(is80 ? 'double_both' : 'double_h').bold(isBold);
  }

  builder.row('TOTAL:', `$${Number(data.total || 0).toFixed(2)}`);
  builder.size('normal').bold(false);

  builder.font(detailSz < 12 ? 'B' : 'A');
  if (data.paymentMethod === 'EFECTIVO' || data.recibido !== undefined) {
    const rec = data.recibido !== undefined ? Number(data.recibido) : Number(data.total);
    const cam = data.cambio !== undefined ? Number(data.cambio) : Math.max(0, rec - Number(data.total));
    builder.row('RECIBIDO:', `$${rec.toFixed(2)}`);
    builder.row('CAMBIO:', `$${cam.toFixed(2)}`);
  } else if (data.paymentMethod === 'MIXTO') {
    builder.align('center').bold(true).line('PAGO MIXTO').bold(false).align('left');
    const efec = Number(data.montoEfectivo || 0);
    builder.row('EFECTIVO:', `$${efec.toFixed(2)}`);
    const secName = data.metodoMixtoSecundario || 'TARJETA:';
    builder.row(secName.endsWith(':') ? secName : `${secName}:`, `$${Number(data.montoTarjeta || data.montoTransferencia || 0).toFixed(2)}`);
    const recMixto = Number((data as any).recibido || 0);
    const camMixto = Number((data as any).cambio || 0);
    if (recMixto > efec) {
      builder.row('EFEC. RECIBIDO:', `$${recMixto.toFixed(2)}`);
      builder.row('CAMBIO:', `$${camMixto.toFixed(2)}`);
    }
  }

  builder.font('A');
  builder.separator('-');

  // 8. Mensaje de Despedida Centrado
  builder.align('center');
  builder.font(detailSz < 12 ? 'B' : 'A');
  builder.bold(isBold);
  builder.line('* GRACIAS POR SU COMPRA *');
  builder.bold(false);
  builder.font('A');

  // 9. Avance y Corte de Papel configurado
  const feedCount = Math.max(1, Math.min(10, parseNum(settings.ticketFeedLines, 3)));
  builder.feed(feedCount);
  builder.cut();

  return builder;
}
