import type { Money } from "../value-objects/money";
import type { Sku } from "../value-objects/sku";
import type { Customer } from "./customer";

/** One priced cart line, computed on the server — never trusted from the client. */
export type QuoteLine = Readonly<{
  productId: string;
  sku: Sku;
  name: string;
  quantity: number;
  /** Rate before offer. */
  unitPrice: Money;
  unitDiscount: Money;
  unitNet: Money;
  offerLabel: string | null;
  lineSubtotal: Money;
  lineDiscount: Money;
  lineNet: Money;
  taxId: string | null;
  taxPercentage: number;
  /** Tax portion of the line (included in `lineNet` when prices are tax-inclusive). */
  lineTax: Money;
  /** Amount the customer pays for this line. */
  lineTotal: Money;
}>;

export type Quote = Readonly<{
  lines: readonly QuoteLine[];
  subtotal: Money;
  discount: Money;
  shipping: Money;
  shippingMethod?: "standard" | "express";
  shippingLabel?: string;
  tax: Money;
  total: Money;
  taxInclusive: boolean;
}>;

/**
 * Everything needed to raise the invoice after payment. Created by the server
 * at order time and stored with the payment order, so a webhook can complete
 * the order even if the customer's browser never returns.
 */
export type CheckoutSnapshot = Readonly<{
  quote: Quote;
  customer: Customer;
}>;
