"use server";

import { Money } from "../core/domain/value-objects/money";
import type { Quote, QuoteLine } from "../core/domain/entities/order";
import { MOCK_PRODUCTS } from "../data/mock-catalog";

export async function quoteCartAction(
  items: Array<{ sku: string; quantity: number }>,
  shippingMethod?: string,
): Promise<{
  success: boolean;
  quote?: Quote;
  error?: string;
}> {
  let subtotalMinor = 0;
  const quoteLines: QuoteLine[] = items.map((item) => {
    const prod = MOCK_PRODUCTS.find((p) => p.sku === item.sku) || MOCK_PRODUCTS[0];
    const unitPrice = prod.price;
    const subtotal = Money.multiply(unitPrice, item.quantity);
    subtotalMinor += subtotal.minor;
    return {
      sku: item.sku,
      name: prod.name,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  const subtotal = Money.ofMinor(subtotalMinor);
  const discount = Money.zero();
  const shipping = shippingMethod === "express" ? Money.ofMinor(9900) : Money.zero();
  const tax = Money.multiply(subtotal, 0.05); // 5% GST
  const total = Money.add(Money.add(subtotal, tax), shipping);

  const quote: Quote = {
    items: quoteLines,
    lines: quoteLines, // alias
    subtotal,
    discount,
    shipping,
    tax,
    total,
  };

  return { success: true, quote };
}

export async function createPaymentOrderAction(orderData: any): Promise<{
  success: boolean;
  orderId?: string;
  amountMinor?: number;
  currency?: string;
  keyId?: string;
  snapshot?: any;
  isDirectOrder?: boolean;
  outOfStock?: Array<{ sku: string; available: number }>;
  error?: string;
}> {
  // Simulate a direct order (no payment gateway needed for prototype)
  return {
    success: true,
    orderId: `ORDER_${Date.now()}`,
    amountMinor: 100000,
    currency: "INR",
    keyId: "rzp_test_prototype",
    snapshot: { items: orderData?.items ?? [] },
    isDirectOrder: true,
    outOfStock: [],
  };
}

export async function confirmPaymentAction(
  paymentData: any,
  snapshot?: any,
): Promise<{
  success: boolean;
  orderNumber?: string;
  invoiceNumber?: string;
  invoiceId?: string;
  reviewTokens?: any[];
  error?: string;
}> {
  const num = Math.floor(100000 + Math.random() * 900000);
  const invoiceNumber = `TSS-INV-${num}`;
  const invoiceId = `inv_${num}`;
  return {
    success: true,
    orderNumber: invoiceNumber,
    invoiceNumber,
    invoiceId,
    reviewTokens: [],
  };
}

export async function getShippingOptionsAction(): Promise<{
  success: boolean;
  options?: Array<{
    id: string;
    name: string;
    type: string;
    rate: { minor: number; currency: string };
    rateMinor: number;
    estimatedDays: string;
  }>;
  error?: string;
}> {
  return {
    success: true,
    options: [
      {
        id: "standard",
        name: "Standard Delivery",
        type: "flat",
        rate: { minor: 0, currency: "INR" },
        rateMinor: 0,
        estimatedDays: "5–7 business days",
      },
      {
        id: "express",
        name: "Express Delivery",
        type: "flat",
        rate: { minor: 9900, currency: "INR" },
        rateMinor: 9900,
        estimatedDays: "2–3 business days",
      },
    ],
  };
}

export async function lookupPincodeAction(pincode: string): Promise<{
  success: boolean;
  city?: string;
  state?: string;
  places?: string[];
  error?: string;
}> {
  // Mock pincode lookup — returns generic data for prototype
  return {
    success: true,
    city: "Mumbai",
    state: "Maharashtra",
    places: ["Andheri", "Bandra", "Worli"],
  };
}
