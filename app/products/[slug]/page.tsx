import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Sparkles, Truck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { PriceTag } from "@/components/store/price-tag";
import { ProductActions } from "@/components/store/product-actions";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductReviews } from "@/components/store/product-reviews";
import { FeaturedCarousel } from "@/components/store/featured-carousel";
import type { StoreProductData } from "@/components/store/product-card";
import { productImages, productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import { connection } from "next/server";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await container.getProduct().execute(slug);
    const images = productImages(product);
    return {
      title: `${product.name} — Handcrafted Collection · NiVi`,
      description:
        product.description ||
        `Shop ${product.name} at NiVi. Curated Indian heritage textiles, delivered across India.`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: images.length > 0 ? [{ url: images[0] }] : undefined,
      },
    };
  } catch {
    return {
      title: "Product Not Found · NiVi",
    };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  await connection();
  const { slug } = await params;

  let product;
  try {
    const getUseCase = container.getProduct();
    product = await getUseCase.execute(slug);
  } catch {
    notFound();
  }

  // Load all products for header search and cart
  let allProducts: StoreProductData[] = [];
  try {
    const list = await container.listProducts().execute({ status: "active" });
    allProducts = list.map((p) => ({
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
  } catch {
    // Graceful fallback
  }

  const allImages = productImages(product);
  const effectivePriceMajor = product.offer?.active
    ? product.offer.type === "percent"
      ? (product.price.minor * (1 - product.offer.percent / 100)) / 100
      : Math.max(0, product.price.minor / 100 - Money.toMajor(product.offer.amount))
    : product.price.minor / 100;

  // JSON-LD structured data for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: allImages,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: effectivePriceMajor,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Nivi",
      },
    },
  };

  let reviewData = {
    reviews: [] as readonly import("@/core/domain/entities/review").Review[],
    summary: { count: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  };
  try {
    reviewData = await container.listReviews().execute(product.sku);
  } catch {
    // Graceful fallback if reviews aren't ready
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={allProducts} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Collections</span>
          </Link>
        </nav>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={allImages} productName={product.name} />
          </div>

          {/* Right: Info & Purchase */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  SKU: {product.sku}
                </span>

                {product.offer?.active && (
                  <Badge className="bg-primary text-primary-foreground font-medium text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>{product.offer.label || `${product.offer.type === "percent" ? product.offer.percent : Money.toMajor(product.offer.amount)}% OFF`}</span>
                  </Badge>
                )}

                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="capitalize text-[10px]">
                    {tag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing */}
            <div className="pt-2">
              <PriceTag
                priceMinor={product.price.minor}
                offer={
                  product.offer
                    ? {
                        active: product.offer.active,
                        type: product.offer.type,
                        value:
                          product.offer.type === "percent"
                            ? product.offer.percent
                            : Money.toMajor(product.offer.amount),
                        label: product.offer.label,
                      }
                    : null
                }
                size="lg"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Inclusive of all taxes. Free express shipping across India.
              </p>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.stock > 5
                    ? "bg-green-500"
                    : product.stock > 0
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              <span className="font-medium text-foreground">
                {product.stock > 5
                  ? "In Stock — Ready for dispatch"
                  : product.stock > 0
                    ? `Only ${product.stock} pieces left in inventory`
                    : "Sold Out — Inquire for custom weaving"}
              </span>
            </div>

            {/* Product Actions (Add to bag, Qty, Wishlist, WhatsApp) */}
            <ProductActions
              sku={product.sku}
              name={product.name}
              stock={product.stock}
            />

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-border/50 space-y-2">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Curator&apos;s Notes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Accordion Specs & Information */}
            <div className="pt-2">
              <Accordion defaultValue={["craftsmanship"]}>
                <AccordionItem value="craftsmanship">
                  <AccordionTrigger>Craftsmanship & Textile Story</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Every piece at Nivi is individually crafted by generational artisans. From hand-spun mulberry silk to intricate zari borders, slight variations in weave and texture attest to authentic handloom provenance.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="care">
                  <AccordionTrigger>Care & Preservation</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-xs">
                      <li>Dry clean exclusively for pure silk and zari weaves.</li>
                      <li>Store wrapped in unbleached cotton muslin cloth.</li>
                      <li>Avoid spraying perfume directly onto metal or metallic zari threads.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping">
                  <AccordionTrigger>Shipping & Authenticity Guarantee</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-muted-foreground text-xs">
                      <p className="flex items-center gap-1.5 text-foreground font-medium">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        <span>Complimentary Express Shipping in India</span>
                      </p>
                      <p>
                        Dispatched within 24–48 hours from our studio. Complete GST invoice and courier tracking details are emailed immediately upon dispatch.
                      </p>
                      <p className="flex items-center gap-1.5 text-foreground font-medium pt-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                        <span>100% Genuine Handloom Certification</span>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Verified Patron Reviews Section */}
        <ProductReviews
          sku={product.sku}
          productName={product.name}
          reviews={reviewData.reviews}
          summary={reviewData.summary}
        />

        {/* You May Also Cherish - Related Saree Carousel (4.25 Desktop / 2.25 Mobile peek) */}
        {allProducts.filter((p) => p.sku !== product.sku).length > 0 && (
          <div className="pt-6 border-t border-border/50">
            <FeaturedCarousel
              products={allProducts.filter((p) => p.sku !== product.sku).slice(0, 8)}
              title="You May Also Cherish"
              subtitle="Complementary weaves handpicked by our heritage curators"
              viewAllHref="/#catalog"
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
