import { createReview, type Review } from "../../../domain/entities/review";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../../domain/errors/domain-errors";
import { toSku } from "../../../domain/value-objects/sku";
import type { SubmitReviewDto } from "../../dto/review.dto";
import type { CacheInvalidator } from "../../ports/cache-invalidator";
import type { ReviewRepository } from "../../ports/review-repository";
import type { SalesRepository } from "../../ports/sales-repository";
import type { TokenSigner } from "../../ports/token-signer";

export class SubmitReview {
  constructor(
    private readonly tokenSigner: TokenSigner,
    private readonly reviewRepo: ReviewRepository,
    private readonly salesRepo: SalesRepository,
    private readonly cacheInvalidator: CacheInvalidator,
  ) {}

  async execute(dto: SubmitReviewDto): Promise<Review> {
    // 1. Verify signed token (tamper-proof, time-limited)
    const payload = await this.tokenSigner.verifyReviewToken(dto.token);
    if (!payload) {
      throw new UnauthorizedError("Invalid or expired review link");
    }

    const sku = toSku(payload.sku);

    // 2. Cross-check against Zoho: did this invoice actually purchase this SKU?
    const hasPurchased = await this.salesRepo.verifyInvoiceItem(payload.invoiceId, payload.sku);
    if (!hasPurchased) {
      throw new NotFoundError("Purchased item on invoice", `${payload.sku} on ${payload.invoiceId}`);
    }

    // 3. Prevent duplicate reviews for the same invoice + SKU
    const existing = await this.reviewRepo.findByInvoiceAndSku(payload.invoiceId, sku);
    if (existing) {
      throw new ConflictError("A review has already been submitted for this purchase");
    }

    // 4. Create and persist review
    const review = createReview({
      id: `rev_${Date.now().toString(36)}`,
      sku,
      invoiceId: payload.invoiceId,
      rating: dto.rating,
      title: dto.title ?? null,
      comment: dto.comment,
      authorName: dto.authorName,
      createdAt: new Date().toISOString(),
    });

    await this.reviewRepo.create(review);

    // 5. Invalidate review cache for this product
    await this.cacheInvalidator.revalidateTag(`reviews:${sku}`);

    return review;
  }
}
