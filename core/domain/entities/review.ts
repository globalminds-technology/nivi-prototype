import { ValidationError } from "../errors/domain-errors";
import type { Sku } from "../value-objects/sku";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Review = Readonly<{
  id: string;
  sku: Sku;
  /** Proves a verified purchase; one review per invoice + SKU. */
  invoiceId: string;
  rating: Rating;
  title: string | null;
  comment: string;
  authorName: string;
  /** ISO timestamp. */
  createdAt: string;
  /** When true, review is hidden from customer storefront by admin. Default false. */
  hidden?: boolean;
}>;

export function isRating(n: number): n is Rating {
  return Number.isInteger(n) && n >= 1 && n <= 5;
}

export function createReview(props: Omit<Review, "rating"> & { rating: number }): Review {
  if (!isRating(props.rating)) throw new ValidationError("Rating must be a whole number from 1 to 5");
  const comment = props.comment.trim();
  if (comment.length < 10) throw new ValidationError("Review must be at least 10 characters");
  const authorName = props.authorName.trim();
  if (!authorName) throw new ValidationError("Name is required");
  const title = props.title?.trim() || null;
  return Object.freeze({
    ...props,
    rating: props.rating,
    comment,
    authorName,
    title,
    hidden: props.hidden ?? false,
  });
}

export type ReviewSummary = Readonly<{
  count: number;
  /** Rounded to one decimal; 0 when there are no reviews. */
  average: number;
  distribution: Readonly<Record<Rating, number>>;
}>;

export function summarizeReviews(reviews: readonly Review[]): ReviewSummary {
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    distribution[r.rating] += 1;
    total += r.rating;
  }
  const count = reviews.length;
  return {
    count,
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    distribution,
  };
}
