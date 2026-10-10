import type { Product } from "../../../domain/entities/product";
import type { ProductFilter, ProductRepository } from "../../ports/product-repository";

export class ListProducts {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(filter?: ProductFilter): Promise<readonly Product[]> {
    return this.productRepo.list(filter);
  }
}
