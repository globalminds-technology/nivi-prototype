import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Calendar, Percent, Sparkles, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { ProductCard, type StoreProductData } from "@/components/store/product-card";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const campaign = await offerCampaignRepository.getById(id).catch(() => null);

  if (!campaign) {
    return {
      title: "Campaign Not Found · NiVi",
    };
  }

  const discountLabel =
    campaign.type === "percent"
      ? `${campaign.value}% OFF`
      : `₹${campaign.value} OFF`;

  return {
    title: `${campaign.bannerTitle || campaign.name} (${discountLabel}) · NiVi`,
    description:
      campaign.bannerSubtitle ||
      campaign.label ||
      `Explore exclusive offers on curated handpicked sarees in our ${campaign.name} promotion.`,
  };
}

export default async function CampaignOffersPage({ params }: PageProps) {
  await connection();
  const { id } = await params;

  const campaign = await offerCampaignRepository.getById(id).catch(() => null);

  if (!campaign) {
    notFound();
  }

  // Fetch all domain products
  let allProducts: StoreProductData[] = [];
  let campaignProducts: StoreProductData[] = [];

  try {
    const listUseCase = container.listProducts();
    const domainProducts = await listUseCase.execute({ status: "active" });

    allProducts = domainProducts.map((p) => ({
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

    // Filter products strictly enrolled in this campaign
    const enrolledIds = new Set(campaign.productIds);
    campaignProducts = domainProducts
      .filter((p) => enrolledIds.has(p.id) || enrolledIds.has(p.sku))
      .map((p) => {
        // Enforce campaign discount formatting so live price reflects campaign discount
        const offer = {
          active: true,
          type: campaign.type,
          value: campaign.value,
          label: campaign.label || campaign.name,
        };

        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          slug: productSlug(p),
          priceMinor: p.price.minor,
          stock: p.stock,
          primaryImageUrl: p.primaryImageUrl,
          tags: p.tags,
          category: p.category ?? null,
          offer,
        };
      });
  } catch (err) {
    console.error("Error loading products for campaign:", err);
  }

  const discountBadgeText =
    campaign.type === "percent"
      ? `${campaign.value}% OFF`
      : `₹${campaign.value} OFF`;

  const bannerImg = campaign.bannerImageUrl;

  return (
    <div className="min-h-screen flex flex-col bg-background text-neutral-900 selection:bg-primary/20 selection:text-primary">
      <Header products={allProducts} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <Link
            href="/offers"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to All Offers
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            {campaignProducts.length} {campaignProducts.length === 1 ? "saree" : "sarees"} enrolled
          </span>
        </div>

        {/* Clean Banner Graphic */}
        {bannerImg && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200/60 shadow-sm bg-neutral-950 aspect-[3/1] sm:aspect-[3.6/1] w-full min-h-[160px] max-h-[420px]">
            <Image
              src={bannerImg}
              alt={campaign.bannerTitle || campaign.name}
              fill
              priority
              unoptimized
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
          </div>
        )}

        {/* Campaign Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {campaign.bannerTitle || campaign.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>{discountBadgeText}</span>
              </span>
            </div>
            {(campaign.bannerSubtitle || campaign.label) && (
              <p className="text-xs text-muted-foreground">
                {campaign.bannerSubtitle || campaign.label}
              </p>
            )}
          </div>

          {campaign.expiry && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Valid till {new Date(campaign.expiry).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Sarees Grid Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span>Exclusive Sarees in this Collection</span>
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {campaignProducts.length} items available
            </span>
          </div>

          {campaignProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 my-8 space-y-3">
              <Percent className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <h3 className="font-medium text-foreground text-base">No sarees currently enrolled</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Items are being curated for this campaign. Please explore our full collection or check other special offers.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/collections" className={buttonVariants({ variant: "default", size: "sm" })}>
                  Explore Collections
                </Link>
                <Link href="/offers" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Other Offers
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-3.5">
              {campaignProducts.map((product) => (
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
