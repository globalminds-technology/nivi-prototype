import type { Review } from "../../domain/entities/review";
import type { Sku } from "../../domain/value-objects/sku";

export interface ReviewRepository {
  listBySku(sku: Sku): Promise<readonly Review[]>;
  findByInvoiceAndSku(invoiceId: string, sku: Sku): Promise<Review | null>;
  create(review: Review): Promise<void>;
}
