import { NextRequest, NextResponse } from "next/server";
import { MOCK_PRODUCTS } from "@/lib/mock/data/mock-catalog";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import type { StoreProductData } from "@/components/store/product-card";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const category = (searchParams.get("category") || "").trim();
  const sort = searchParams.get("sort") || "featured";

  // Filter active products
  let filtered = MOCK_PRODUCTS.filter((p) => p.status === "active");

  // Search by name/description/sku
  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (category && category !== "all") {
    filtered = filtered.filter(
      (p) => p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // Sort
  switch (sort) {
    case "price-asc":
      filtered.sort((a, b) => a.price.minor - b.price.minor);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price.minor - a.price.minor);
      break;
    case "name-asc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
      // Mock: reverse order (last items = "newest")
      filtered.reverse();
      break;
    case "featured":
    default:
      // Featured items first, then by order
      filtered.sort((a, b) => {
        const aFeat = a.tags.includes("featured") ? 0 : 1;
        const bFeat = b.tags.includes("featured") ? 0 : 1;
        return aFeat - bFeat;
      });
      break;
  }

  // Paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  // Map to StoreProductData shape
  const products: StoreProductData[] = pageItems.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: productSlug(p),
    priceMinor: p.price.minor,
    stock: p.stock,
    primaryImageUrl: p.primaryImageUrl,
    tags: p.tags as unknown as readonly string[],
    category: p.category ?? null,
    offer: p.offer
      ? {
          active: p.offer.active,
          type: p.offer.type,
          value:
            p.offer.type === "percent"
              ? (p.offer.percent ?? 0)
              : Money.toMajor(p.offer.amount!),
          label: p.offer.label,
        }
      : null,
  }));

  return NextResponse.json({
    products,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  });
}

