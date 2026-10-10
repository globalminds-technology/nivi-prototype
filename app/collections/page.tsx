import { connection } from "next/server";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CircularCategoryBar } from "@/components/store/circular-category-bar";
import { CollectionsView } from "@/components/store/collections-view";
import type { StoreProductData } from "@/components/store/product-card";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { CategoryRepository } from "@/infrastructure/categories/category-repository";
import { container } from "@/infrastructure/di/container";

export const instant = false;

export const metadata = {
  title: "Handcrafted Collections — NiVi Sarees",
  description:
    "Explore our complete collection of handcrafted silk sarees, bridal master weaves, and festive handlooms. Delivered nationwide.",
};

interface CollectionsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
  }>;
}

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

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  await connection();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const query = (params.q || "").trim().toLowerCase();
  const categoryFilter = (params.category || "").trim();
  const tagFilter = (params.tag || "").trim();
  const sort = (params.sort || "featured").trim().toLowerCase();

  const categoryRepo = new CategoryRepository();
  const categories = await categoryRepo.list();

  let storeProducts: StoreProductData[] = [];
  try {
    const listUseCase = container.listProducts();
    const domainProducts = await listUseCase.execute({ status: "active" });

    storeProducts = domainProducts.map((p) => ({
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
  } catch (err) {
    console.error("[CollectionsPage] Failed loading products:", err);
  }

  const availableCategories = Array.from(
    new Set(storeProducts.map((p) => p.category).filter(Boolean) as string[])
  );
  const availableTags = Array.from(
    new Set(storeProducts.flatMap((p) => p.tags).filter(Boolean))
  );

  // Apply filters for initial server render
  let filtered = storeProducts;

  if (query) {
    filtered = filtered.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query);
      const skuMatch = p.sku.toLowerCase().includes(query);
      const catMatch = (p.category ?? "").toLowerCase().includes(query);
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(query));
      return nameMatch || skuMatch || catMatch || tagMatch;
    });
  }

  if (categoryFilter && categoryFilter.toLowerCase() !== "all") {
    const normCat = normalizeCategoryStr(categoryFilter);
    filtered = filtered.filter((p) => {
      if (!p.category) return false;
      const normProductCat = normalizeCategoryStr(p.category);
      return normProductCat === normCat || normProductCat.includes(normCat) || normCat.includes(normProductCat);
    });
  }

  if (tagFilter && tagFilter.toLowerCase() !== "all") {
    filtered = filtered.filter((p) => productMatchesTag(p.tags, tagFilter));
  }

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
      filtered.sort((a, b) => {
        const aNew = productMatchesTag(a.tags, "new_arrival") ? 1 : 0;
        const bNew = productMatchesTag(b.tags, "new_arrival") ? 1 : 0;
        return bNew - aNew;
      });
      break;
    case "featured":
    default:
      filtered.sort((a, b) => {
        const aFeat = productMatchesTag(a.tags, "featured") ? 1 : 0;
        const bFeat = productMatchesTag(b.tags, "featured") ? 1 : 0;
        return bFeat - aFeat;
      });
      break;
  }

  const limit = 20;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * limit;
  const initialPaginated = filtered.slice(startIndex, startIndex + limit);

  return (
    <div className="min-h-screen flex flex-col bg-background text-neutral-900 selection:bg-primary/20 selection:text-primary">
      {/* 1. Header with Deep Teal & Gold theme */}
      <Header products={storeProducts} />

      {/* 2. Round-shaped Category Bar */}
      <CircularCategoryBar categories={categories} />

      {/* 3. Main Collections View */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-20">
        <CollectionsView
          initialProducts={initialPaginated}
          initialPagination={{
            page: validPage,
            limit,
            total,
            totalPages,
            hasNext: validPage < totalPages,
            hasPrev: validPage > 1,
          }}
          availableCategories={availableCategories}
          availableTags={availableTags}
          initialTag={tagFilter}
          initialCategory={categoryFilter}
          initialQuery={query}
        />
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
