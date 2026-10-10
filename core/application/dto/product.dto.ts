import { z } from "zod";
import { normalizeSku, SKU_PATTERN } from "../../domain/value-objects/sku";

export const ProductOfferDto = z.object({
  active: z.boolean().default(false),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive("Offer value must be greater than 0"),
  label: z.string().default(""),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be YYYY-MM-DD").optional().nullable(),
});

export const ProductInputDto = z.object({
  sku: z.preprocess(
    (val) => (typeof val === "string" ? normalizeSku(val) : val),
    z.string().regex(SKU_PATTERN, "SKU must contain only letters, numbers, hyphens and underscores"),
  ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().default(""),
  price: z.number().nonnegative("Price cannot be negative"), // In Major units (Rupees) - Selling Price
  costPrice: z.number().nonnegative("Cost price cannot be negative").optional().nullable(), // Purchase Price
  stock: z.number().int().default(0),
  taxId: z.string().optional().nullable(),
  taxPercentage: z.number().min(0).max(100).default(0),
  primaryImageUrl: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  gallery: z.array(z.string().url()).max(11, "Maximum 11 gallery images").default([]),
  tags: z.array(z.string()).default([]),
  offer: ProductOfferDto.optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ProductOfferDto = z.infer<typeof ProductOfferDto>;
export type ProductInputDto = z.infer<typeof ProductInputDto>;
