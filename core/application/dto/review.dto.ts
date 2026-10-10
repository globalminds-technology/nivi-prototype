import { z } from "zod";

export const SubmitReviewDto = z.object({
  token: z.string().min(1, "Review token is required"),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  title: z.string().max(100).optional().nullable(),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000),
  authorName: z.string().min(2, "Name is required").max(100),
});

export type SubmitReviewDto = z.infer<typeof SubmitReviewDto>;
