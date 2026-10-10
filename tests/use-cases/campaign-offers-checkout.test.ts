import { describe, it, expect } from "vitest";
import { CampaignEnrichedProductRepository } from "@/infrastructure/offers/offer-enricher";
import type { Product } from "@/core/domain/entities/product";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";
import type { OfferCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";
import type { ProductRepository } from "@/core/application/ports/product-repository";
import { Money } from "@/core/domain/value-objects/money";
import { toSku } from "@/core/domain/value-objects/sku";
import { QuoteCart } from "@/core/application/use-cases/checkout/quote-cart";
import { SystemClock } from "@/infrastructure/system/system-clock";

describe("Campaign Offers & Checkout Integration", () => {
  const dummyProduct: Product = {
    id: "4251796000000059001",
    sku: toSku("KS-002"),
    name: "Maroon Gold Zari Kanchipuram Silk Saree",
    description: "Pure mulberry silk with authentic zari work",
    price: Money.ofMajor(10000),
    stock: 5,
    taxId: null,
    taxPercentage: 0,
    primaryImageUrl: "/api/images/zoho/4251796000000059001",
    gallery: Object.freeze([]) as unknown as Product["gallery"],
    tags: ["bestseller", "featured"],
    offer: null,
    status: "active",
  };

  const dummyCampaign: OfferCampaign = {
    id: "offer_diwali_10",
    name: "Diwali Offer",
    type: "percent",
    value: 10,
    label: "10% OFF",
    expiry: "2028-12-31",
    active: true,
    productIds: ["4251796000000059001"],
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
  };

  const mockProductRepo: ProductRepository = {
    list: async () => [dummyProduct],
    getBySku: async (sku) => (sku.toLowerCase() === dummyProduct.sku.toLowerCase() ? dummyProduct : null),
    getById: async (id) => (id === dummyProduct.id ? dummyProduct : null),
    create: async () => dummyProduct,
    update: async () => dummyProduct,
  };

  const mockCampaignRepo: Partial<OfferCampaignRepository> = {
    list: async () => [dummyCampaign],
  };

  it("enriches product with campaign offer when fetched by SKU or ID", async () => {
    const enrichedRepo = new CampaignEnrichedProductRepository(
      mockProductRepo,
      mockCampaignRepo as OfferCampaignRepository,
    );

    const product = await enrichedRepo.getBySku(toSku("KS-002"));
    expect(product).not.toBeNull();
    expect(product!.offer).not.toBeNull();
    expect(product!.offer?.active).toBe(true);
    expect(product!.offer?.type).toBe("percent");
    if (product!.offer?.type === "percent") {
      expect(product!.offer?.percent).toBe(10);
    }
    expect(product!.offer?.label).toBe("10% OFF");
  });

  it("correctly quotes a cart applying the campaign promotional discount", async () => {
    const enrichedRepo = new CampaignEnrichedProductRepository(
      mockProductRepo,
      mockCampaignRepo as OfferCampaignRepository,
    );
    const quoteCart = new QuoteCart(enrichedRepo, new SystemClock());

    const quote = await quoteCart.execute([{ sku: "KS-002", quantity: 2 }]);

    // Base subtotal = 10,000 * 2 = 20,000 (2,000,000 minor)
    expect(quote.subtotal.minor).toBe(2000000);

    // 10% discount on 20,000 = 2,000 (200,000 minor)
    expect(quote.discount.minor).toBe(200000);

    // Total = 18,000 (1,800,000 minor)
    expect(quote.total.minor).toBe(1800000);

    // Line details
    expect(quote.lines[0].offerLabel).toBe("10% OFF");
    expect(quote.lines[0].unitDiscount.minor).toBe(100000);
    expect(quote.lines[0].lineDiscount.minor).toBe(200000);
    expect(quote.lines[0].lineTotal.minor).toBe(1800000);
  });
});
