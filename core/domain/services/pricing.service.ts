import type { Product } from "../entities/product";
import type { Quote, QuoteLine } from "../entities/order";
import { ValidationError } from "../errors/domain-errors";
import type { CalendarDate } from "../value-objects/calendar-date";
import { Money } from "../value-objects/money";
import { isOfferLive, offerDiscount } from "../value-objects/offer";

/**
 * Whether Zoho item rates already include GST. Must match the Zoho invoice's
 * `is_inclusive_tax` so the amount charged by Razorpay equals the invoice total.
 */
export type PricingPolicy = Readonly<{ taxInclusive: boolean }>;

export type UnitPricing = Readonly<{
  base: Money;
  discount: Money;
  net: Money;
  hasOffer: boolean;
  offerLabel: string | null;
  /** Whole-number percent off, for badges like "20% off". */
  percentOff: number;
}>;

/** Display/unit price for a product on a given day. Pure; the single pricing rule. */
export function priceProduct(product: Product, today: CalendarDate): UnitPricing {
  const base = product.price;
  if (!isOfferLive(product.offer, today)) {
    return { base, discount: Money.zero(), net: base, hasOffer: false, offerLabel: null, percentOff: 0 };
  }
  const discount = offerDiscount(product.offer, base);
  const net = Money.subtract(base, discount);
  return {
    base,
    discount,
    net,
    hasOffer: discount.minor > 0,
    offerLabel: product.offer.label || null,
    percentOff: base.minor > 0 ? Math.round((discount.minor / base.minor) * 100) : 0,
  };
}

/** Tax portion of `net` (extracted when inclusive, added on top when exclusive). */
export function taxFor(net: Money, percentage: number, inclusive: boolean): Money {
  if (percentage <= 0) return Money.zero(net.currency);
  return inclusive
    ? Money.ofMinor(Math.round((net.minor * percentage) / (100 + percentage)), net.currency)
    : Money.ofMinor(Math.round((net.minor * percentage) / 100), net.currency);
}

export function quoteLine(
  product: Product,
  quantity: number,
  today: CalendarDate,
  policy: PricingPolicy,
): QuoteLine {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError("Quantity must be a positive whole number", { sku: product.sku, quantity });
  }
  const unit = priceProduct(product, today);
  const lineSubtotal = Money.multiply(unit.base, quantity);
  const lineDiscount = Money.multiply(unit.discount, quantity);
  const lineNet = Money.subtract(lineSubtotal, lineDiscount);
  const lineTax = taxFor(lineNet, product.taxPercentage, policy.taxInclusive);
  const lineTotal = policy.taxInclusive ? lineNet : Money.add(lineNet, lineTax);

  return Object.freeze({
    productId: product.id,
    sku: product.sku,
    name: product.name,
    quantity,
    unitPrice: unit.base,
    unitDiscount: unit.discount,
    unitNet: unit.net,
    offerLabel: unit.offerLabel,
    lineSubtotal,
    lineDiscount,
    lineNet,
    taxId: product.taxId,
    taxPercentage: product.taxPercentage,
    lineTax,
    lineTotal,
  });
}

export function buildQuote(
  lines: readonly QuoteLine[],
  policy: PricingPolicy,
  shipping?: { amount: Money; method: "standard" | "express"; label?: string },
): Quote {
  const linesTotal = Money.sum(lines.map((l) => l.lineTotal));
  const shippingAmount = shipping?.amount || Money.zero();
  const total = Money.add(linesTotal, shippingAmount);

  return Object.freeze({
    lines: Object.freeze([...lines]),
    subtotal: Money.sum(lines.map((l) => l.lineSubtotal)),
    discount: Money.sum(lines.map((l) => l.lineDiscount)),
    shipping: shippingAmount,
    shippingMethod: shipping?.method,
    shippingLabel: shipping?.label,
    tax: Money.sum(lines.map((l) => l.lineTax)),
    total,
    taxInclusive: policy.taxInclusive,
  });
}
