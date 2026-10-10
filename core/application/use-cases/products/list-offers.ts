import type { Product } from "../../../domain/entities/product";
import { calendarDateOf } from "../../../domain/value-objects/calendar-date";
import { isOfferLive } from "../../../domain/value-objects/offer";
import type { Clock } from "../../ports/clock";
import type { ProductRepository } from "../../ports/product-repository";

export class ListOffers {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<readonly Product[]> {
    const products = await this.productRepo.list({ hasOffer: true, status: "active" });
    const today = calendarDateOf(this.clock.now());

    // Only include products with truly live offers (not expired in IST)
    return products.filter((p) => isOfferLive(p.offer, today));
  }
}
