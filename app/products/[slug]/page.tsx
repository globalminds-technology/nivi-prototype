import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  await connection();
  const { slug } = await params;
  try {
    const product = await container.getProduct().execute(slug);
    const images = productImages(product);
    return {
      title: `${product.name} — Handcrafted Collection · The Saree Studio`,
      description:
        product.description ||
        `Shop ${product.name} at The Saree Studio. Curated Indian heritage textiles, delivered across India.`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: images.length > 0 ? [{ url: images[0] }] : undefined,
      },
    };
  } catch {
    return {
      title: "Product Not Found · The Saree Studio",
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

  // Load active products for header search and related carousel
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
        name: "The Saree Studio",
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

  // Extract only genuine saree attributes present in Zoho Books (no placeholders)
  const specItems: { label: string; value: string | readonly string[] }[] = [];
  if (product.category && product.category.trim()) {
    specItems.push({ label: "Category", value: product.category.trim() });
  }
  if (product.attributes?.fabric && product.attributes.fabric.trim()) {
    specItems.push({ label: "Fabric", value: product.attributes.fabric.trim() });
  }
  if (product.attributes?.border && product.attributes.border.trim()) {
    specItems.push({ label: "Border Type", value: product.attributes.border.trim() });
  }
  if (product.attributes?.primaryColour && product.attributes.primaryColour.trim()) {
    specItems.push({ label: "Colour", value: product.attributes.primaryColour.trim() });
  }
  if (product.attributes?.colourPalette && product.attributes.colourPalette.trim()) {
    specItems.push({ label: "Palette", value: product.attributes.colourPalette.trim() });
  }
  if (product.attributes?.occasion && product.attributes.occasion.length > 0) {
    specItems.push({ label: "Occasion", value: product.attributes.occasion });
  }
  if (product.attributes?.style && product.attributes.style.length > 0) {
    specItems.push({ label: "Style", value: product.attributes.style });
  }
  if (product.attributes?.comfort && product.attributes.comfort.length > 0) {
    specItems.push({ label: "Feel & Comfort", value: product.attributes.comfort });
  }

  // Related products from the same category or active collection
  const relatedProducts = allProducts
    .filter((p) => p.sku !== product.sku)
    .slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={allProducts} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6B5A4A] flex-wrap">
          <Link href="/" className="hover:text-[#073C35] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-[#073C35] transition-colors">
            Collections
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <span className="text-[#6B5A4A]">{product.category}</span>
            </>
          )}
          <span>/</span>
          <span className="text-[#221811] font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Product Hero Grid (Compact 2-Column: Left Gallery, Right Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Product Gallery (Sticky on desktop, constrained to viewport height) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ProductGallery images={allImages} productName={product.name} />
          </div>

          {/* Right: Real Product Info & Actions */}
          <div className="lg:col-span-7 space-y-5">
            {/* Header: SKU, Badges & Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-[#6B5A4A] tracking-wider uppercase bg-[#D5CCBB]/35 px-2 py-0.5 rounded-sm">
                  SKU: {product.sku}
                </span>

                {product.offer?.active && (
                  <Badge className="bg-[#073C35] text-[#FAF7F0] font-medium text-[11px] gap-1 border-0">
                    <span>
                      {product.offer.label ||
                        `${product.offer.type === "percent" ? product.offer.percent : Money.toMajor(product.offer.amount)}% OFF`}
                    </span>
                  </Badge>
                )}

                {product.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="capitalize text-[10.5px] bg-[#D5CCBB]/40 text-[#30251F] border-0"
                  >
                    {tag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#221811] leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing */}
            <div className="pt-1">
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
              <p className="text-[11.5px] text-[#6B5A4A] mt-1">
                Inclusive of all taxes. Free express shipping across India.
              </p>
            </div>

            {/* Stock Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.stock > 5
                    ? "bg-emerald-600"
                    : product.stock > 0
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              <span className="font-medium text-[#221811]">
                {product.stock > 5
                  ? "In Stock — Ready for dispatch"
                  : product.stock > 0
                    ? `Only ${product.stock} pieces left in inventory`
                    : "Sold Out — Inquire for custom weaving"}
              </span>
            </div>

            {/* Actions: Quantity Selector + Add to Bag + Wishlist + WhatsApp Direct Inquiry */}
            <ProductActions
              sku={product.sku}
              name={product.name}
              stock={product.stock}
            />

            {/* Genuine Description from Zoho Books */}
            {product.description && (
              <div className="pt-4 border-t border-[#D5CCBB]/70 space-y-2">
                <h3 className="text-xs font-serif font-bold text-[#694208] uppercase tracking-wider">
                  Description
                </h3>
                <p className="text-xs sm:text-sm text-[#4A3D33] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Real Saree Specifications Grid (Only Non-Empty Attributes) */}
            {specItems.length > 0 && (
              <div className="pt-4 border-t border-[#D5CCBB]/70 space-y-3">
                <h3 className="text-xs font-serif font-bold text-[#694208] uppercase tracking-wider">
                  Saree Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {specItems.map((spec) => (
                    <div
                      key={spec.label}
                      className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D5CCBB]/60"
                    >
                      <span className="text-[10px] font-sans uppercase tracking-wider text-[#7C6A59] block">
                        {spec.label}
                      </span>
                      <div className="text-xs font-medium text-[#221811] mt-0.5">
                        {Array.isArray(spec.value) ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {spec.value.map((v) => (
                              <span
                                key={v}
                                className="inline-block text-[10px] bg-[#073C35]/10 text-[#073C35] px-1.5 py-0.5 rounded font-sans font-medium"
                              >
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          spec.value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Saree Matchmaker Discovery Banner */}
            <div className="p-3.5 rounded-xl bg-[#073C35] text-[#FAF7F0] flex items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <p className="font-serif text-xs font-semibold text-white">
                  Find Your Perfect Saree Match
                </p>
                <p className="text-[10.5px] text-[#E5C378]">
                  Take our 2-min Saree Matchmaker for personalized drape & blouse recommendations
                </p>
              </div>
              <Link
                href="/quiz"
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#FAF7F0] text-[#073C35] text-[11px] font-semibold hover:bg-white transition-colors"
              >
                Find Match
              </Link>
            </div>
          </div>
        </div>

        {/* Verified Patron Reviews (Only displayed when real reviews exist) */}
        {reviewData.reviews.length > 0 && (
          <ProductReviews
            sku={product.sku}
            productName={product.name}
            reviews={reviewData.reviews}
            summary={reviewData.summary}
          />
        )}

        {/* Related Sarees from Active Collection */}
        {relatedProducts.length > 0 && (
          <div className="pt-6 border-t border-[#D5CCBB]/70">
            <FeaturedCarousel
              products={relatedProducts}
              title="You May Also Cherish"
              subtitle="Complementary weaves handpicked by our heritage curators"
              viewAllHref="/collections"
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
