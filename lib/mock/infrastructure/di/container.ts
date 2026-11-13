import type { Product } from "../../core/domain/entities/product";
import { productSlug } from "../../core/domain/entities/product";
import { MOCK_PRODUCTS } from "../../data/mock-catalog";
import type { Review, ReviewSummary } from "../../core/domain/entities/review";
import { summarizeReviews } from "../../core/domain/entities/review";
import { Money } from "../../core/domain/value-objects/money";
import type { ShippingOption } from "../../core/application/ports/shipping-repository";

const mockReviews: Review[] = [
  {
    id: "rev_01",
    sku: "TSS-KAN-001",
    invoiceId: "INV-001",
    rating: 5,
    title: "Pure Heirloom Quality",
    comment: "The zari work and the feel of pure silk exceeded my expectations. Draped gracefully for my daughter's wedding.",
    authorName: "Ananya R.",
    createdAt: new Date().toISOString(),
    hidden: false,
  },
  {
    id: "rev_02",
    sku: "TSS-COT-003",
    invoiceId: "INV-002",
    rating: 5,
    title: "Breathable & Authentic",
    comment: "The Sungudi dye and handloom texture are exquisite. Very lightweight and comfortable for everyday wear.",
    authorName: "Priyanka S.",
    createdAt: new Date().toISOString(),
    hidden: false,
  },
];

const mockShippingOptions: ShippingOption[] = [
  {
    id: "standard",
    name: "Standard Delivery (5–7 days)",
    type: "standard",
    rate: Money.zero(),
    rateMinor: 0,
    estimatedDays: "5–7 business days",
  },
  {
    id: "express",
    name: "Express Delivery (2–3 days)",
    type: "express",
    rate: Money.ofMinor(9900),
    rateMinor: 9900,
    estimatedDays: "2–3 business days",
  },
];

const mockVendors: Array<{ id: string; name: string }> = [
  { id: "vendor_01", name: "Kanchipuram Weavers Co-op" },
  { id: "vendor_02", name: "Banarasi Artisans Guild" },
  { id: "vendor_03", name: "South India Handloom Federation" },
];

export const container = {
  getZohoOrgId: () => "PROTOTYPE_STUDIO",

  adminAuth: {
    getCurrentSession: async () => ({
      email: "designer@thesareestudio.com",
      role: "admin" as const,
      name: "The Saree Studio Admin",
      hideZohoBooks: true,
    }),
    requireAdmin: async () => {
      // Mock: always passes for prototype
    },
  },

  listProducts: () => ({
    execute: async (filter?: { status?: string }) => {
      if (filter?.status) {
        return MOCK_PRODUCTS.filter((p) => p.status === filter.status);
      }
      return [...MOCK_PRODUCTS];
    },
  }),

  listAdminProducts: () => ({
    execute: async () => [...MOCK_PRODUCTS],
  }),

  listOffers: () => ({
    execute: async () => MOCK_PRODUCTS.filter((p) => p.offer?.active),
  }),

  getProduct: () => ({
    execute: async (slugOrId: string): Promise<Product | null> => {
      const found = MOCK_PRODUCTS.find(
        (p) =>
          p.id === slugOrId ||
          p.sku.toLowerCase() === slugOrId.toLowerCase() ||
          productSlug(p) === slugOrId ||
          slugOrId.includes(p.sku.toLowerCase()),
      );
      return found ?? null;
    },
  }),

  getProductById: () => ({
    execute: async (id: string): Promise<Product | null> => {
      return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
    },
  }),

  getAdminProductById: () => ({
    execute: async (id: string): Promise<Product> => {
      const p = MOCK_PRODUCTS.find((prod) => prod.id === id);
      if (!p) throw new Error(`Product ${id} not found`);
      return p;
    },
  }),

  getVendors: async (): Promise<Array<{ id: string; name: string }>> => {
    return mockVendors;
  },

  getShippingOptions: async (): Promise<ShippingOption[]> => {
    return mockShippingOptions;
  },

  reviewRepository: () => ({
    listAll: async (): Promise<readonly Review[]> => mockReviews,
    listBySku: async (sku: string): Promise<Review[]> => {
      return mockReviews.filter((r) => r.sku.toLowerCase() === sku.toLowerCase() && !r.hidden);
    },
    getSummary: async (sku: string): Promise<ReviewSummary> => {
      const revs = mockReviews.filter((r) => r.sku.toLowerCase() === sku.toLowerCase() && !r.hidden);
      return summarizeReviews(revs);
    },
  }),

  reviews: {
    listBySku: async (sku: string): Promise<Review[]> => {
      return mockReviews.filter((r) => r.sku.toLowerCase() === sku.toLowerCase() && !r.hidden);
    },
    getSummary: async (sku: string): Promise<ReviewSummary> => {
      const revs = mockReviews.filter((r) => r.sku.toLowerCase() === sku.toLowerCase() && !r.hidden);
      return summarizeReviews(revs);
    },
  },
};

