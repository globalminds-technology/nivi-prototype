import type { Product, ProductProps, ProductStatus } from "../../domain/entities/product";
import type { DisplayTag } from "../../domain/value-objects/display-tag";
import type { Sku } from "../../domain/value-objects/sku";

export type ProductFilter = {
  tag?: DisplayTag;
  hasOffer?: boolean;
  status?: ProductStatus;
};

export interface ProductRepository {
  list(filter?: ProductFilter): Promise<readonly Product[]>;
  getBySku(sku: Sku): Promise<Product | null>;
  getById(id: string): Promise<Product | null>;
  create(product: ProductProps): Promise<Product>;
  update(id: string, updates: Partial<ProductProps>): Promise<Product>;
  uploadPrimaryImage?(id: string, imageBlob: Blob | Uint8Array, filename: string): Promise<string>;
  getItemImage?(id: string): Promise<{ data: Uint8Array; contentType: string } | null>;
  deletePrimaryImage?(id: string): Promise<void>;
}
