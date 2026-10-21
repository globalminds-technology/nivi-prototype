"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { ProductCard, type StoreProductData } from "./product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoldText } from "./gold-text";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CollectionsViewProps {
  initialProducts: StoreProductData[];
  initialPagination: PaginationData;
  availableCategories: string[];
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: string;
}

export function CollectionsView({
  initialProducts,
  initialPagination,
  availableCategories,
  initialCategory = "",
  initialQuery = "",
  initialSort = "featured",
}: CollectionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [products, setProducts] = useState<StoreProductData[]>(initialProducts);
  const [pagination, setPagination] = useState<PaginationData>(initialPagination);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory || "all");
  const [sort, setSort] = useState(initialSort || "featured");
  const [isLoading, setIsLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Fetch from API
  const fetchProducts = useCallback(
    async (
      targetPage: number,
      targetQuery: string,
      targetCategory: string,
      targetSort: string,
      shouldScroll = false
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", "25");
        if (targetQuery.trim()) params.set("q", targetQuery.trim());
        if (targetCategory && targetCategory !== "all") params.set("category", targetCategory);
        if (targetSort && targetSort !== "featured") params.set("sort", targetSort);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();

        setProducts(data.products || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }

        // Update URL query parameters without reloading
        const urlParams = new URLSearchParams();
        if (targetQuery.trim()) urlParams.set("q", targetQuery.trim());
        if (targetCategory && targetCategory !== "all") urlParams.set("category", targetCategory);
        if (targetSort && targetSort !== "featured") urlParams.set("sort", targetSort);
        if (targetPage > 1) urlParams.set("page", String(targetPage));

        const newUrl = urlParams.toString() ? `/collections?${urlParams.toString()}` : "/collections";
        window.history.replaceState(null, "", newUrl);

        if (shouldScroll && resultsRef.current) {
          const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top, behavior: "smooth" });
        }
      } catch (err) {
        console.error("Error fetching collections:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(1, query, category, sort, false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, category, sort, fetchProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    fetchProducts(newPage, query, category, sort, true);
  };

  const handleResetFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("featured");
    fetchProducts(1, "", "all", "featured", true);
  };

  const activeFiltersCount =
    (query ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  return (
    <div className="space-y-6 sm:space-y-8" ref={resultsRef}>
      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto pt-2 pb-1 sm:pb-3">
        <GoldText>Handcrafted Collections</GoldText>
        <p className="text-xs sm:text-sm text-[#5C4D3C] max-w-lg mx-auto">
          Explore our complete showcase of authentic handlooms, pure zari borders, and timeless silks woven with soul.
        </p>
      </div>

      {/* Sleek Filter & Search Toolbar (Search, Category, and Sort with shadcn Select) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto w-full">
        {/* 1. Live Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7A6B]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sarees, SKU, weave..."
            className="w-full h-10 pl-9 pr-8 rounded-full border border-[#D5CCBB] bg-[#FFFCF5] text-xs text-[#221811] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#073C35] focus:border-[#073C35] transition-all shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#221811] p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2. Controls Group: Category & Sort shadcn Selects */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Category Select */}
          <div className="flex-1 sm:w-52">
            <Select value={category} onValueChange={(val) => setCategory(val ?? "all")}>
              <SelectTrigger className="w-full h-10 px-3.5 rounded-full border border-[#D5CCBB] bg-[#FFFCF5] text-xs text-[#221811] shadow-2xs focus:ring-[#073C35]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#FFFCF5] border-[#D5CCBB] text-[#221811] rounded-2xl shadow-lg">
                <SelectItem value="all" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  All Categories
                </SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Select */}
          <div className="flex-1 sm:w-48">
            <Select value={sort} onValueChange={(val) => setSort(val ?? "featured")}>
              <SelectTrigger className="w-full h-10 px-3.5 rounded-full border border-[#D5CCBB] bg-[#FFFCF5] text-xs text-[#221811] shadow-2xs focus:ring-[#073C35]">
                <SelectValue placeholder="Sort: Featured" />
              </SelectTrigger>
              <SelectContent className="bg-[#FFFCF5] border-[#D5CCBB] text-[#221811] rounded-2xl shadow-lg">
                <SelectItem value="featured" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  Featured First
                </SelectItem>
                <SelectItem value="price-asc" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-desc" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="name-asc" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  Name: A to Z
                </SelectItem>
                <SelectItem value="newest" className="text-xs cursor-pointer focus:bg-[#E4DDCD]/50">
                  Newest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset button if active filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 px-3 text-xs text-[#6B5A4A] hover:text-[#073C35] hover:bg-[#E4DDCD]/60 rounded-full shrink-0 cursor-pointer"
              title="Reset filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Results Header and Total Count */}
      <div className="flex items-center justify-between text-xs text-[#6B5A4A] px-1">
        <div>
          Showing{" "}
          <span className="font-semibold text-[#221811]">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-[#221811]">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-semibold text-[#221811]">{pagination.total}</span> pieces
          {isLoading && (
            <span className="inline-flex items-center gap-1 ml-2 text-[#073C35]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </span>
          )}
        </div>

        <div className="text-[11px] text-[#6B5A4A]">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>

      {/* Products Grid (5 per row on desktop) */}
      {products.length > 0 ? (
        <div
          className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5 transition-opacity duration-200 ${
            isLoading ? "opacity-60" : "opacity-100"
          }`}
        >
          {products.map((product, idx) => (
            <ProductCard
              key={product.id || product.sku}
              product={product}
              priority={idx < 4}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 rounded-3xl border border-neutral-300/70 bg-[#faf8f2] max-w-md mx-auto space-y-4 shadow-2xs">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Filter className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-neutral-900">
              No matching pieces found
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              We couldn&apos;t find any sarees matching your selected filters. Try clearing your search or switching categories.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={handleResetFilters}
              variant="default"
              size="sm"
              className="rounded-full text-xs font-medium"
            >
              Reset All Filters
            </Button>
          </div>
        </div>
      )}

      {/* Pagination Controls (25 products per page) */}
      {pagination.totalPages > 1 && (
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 order-2 sm:order-1">
            Showing 25 items per page
          </div>

          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev || isLoading}
              className="rounded-full h-8 px-3 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === pagination.page;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    disabled={isLoading}
                    className={`h-8 min-w-8 px-2 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#083e3e] text-[#f3d998] font-bold shadow-2xs"
                        : "text-neutral-700 hover:bg-neutral-200/60"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="rounded-full h-8 px-3 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
