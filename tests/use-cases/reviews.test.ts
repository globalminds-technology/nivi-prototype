import { beforeEach, describe, expect, it } from "vitest";
import { ListReviews } from "../../core/application/use-cases/reviews/list-reviews";
import { SubmitReview } from "../../core/application/use-cases/reviews/submit-review";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../core/domain/errors/domain-errors";
import {
  FakeCacheInvalidator,
  FakeTokenSigner,
  InMemoryReviewRepository,
  InMemorySalesRepository,
} from "../fakes/in-memory-repositories";

describe("Review Use Cases", () => {
  let reviewRepo: InMemoryReviewRepository;
  let salesRepo: InMemorySalesRepository;
  let tokenSigner: FakeTokenSigner;
  let cacheInvalidator: FakeCacheInvalidator;

  beforeEach(() => {
    reviewRepo = new InMemoryReviewRepository();
    salesRepo = new InMemorySalesRepository();
    tokenSigner = new FakeTokenSigner();
    cacheInvalidator = new FakeCacheInvalidator();
  });

  it("submits a genuine review, updates summary and rejects duplicates", async () => {
    const submitReviewUseCase = new SubmitReview(tokenSigner, reviewRepo, salesRepo, cacheInvalidator);
    const listReviewsUseCase = new ListReviews(reviewRepo);

    // Register that invoice inv_100 actually bought SAREE-01
    salesRepo.validInvoiceItems.add("inv_100:SAREE-01");

    const validToken = await tokenSigner.signReviewToken({
      invoiceId: "inv_100",
      sku: "SAREE-01",
    });

    // 1. Submit review
    const review = await submitReviewUseCase.execute({
      token: validToken,
      rating: 5,
      title: "Gorgeous saree",
      comment: "The silk quality and zari work are exquisite! Loved it.",
      authorName: "Priya R",
    });

    expect(review.rating).toBe(5);
    expect(cacheInvalidator.invalidatedTags).toContain("reviews:SAREE-01");

    // 2. Listing reviews gives summary
    const { reviews, summary } = await listReviewsUseCase.execute("SAREE-01");
    expect(reviews.length).toBe(1);
    expect(summary.count).toBe(1);
    expect(summary.average).toBe(5);
    expect(summary.distribution[5]).toBe(1);

    // 3. Submitting again with the same token/invoice must be rejected
    await expect(
      submitReviewUseCase.execute({
        token: validToken,
        rating: 4,
        title: "Another attempt",
        comment: "Trying to submit duplicate review here",
        authorName: "Priya R",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejects review if token is invalid or tampered", async () => {
    const submitReviewUseCase = new SubmitReview(tokenSigner, reviewRepo, salesRepo, cacheInvalidator);

    await expect(
      submitReviewUseCase.execute({
        token: "invalid-token-string",
        rating: 5,
        comment: "This should fail authentication",
        authorName: "Fake Buyer",
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("rejects review if customer did not actually purchase the SKU on that invoice", async () => {
    const submitReviewUseCase = new SubmitReview(tokenSigner, reviewRepo, salesRepo, cacheInvalidator);

    const tokenForUnpurchasedSku = await tokenSigner.signReviewToken({
      invoiceId: "inv_100",
      sku: "UNPURCHASED-SKU",
    });

    await expect(
      submitReviewUseCase.execute({
        token: tokenForUnpurchasedSku,
        rating: 5,
        comment: "Trying to review an item not on my invoice",
        authorName: "Sneaky Buyer",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
