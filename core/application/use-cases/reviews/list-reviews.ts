import { type Review, type ReviewSummary, summarizeReviews } from "../../../domain/entities/review";
import { toSku } from "../../../domain/value-objects/sku";
import type { ReviewRepository } from "../../ports/review-repository";

export interface ListReviewsResult {
  reviews: readonly Review[];
  summary: ReviewSummary;
}

export class ListReviews {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(skuOrRaw: string): Promise<ListReviewsResult> {
    const sku = toSku(skuOrRaw);
    const reviews = await this.reviewRepo.listBySku(sku);
    const summary = summarizeReviews(reviews);

    return { reviews, summary };
  }
}
