import { ValidationError } from "../errors/domain-errors";
import { type DisplayTag, normalizeTags } from "../value-objects/display-tag";
import { createGallery, type Gallery } from "../value-objects/gallery";
import type { Money } from "../value-objects/money";
import type { Offer } from "../value-objects/offer";
import type { Sku } from "../value-objects/sku";

export type ProductStatus = "active" | "inactive";

export type SareeAttributes = Readonly<{
  fabric?: string | null;
  occasion?: readonly string[];
  style?: readonly string[];
  comfort?: readonly string[];
  border?: string | null;
  colourPalette?: string | null;
  primaryColour?: string | null;
}>;

export type Product = Readonly<{
  id: string;
  sku: Sku;
  name: string;
  description: string;
  price: Money;
  costPrice?: Money | null;
  vendorId?: string | null;
  vendorName?: string | null;
  stock: number;
  taxId: string | null;
  taxPercentage: number;
  primaryImageUrl: string | null;
  category?: string | null;
  gallery: Gallery;
  tags: readonly DisplayTag[];
  offer: Offer | null;
  status: ProductStatus;
  attributes?: SareeAttributes;
}>;

export type ProductProps = Omit<Product, "gallery" | "tags"> & {
  gallery?: readonly string[];
  tags?: readonly string[];
};

export function createProduct(props: ProductProps): Product {
  const name = props.name.trim();
  if (name.length < 2) throw new ValidationError("Product name must be at least 2 characters");
  return Object.freeze({
    ...props,
    name,
    category: props.category ? props.category.trim() : null,
    costPrice: props.costPrice ?? null,
    vendorId: props.vendorId ?? null,
    vendorName: props.vendorName ?? null,
    description: props.description.trim(),
    gallery: createGallery(props.gallery ?? []),
    tags: normalizeTags(props.tags ?? []),
    attributes: props.attributes
      ? Object.freeze({
          fabric: props.attributes.fabric ? props.attributes.fabric.trim() : null,
          occasion: props.attributes.occasion ? Object.freeze([...props.attributes.occasion]) : [],
          style: props.attributes.style ? Object.freeze([...props.attributes.style]) : [],
          comfort: props.attributes.comfort ? Object.freeze([...props.attributes.comfort]) : [],
          border: props.attributes.border ? props.attributes.border.trim() : null,
          colourPalette: props.attributes.colourPalette ? props.attributes.colourPalette.trim() : null,
          primaryColour: props.attributes.primaryColour ? props.attributes.primaryColour.trim() : null,
        })
      : undefined,
  });
}

export const availableStock = (p: Product): number => Math.max(0, p.stock);

export const isPurchasable = (p: Product, quantity = 1): boolean =>
  p.status === "active" && availableStock(p) >= quantity;

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

export const productSlug = (p: Pick<Product, "name" | "sku">): string =>
  [slugify(p.name), slugify(p.sku)].filter(Boolean).join("-");

