import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CheckoutView } from "@/components/store/checkout-view";
import type { StoreProductData } from "@/components/store/product-card";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout — Nivi Sarees",
  description: "Secure checkout for your handcrafted sarees and heritage textiles. Free insured domestic delivery.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  await connection();
  let storeProducts: StoreProductData[] = [];

  try {
    const domainProducts = await container.listProducts().execute({ status: "active" });
    storeProducts = domainProducts.map((p) => ({
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
    console.error("Failed to load products for checkout:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={storeProducts} />
      <main className="flex-1 py-4 sm:py-8">
        <CheckoutView products={storeProducts} />
      </main>
      <Footer />
    </div>
  );
}
