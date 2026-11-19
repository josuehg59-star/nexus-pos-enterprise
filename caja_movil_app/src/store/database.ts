import Dexie, { type Table } from 'dexie';

// Definición de las Tablas (Tipos)
export interface Turno {
  id?: number;
  folio: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  estado: string; // 'ACTIVO' | 'CERRADO'
  cajero?: string;
  caja?: string;
}

export interface Product {
  id?: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  status: string; // Changed to string to allow 'ACTIVO' or other statuses safely
  barcode2?: string;
  barcode3?: string;
  family?: string;
  supplier_id?: string | number;
  supplier?: string;
  proveedor?: string;
  supplier_name?: string;
  promo_qty?: number;
  promo_price?: number;
  unit_measure?: string;
  iva?: number;
  ieps?: number;
  min_stock?: number;
  max_stock?: number;
  description?: string;
  parent_sku?: string;
  caja_padre?: string;
  piezas_x_caja?: number;
  image?: string;
  imagen?: string;
}

export interface Client {
  id?: number;
  name: string;
  phone: string;
  email?: string; // added
  type: string;
  monedero: number;
  credito: number;
  monederoCode?: string;
}


export interface Provider {
  id?: number;
  name: string;
  phone: string;
  email: string;
  contact: string;
  address: string;
  rfc: string;
  company?: string;
}

export interface Compra {
  id?: number;
  folio: string;
  date: string;
  provider: string;
  items: any[];
  subtotal: number;
  total: number;
  status?: string;
  fechaRecepcion?: string;
  [key: string]: any;
}

export interface Ticket {
  id?: string; // UUID
  date: string;
  total: number;
  monedero_earned?: number;
  paymentMethod: string;
  items: any[];
  synced: boolean; 
  clientName?: string; // added
  client?: string;
  status?: string;
  folio?: string | number;
  pendingBalance?: number;
  recibido?: number;
  cambio?: number;
  montoEfectivo?: number;
  montoTarjeta?: number;
  montoTransferencia?: number;
  metodoMixtoSecundario?: string;
  caja?: string;
  cajero?: string;
}

// Inicialización de la Base de Datos Local
export interface CorteZ {
  id?: number;
  date: string;
  fondoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  totalVentas: number;
  totalFisico?: number;
  ticketsCount?: number;
  totalEsperado?: number;
  caja?: string;
  cajero?: string;
  [key: string]: any;
}


export interface KardexMovement {
  id?: number;
  fecha: string;        // ISO / local date string
  tipo: string;         // ENTRADA | SALIDA | DEVOLUCION | MERMA | AJUSTE_AUDITORIA | CORRECCION_STOCK | ALTA_PRODUCTO
  sku: string;
  productName: string;
  cantidad: number;
  costo?: number;
  precio?: number;
  costoUnitario?: number;
  precioVenta?: number;
  total: number;
  folio?: string;
  proveedor?: string;
  provider?: string;
  usuario?: string;        // Nombre del usuario/cajero que realizó la acción
  caja?: string;           // Nombre de la Caja Terminal
  stockAnterior?: number;  // Stock antes del movimiento
  stockNuevo?: number;     // Stock después del movimiento
  detalles?: string;       // Motivo / notas de la acción
}

export interface DailyCashEntry {
  id?: number;
  dateKey: string;      // YYYY-MM-DD
  provider: string;     // Nombre del proveedor o 'GENERAL'
  cashAmount: number;   // Monto de efectivo manual físico
  notes?: string;       // Observaciones
  updatedAt: string;    // Timestamp
}

export class NexusDatabase extends Dexie {
  products!: Table<Product, number>;
  clients!: Table<Client, number>;
  tickets!: Table<Ticket, string>;
  cortes!: Table<CorteZ, number>;
  kardex!: Table<KardexMovement, number>;
  providers!: Table<Provider, number>;
  turnos!: Table<Turno, number>;
  compras!: Table<Compra, number>;
  dailyCashEntries!: Table<DailyCashEntry, number>;

  constructor() {
    super('NexusDB');
    this.version(5).stores({
      providers: '++id, name',
      products: '++id, sku, name, category',
      clients: '++id, name, phone, email, monederoCode',
      tickets: 'id, date, paymentMethod',
      cortes: '++id, date',
      turnos: '++id, folio, fechaApertura, estado',
      kardex: '++id, fecha, sku, tipo'
    });
    this.version(6).stores({
      compras: '++id, folio, date, provider'
    });
    this.version(7).stores({
      tickets: 'id, folio, date, paymentMethod, caja',
      kardex: '++id, folio, fecha, sku, tipo, caja'
    });
    this.version(8).stores({
      products: '++id, sku, name, category, barcode2, barcode3',
      tickets: 'id, folio, date, paymentMethod, caja, synced'
    });
    this.version(9).stores({
      dailyCashEntries: '++id, dateKey, provider, [dateKey+provider]'
    });
  }
}

export const db = new NexusDatabase();
