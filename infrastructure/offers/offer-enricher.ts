import "server-only";
import type { Product } from "@/core/domain/entities/product";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";
import { createOffer } from "@/core/domain/value-objects/offer";
import { toCalendarDate, calendarDateOf } from "@/core/domain/value-objects/calendar-date";
import { Money } from "@/core/domain/value-objects/money";
import type { ProductFilter, ProductRepository } from "@/core/application/ports/product-repository";
import type { Sku } from "@/core/domain/value-objects/sku";
import type { OfferCampaignRepository } from "./offer-campaign-repository";

/**
 * Enriches domain products with active promotional campaigns managed in OfferCampaignRepository.
 * If a product is enrolled in an active campaign, its domain `offer` is attached so pricing,
 * quote calculations, checkout, and invoices reflect the discount automatically.
 */
export function enrichProductWithCampaigns(
  product: Product,
  campaigns: readonly OfferCampaign[],
): Product {
  const todayStr = calendarDateOf(new Date());

  // Find active, unexpired campaign enrolling this product by ID or SKU
  const matchingCampaign = campaigns.find((c) => {
    if (!c.active) return false;
    if (c.expiry && c.expiry.slice(0, 10) < todayStr) return false;
    return (
      c.productIds.includes(product.id) ||
      c.productIds.some((id) => id.toLowerCase() === product.sku.toLowerCase())
    );
  });

  if (!matchingCampaign) {
    return product;
  }

  try {
    const offer = createOffer(
      matchingCampaign.type === "percent"
        ? {
            active: true,
            type: "percent",
            percent: matchingCampaign.value,
            label: matchingCampaign.label || `${matchingCampaign.value}% OFF`,
            expiry: matchingCampaign.expiry ? toCalendarDate(matchingCampaign.expiry.slice(0, 10)) : null,
          }
        : {
            active: true,
            type: "flat",
            amount: Money.ofMajor(matchingCampaign.value),
            label: matchingCampaign.label || `₹${matchingCampaign.value} OFF`,
            expiry: matchingCampaign.expiry ? toCalendarDate(matchingCampaign.expiry.slice(0, 10)) : null,
          },
    );

    return Object.freeze({
      ...product,
      offer,
    });
  } catch (err) {
    console.warn(`Failed to create offer for product ${product.sku} from campaign:`, err);
    return product;
  }
}

export class CampaignEnrichedProductRepository implements ProductRepository {
  constructor(
    private readonly inner: ProductRepository,
    private readonly campaignRepo: OfferCampaignRepository,
  ) {}

  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    const products = await this.inner.list(filter);
    try {
      const campaigns = await this.campaignRepo.list();
      const activeCampaigns = campaigns.filter((c) => c.active);
      if (activeCampaigns.length === 0) return products;
      return products.map((p) => enrichProductWithCampaigns(p, activeCampaigns));
    } catch {
      return products;
    }
  }

  async getBySku(sku: Sku): Promise<Product | null> {
    const product = await this.inner.getBySku(sku);
    if (!product) return null;
    try {
      const campaigns = await this.campaignRepo.list();
      const activeCampaigns = campaigns.filter((c) => c.active);
      return enrichProductWithCampaigns(product, activeCampaigns);
    } catch {
      return product;
    }
  }

  async getById(id: string): Promise<Product | null> {
    const product = await this.inner.getById(id);
    if (!product) return null;
    try {
      const campaigns = await this.campaignRepo.list();
      const activeCampaigns = campaigns.filter((c) => c.active);
      return enrichProductWithCampaigns(product, activeCampaigns);
    } catch {
      return product;
    }
  }

  async create(product: Parameters<ProductRepository["create"]>[0]) {
    return this.inner.create(product);
  }

  async update(id: string, updates: Parameters<ProductRepository["update"]>[1]) {
    return this.inner.update(id, updates);
  }

  async uploadPrimaryImage(id: string, imageBlob: Blob | Uint8Array, filename: string) {
    if (!this.inner.uploadPrimaryImage) {
      throw new Error("Underlying repository does not support uploadPrimaryImage");
    }
    return this.inner.uploadPrimaryImage(id, imageBlob, filename);
  }

  async getItemImage(id: string) {
    if (!this.inner.getItemImage) return null;
    return this.inner.getItemImage(id);
  }

  async deletePrimaryImage(id: string) {
    if (!this.inner.deletePrimaryImage) return;
    return this.inner.deletePrimaryImage(id);
  }
}
