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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Product Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store items, gallery media, custom tags, and special offers. Synchronized with Zoho Books.
          </p>
        </div>
      </div>

      {errorNotice && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Zoho Books Connection Notice</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{errorNotice}</p>
            <p className="text-xs opacity-80">
              Ensure <code className="bg-destructive/20 px-1 py-0.5 rounded">ZOHO_CLIENT_ID</code>,{" "}
              <code className="bg-destructive/20 px-1 py-0.5 rounded">ZOHO_CLIENT_SECRET</code>, and{" "}
              <code className="bg-destructive/20 px-1 py-0.5 rounded">ZOHO_REFRESH_TOKEN</code> are configured in your environment.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Catalog items</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Catalog</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible on storefront</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">In Stock</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{inStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for purchase</p>
          </CardContent>
        </Card>

        <Card className="shadow-[0_2px_12px_rgba(70,50,20,0.05)] border-[#d2c8b5] bg-card hover:border-brand/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inactive Catalog</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Hidden from storefront</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <ProductTable products={products} zohoOrgId={zohoOrgId} />
    </div>
  );
}
