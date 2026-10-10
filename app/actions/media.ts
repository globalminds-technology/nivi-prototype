"use server";

import { z } from "zod";
import { isDomainError } from "@/core/domain/errors/domain-errors";
import { container } from "@/infrastructure/di/container";

const RequestUploadUrlSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  index: z.number().int().min(2).max(12),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;

export type UploadUrlResponse =
  | {
      success: true;
      data: {
        uploadUrl: string;
        publicUrl: string;
        key: string;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Server Action for requesting presigned S3/R2 upload URLs for product gallery images.
 * Image index must be 2..12 (index 1 is reserved for Zoho's native primary image).
 */
export async function getPresignedUploadUrl(
  input: RequestUploadUrlInput,
): Promise<UploadUrlResponse> {
  const parsed = RequestUploadUrlSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await container.adminAuth.requireAdmin();
    const useCase = container.createUploadUrl();
    const result = await useCase.execute(parsed.data);

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Failed to generate presigned R2 upload URL:", err);
    return { success: false, error: "Failed to generate upload URL. Check server configuration." };
  }
}

export async function uploadGalleryImageAction(
  formData: FormData,
): Promise<{ success: true; data: { publicUrl: string } } | { success: false; error: string }> {
  try {
    await container.adminAuth.requireAdmin();

    const sku = (formData.get("sku") as string)?.trim().toUpperCase();
    const index = parseInt(formData.get("index") as string, 10);
    const file = formData.get("file") as File;

    if (!sku || isNaN(index) || !file) {
      return { success: false, error: "SKU, index, and image file are required." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    const publicUrl = await container.uploadProductGallery(sku, index, buffer, contentType);
    return { success: true, data: { publicUrl } };
  } catch (err: unknown) {
    console.error("Failed uploading gallery image:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to upload image." };
  }
}

export async function uploadCampaignBannerAction(
  formData: FormData,
): Promise<{ success: true; data: { publicUrl: string } } | { success: false; error: string }> {
  try {
    await container.adminAuth.requireAdmin();

    const campaignId = (formData.get("campaignId") as string)?.trim() || `campaign_${Date.now()}`;
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "Banner image file is required." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    const publicUrl = await container.uploadCampaignBanner(campaignId, buffer, contentType);
    return { success: true, data: { publicUrl } };
  } catch (err: unknown) {
    console.error("Failed uploading campaign banner:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to upload banner image." };
  }
}
