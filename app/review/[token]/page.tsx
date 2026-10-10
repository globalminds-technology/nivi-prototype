import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { ReviewForm } from "@/components/store/review-form";
import { buttonVariants } from "@/components/ui/button";
import { container } from "@/infrastructure/di/container";
import { toSku } from "@/core/domain/value-objects/sku";
import type { StoreProductData } from "@/components/store/product-card";
import { productSlug } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";

export const instant = false;

export const metadata: Metadata = {
  title: "Submit Verified Review — Nivi Sarees",
  description: "Share your experience with your handcrafted Nivi saree.",
  robots: {
    index: false,
    follow: false,
  },
};

interface ReviewPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  await connection();
  const { token } = await params;

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
  } catch {
    // Ignore
  }

  // 1. Verify token cryptographically
  const payload = await container.tokenSigner().verifyReviewToken(token);

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header products={storeProducts} />
        <main className="flex-1 py-16 px-4">
          <div className="container max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-semibold">Review Link Expired or Invalid</h1>
            <p className="text-sm text-muted-foreground">
              This review link has expired or is invalid. If you purchased this saree recently, please contact concierge for a fresh link.
            </p>
            <div className="pt-4">
              <Link href="/" className={buttonVariants({ variant: "outline", className: "gap-2" })}>
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Store</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sku = toSku(payload.sku);

  // 2. Check if already reviewed
  const existingReview = await container.reviewRepository().findByInvoiceAndSku(payload.invoiceId, sku);
  if (existingReview) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header products={storeProducts} />
        <main className="flex-1 py-16 px-4">
          <div className="container max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-semibold">Review Already Submitted</h1>
            <p className="text-sm text-muted-foreground">
              You have already shared your thoughts for this purchase ({payload.sku}). Thank you for supporting our artisans!
            </p>
            <div className="pt-4">
              <Link href="/" className={buttonVariants({ variant: "default", className: "gap-2" })}>
                <ArrowLeft className="w-4 h-4" />
                <span>Explore More Sarees</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Find product name
  let productName = "";
  try {
    const product = await container.getProduct().execute(payload.sku);
    if (product) productName = product.name;
  } catch {
    // Ignore
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header products={storeProducts} />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="container max-w-4xl mx-auto">
          <ReviewForm
            token={token}
            sku={payload.sku}
            invoiceId={payload.invoiceId}
            productName={productName}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
