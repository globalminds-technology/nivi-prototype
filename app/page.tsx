import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  title: "The Saree Studio — Handcrafted Sarees, Styled for Today.",
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

      <main className="flex-1 pb-20">
        {/* 2. HERO CAROUSEL (Edge-to-edge frame matching reference) */}
        <HeroCarousel campaigns={campaigns} heroBanner={heroBanner} />

        {/* 3. CATEGORY SECTION (Immediately attached to the banner with large circles) */}
        <CircularCategoryBar categories={categories} />

        {/* 4. INTERNATIONAL DELIVERY BANNER (Designed Section) */}
        <section className="w-full px-3.5 sm:px-5 md:px-0 my-3 sm:my-5 md:my-8">
          <div className="w-full rounded-2xl md:rounded-none overflow-hidden shadow-xs md:shadow-none"
               style={{ background: "linear-gradient(135deg, #FAF3E8 0%, #F5EBD8 40%, #EDE3D0 100%)" }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-10 md:gap-14 px-5 sm:px-10 py-5 sm:py-7 md:py-8">
              {/* Text */}
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm tracking-[0.2em] uppercase text-[#8B6914] font-medium mb-0.5 sm:mb-1">For</p>
                <h2 className="font-serif italic text-xl sm:text-3xl md:text-4xl font-bold text-[#7A1B2D] leading-tight">
                  International <span className="text-[#8B6914]">✦</span> Delivery
                </h2>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-[#C9A84C]/40" />

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/919800000000?text=Hello%20The%20Saree%20Studio%2C%20I%20would%20like%20to%20inquire%20about%20international%20delivery."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-4 px-4 sm:px-7 py-2 sm:py-3 rounded-full text-white transition-all hover:scale-[1.03] active:scale-[0.98] shadow-md"
                style={{ background: "linear-gradient(135deg, #7A1B2D 0%, #5C1420 100%)" }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-7 sm:h-7 fill-[#25D366] shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] sm:text-xs font-medium tracking-wide opacity-80">Contact WhatsApp</span>
                  <span className="text-sm sm:text-lg font-bold tracking-wide">98000 00000</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>
        </section>

        {/* 5. PRODUCT SHOWCASE SECTIONS */}
        <div className="space-y-5 sm:space-y-8 mt-4 sm:mt-8">
          {/* NEW ARRIVALS */}
          {newArrivals.length > 0 && (
            <section className="container mx-auto px-4 sm:px-6">
              <FeaturedCarousel
                products={newArrivals}
                title="New Arrivals"
                viewAllHref="/collections?tag=new_arrival"
              />
            </section>
          )}

          {/* FEATURED */}
          {featured.length > 0 && (
            <section className="container mx-auto px-4 sm:px-6">
              <FeaturedCarousel
                products={featured}
                title="Featured"
                viewAllHref="/collections?tag=featured"
              />
            </section>
          )}

          {/* BEST SELLERS */}
          {bestSellers.length > 0 && (
            <section className="container mx-auto px-4 sm:px-6">
              <FeaturedCarousel
                products={bestSellers}
                title="Best Sellers"
                viewAllHref="/collections?tag=bestseller"
              />
            </section>
          )}

          {/* DYNAMIC TAG SECTIONS */}
          {dynamicTagSections.map((section) => (
            <section key={section.key} className="container mx-auto px-4 sm:px-6">
              <FeaturedCarousel
                products={section.products}
                title={section.label}
                viewAllHref={`/collections?tag=${encodeURIComponent(section.key)}`}
              />
            </section>
          ))}
        </div>
      </main>

      {/* FLOATING ACTION BUTTON: Find Your Perfect Saree */}
      <Link
        href="/quiz"
        className="group fixed bottom-20 md:bottom-5 right-3 md:right-4 z-40 h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-[#0B4B42] via-[#073C35] to-[#03231F] text-[#FAF7F0] border-2 border-[#C9A45C] shadow-[0_8px_24px_rgba(7,60,53,0.45)] hover:shadow-[0_12px_36px_rgba(201,164,92,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center p-1 focus:outline-hidden ring-2 ring-[#C9A45C]/20 hover:ring-[#C9A45C]/60"
        aria-label="Find Your Perfect Saree — Saree Matchmaker"
      >
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C378] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C9A45C] border border-[#073C35]" />
        </span>

        <span className="font-serif text-[9.5px] sm:text-[10px] font-bold tracking-widest text-[#FAF7F0] uppercase leading-none">
          SAREE
        </span>
        <span className="text-[7.5px] sm:text-[8px] text-[#E5C378] font-sans font-semibold tracking-wider uppercase leading-none mt-1">
          MATCH
        </span>

        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden md:group-hover:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#073C35]/95 backdrop-blur-md border border-[#C9A45C]/60 text-white shadow-xl whitespace-nowrap pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-right-2">
          <span className="font-serif text-xs font-semibold text-[#FFFCF5]">Find Your Perfect Saree</span>
          <span className="text-[10px] text-[#E5C378] font-sans font-medium uppercase tracking-wider">• 2-Min Matchmaker</span>
          <ArrowRight className="h-3 w-3 text-[#E5C378]" />
        </div>
      </Link>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
