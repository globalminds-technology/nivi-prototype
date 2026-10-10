import { type Product } from "../../../domain/entities/product";
import { NotFoundError } from "../../../domain/errors/domain-errors";
import type { ProductRepository } from "../../ports/product-repository";

export class GetProductById {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepo.getById(id);
    if (!product) {
      throw new NotFoundError("Product", id);
    }
    return product;
  }
}
