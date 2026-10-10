import { calendarDateOf } from "../../../domain/value-objects/calendar-date";
import { isOfferExpired } from "../../../domain/value-objects/offer";
import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { Clock } from "../../ports/clock";
import type { ProductRepository } from "../../ports/product-repository";

export interface ExpireOffersResult {
  checkedCount: number;
  expiredCount: number;
  deactivatedSkus: string[];
}

export class ExpireOffers {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly clock: Clock,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(): Promise<ExpireOffersResult> {
    const products = await this.productRepo.list({ hasOffer: true });
    const today = calendarDateOf(this.clock.now());

    const deactivatedSkus: string[] = [];

    for (const product of products) {
      if (product.offer && product.offer.active && isOfferExpired(product.offer, today)) {
        // Deactivate in Zoho Books
        await this.productRepo.update(product.id, {
          offer: {
            ...product.offer,
            active: false,
          },
        });
        deactivatedSkus.push(product.sku);
      }
    }

    if (deactivatedSkus.length > 0) {
      await this.cacheInvalidator.revalidateTag("products");
    }

    return {
      checkedCount: products.length,
      expiredCount: deactivatedSkus.length,
      deactivatedSkus,
    };
  }
}
