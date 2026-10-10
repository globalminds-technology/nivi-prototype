"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  EyeOff,
  MoreHorizontal,
  Package,
  Pencil,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { syncCatalogAction, toggleProductStatusAction } from "@/app/actions/admin-products";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

export interface SerializedProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceFormatted: string;
  priceMinor: number;
  costPriceFormatted?: string | null;
  costPriceMinor?: number | null;
  stock: number;
  category?: string | null;
  tags: readonly string[];
  status: "active" | "inactive";
  primaryImageUrl: string | null;
  galleryCount: number;
  offer: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label: string;
    expiry: string | null;
  } | null;
}

interface ProductTableProps {
  products: SerializedProduct[];
  zohoOrgId?: string;
}

export function ProductTable({ products, zohoOrgId }: ProductTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isSyncing, startSync] = useTransition();
  const [, startToggle] = useTransition();

  const handleToggleStatus = (id: string, newStatus: "active" | "inactive") => {
    startToggle(async () => {
      const res = await toggleProductStatusAction(id, newStatus);
      if (res.success) {
        toast.success(`Product marked as ${newStatus}`);
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  const handleSync = () => {
    startSync(async () => {
      const res = await syncCatalogAction();
      if (res.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.error);
      }
    });
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, SKU or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-[#d2c8b5] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#ede7d8]/50 p-1 rounded-lg border border-[#d2c8b5] text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "active"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === "inactive"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Purge & Sync Cache</span>
          </Button>

          <Link
            href="/admin/products/new"
            className={buttonVariants({ size: "sm", className: "gap-1.5" })}
          >
            <Package className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-xl border border-[#d2c8b5] bg-card overflow-hidden shadow-[0_2px_12px_rgba(70,50,20,0.05)]">
        <Table>
          <TableHeader className="bg-[#ede7d8]/60 border-b border-[#d2c8b5]">
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product & SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">No products found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {search
                        ? `No items match the search term "${search}".`
                        : "There are no products in Zoho Books or catalog yet. Click Add Product to create your first item."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const zohoItemUrl = zohoOrgId
                  ? `https://books.zoho.in/app#/items/${product.id}?organization_id=${zohoOrgId}`
                  : `https://books.zoho.in/app#/items/${product.id}`;

                return (
                  <TableRow key={product.id} className="group">
                    {/* Primary Image Thumbnail */}
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-lg border border-border/60 bg-muted/30 overflow-hidden flex items-center justify-center">
                        {product.primaryImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.primaryImageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        )}
                      </div>
                    </TableCell>

                    {/* Name & SKU */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">
                            {product.sku}
                          </span>
                          {product.category && (
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase border-brand/40 text-primary">
                              {product.category}
                            </Badge>
                          )}
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {product.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-normal bg-brand/10 text-brand-secondary border border-brand/20 capitalize"
                                >
                                  {tag.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium font-mono text-sm">
                          {product.priceFormatted}
                        </span>
                        {product.costPriceFormatted && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Cost: {product.costPriceFormatted}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            product.stock > 5
                              ? "bg-green-500"
                              : product.stock > 0
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="font-mono text-xs font-medium">
                          {product.stock} units
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className="capitalize text-xs font-normal"
                      >
                        {product.status}
                      </Badge>
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              render={
                                <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2">
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit Product</span>
                                </Link>
                              }
                            />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(
                                  product.id,
                                  product.status === "active" ? "inactive" : "active",
                                )
                              }
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              {product.status === "active" ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>Mark as Inactive</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  <span>Mark as Active</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              render={
                                <a
                                  href={zohoItemUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>View in Zoho</span>
                                </a>
                              }
                            />
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
