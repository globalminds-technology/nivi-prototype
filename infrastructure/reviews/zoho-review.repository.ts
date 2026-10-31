import "server-only";
import type { Review } from "@/core/domain/entities/review";
import type { Sku } from "@/core/domain/value-objects/sku";
import type { ReviewRepository } from "@/core/application/ports/review-repository";
import type { ZohoHttpClient } from "../zoho/zoho-http";
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

  async listBySku(sku: Sku, includeHidden = false): Promise<readonly Review[]> {
    let allForSku: Review[] = [];

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
            allForSku = parsed;
          }
        }
      } catch {
        // Fall back to Zoho custom field if not in R2
      }
    }

    // 2. Second attempt: Read from Zoho Books custom field on the item if R2 was empty
    if (allForSku.length === 0) {
      try {
        const searchRes = await this.http.get<ZohoItemListResponse>("items", {
          sku: sku,
        });
        const match = (searchRes.items || []).find((i) => i.sku?.toLowerCase() === sku.toLowerCase());
        if (match) {
          const itemRes = await this.http.get<ZohoItemResponse>(`items/${match.item_id}`);
          const item = itemRes.item;
          if (item) {
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
                allForSku = parsed;
              }
            }
          }
        }
      } catch {
        // Graceful fallback
      }
    }

    if (includeHidden) {
      return allForSku;
    }
    return allForSku.filter((r) => !r.hidden);
  }

  async listAll(): Promise<readonly Review[]> {
    const r2 = this.getR2();
    const config = env();
    if (!r2 || !config.R2_BUCKET_NAME) {
      return [];
    }

    // 1. Try reading the aggregated all_reviews index
    try {
      const cmd = new GetObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: "reviews/all_reviews.json",
      });
      const res = await r2.send(cmd);
      if (res.Body) {
        const text = await res.Body.transformToString();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }
    } catch {
      // Index does not exist yet; will rebuild below
    }

    // 2. Scan all reviews/*.json files in R2 and build all_reviews index
    try {
      const listCmd = new ListObjectsV2Command({
        Bucket: config.R2_BUCKET_NAME,
        Prefix: "reviews/",
      });
      const listRes = await r2.send(listCmd);
      const objects = listRes.Contents || [];

      const aggregated: Review[] = [];
      for (const obj of objects) {
        if (!obj.Key || obj.Key === "reviews/all_reviews.json" || !obj.Key.endsWith(".json")) {
          continue;
        }
        try {
          const getCmd = new GetObjectCommand({
            Bucket: config.R2_BUCKET_NAME,
            Key: obj.Key,
          });
          const getRes = await r2.send(getCmd);
          if (getRes.Body) {
            const bodyStr = await getRes.Body.transformToString();
            const parsed = JSON.parse(bodyStr);
            if (Array.isArray(parsed)) {
              aggregated.push(...parsed);
            }
          }
        } catch {
          // ignore single file error
        }
      }

      aggregated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Save the aggregated index for future ultra-fast reads
      if (aggregated.length > 0) {
        const saveCmd = new PutObjectCommand({
          Bucket: config.R2_BUCKET_NAME,
          Key: "reviews/all_reviews.json",
          Body: JSON.stringify(aggregated, null, 2),
          ContentType: "application/json",
        });
        await r2.send(saveCmd);
      }

      return aggregated;
    } catch (err) {
      console.error("Failed to list all reviews from R2:", err);
      return [];
    }
  }

  async findByInvoiceAndSku(invoiceId: string, sku: Sku): Promise<Review | null> {
    const list = await this.listBySku(sku, true);
    return list.find((r) => r.invoiceId === invoiceId) ?? null;
  }

  async create(review: Review): Promise<void> {
    // Ensure hidden defaults to false
    const reviewWithDefaults: Review = {
      ...review,
      hidden: review.hidden ?? false,
    };

    const existing = await this.listBySku(reviewWithDefaults.sku, true);
    const updated = [...existing, reviewWithDefaults];

    const r2 = this.getR2();
    const config = env();

    // 1. Write SKU file to R2
    if (r2 && config.R2_BUCKET_NAME) {
      try {
        const cmd = new PutObjectCommand({
          Bucket: config.R2_BUCKET_NAME,
          Key: `reviews/${reviewWithDefaults.sku.toLowerCase()}.json`,
          Body: JSON.stringify(updated, null, 2),
          ContentType: "application/json",
        });
        await r2.send(cmd);
      } catch (err) {
        console.error("Failed to write review to R2:", err);
      }

      // Also update the all_reviews index
      try {
        const all = await this.listAll();
        const updatedAll = [reviewWithDefaults, ...all.filter((r) => r.id !== reviewWithDefaults.id)];
        const putAllCmd = new PutObjectCommand({
          Bucket: config.R2_BUCKET_NAME,
          Key: "reviews/all_reviews.json",
          Body: JSON.stringify(updatedAll, null, 2),
          ContentType: "application/json",
        });
        await r2.send(putAllCmd);
      } catch (err) {
        console.error("Failed to update all_reviews index in R2:", err);
      }
    }

    // 2. Also try writing back to Zoho Books item custom field (Option A)
    try {
      const searchRes = await this.http.get<ZohoItemListResponse>("items", {
        sku: reviewWithDefaults.sku,
      });
      const match = (searchRes.items || []).find((i) => i.sku?.toLowerCase() === reviewWithDefaults.sku.toLowerCase());
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
      console.warn("Zoho item custom field cf_reviews_json write skipped or failed:", err);
    }
  }

  async toggleVisibility(reviewId: string, sku: Sku, hidden: boolean): Promise<void> {
    const r2 = this.getR2();
    const config = env();
    if (!r2 || !config.R2_BUCKET_NAME) {
      throw new Error("Cloudflare R2 is not configured for review moderation");
    }

    // 1. Update in the SKU-specific file
    try {
      const existing = await this.listBySku(sku, true);
      const updated = existing.map((r) => (r.id === reviewId ? { ...r, hidden } : r));
      const cmd = new PutObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: `reviews/${sku.toLowerCase()}.json`,
        Body: JSON.stringify(updated, null, 2),
        ContentType: "application/json",
      });
      await r2.send(cmd);
    } catch (err) {
      console.error(`Failed to update SKU review visibility in R2 for ${sku}:`, err);
      throw err;
    }

    // 2. Update in all_reviews.json
    try {
      const all = await this.listAll();
      const updatedAll = all.map((r) => (r.id === reviewId ? { ...r, hidden } : r));
      const putAllCmd = new PutObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: "reviews/all_reviews.json",
        Body: JSON.stringify(updatedAll, null, 2),
        ContentType: "application/json",
      });
      await r2.send(putAllCmd);
    } catch (err) {
      console.error("Failed to update all_reviews.json visibility:", err);
    }
  }
}
