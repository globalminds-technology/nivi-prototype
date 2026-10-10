import { ValidationError } from "../errors/domain-errors";
import type { Sku } from "./sku";

/**
 * Image naming convention: `SKU/01.jpg … SKU/12.jpg`.
 *   01      → primary image, stored natively on the Zoho item
 *   02–12   → gallery images in Cloudflare R2 (max 11), URLs kept in `gallery_images`
 */
export const MAX_GALLERY_IMAGES = 11;
export const GALLERY_INDEX = { min: 2, max: 12 } as const;

export const IMAGE_CONTENT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageContentType = keyof typeof IMAGE_CONTENT_TYPES;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type Gallery = readonly string[];

export function isImageContentType(value: string): value is ImageContentType {
  return Object.hasOwn(IMAGE_CONTENT_TYPES, value);
}

export function createGallery(urls: readonly string[]): Gallery {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  if (unique.length > MAX_GALLERY_IMAGES) {
    throw new ValidationError(`A product can have at most ${MAX_GALLERY_IMAGES} gallery images`, {
      count: unique.length,
    });
  }
  for (const url of unique) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ValidationError("Gallery image must be an absolute URL", { url });
    }
    if (parsed.protocol !== "https:") {
      throw new ValidationError("Gallery image must use https", { url });
    }
  }
  return Object.freeze(unique);
}

export function galleryImageKey(sku: Sku, index: number, contentType: ImageContentType): string {
  if (!Number.isInteger(index) || index < GALLERY_INDEX.min || index > GALLERY_INDEX.max) {
    throw new ValidationError(
      `Gallery image index must be between ${GALLERY_INDEX.min} and ${GALLERY_INDEX.max}`,
      { index },
    );
  }
  return `${sku}/${String(index).padStart(2, "0")}.${IMAGE_CONTENT_TYPES[contentType]}`;
}
