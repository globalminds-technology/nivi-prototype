import type { Quote, QuoteLine } from "../../../domain/entities/order";
import { NotFoundError, OutOfStockError } from "../../../domain/errors/domain-errors";
import { buildQuote, type PricingPolicy, quoteLine } from "../../../domain/services/pricing.service";
import { calendarDateOf } from "../../../domain/value-objects/calendar-date";
import { Money } from "../../../domain/value-objects/money";
import { toSku } from "../../../domain/value-objects/sku";
import type { CartLineItemDto } from "../../dto/checkout.dto";
import type { Clock } from "../../ports/clock";
import type { ProductRepository } from "../../ports/product-repository";
import type { ShippingRepository } from "../../ports/shipping-repository";

export class QuoteCart {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly clock: Clock,
    private readonly pricingPolicy: PricingPolicy = { taxInclusive: true },
    private readonly shippingRepo?: ShippingRepository,
  ) {}

  async execute(
    items: readonly CartLineItemDto[],
    shippingMethod: "standard" | "express" = "standard",
  ): Promise<Quote> {
    const today = calendarDateOf(this.clock.now());
    const quoteLines: QuoteLine[] = [];
    const outOfStockItems: Array<{ sku: string; requested: number; available: number }> = [];

    for (const item of items) {
      const sku = toSku(item.sku);
      const product = await this.productRepo.getBySku(sku);

      if (!product || product.status !== "active") {
        throw new NotFoundError("Product", item.sku);
      }

      if (product.stock < item.quantity) {
        outOfStockItems.push({
          sku: item.sku,
          requested: item.quantity,
          available: Math.max(0, product.stock),
        });
      }

      quoteLines.push(quoteLine(product, item.quantity, today, this.pricingPolicy));
    }

    if (outOfStockItems.length > 0) {
      throw new OutOfStockError(outOfStockItems);
    }

    let shipping: { amount: Money; method: "standard" | "express"; label?: string } | undefined;
    if (this.shippingRepo) {
      const option = await this.shippingRepo.getOptionByType(shippingMethod);
      shipping = {
        amount: Money.ofMinor(option.rateMinor, "INR"),
        method: shippingMethod,
        label: option.name,
      };
    }

    return buildQuote(quoteLines, this.pricingPolicy, shipping);
  }
}
