import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";

const OFFERS_FILE = path.join(process.cwd(), "data", "offers.json");
const R2_OFFERS_KEY = "offers/campaigns.json";

export class OfferCampaignRepository {
  private r2Client: S3Client | null = null;
  private bucketName: string | null = null;

  private getR2(): { client: S3Client; bucketName: string } | null {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return null;
    }

    if (!this.r2Client) {
      this.r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucketName = bucketName;
    }

    return { client: this.r2Client, bucketName };
  }

  private async readAll(): Promise<OfferCampaign[]> {
    const r2 = this.getR2();
    if (r2) {
      try {
        const command = new GetObjectCommand({
          Bucket: r2.bucketName,
          Key: R2_OFFERS_KEY,
        });
        const res = await r2.client.send(command);
        const text = await res.Body?.transformToString();
        if (text) {
          const parsed = JSON.parse(text) as OfferCampaign[];
          // Mirror to local disk cache for fast fallback
          fs.writeFile(OFFERS_FILE, text, "utf-8").catch(() => {});
          return parsed;
        }
      } catch (err: unknown) {
        // If not found in R2 yet (NoSuchKey), fall through to local file
        const code = (err as { name?: string })?.name;
        if (code !== "NoSuchKey") {
          console.warn("[OfferCampaignRepository] R2 read failed, falling back to local file:", err);
        }
      }
    }

    try {
      const content = await fs.readFile(OFFERS_FILE, "utf-8");
      const list = JSON.parse(content) as OfferCampaign[];
      // If R2 is available but empty, seed it with local data
      if (r2 && list.length > 0) {
        this.writeToR2(list, r2).catch(() => {});
      }
      return list;
    } catch {
      return [];
    }
  }

  private async writeToR2(campaigns: OfferCampaign[], r2: { client: S3Client; bucketName: string }): Promise<void> {
    const body = JSON.stringify(campaigns, null, 2);
    const command = new PutObjectCommand({
      Bucket: r2.bucketName,
      Key: R2_OFFERS_KEY,
      Body: Buffer.from(body),
      ContentType: "application/json",
    });
    await r2.client.send(command);
  }

  private async writeAll(campaigns: OfferCampaign[]): Promise<void> {
    const r2 = this.getR2();
    if (r2) {
      try {
        await this.writeToR2(campaigns, r2);
      } catch (r2Err) {
        console.error("[OfferCampaignRepository] Failed writing to Cloudflare R2:", r2Err);
      }
    }

    try {
      await fs.mkdir(path.dirname(OFFERS_FILE), { recursive: true });
      await fs.writeFile(OFFERS_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
    } catch (err) {
      console.warn("[OfferCampaignRepository] Local file write warning (expected on read-only environments like Vercel):", err);
    }
  }

  async list(): Promise<OfferCampaign[]> {
    const all = await this.readAll();
    // Sort by displayOrder ascending if set, else by createdAt descending
    return all.sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      if (a.displayOrder !== undefined) return -1;
      if (b.displayOrder !== undefined) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getById(id: string): Promise<OfferCampaign | null> {
    const list = await this.readAll();
    return list.find((c) => c.id === id) || null;
  }

  async create(
    data: Omit<OfferCampaign, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<OfferCampaign> {
    const list = await this.readAll();
    const now = new Date().toISOString();
    const newCampaign: OfferCampaign = {
      id: data.id || `offer_${Date.now()}`,
      name: data.name,
      type: data.type,
      value: data.value,
      label: data.label,
      expiry: data.expiry ?? null,
      active: data.active ?? true,
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
      bannerImageUrl: data.bannerImageUrl ?? null,
      bannerTitle: data.bannerTitle ?? null,
      bannerSubtitle: data.bannerSubtitle ?? null,
      bannerCtaText: data.bannerCtaText ?? null,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newCampaign);
    await this.writeAll(list);
    return newCampaign;
  }

  async update(id: string, updates: Partial<OfferCampaign>): Promise<OfferCampaign | null> {
    const list = await this.readAll();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated: OfferCampaign = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    await this.writeAll(list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = await this.readAll();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;
    await this.writeAll(filtered);
    return true;
  }

  async setProducts(campaignId: string, productIds: string[]): Promise<OfferCampaign | null> {
    return this.update(campaignId, { productIds });
  }

  async removeProductFromAll(productId: string): Promise<void> {
    const list = await this.readAll();
    let changed = false;
    const updated = list.map((c) => {
      if (c.productIds.includes(productId)) {
        changed = true;
        return {
          ...c,
          productIds: c.productIds.filter((id) => id !== productId),
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    if (changed) {
      await this.writeAll(updated);
    }
  }

  /**
   * Returns a map of productId -> { campaignId, campaignName } for all active campaigns,
   * optionally excluding a specific campaign (e.g. the one currently being edited).
   */
  async getProductsExclusivityMap(
    excludeCampaignId?: string,
  ): Promise<Record<string, { campaignId: string; campaignName: string }>> {
    const list = await this.readAll();
    const map: Record<string, { campaignId: string; campaignName: string }> = {};

    for (const campaign of list) {
      if (!campaign.active) continue;
      if (excludeCampaignId && campaign.id === excludeCampaignId) continue;

      for (const prodId of campaign.productIds) {
        if (!map[prodId]) {
          map[prodId] = {
            campaignId: campaign.id,
            campaignName: campaign.name,
          };
        }
      }
    }

    return map;
  }

  async reorderBanners(orderedCampaignIds: string[]): Promise<OfferCampaign[]> {
    const list = await this.readAll();
    const updated = list.map((campaign) => {
      const index = orderedCampaignIds.indexOf(campaign.id);
      if (index !== -1) {
        return {
          ...campaign,
          displayOrder: index + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return campaign;
    });

    await this.writeAll(updated);
    return this.list();
  }
}

export const offerCampaignRepository = new OfferCampaignRepository();
