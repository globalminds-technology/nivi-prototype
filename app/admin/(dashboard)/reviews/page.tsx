import type { Metadata } from "next";
import { connection } from "next/server";
import { container } from "@/infrastructure/di/container";
import { productSlug } from "@/core/domain/entities/product";
import type { Review } from "@/core/domain/entities/review";
import {
  ReviewManager,
  type SerializedReviewItem,
  type ReviewProductInfo,
} from "@/components/admin/review-manager";

export const instant = false;

export const metadata: Metadata = {
  title: "Customer Reviews & Moderation",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  await connection();
  await container.adminAuth.requireAdmin();

  // Load all reviews from Cloudflare R2
  let reviews: readonly Review[] = [];
  try {
    reviews = await container.reviewRepository().listAll();
  } catch (err) {
    console.error("Failed to load reviews from R2:", err);
  }

  // Load products to enrich SKU with product title, slug, and thumbnail
  const productsMap: Record<string, ReviewProductInfo> = {};
  try {
    const products = await container.listAdminProducts().execute();
    for (const p of products) {
      productsMap[p.sku.toLowerCase()] = {
        name: p.name,
        slug: productSlug(p),
        imageUrl: p.primaryImageUrl || (p.id ? `/api/images/zoho/${p.id}` : null),
      };
    }
  } catch (err) {
    console.warn("Could not load products map for reviews:", err);
  }

  const serializedReviews: SerializedReviewItem[] = reviews.map((r) => ({
    id: r.id,
    sku: r.sku,
    invoiceId: r.invoiceId,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    authorName: r.authorName,
    createdAt: r.createdAt,
    hidden: Boolean(r.hidden),
  }));

  return (
    <div className="space-y-6">
      <ReviewManager
        initialReviews={serializedReviews}
        productsMap={productsMap}
      />
    </div>
  );
}
