import Dexie, { type EntityTable } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  brand: string;
  flavor: string;
  size: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  expirationDate: string;
  lowStockThreshold: number;
}

export interface Shop {
  id?: number;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  balance: number; // Positive means they owe money
}

export interface OrderItem {
  productId: number;
  quantity: number;
  sellingPrice: number;
  purchasePrice: number; // to calculate profit later
}

export interface Order {
  id?: number;
  shopId: number;
  date: string;
  totalAmount: number;
  paymentType: 'paid' | 'debt' | 'partial';
  paidAmount?: number;
  items: OrderItem[];
}

export interface Payment {
  id?: number;
  shopId: number;
  date: string;
  amount: number;
}

export interface PurchaseInvoiceItem {
  productId?: number; // Optional if it's a new product not yet in db
  productName: string;
  quantity: number;
  purchasePrice: number;
}

export interface PurchaseInvoice {
  id?: number;
  supplierName: string;
  date: string;
  items: PurchaseInvoiceItem[];
  image?: string; // base64 or blob url
}

export interface DailyBusinessItem {
  productId: number;
  takenCartons: number;
  remainingCartons: number;
  returnedCartons: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface DailyBusiness {
  id?: number;
  date: string;
  status: 'started' | 'ended';
  items: DailyBusinessItem[];
  totalTakenCost: number;
  expectedSales: number;
  expectedProfit: number;
  realSales: number;
  realProfit: number;
  debtsCollected: number;
}

export const db = new Dexie('IceCreamDistributorDB') as Dexie & {
  products: EntityTable<Product, 'id'>;
  shops: EntityTable<Shop, 'id'>;
  orders: EntityTable<Order, 'id'>;
  payments: EntityTable<Payment, 'id'>;
  purchaseInvoices: EntityTable<PurchaseInvoice, 'id'>;
  dailyBusiness: EntityTable<DailyBusiness, 'id'>;
};

db.version(1).stores({
  products: '++id, name, brand, flavor, size, expirationDate, stockQuantity',
  shops: '++id, name, ownerName, phone, balance',
  orders: '++id, shopId, date, paymentType',
  payments: '++id, shopId, date',
  purchaseInvoices: '++id, supplierName, date'
});

db.version(2).stores({
  products: '++id, name, brand, flavor, size, expirationDate, stockQuantity',
  shops: '++id, name, ownerName, phone, balance',
  orders: '++id, shopId, date, paymentType',
  payments: '++id, shopId, date',
  purchaseInvoices: '++id, supplierName, date',
  dailyBusiness: '++id, date, status'
});
