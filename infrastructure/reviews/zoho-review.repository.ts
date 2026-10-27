import "server-only";
import type { Review } from "@/core/domain/entities/review";
import type { Sku } from "@/core/domain/value-objects/sku";
import type { ReviewRepository } from "@/core/application/ports/review-repository";
import type { ZohoHttpClient } from "../zoho/zoho-http";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";

interface ZohoItemResponse {
  code: number;
  item: {
    item_id: string;
    custom_fields?: Array<{ api_name?: string; placeholder?: string; label?: string; value?: unknown }>;
    custom_field_hash?: Record<string, unknown>;
  };
}

interface ZohoItemListResponse {
  code: number;
  items: Array<{ item_id: string; sku?: string; name: string }>;
}

export class ZohoReviewRepository implements ReviewRepository {
  private r2Client: S3Client | null = null;

  constructor(private readonly http: ZohoHttpClient) {}

  private getR2(): S3Client | null {
    const config = env();
    if (!config.R2_ACCOUNT_ID || !config.R2_ACCESS_KEY_ID || !config.R2_SECRET_ACCESS_KEY) {
      return null;
    }
    if (!this.r2Client) {
      this.r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.R2_ACCESS_KEY_ID,
          secretAccessKey: config.R2_SECRET_ACCESS_KEY,
        },
      });
    }
    return this.r2Client;
  }

  async listBySku(sku: Sku): Promise<readonly Review[]> {
    // 1. First attempt: Read from R2 if configured (no character limits)
    try {
      const { connection } = await import("next/server");
      await connection();
    } catch {
      // Safely ignore when called outside a Next.js request context
    }

    const r2 = this.getR2();
    const config = env();
    if (r2 && config.R2_BUCKET_NAME) {
      try {
        const cmd = new GetObjectCommand({
          Bucket: config.R2_BUCKET_NAME,
          Key: `reviews/${sku.toLowerCase()}.json`,
        });
        const res = await r2.send(cmd);
        if (res.Body) {
          const text = await res.Body.transformToString();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {
        // Fall back to Zoho custom field if not in R2
      }
    }

    // 2. Second attempt: Read from Zoho Books custom field on the item
    try {
      const searchRes = await this.http.get<ZohoItemListResponse>("items", {
        sku: sku,
      });
      const match = (searchRes.items || []).find((i) => i.sku?.toLowerCase() === sku.toLowerCase());
      if (!match) return [];

      const itemRes = await this.http.get<ZohoItemResponse>(`items/${match.item_id}`);
      const item = itemRes.item;
      if (!item) return [];

      let rawReviews: unknown;
      if (item.custom_field_hash?.cf_reviews_json || item.custom_field_hash?.reviews_json) {
        rawReviews = item.custom_field_hash.cf_reviews_json || item.custom_field_hash.reviews_json;
      } else if (Array.isArray(item.custom_fields)) {
        const cf = item.custom_fields.find(
          (f) =>
            f.api_name === "cf_reviews_json" ||
            f.api_name === "reviews_json" ||
            f.label?.toLowerCase() === "reviews",
        );
        rawReviews = cf?.value;
      }

      if (typeof rawReviews === "string" && rawReviews.trim()) {
        const parsed = JSON.parse(rawReviews);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Graceful fallback
    }

    return [];
  }

  async findByInvoiceAndSku(invoiceId: string, sku: Sku): Promise<Review | null> {
    const list = await this.listBySku(sku);
    return list.find((r) => r.invoiceId === invoiceId) ?? null;
  }

  async create(review: Review): Promise<void> {
    const existing = await this.listBySku(review.sku);
    const updated = [...existing, review];

    // 1. Write to R2 (preferred for unlimited storage & zero race issues)
    const r2 = this.getR2();
    const config = env();
    if (r2 && config.R2_BUCKET_NAME) {
      try {
        const cmd = new PutObjectCommand({
          Bucket: config.R2_BUCKET_NAME,
          Key: `reviews/${review.sku.toLowerCase()}.json`,
          Body: JSON.stringify(updated, null, 2),
          ContentType: "application/json",
        });
        await r2.send(cmd);
      } catch (err) {
        console.error("Failed to write review to R2:", err);
      }
    }

    // 2. Also try writing back to Zoho Books item custom field (Option A)
    try {
      const searchRes = await this.http.get<ZohoItemListResponse>("items", {
        sku: review.sku,
      });
      const match = (searchRes.items || []).find((i) => i.sku?.toLowerCase() === review.sku.toLowerCase());
      if (match) {
        await this.http.put(`items/${match.item_id}`, {
          custom_fields: [
            {
              api_name: "cf_reviews_json",
              value: JSON.stringify(updated.slice(-15)), // Keep latest 15 to stay within length limit
            },
          ],
        });
      }
    } catch (err) {
      // Don't fail the review creation if Zoho custom field isn't set up yet
      console.warn("Zoho item custom field cf_reviews_json write skipped or failed:", err);
    }
  }
}
