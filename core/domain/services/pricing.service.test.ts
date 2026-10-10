import { describe, expect, it } from "vitest";
import { createProduct } from "../entities/product";
import { toCalendarDate } from "../value-objects/calendar-date";
import { Money } from "../value-objects/money";
import { createOffer } from "../value-objects/offer";
import { toSku } from "../value-objects/sku";
import { buildQuote, priceProduct, quoteLine, taxFor } from "./pricing.service";

describe("PricingService", () => {
  const baseProduct = createProduct({
    id: "item_123",
    sku: toSku("SILK-SAREE-01"),
    name: "Pure Kanjivaram Silk Saree",
    description: "Handwoven pure silk saree with zari border",
    price: Money.ofMajor(10000), // ₹10,000
    stock: 5,
    taxId: "tax_5",
    taxPercentage: 5,
    primaryImageUrl: "https://example.com/01.jpg",
    status: "active",
    offer: null,
  });

  const today = toCalendarDate("2026-10-03");

  it("calculates regular price without offer", () => {
    const pricing = priceProduct(baseProduct, today);
    expect(pricing.base.minor).toBe(1000000);
    expect(pricing.discount.minor).toBe(0);
    expect(pricing.net.minor).toBe(1000000);
    expect(pricing.hasOffer).toBe(false);
    expect(pricing.percentOff).toBe(0);
  });

  it("applies percent offer accurately", () => {
    const productWithOffer = {
      ...baseProduct,
      offer: createOffer({
        active: true,
        type: "percent",
        percent: 20,
        label: "Diwali Special",
        expiry: toCalendarDate("2026-10-10"),
      }),
    };

    const pricing = priceProduct(productWithOffer, today);
    expect(pricing.base.minor).toBe(1000000);
    expect(pricing.discount.minor).toBe(200000); // 20% = ₹2,000
    expect(pricing.net.minor).toBe(800000); // ₹8,000
    expect(pricing.hasOffer).toBe(true);
    expect(pricing.offerLabel).toBe("Diwali Special");
    expect(pricing.percentOff).toBe(20);
  });

  it("applies flat offer capped at base price", () => {
    const productWithOffer = {
      ...baseProduct,
      offer: createOffer({
        active: true,
        type: "flat",
        amount: Money.ofMajor(15000), // Flat ₹15,000 off on ₹10,000 item
        label: "Mega Clearance",
        expiry: null,
      }),
    };

    const pricing = priceProduct(productWithOffer, today);
    expect(pricing.discount.minor).toBe(1000000); // Capped at ₹10,000
    expect(pricing.net.minor).toBe(0);
  });

  it("ignores expired offers automatically in pricing", () => {
    const productWithExpiredOffer = {
      ...baseProduct,
      offer: createOffer({
        active: true,
        type: "percent",
        percent: 50,
        label: "Flash Sale",
        expiry: toCalendarDate("2026-10-01"), // Expired 2 days ago
      }),
    };

    const pricing = priceProduct(productWithExpiredOffer, today);
    expect(pricing.hasOffer).toBe(false);
    expect(pricing.discount.minor).toBe(0);
    expect(pricing.net.minor).toBe(1000000);
  });

  it("calculates tax inclusive and exclusive correctly", () => {
    const net = Money.ofMajor(1050); // ₹1,050 with 5% tax
    // Inclusive: 1050 * 5 / 105 = 50
    const inclusiveTax = taxFor(net, 5, true);
    expect(inclusiveTax.minor).toBe(5000);

    // Exclusive: 1000 * 5 / 100 = 50
    const exclusiveNet = Money.ofMajor(1000);
    const exclusiveTax = taxFor(exclusiveNet, 5, false);
    expect(exclusiveTax.minor).toBe(5000);
  });

  it("builds complete cart quote with multiple lines", () => {
    const line1 = quoteLine(baseProduct, 2, today, { taxInclusive: true });
    expect(line1.lineSubtotal.minor).toBe(2000000);
    expect(line1.lineTotal.minor).toBe(2000000);

    const quote = buildQuote([line1], { taxInclusive: true });
    expect(quote.total.minor).toBe(2000000);
    expect(quote.subtotal.minor).toBe(2000000);
    expect(quote.discount.minor).toBe(0);
    expect(quote.taxInclusive).toBe(true);
  });
});
