import { NextResponse, NextRequest, connection } from "next/server";
import { container } from "@/infrastructure/di/container";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import type { StoreProductData } from "@/components/store/product-card";

function normalizeTagKey(tag: string): string {
  const compact = tag.toLowerCase().trim().replace(/[\s-_]+/g, "");
  if (compact === "bestseller") return "bestseller";
  if (compact === "newarrival") return "new_arrival";
  if (compact === "limitededition") return "limited_edition";
  return tag.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function productMatchesTag(productTags: readonly string[], targetTag: string): boolean {
  const targetNorm = normalizeTagKey(targetTag);
  return productTags.some((t) => normalizeTagKey(t) === targetNorm);
}

function normalizeCategoryStr(s?: string | null): string {
  return (s ?? "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

export async function GET(request: NextRequest) {
  await connection();
  try {
    const searchParams = request.nextUrl.searchParams;

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "25", 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 25;

    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const categoryFilter = (searchParams.get("category") || "").trim();
    const tagFilter = (searchParams.get("tag") || "").trim();
    const sort = (searchParams.get("sort") || "featured").trim().toLowerCase();

    // Fetch active products from domain layer (Zoho repository via container)
    const listUseCase = container.listProducts();
    const domainProducts = await listUseCase.execute({ status: "active" });

    const storeProducts: StoreProductData[] = domainProducts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: productSlug(p),
      priceMinor: p.price.minor,
      stock: p.stock,
      primaryImageUrl: p.primaryImageUrl,
      tags: p.tags,
      category: p.category ?? null,
      offer: p.offer
        ? {
            active: p.offer.active,
            type: p.offer.type,
            value:
              p.offer.type === "percent"
                ? p.offer.percent
                : Money.toMajor(p.offer.amount),
            label: p.offer.label,
          }
        : null,
    }));

    // Collect available unique categories and tags for filtering UI
    const availableCategories = Array.from(
      new Set(storeProducts.map((p) => p.category).filter(Boolean) as string[])
    );
    const availableTags = Array.from(
      new Set(storeProducts.flatMap((p) => p.tags).filter(Boolean))
    );

    // Apply filters
    let filtered = storeProducts;

    // Search query
    if (query) {
      filtered = filtered.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const skuMatch = p.sku.toLowerCase().includes(query);
        const catMatch = (p.category ?? "").toLowerCase().includes(query);
        const tagMatch = p.tags.some((t) => t.toLowerCase().includes(query));
        return nameMatch || skuMatch || catMatch || tagMatch;
      });
    }

    // Category filter
    if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
      const normCat = normalizeCategoryStr(categoryFilter);
      filtered = filtered.filter((p) => {
        if (!p.category) return false;
        const normProductCat = normalizeCategoryStr(p.category);
        return normProductCat === normCat || normProductCat.includes(normCat) || normCat.includes(normProductCat);
      });
    }

    // Tag filter
    if (tagFilter && tagFilter.toLowerCase() !== "all") {
      filtered = filtered.filter((p) => productMatchesTag(p.tags, tagFilter));
    }

    // Sorting
    switch (sort) {
      case "price-asc":
      case "price_asc":
        filtered.sort((a, b) => a.priceMinor - b.priceMinor);
        break;
      case "price-desc":
      case "price_desc":
        filtered.sort((a, b) => b.priceMinor - a.priceMinor);
        break;
      case "name-asc":
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        // Prioritize new arrivals if tagged
        filtered.sort((a, b) => {
          const aNew = productMatchesTag(a.tags, "new_arrival") ? 1 : 0;
          const bNew = productMatchesTag(b.tags, "new_arrival") ? 1 : 0;
          return bNew - aNew;
        });
        break;
      case "featured":
      default:
        // Prioritize featured if tagged
        filtered.sort((a, b) => {
          const aFeat = productMatchesTag(a.tags, "featured") ? 1 : 0;
          const bFeat = productMatchesTag(b.tags, "featured") ? 1 : 0;
          return bFeat - aFeat;
        });
        break;
    }

    // Pagination (20 per page default)
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const validPage = Math.min(page, totalPages);
    const startIndex = (validPage - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        page: validPage,
        limit,
        total,
        totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1,
      },
      availableCategories,
      availableTags,
    });
  } catch (error) {
    console.error("[GET /api/products] Error:", error);
    return NextResponse.json(
      { error: "Failed to list products", details: String(error) },
      { status: 500 }
    );
  }
}
