import { type Product, productSlug } from "../../../domain/entities/product";
import { NotFoundError } from "../../../domain/errors/domain-errors";
import { isSku, toSku } from "../../../domain/value-objects/sku";
import type { ProductRepository } from "../../ports/product-repository";

export class GetProduct {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(skuOrSlug: string): Promise<Product> {
    const trimmed = skuOrSlug.trim();

    // 1. Try direct SKU lookup first if valid format
    if (isSku(trimmed)) {
      const product = await this.productRepo.getBySku(toSku(trimmed));
      if (product) return product;
    }

    // 2. Lookup by slug match across catalog
    const all = await this.productRepo.list();
    const matched = all.find(
      (p) =>
        p.sku.toLowerCase() === trimmed.toLowerCase() ||
        productSlug(p).toLowerCase() === trimmed.toLowerCase() ||
        trimmed.toLowerCase().endsWith(p.sku.toLowerCase()),
    );

    if (!matched) {
      throw new NotFoundError("Product", skuOrSlug);
    }

    return matched;
  }
}
