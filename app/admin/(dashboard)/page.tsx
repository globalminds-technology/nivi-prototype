import type { Metadata } from "next";
import { connection } from "next/server";
import { AlertCircle, CheckCircle2, EyeOff, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductTable, type SerializedProduct } from "@/components/admin/product-table";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";


export const instant = false;

export const metadata: Metadata = {
  title: "Product Catalog Management",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await connection();
  const zohoOrgId = container.getZohoOrgId();
  let products: SerializedProduct[] = [];
  let errorNotice: string | null = null;

  try {
    const listUseCase = container.listAdminProducts();
    const domainProducts = await listUseCase.execute();
    products = domainProducts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      priceFormatted: `₹${(p.price.minor / 100).toLocaleString("en-IN")}`,
      priceMinor: p.price.minor,
      costPriceFormatted: p.costPrice
        ? `₹${(p.costPrice.minor / 100).toLocaleString("en-IN")}`
        : null,
      costPriceMinor: p.costPrice?.minor ?? null,
      stock: p.stock,
      category: p.category ?? null,
      tags: p.tags,
      status: p.status,
      primaryImageUrl: p.primaryImageUrl,
      galleryCount: p.gallery.length,
      offer: p.offer
        ? {
            active: p.offer.active,
            type: p.offer.type,
            value:
              p.offer.type === "percent"
                ? p.offer.percent
                : Money.toMajor(p.offer.amount),
            label: p.offer.label,
            expiry: p.offer.expiry ?? null,
          }
        : null,
    }));
  } catch (err: unknown) {
    console.error("Failed to load products from Zoho Books:", err);
    errorNotice =
      err instanceof Error
        ? err.message
        : "Failed to connect to Zoho Books API. Check your environment variables.";
  }

  // Calculate stats
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status === "active").length;
  const inactiveCount = products.filter((p) => p.status === "inactive").length;
  const inStockCount = products.filter((p) => p.stock > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5CCBB]/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#073C35]">
              Product Catalog
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-[#073C35]/10 text-[#073C35] border border-[#073C35]/25 font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              Zoho Synced
            </span>
          </div>
          <p className="text-sm text-[#6B5A4A] mt-1 font-sans">
            Manage your store items, media galleries, custom tags, pricing, and active offers. Synchronized with Zoho Books.
          </p>
        </div>
      </div>

      {errorNotice && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-sm font-bold">Zoho Books Connection Notice</AlertTitle>
          <AlertDescription className="space-y-2 text-xs text-red-800">
            <p>{errorNotice}</p>
            <p className="opacity-80">
              Ensure <code className="bg-red-100 px-1 py-0.5 rounded font-mono">ZOHO_CLIENT_ID</code>,{" "}
              <code className="bg-red-100 px-1 py-0.5 rounded font-mono">ZOHO_CLIENT_SECRET</code>, and{" "}
              <code className="bg-red-100 px-1 py-0.5 rounded font-mono">ZOHO_REFRESH_TOKEN</code> are configured in your environment.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-[0_2px_12px_rgba(7,60,53,0.04)] border-[#D5CCBB] bg-[#FFFCF5] hover:border-[#073C35]/40 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B5A4A] tracking-wider uppercase font-mono">Total Items</CardTitle>
            <div className="h-7 w-7 rounded-lg bg-[#073C35]/8 flex items-center justify-center text-[#073C35]">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#073C35]">{totalCount}</div>
            <p className="text-xs text-[#6B5A4A] mt-1">Catalog items</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(7,60,53,0.04)] border-[#D5CCBB] bg-[#FFFCF5] hover:border-emerald-500/40 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B5A4A] tracking-wider uppercase font-mono">Active Catalog</CardTitle>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-800">{activeCount}</div>
            <p className="text-xs text-[#6B5A4A] mt-1">Live on storefront</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(7,60,53,0.04)] border-[#D5CCBB] bg-[#FFFCF5] hover:border-[#C9A45C]/50 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B5A4A] tracking-wider uppercase font-mono">In Stock</CardTitle>
            <div className="h-7 w-7 rounded-lg bg-[#C9A45C]/15 flex items-center justify-center text-[#8C6D37]">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#073C35]">{inStockCount}</div>
            <p className="text-xs text-[#6B5A4A] mt-1">Ready for checkout</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(7,60,53,0.04)] border-[#D5CCBB] bg-[#FFFCF5] hover:border-stone-400 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-[#6B5A4A] tracking-wider uppercase font-mono">Inactive Catalog</CardTitle>
            <div className="h-7 w-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
              <EyeOff className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-700">{inactiveCount}</div>
            <p className="text-xs text-[#6B5A4A] mt-1">Hidden from storefront</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <ProductTable products={products} zohoOrgId={zohoOrgId} />
    </div>
  );
}
