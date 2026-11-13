import type { Money } from "../value-objects/money";

export interface QuoteLine {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

export interface Quote {
  items: QuoteLine[];
  /** Alias for items — some components use quote.lines */
  lines: QuoteLine[];
  subtotal: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
}

export interface Order {
  id: string;
  orderNumber: string;
  quote: Quote;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
}

