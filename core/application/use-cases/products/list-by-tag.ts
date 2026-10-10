import type { Product } from "../../../domain/entities/product";
import type { DisplayTag } from "../../../domain/value-objects/display-tag";
import type { ProductRepository } from "../../ports/product-repository";

export class ListByTag {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(tag: DisplayTag): Promise<readonly Product[]> {
    return this.productRepo.list({ tag, status: "active" });
  }
}
