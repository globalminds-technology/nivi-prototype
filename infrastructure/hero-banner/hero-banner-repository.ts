import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  DEFAULT_HERO_BANNER,
  type HeroBannerConfig,
} from "@/core/domain/entities/hero-banner";

const HERO_FILE = path.join(process.cwd(), "data", "hero-banner.json");
const R2_HERO_KEY = "settings/hero-banner.json";

export class HeroBannerRepository {
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

  async get(): Promise<HeroBannerConfig> {
    const r2 = this.getR2();
    if (r2) {
      try {
        const command = new GetObjectCommand({
          Bucket: r2.bucketName,
          Key: R2_HERO_KEY,
        });
        const res = await r2.client.send(command);
        const text = await res.Body?.transformToString();
        if (text) {
          const parsed = JSON.parse(text) as Partial<HeroBannerConfig>;
          const config = this.mergeWithDefault(parsed);
          // Mirror to local disk cache asynchronously
          fs.writeFile(HERO_FILE, JSON.stringify(config, null, 2), "utf-8").catch(() => {});
          return config;
        }
      } catch (err: unknown) {
        const code = (err as { name?: string })?.name;
        if (code !== "NoSuchKey") {
          console.warn("[HeroBannerRepository] R2 read failed, falling back to local file:", err);
        }
      }
    }

    try {
      const content = await fs.readFile(HERO_FILE, "utf-8");
      const parsed = JSON.parse(content) as Partial<HeroBannerConfig>;
      const config = this.mergeWithDefault(parsed);
      if (r2) {
        this.writeToR2(config, r2).catch(() => {});
      }
      return config;
    } catch {
      return DEFAULT_HERO_BANNER;
    }
  }

  async save(updates: Partial<HeroBannerConfig>): Promise<HeroBannerConfig> {
    const current = await this.get();
    const updated: HeroBannerConfig = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Ensure objectPosition aligns with imagePositionX / imagePositionY if present
    if (updates.imagePositionX !== undefined || updates.imagePositionY !== undefined) {
      const x = updates.imagePositionX ?? updated.imagePositionX ?? 85;
      const y = updates.imagePositionY ?? updated.imagePositionY ?? 15;
      updated.objectPosition = `${x}% ${y}%`;
    }

    const r2 = this.getR2();
    if (r2) {
      try {
        await this.writeToR2(updated, r2);
      } catch (err) {
        console.error("[HeroBannerRepository] Failed writing to R2:", err);
      }
    }

    try {
      await fs.mkdir(path.dirname(HERO_FILE), { recursive: true });
      await fs.writeFile(HERO_FILE, JSON.stringify(updated, null, 2), "utf-8");
    } catch (err) {
      console.error("[HeroBannerRepository] Failed writing local hero-banner.json:", err);
    }

    return updated;
  }

  async reset(): Promise<HeroBannerConfig> {
    return this.save(DEFAULT_HERO_BANNER);
  }

  private mergeWithDefault(parsed: Partial<HeroBannerConfig>): HeroBannerConfig {
    return {
      imageUrl: parsed.imageUrl || DEFAULT_HERO_BANNER.imageUrl,
      active: parsed.active ?? DEFAULT_HERO_BANNER.active,
      displayOrder: parsed.displayOrder ?? DEFAULT_HERO_BANNER.displayOrder,
      tagline: parsed.tagline !== undefined ? parsed.tagline : DEFAULT_HERO_BANNER.tagline,
      title: parsed.title !== undefined ? parsed.title : DEFAULT_HERO_BANNER.title,
      subtitle: parsed.subtitle !== undefined ? parsed.subtitle : DEFAULT_HERO_BANNER.subtitle,
      primaryCtaText:
        parsed.primaryCtaText !== undefined
          ? parsed.primaryCtaText
          : DEFAULT_HERO_BANNER.primaryCtaText,
      primaryCtaLink:
        parsed.primaryCtaLink !== undefined
          ? parsed.primaryCtaLink
          : DEFAULT_HERO_BANNER.primaryCtaLink,
      secondaryCtaText:
        parsed.secondaryCtaText !== undefined
          ? parsed.secondaryCtaText
          : DEFAULT_HERO_BANNER.secondaryCtaText,
      secondaryCtaLink:
        parsed.secondaryCtaLink !== undefined
          ? parsed.secondaryCtaLink
          : DEFAULT_HERO_BANNER.secondaryCtaLink,
      showOverlay: parsed.showOverlay ?? DEFAULT_HERO_BANNER.showOverlay,
      textPosition: parsed.textPosition || DEFAULT_HERO_BANNER.textPosition,
      imagePositionX: parsed.imagePositionX ?? DEFAULT_HERO_BANNER.imagePositionX,
      imagePositionY: parsed.imagePositionY ?? DEFAULT_HERO_BANNER.imagePositionY,
      objectPosition:
        parsed.objectPosition ||
        `${parsed.imagePositionX ?? DEFAULT_HERO_BANNER.imagePositionX}% ${
          parsed.imagePositionY ?? DEFAULT_HERO_BANNER.imagePositionY
        }%`,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  }

  private async writeToR2(
    config: HeroBannerConfig,
    r2: { client: S3Client; bucketName: string },
  ): Promise<void> {
    const body = JSON.stringify(config, null, 2);
    const command = new PutObjectCommand({
      Bucket: r2.bucketName,
      Key: R2_HERO_KEY,
      Body: Buffer.from(body),
      ContentType: "application/json",
    });
    await r2.client.send(command);
  }
}

export const heroBannerRepository = new HeroBannerRepository();
