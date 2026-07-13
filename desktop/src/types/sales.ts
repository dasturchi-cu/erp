import type { Customer, Product } from '@/types/entities';
import type { Sale } from '@/types/entities';

export interface CartLine {
  product: Product;
  quantity: number;
  saleUnit: 'piece' | 'box';
  unitPriceUzs: number;
}

export type SaleCurrency = 'UZS' | 'USD';
export type PaymentMethod = 'cash' | 'credit' | 'mixed';

export interface SaleLineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceUzs: number;
  unitPriceUsd: number;
  totalUzs: number;
  totalUsd: number;
}

export interface FifoAllocation {
  batchId: string;
  productId: string;
  productName: string;
  quantity: number;
  costUzs: number;
}

export interface SalePaymentBreakdown {
  method: PaymentMethod;
  amountUzs: number;
  amountUsd: number;
  receivedUzs?: number;
  changeUzs?: number;
}

export interface SaleDetail extends Sale {
  customerId?: string;
  currency: SaleCurrency;
  exchangeRate: number;
  lineItems: SaleLineItem[];
  fifoAllocations: FifoAllocation[];
  payments: SalePaymentBreakdown[];
  notes?: string;
}

export interface CreateSalePayload {
  items: CartLine[];
  customer: Customer | null;
  currency: SaleCurrency;
  paymentMethod: PaymentMethod;
  receivedUzs?: number;
  creditAmountUzs?: number;
  exchangeRate: number;
  cashierName: string;
}

export interface PaymentDialogData {
  method: PaymentMethod;
  receivedUzs: number;
  receivedUsd?: number;
  dialogCurrency: 'UZS' | 'USD';
}
