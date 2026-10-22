"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#073C35]/60 pointer-events-none" />
            <Input
              placeholder="Search by name, SKU or tag..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-[#FFFCF5] border-[#D5CCBB] text-[#30251F] placeholder:text-[#6B5A4A]/50 focus-visible:border-[#073C35] focus-visible:ring-[#073C35] rounded-xl shadow-2xs h-10"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#FFFCF5] p-1 rounded-xl border border-[#D5CCBB] text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => handleStatusFilterChange("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-[#073C35] text-[#FFFCF5] shadow-xs"
                  : "text-[#6B5A4A] hover:text-[#073C35]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("active")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-[#073C35] text-[#FFFCF5] shadow-xs"
                  : "text-[#6B5A4A] hover:text-[#073C35]"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilterChange("inactive")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-[#073C35] text-[#FFFCF5] shadow-xs"
                  : "text-[#6B5A4A] hover:text-[#073C35]"
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
            className="gap-2 border-[#D5CCBB] bg-[#FFFCF5] hover:bg-[#073C35]/8 text-[#073C35] rounded-xl shadow-2xs font-medium h-10"
          >
            {isSyncing ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4 text-[#073C35]" />
            )}
            <span>Purge & Sync Cache</span>
          </Button>

          <Link
            href="/admin/products/new"
            className={buttonVariants({
              size: "sm",
              className:
                "gap-1.5 bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] rounded-xl shadow-xs font-semibold h-10",
            })}
          >
            <Package className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-2xl border border-[#D5CCBB] bg-[#FFFCF5] overflow-hidden shadow-[0_4px_20px_rgba(7,60,53,0.05)]">
        <Table>
          <TableHeader className="bg-[#E4DDCD]/40 border-b border-[#D5CCBB]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] font-semibold text-[#073C35] text-xs uppercase tracking-wider">Image</TableHead>
              <TableHead className="font-semibold text-[#073C35] text-xs uppercase tracking-wider">Product & SKU</TableHead>
              <TableHead className="font-semibold text-[#073C35] text-xs uppercase tracking-wider">Price</TableHead>
              <TableHead className="font-semibold text-[#073C35] text-xs uppercase tracking-wider">Stock</TableHead>
              <TableHead className="font-semibold text-[#073C35] text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right w-[80px] font-semibold text-[#073C35] text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-[#6B5A4A]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="h-8 w-8 text-[#073C35]/40" />
                    <p className="font-medium text-[#30251F]">No products found</p>
                    <p className="text-xs text-[#6B5A4A] max-w-sm">
                      {search
                        ? `No items match the search term "${search}".`
                        : "There are no products in Zoho Books or catalog yet. Click Add Product to create your first item."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => {
                const zohoItemUrl = zohoOrgId
                    ? `https://books.zoho.in/app#/items/${product.id}?organization_id=${zohoOrgId}`
                    : `https://books.zoho.in/app#/items/${product.id}`;

                return (
                  <TableRow key={product.id} className="group hover:bg-[#073C35]/2 border-b border-[#D5CCBB]/50 transition-colors">
                    {/* Primary Image Thumbnail */}
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-xl border border-[#D5CCBB] bg-[#E4DDCD]/30 overflow-hidden flex items-center justify-center shadow-2xs">
                        {product.primaryImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.primaryImageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-[#073C35]/30" />
                        )}
                      </div>
                    </TableCell>

                    {/* Name & SKU */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-serif font-semibold text-[15px] text-[#30251F] hover:text-[#073C35] transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-[#6B5A4A] bg-[#073C35]/5 px-2 py-0.5 rounded border border-[#073C35]/15">
                            {product.sku}
                          </span>
                          {product.category && (
                            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 uppercase border-[#C9A45C]/40 text-[#8C6D37] bg-[#C9A45C]/10 rounded-full font-medium">
                              {product.category}
                            </Badge>
                          )}
                          {product.offer?.active && (
                            <span className="text-[10px] px-2 py-0.5 font-bold bg-[#C9A45C]/20 text-[#7a4e0e] border border-[#C9A45C]/50 rounded-full">
                              Offer: {product.offer.label || (product.offer.type === 'percent' ? `${product.offer.value}% OFF` : `₹${product.offer.value} OFF`)}
                            </span>
                          )}
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {product.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] px-2 py-0.5 font-normal bg-stone-100 text-[#30251F] border border-stone-200 rounded-full capitalize"
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
                        <span className="font-semibold font-mono text-sm text-[#073C35]">
                          {product.priceFormatted}
                        </span>
                        {product.costPriceFormatted && (
                          <span className="text-[11px] font-mono text-[#6B5A4A]">
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
                              ? "bg-emerald-500"
                              : product.stock > 0
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="font-mono text-xs font-medium text-[#30251F]">
                          {product.stock > 0 ? `${product.stock} units` : "Out of stock"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                        className={`capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          product.status === "active"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {product.status}
                      </Badge>
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B5A4A] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 bg-[#FFFCF5] border-[#D5CCBB] shadow-lg rounded-xl">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-[#6B5A4A] font-medium">Product Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              render={
                                <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 text-xs text-[#30251F] hover:text-[#073C35]">
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
                              className="flex items-center gap-2 cursor-pointer text-xs text-[#30251F] hover:text-[#073C35]"
                            >
                              {product.status === "active" ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-stone-500" />
                                  <span>Mark as Inactive</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
                                  className="flex items-center gap-2 text-xs text-[#30251F] hover:text-[#073C35]"
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

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#FFFCF5] border border-[#D5CCBB] rounded-2xl shadow-2xs text-xs">
          <div className="flex items-center gap-4 text-[#6B5A4A]">
            <span>
              Showing <span className="font-semibold text-[#073C35]">{startIndex + 1}</span>–
              <span className="font-semibold text-[#073C35]">{endIndex}</span> of{" "}
              <span className="font-semibold text-[#073C35]">{totalItems}</span> sarees
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D5CCBB] text-[#30251F] rounded-lg px-2 py-1 text-xs font-medium focus:border-[#073C35] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              aria-label="First Page"
              className="h-8 w-8 rounded-lg border-[#D5CCBB] text-[#073C35] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Previous Page"
              className="h-8 w-8 rounded-lg border-[#D5CCBB] text-[#073C35] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 py-1 font-mono font-medium text-xs text-[#073C35] bg-[#073C35]/8 rounded-lg border border-[#073C35]/15">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Next Page"
              className="h-8 w-8 rounded-lg border-[#D5CCBB] text-[#073C35] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              aria-label="Last Page"
              className="h-8 w-8 rounded-lg border-[#D5CCBB] text-[#073C35] disabled:opacity-40 cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
