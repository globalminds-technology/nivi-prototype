import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, Package, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { ProductCard, type StoreProductData } from "@/components/store/product-card";
import { GoldText } from "@/components/store/gold-text";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";

export const instant = false;

export const metadata = {
  title: "Special Offers & Festive Discounts · NiVi",
  description: "Browse limited-time offers and seasonal discounts on curated handcrafted Indian ensembles.",
};

export default async function OffersPage() {
  await connection();
  let offerProducts: StoreProductData[] = [];
  let allProducts: StoreProductData[] = [];
  let activeCampaigns: OfferCampaign[] = [];

  try {
    const [offersDomain, allDomain, campaigns] = await Promise.all([
      container.listOffers().execute().catch(() => []),
      container.listProducts().execute({ status: "active" }).catch(() => []),
      offerCampaignRepository.list().catch(() => []),
    ]);

    activeCampaigns = campaigns.filter((c) => c.active);

    offerProducts = offersDomain.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: productSlug(p),
      priceMinor: p.price.minor,
      stock: p.stock,
      primaryImageUrl: p.primaryImageUrl,
      tags: p.tags,
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

    allProducts = allDomain.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: productSlug(p),
      priceMinor: p.price.minor,
      stock: p.stock,
      primaryImageUrl: p.primaryImageUrl,
      tags: p.tags,
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
    console.error("Error loading offers:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-neutral-900 selection:bg-primary/20 selection:text-primary">
      <Header products={allProducts} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {/* Breadcrumb / Header */}
        <div className="text-center max-w-xl mx-auto space-y-2 pb-5 border-b border-border/60">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group mb-1"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Catalog
          </Link>
          <GoldText>Special Offers & Promotions</GoldText>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Limited-time festive discounts and exclusive promotional collections.
          </p>
        </div>

        {/* 1. Featured Promotional Campaigns */}
        {activeCampaigns.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>Active Campaigns</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {activeCampaigns.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeCampaigns.map((camp) => {
                const discountText =
                  camp.type === "percent"
                    ? `${camp.value}% OFF`
                    : `₹${camp.value} OFF`;

                return (
                  <Link
                    key={camp.id}
                    href={`/offers/${camp.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Banner Image or Gradient Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                      {camp.bannerImageUrl ? (
                        <Image
                          src={camp.bannerImageUrl}
                          alt={camp.bannerTitle || camp.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-teal-900 to-neutral-950 flex items-center justify-center p-6 text-center">
                          <span className="font-serif text-lg font-bold text-amber-200">
                            {camp.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Badge top-right */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center rounded-full bg-amber-400 text-black px-2.5 py-0.5 text-xs font-bold shadow-md">
                          {discountText}
                        </span>
                      </div>

                      {/* Bottom title inside thumbnail */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-serif text-lg font-bold line-clamp-1 group-hover:text-amber-200 transition-colors">
                          {camp.bannerTitle || camp.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Footer */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {camp.bannerSubtitle || camp.label || "Exclusive handpicked festive discounts."}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-medium text-primary">
                        <span>
                          {camp.productIds.length} {camp.productIds.length === 1 ? "saree" : "sarees"} enrolled
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                          {camp.bannerCtaText || "Shop Collection"}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. All Discounted Sarees Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span>All Discounted Ensembles</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {offerProducts.length} items
            </span>
          </div>

          {offerProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 my-8 space-y-3">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground text-base">No active individual offers right now</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Our promotional calendar is refreshed frequently. Check out the campaigns above or explore our catalog.
              </p>
              <Link href="/collections" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Browse Full Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {offerProducts.map((product) => (
                <ProductCard key={product.sku} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
