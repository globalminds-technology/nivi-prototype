import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import type { Product, ProductProps } from "@/core/domain/entities/product";
import { toSku, type Sku } from "@/core/domain/value-objects/sku";
import type { ProductFilter, ProductRepository } from "@/core/application/ports/product-repository";

let underlyingRepo: ProductRepository | null = null;

/**
 * Top-level cached functions as required by Next.js 16 Cache Components.
 * Arguments must be serializable primitives so Turbopack does not try to serialize class instances.
 */
async function fetchCachedList(filterJson: string): Promise<readonly Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");
  if (!underlyingRepo) return [];
  const filter = filterJson ? (JSON.parse(filterJson) as ProductFilter) : undefined;
  return underlyingRepo.list(filter);
}

async function fetchCachedBySku(skuStr: string): Promise<Product | null> {
  "use cache";
  cacheTag("products", `product:sku:${skuStr.toLowerCase()}`);
  cacheLife("minutes");
  if (!underlyingRepo) return null;
  return underlyingRepo.getBySku(toSku(skuStr));
}

async function fetchCachedById(id: string): Promise<Product | null> {
  "use cache";
  cacheTag("products", `product:id:${id}`);
  cacheLife("minutes");
  if (!underlyingRepo) return null;
  return underlyingRepo.getById(id);
}

/**
 * Decorator implementing ProductRepository that transparently caches read queries
 * using Next.js 16 Cache Components.
 */
export class CachedProductRepository implements ProductRepository {
  constructor(private readonly inner: ProductRepository) {
    underlyingRepo = inner;
  }

  async list(filter?: ProductFilter): Promise<readonly Product[]> {
    underlyingRepo = this.inner;
    const filterKey = filter ? JSON.stringify(filter) : "";
    return fetchCachedList(filterKey);
  }

  async getBySku(sku: Sku): Promise<Product | null> {
    underlyingRepo = this.inner;
    return fetchCachedBySku(sku);
  }

  async getById(id: string): Promise<Product | null> {
    underlyingRepo = this.inner;
    return fetchCachedById(id);
  }

  async create(product: ProductProps): Promise<Product> {
    return this.inner.create(product);
  }

  async update(id: string, updates: Partial<ProductProps>): Promise<Product> {
    return this.inner.update(id, updates);
  }

  async uploadPrimaryImage(id: string, imageBlob: Blob | Uint8Array, filename: string): Promise<string> {
    if (!this.inner.uploadPrimaryImage) {
      throw new Error("Underlying repository does not support uploadPrimaryImage");
    }
    return this.inner.uploadPrimaryImage(id, imageBlob, filename);
  }

  async getItemImage(id: string): Promise<{ data: Uint8Array; contentType: string } | null> {
    if (!this.inner.getItemImage) return null;
    return this.inner.getItemImage(id);
  }

  async deletePrimaryImage(id: string): Promise<void> {
    if (!this.inner.deletePrimaryImage) return;
    return this.inner.deletePrimaryImage(id);
  }
}
