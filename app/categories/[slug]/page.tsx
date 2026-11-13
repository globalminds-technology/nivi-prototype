import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";
import { GoldText } from "@/components/store/gold-text";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CatalogGrid } from "@/components/store/catalog-grid";
import { buttonVariants } from "@/components/ui/button";
import type { StoreProductData } from "@/components/store/product-card";
import { connection } from "next/server";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { CategoryRepository } from "@/infrastructure/categories/category-repository";
import { container } from "@/infrastructure/di/container";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const instant = false;

function normalizeCategoryStr(s?: string | null): string {
  return (s ?? "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function matchesCategory(
  productCategory: string | null | undefined,
  catName: string,
  catSlug: string
): boolean {
  if (!productCategory) return false;
  const pNorm = normalizeCategoryStr(productCategory);
  const nameNorm = normalizeCategoryStr(catName);
  const slugNorm = normalizeCategoryStr(catSlug);
  return (
    pNorm === nameNorm ||
    pNorm === slugNorm ||
    (pNorm.length > 3 && nameNorm.includes(pNorm)) ||
    (nameNorm.length > 3 && pNorm.includes(nameNorm))
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  await connection();
  const { slug } = await params;
  const categoryRepo = new CategoryRepository();
  const category = await categoryRepo.getBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found — The Saree Studio",
    };
  }

  return {
    title: `${category.name} Sarees — The Saree Studio`,
    description:
      category.description ||
      `Explore our handcrafted collection of authentic ${category.name} sarees.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  await connection();
  const { slug } = await params;

  const categoryRepo = new CategoryRepository();
  const category = await categoryRepo.getBySlug(slug);

  if (!category) {
    notFound();
  }

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
    console.error("[CategoryPage] Failed loading products:", err);
  }

  // Filter products strictly matching this category
  const categoryProducts = storeProducts.filter((p) =>
    matchesCategory(p.category, category.name, category.slug)
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={storeProducts} />

      <main className="flex-1 space-y-10 pb-16">
        {/* BREADCRUMB */}
        <div className="container mx-auto px-4 sm:px-6 pt-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/collections" className="hover:text-foreground transition-colors">
              Collections
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{category.name}</span>
          </nav>
        </div>

        {/* CATEGORY HERO BANNER */}
        <section className="container mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 sm:p-10 md:p-12 shadow-xs">
            {category.imageUrl && (
              <div className="absolute inset-0 z-0 opacity-15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-3">
              <GoldText>{category.name}</GoldText>

              {category.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  {category.description}
                </p>
              )}

              <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
                <span>
                  {categoryProducts.length} {categoryProducts.length === 1 ? "piece" : "pieces"} available
                </span>
                <span>•</span>
                <span>Direct Artisan Inventory</span>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS IN THIS CATEGORY */}
        <section className="container mx-auto px-4 sm:px-6">
          {categoryProducts.length > 0 ? (
            <CatalogGrid
              products={categoryProducts}
              initialCategory={category.name}
            />
          ) : (
            <div className="text-center py-16 px-6 rounded-3xl border border-border/70 bg-card max-w-lg mx-auto shadow-2xs space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  No sarees currently in {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our generational weavers are crafting new handloom pieces for this collection. Explore other active weaves across our store.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/collections"
                  className={buttonVariants({ variant: "default", size: "sm", className: "rounded-full text-xs font-medium" })}
                >
                  Browse All Collections
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* BACK BUTTON */}
        <div className="container mx-auto px-4 sm:px-6 pt-4">
          <Link
            href="/collections"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "gap-2 text-xs",
            })}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Collections</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
