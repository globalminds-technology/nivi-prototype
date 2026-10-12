"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { ProductCard, type StoreProductData } from "./product-card";
import { Button } from "@/components/ui/button";

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
  availableTags: string[];
  initialTag?: string;
  initialCategory?: string;
  initialQuery?: string;
}

export function CollectionsView({
  initialProducts,
  initialPagination,
  availableCategories,
  availableTags,
  initialTag = "",
  initialCategory = "",
  initialQuery = "",
}: CollectionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [products, setProducts] = useState<StoreProductData[]>(initialProducts);
  const [pagination, setPagination] = useState<PaginationData>(initialPagination);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory || "all");
  const [tag, setTag] = useState(initialTag || "all");
  const [sort, setSort] = useState("featured");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resultsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Normalization for tags
  const normalizeTagKey = (t: string) => {
    const compact = t.toLowerCase().trim().replace(/[\s-_]+/g, "");
    if (compact === "bestseller") return "bestseller";
    if (compact === "newarrival") return "new_arrival";
    if (compact === "limitededition") return "limited_edition";
    return t.toLowerCase().trim().replace(/[\s-]+/g, "_");
  };

  const formatTagLabel = (t: string) => {
    const key = normalizeTagKey(t);
    if (key === "new_arrival") return "New Arrival";
    if (key === "bestseller") return "Best Seller";
    if (key === "featured") return "Featured";
    return t.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Fetch from API
  const fetchProducts = useCallback(
    async (
      targetPage: number,
      targetQuery: string,
      targetCategory: string,
      targetTag: string,
      targetSort: string,
      shouldScroll = false
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", "20");
        if (targetQuery.trim()) params.set("q", targetQuery.trim());
        if (targetCategory && targetCategory !== "all") params.set("category", targetCategory);
        if (targetTag && targetTag !== "all") params.set("tag", targetTag);
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
        if (targetTag && targetTag !== "all") urlParams.set("tag", targetTag);
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
      fetchProducts(1, query, category, tag, sort, false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, category, tag, sort, fetchProducts]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return;
    fetchProducts(newPage, query, category, tag, sort, true);
  };

  const handleResetFilters = () => {
    setQuery("");
    setCategory("all");
    setTag("all");
    setSort("featured");
    fetchProducts(1, "", "all", "all", "featured", true);
  };

  const activeFiltersCount =
    (query ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (tag !== "all" ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  // Curated tag pills
  const presetTags = ["all", "new_arrival", "featured", "bestseller", ...availableTags.filter((t) => {
    const k = normalizeTagKey(t);
    return k !== "new_arrival" && k !== "featured" && k !== "bestseller";
  })];
  // Deduplicate
  const uniqueTagOptions = Array.from(new Set(presetTags.map((t) => normalizeTagKey(t))));

  return (
    <div className="space-y-6 sm:space-y-8" ref={resultsRef}>
      {/* Header Banner */}
      <div className="text-center space-y-2.5 max-w-2xl mx-auto pt-2 pb-2 sm:pb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          <span>Curated Artisan Weaves</span>
        </div>
        <h1 className="font-['Great_Vibes'] text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-primary leading-tight">
          Handcrafted Collections
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
          Explore our complete showcase of authentic handlooms, pure zari borders, and timeless silks woven with soul.
        </p>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="rounded-2xl sm:rounded-3xl border border-neutral-300/70 bg-[#faf8f2] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Live Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sarees, SKU, weave..."
              className="w-full h-10 pl-9 pr-8 rounded-full border border-neutral-200 bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. Category Selector */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3.5 rounded-full border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Tag Selector */}
          <div>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full h-10 px-3.5 rounded-full border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Tags</option>
              {uniqueTagOptions.filter((t) => t !== "all").map((t) => (
                <option key={t} value={t}>
                  {formatTagLabel(t)}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Sort Selector */}
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full h-10 px-3.5 rounded-full border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="price-asc">Sort: Price (Low to High)</option>
              <option value="price-desc">Sort: Price (High to Low)</option>
              <option value="name-asc">Sort: Name (A to Z)</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        </div>

        {/* Quick Tag Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          <span className="text-[11px] font-medium text-neutral-500 shrink-0">Tags:</span>
          {uniqueTagOptions.map((t) => {
            const isSelected = (tag === "all" && t === "all") || tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#083e3e] text-[#f3d998] shadow-2xs font-semibold"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                }`}
              >
                {t === "all" ? "All Tags" : formatTagLabel(t)}
              </button>
            );
          })}

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="ml-auto text-xs text-neutral-500 hover:text-primary gap-1 rounded-full shrink-0 h-7 px-2.5"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Results Header and Total Count */}
      <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
        <div>
          Showing{" "}
          <span className="font-semibold text-neutral-900">
            {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-neutral-900">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-semibold text-neutral-900">{pagination.total}</span> pieces
          {isLoading && (
            <span className="inline-flex items-center gap-1 ml-2 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </span>
          )}
        </div>

        <div className="text-[11px] text-neutral-500">
          Page {pagination.page} of {pagination.totalPages}
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div
          className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-opacity duration-200 ${
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

      {/* Pagination Controls (20 products per page) */}
      {pagination.totalPages > 1 && (
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 order-2 sm:order-1">
            Showing 20 items per page
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
