import { ValidationError } from "../errors/domain-errors";
import { type DisplayTag, normalizeTags } from "../value-objects/display-tag";
import { createGallery, type Gallery } from "../value-objects/gallery";
import type { Money } from "../value-objects/money";
import type { Offer } from "../value-objects/offer";
import type { Sku } from "../value-objects/sku";

export type ProductStatus = "active" | "inactive";

/** A sellable item. Zoho Books is the system of record; this is the domain view of it. */
export type Product = Readonly<{
  /** Zoho `item_id`. */
  id: string;
  sku: Sku;
  name: string;
  description: string;
  /** Selling rate before any offer. Tax treatment comes from the PricingPolicy. */
  price: Money;
  /** Purchase/cost price from Zoho Books. */
  costPrice?: Money | null;
  /** Stock on hand as reported by Zoho; may be negative if oversold. */
  stock: number;
  taxId: string | null;
  taxPercentage: number;
  primaryImageUrl: string | null;
  category?: string | null;
  gallery: Gallery;
  tags: readonly DisplayTag[];
  offer: Offer | null;
  status: ProductStatus;
}>;

export type ProductProps = Omit<Product, "gallery" | "tags"> & {
  gallery?: readonly string[];
  tags?: readonly string[];
};

export function createProduct(props: ProductProps): Product {
  const name = props.name.trim();
  if (name.length < 2) throw new ValidationError("Product name must be at least 2 characters");
  if (props.price.minor < 0) throw new ValidationError("Price cannot be negative");
  if (props.costPrice && props.costPrice.minor < 0) {
    throw new ValidationError("Cost price cannot be negative");
  }
  if (!Number.isInteger(props.stock)) throw new ValidationError("Stock must be a whole number");
  if (props.taxPercentage < 0 || props.taxPercentage > 100) {
    throw new ValidationError("Tax percentage must be between 0 and 100");
  }
  return Object.freeze({
    ...props,
    name,
    category: props.category ? props.category.trim() : null,
    costPrice: props.costPrice ?? null,
    description: props.description.trim(),
    gallery: createGallery(props.gallery ?? []),
    tags: normalizeTags(props.tags ?? []),
  });
}

export const availableStock = (p: Product): number => Math.max(0, p.stock);

export const isPurchasable = (p: Product, quantity = 1): boolean =>
  p.status === "active" && availableStock(p) >= quantity;

/** All images in display order: primary first, then gallery. */
export const productImages = (p: Product): readonly string[] =>
  p.primaryImageUrl ? [p.primaryImageUrl, ...p.gallery] : p.gallery;

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL slug: readable name + SKU, so it's unique and stable while the SKU stays. */
export const productSlug = (p: Pick<Product, "name" | "sku">): string =>
  [slugify(p.name), slugify(p.sku)].filter(Boolean).join("-");
