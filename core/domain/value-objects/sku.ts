import { ValidationError } from "../errors/domain-errors";

/** Stock-keeping unit. Also the folder name for a product's R2 images. */
export type Sku = string & { readonly __brand: "Sku" };

export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function isSku(raw: string): raw is Sku {
  return SKU_PATTERN.test(raw);
}

/**
 * Normalizes any string into a valid Sku.
 * Replaces spaces, slashes, and special characters with hyphens.
 * Ensures the result starts with an alphanumeric character and is <= 64 chars.
 */
export function normalizeSku(raw: string, fallback?: string): Sku {
  let cleaned = (raw || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned && fallback) {
    cleaned = (fallback || "")
      .trim()
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (!/^[A-Za-z0-9]/.test(cleaned)) {
    cleaned = `SKU-${cleaned}`.replace(/^-+|-+$/g, "");
  }

  if (!cleaned || cleaned === "SKU-") {
    cleaned = `ITEM-${Date.now()}`;
  }

  return cleaned.slice(0, 64).replace(/-+$/, "") as Sku;
}

/**
 * Trims and validates. If invalid (e.g. from Zoho catalog items without strict SKUs),
 * normalizes safely so external catalog items do not crash the application.
 */
export function toSku(raw: string, fallback?: string): Sku {
  const value = (raw || "").trim();
  if (isSku(value)) {
    return value;
  }
  return normalizeSku(raw, fallback);
}
