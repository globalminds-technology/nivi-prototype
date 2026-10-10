import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { galleryImageKey, type ImageContentType } from "@/core/domain/value-objects/gallery";
import type { Sku } from "@/core/domain/value-objects/sku";
import type { ImageStorage, PresignedUpload } from "@/core/application/ports/image-storage";
import { requireEnv } from "../config/env";

export class R2ImageStorage implements ImageStorage {
  private client: S3Client | null = null;

  private getClient(): { client: S3Client; bucketName: string; bucketUrl: string } {
    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
    } = requireEnv(
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    );

    const { R2_BUCKET_URL } = require("../config/env").env();
    const bucketUrl = R2_BUCKET_URL || `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    if (!this.client) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      });
    }

    return {
      client: this.client,
      bucketName: R2_BUCKET_NAME,
      bucketUrl,
    };
  }

  async createUploadUrl(
    sku: Sku,
    index: number,
    contentType: ImageContentType,
    expiresInSeconds = 300,
  ): Promise<PresignedUpload> {
    const { client, bucketName, bucketUrl } = this.getClient();
    const key = galleryImageKey(sku, index, contentType);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    const publicUrl = `${bucketUrl.replace(/\/+$/, "")}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  }

  async createCategoryUploadUrl(
    slug: string,
    contentType: ImageContentType,
    expiresInSeconds = 300,
  ): Promise<PresignedUpload> {
    const { client, bucketName, bucketUrl } = this.getClient();
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const key = `categories/${slug}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    const publicUrl = `${bucketUrl.replace(/\/+$/, "")}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  }

  async uploadCategoryDirect(
    slug: string,
    buffer: Uint8Array,
    contentType: ImageContentType,
  ): Promise<string> {
    const { client, bucketName, bucketUrl } = this.getClient();
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const key = `categories/${slug}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${bucketUrl.replace(/\/+$/, "")}/${key}`;
  }

  async uploadGalleryDirect(
    sku: Sku,
    index: number,
    buffer: Uint8Array,
    contentType: ImageContentType,
  ): Promise<string> {
    const { client, bucketName, bucketUrl } = this.getClient();
    const key = galleryImageKey(sku, index, contentType);

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${bucketUrl.replace(/\/+$/, "")}/${key}`;
  }

  async uploadBannerDirect(
    campaignId: string,
    buffer: Uint8Array,
    contentType: ImageContentType,
  ): Promise<string> {
    const { client, bucketName, bucketUrl } = this.getClient();
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const safeId = campaignId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const key = `banners/${safeId}_${Date.now()}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${bucketUrl.replace(/\/+$/, "")}/${key}`;
  }

  async deleteImage(key: string): Promise<void> {
    const { client, bucketName } = this.getClient();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
  }
}
