import Dexie, { type EntityTable } from 'dexie';

export interface MobileProduct {
  id?: string;
  code: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  image?: string;
  favorite?: boolean;
}

export interface MobileCartItem {
  product: MobileProduct;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface MobileSale {
  id?: string;
  folio: string;
  date: string;
  timestamp: number;
  items: MobileCartItem[];
  total: number;
  received: number;
  change: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO';
  clientName?: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC';
}

export interface MobileClient {
  id?: string;
  name: string;
  phone?: string;
  credito?: number;
}

export const mobileDb = new Dexie('NEXUS_POS_MOVIL_DB') as Dexie & {
  products: EntityTable<MobileProduct, 'code'>;
  sales: EntityTable<MobileSale, 'id'>;
  clients: EntityTable<MobileClient, 'id'>;
};

mobileDb.version(1).stores({
  products: 'code, name, category, favorite',
  sales: 'id, folio, date, timestamp, syncStatus',
  clients: 'id, name, phone'
});
