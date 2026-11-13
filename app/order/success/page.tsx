import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { OrderSuccessView } from "@/components/store/order-success-view";
import type { StoreProductData } from "@/components/store/product-card";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";

export const instant = false;

export const metadata: Metadata = {
  title: "Order Confirmed — The Saree Studio",
  description: "Your handcrafted order has been received and confirmed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderSuccessPage() {
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
    console.error("Failed to load products for success page:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={storeProducts} />
      <main className="flex-1 py-4 sm:py-8">
        <Suspense
          fallback={
            <div className="container max-w-2xl mx-auto py-20 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading order details...</p>
            </div>
          }
        >
          <OrderSuccessView />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
