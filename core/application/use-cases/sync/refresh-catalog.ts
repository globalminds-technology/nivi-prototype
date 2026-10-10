import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { ProductRepository } from "../../ports/product-repository";

export class RefreshCatalog {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(): Promise<{ refreshedAt: string; count: number }> {
    // Read from source repository to verify freshness
    const products = await this.productRepo.list();

    // Invalidate Next.js cache tag
    await this.cacheInvalidator.revalidateTag("products");

    return {
      refreshedAt: new Date().toISOString(),
      count: products.length,
    };
  }
}
