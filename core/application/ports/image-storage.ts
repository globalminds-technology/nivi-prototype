import type { ImageContentType } from "../../domain/value-objects/gallery";
import type { Sku } from "../../domain/value-objects/sku";

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface ImageStorage {
  createUploadUrl(sku: Sku, index: number, contentType: ImageContentType): Promise<PresignedUpload>;
  createCategoryUploadUrl?(slug: string, contentType: ImageContentType): Promise<PresignedUpload>;
  deleteImage?(key: string): Promise<void>;
}
