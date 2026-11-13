import { connection } from "next/server";
import { container } from "@/infrastructure/di/container";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WishlistClient } from "./wishlist-client";
import type { StoreProductData } from "@/components/store/product-card";

export const metadata = {
  title: "My Wishlist · The Saree Studio",
  description: "View your saved handcrafted sarees and festival ensembles.",
};

export const instant = false;

export default async function WishlistPage() {
  await connection();
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
  } catch (err: unknown) {
    console.error("Wishlist error loading products:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-neutral-900">
      <Header products={storeProducts} />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 md:py-16">
        <WishlistClient products={storeProducts} />
      </main>
      <Footer />
    </div>
  );
}
