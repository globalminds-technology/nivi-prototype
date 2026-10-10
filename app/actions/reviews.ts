"use server";

import { container } from "@/infrastructure/di/container";
import { SubmitReviewDto } from "@/core/application/dto/review.dto";
import type { Review, ReviewSummary } from "@/core/domain/entities/review";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { toSku } from "@/core/domain/value-objects/sku";

export interface SubmitReviewResponse {
  success: boolean;
  review?: Review;
  error?: string;
}

export async function submitReviewAction(input: unknown): Promise<SubmitReviewResponse> {
  try {
    const parsed = SubmitReviewDto.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const review = await container.submitReview().execute(parsed.data);
    return { success: true, review };
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit review",
    };
  }
}

export interface VerifyTokenResponse {
  valid: boolean;
  sku?: string;
  invoiceId?: string;
  error?: string;
}

export async function verifyReviewTokenAction(token: string): Promise<VerifyTokenResponse> {
  try {
    const payload = await container.tokenSigner().verifyReviewToken(token);
    if (!payload) {
      return { valid: false, error: "This review link is invalid or has expired." };
    }

    // Check if review has already been submitted
    const existing = await container.reviewRepository().findByInvoiceAndSku(payload.invoiceId, toSku(payload.sku));
    if (existing) {
      return { valid: false, error: "You have already reviewed this purchase. Thank you!" };
    }

    return { valid: true, sku: payload.sku, invoiceId: payload.invoiceId };
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unable to verify link",
    };
  }
}

export interface ListReviewsResponse {
  reviews: readonly Review[];
  summary: ReviewSummary;
}

export async function listProductReviewsAction(sku: string): Promise<ListReviewsResponse> {
  try {
    return await container.listReviews().execute(sku);
  } catch {
    return {
      reviews: [],
      summary: {
        count: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }
}
