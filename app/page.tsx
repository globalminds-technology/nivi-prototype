import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CircularCategoryBar } from "@/components/store/circular-category-bar";
import { FeaturedCarousel } from "@/components/store/featured-carousel";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import type { StoreProductData } from "@/components/store/product-card";
import { connection } from "next/server";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { CategoryRepository } from "@/infrastructure/categories/category-repository";
import { container } from "@/infrastructure/di/container";
import { HeroCarousel } from "@/components/store/hero-carousel";
import { heroBannerRepository } from "@/infrastructure/hero-banner/hero-banner-repository";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";

export const instant = false;

export const metadata = {
  title: "NiVi — Woven with tradition, styled for today",
  description:
    "Curated collection of handcrafted Indian sarees, bespoke festive ensembles and heritage textiles. Delivered across India.",
};

/**
 * Normalizes tag strings for consistent multi-tag matching
 * e.g. "New Arrival", "new_arrival", "new-arrival" => "new_arrival"
 * "bestseller", "Best Seller", "best_seller" => "bestseller"
 */
function normalizeTagKey(tag: string): string {
  const compact = tag.toLowerCase().trim().replace(/[\s-_]+/g, "");
  if (compact === "bestseller") return "bestseller";
  if (compact === "newarrival") return "new_arrival";
  if (compact === "limitededition") return "limited_edition";
  return tag.toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function productMatchesTag(productTags: readonly string[], targetKey: string): boolean {
  const targetNorm = normalizeTagKey(targetKey);
  return productTags.some((t) => normalizeTagKey(t) === targetNorm);
}

function formatTagLabel(tagKey: string, originalTag?: string): string {
  if (originalTag && originalTag.trim().length > 0) {
    // If the original tag was "Bridal Wear", preserve capital words
    return originalTag
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return tagKey
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function HomePage() {
  await connection();
  let storeProducts: StoreProductData[] = [];
  let campaigns: import("@/core/domain/entities/offer-campaign").OfferCampaign[] = [];
  let heroBanner: import("@/core/domain/entities/hero-banner").HeroBannerConfig | null = null;
  const categoryRepo = new CategoryRepository();
  const categories = await categoryRepo.list();

  try {
    campaigns = await offerCampaignRepository.list();
    heroBanner = await heroBannerRepository.get();
  } catch (err) {
    console.error("Storefront error loading campaigns or hero banner:", err);
  }

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
  } catch (err: unknown) {
    console.error("Storefront error loading products:", err);
  }

  // 1. Primary tag showcases (strict matching, no fallbacks)
  const newArrivals = storeProducts.filter((p) => productMatchesTag(p.tags, "new_arrival"));
  const featured = storeProducts.filter((p) => productMatchesTag(p.tags, "featured"));
  const bestSellers = storeProducts.filter((p) => productMatchesTag(p.tags, "bestseller"));

  // 2. Dynamic tag sections: Any other tags that active products have (e.g. bridal, handcrafted, limited_edition)
  const standardKeys = new Set(["new_arrival", "featured", "bestseller"]);
  const dynamicTagMap = new Map<string, { label: string; products: StoreProductData[] }>();

  for (const product of storeProducts) {
    for (const rawTag of product.tags) {
      const key = normalizeTagKey(rawTag);
      if (!standardKeys.has(key) && key.length > 0) {
        if (!dynamicTagMap.has(key)) {
          const matching = storeProducts.filter((p) => productMatchesTag(p.tags, key));
          if (matching.length > 0) {
            dynamicTagMap.set(key, {
              label: formatTagLabel(key, rawTag),
              products: matching,
            });
          }
        }
      }
    }
  }

  const dynamicTagSections = Array.from(dynamicTagMap.entries()).map(([key, data]) => ({
    key,
    label: data.label,
    products: data.products,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background text-neutral-900 selection:bg-primary/20 selection:text-primary">
      {/* 1. STORE HEADER */}
      <Header products={storeProducts} categories={categories} />

      {/* 2. ROUND-SHAPED CATEGORY BAR (SUB-HEADER) */}
      <CircularCategoryBar categories={categories} />

      <main className="flex-1 space-y-8 sm:space-y-12 pb-20">
        {/* 3. HERO CAROUSEL (Initial Hero Slide + Active Campaign Banners from R2) */}
        <HeroCarousel campaigns={campaigns} heroBanner={heroBanner} />

        {/* 4. NEW ARRIVALS (Strictly tag = new_arrival) */}
        {newArrivals.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6">
            <FeaturedCarousel
              products={newArrivals}
              title="New Arrivals"
              viewAllHref="/collections?tag=new_arrival"
            />
          </section>
        )}

        {/* 5. FEATURED (Strictly tag = featured) */}
        {featured.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6">
            <FeaturedCarousel
              products={featured}
              title="Featured"
              viewAllHref="/collections?tag=featured"
            />
          </section>
        )}

        {/* 6. BEST SELLERS (Strictly tag = bestseller) */}
        {bestSellers.length > 0 && (
          <section className="container mx-auto px-4 sm:px-6">
            <FeaturedCarousel
              products={bestSellers}
              title="Best Sellers"
              viewAllHref="/collections?tag=bestseller"
            />
          </section>
        )}

        {/* 7. DYNAMIC TAG SECTIONS (Any other tags present on products, e.g. bridal, handcrafted) */}
        {dynamicTagSections.map((section) => (
          <section key={section.key} className="container mx-auto px-4 sm:px-6">
            <FeaturedCarousel
              products={section.products}
              title={section.label}
              viewAllHref={`/collections?tag=${encodeURIComponent(section.key)}`}
            />
          </section>
        ))}
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
