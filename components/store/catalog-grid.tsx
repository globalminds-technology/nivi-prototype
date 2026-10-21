"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, Heart, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard, type StoreProductData } from "@/components/store/product-card";
import { GoldText } from "@/components/store/gold-text";
import { useWishlist } from "@/hooks/use-wishlist";

interface CatalogGridProps {
  products: StoreProductData[];
  initialTag?: string;
  initialCategory?: string;
  categories?: { name: string; slug: string }[];
}

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

export function CatalogGrid({
  products,
  initialTag,
  initialCategory,
  categories = [],
}: CatalogGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory ?? "all");
  const [selectedTag, setSelectedTag] = useState<string>(initialTag ?? "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const { wishlist, count: wishlistCount } = useWishlist();

  // Extract all unique categories from products if not provided
  const categoryList = useMemo(() => {
    if (categories.length > 0) return categories;
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category) {
        map.set(p.category.toLowerCase(), p.category);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [categories, products]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [products]);

  // Filter & Sort products
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (showWishlistOnly && !wishlist.includes(p.sku)) {
        return false;
      }
      if (selectedCategory !== "all") {
        const prodCat = (p.category || "").toLowerCase();
        if (prodCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      if (selectedTag === "offers") {
        if (!p.offer?.active) return false;
      } else if (selectedTag !== "all") {
        if (!p.tags.includes(selectedTag)) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCat = (p.category || "").toLowerCase().includes(query);
        const matchesTag = p.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesSku && !matchesCat && !matchesTag) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.priceMinor - b.priceMinor;
        case "price-desc":
          return b.priceMinor - a.priceMinor;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "featured":
        default:
          // Featured / In Stock items first
          if (a.stock > 0 && b.stock <= 0) return -1;
          if (a.stock <= 0 && b.stock > 0) return 1;
          return 0;
      }
    });

    return result;
  }, [products, showWishlistOnly, wishlist, selectedCategory, selectedTag, searchQuery, sortBy]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedTag !== "all" ||
    showWishlistOnly ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedTag("all");
    setShowWishlistOnly(false);
    setSearchQuery("");
    setSortBy("featured");
  };

  return (
    <div id="catalog" className="space-y-6 scroll-mt-24">
      {/* Header and Filter Controls - Center Aligned */}
      <div className="space-y-5 border-b border-neutral-200/80 pb-6 text-center">
        <div className="space-y-1.5 flex flex-col items-center justify-center">
          <GoldText>{showWishlistOnly ? "Your Saved Wishlist" : "Complete Handloom Showcase"}</GoldText>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Showing {filtered.length} {filtered.length === 1 ? "masterpiece" : "masterpieces"} ready for express delivery across India
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search sarees by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 pr-7 h-9 text-xs bg-white rounded-full border-neutral-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs bg-white rounded-full border-neutral-200 gap-1">
              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="featured" className="text-xs">Featured</SelectItem>
              <SelectItem value="price-asc" className="text-xs">Price: Low to High</SelectItem>
              <SelectItem value="price-desc" className="text-xs">Price: High to Low</SelectItem>
              <SelectItem value="name-asc" className="text-xs">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Wishlist filter toggle */}
          <Button
            variant={showWishlistOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowWishlistOnly(!showWishlistOnly);
              if (!showWishlistOnly) {
                setSelectedTag("all");
                setSelectedCategory("all");
              }
            }}
            className="gap-1.5 text-xs h-9 rounded-full"
          >
            <Heart className={`h-3.5 w-3.5 ${showWishlistOnly ? "fill-current" : ""}`} />
            <span>Wishlist ({wishlistCount})</span>
          </Button>
        </div>

        {/* Filter Pills */}
        {!showWishlistOnly && (
          <div className="space-y-2 pt-1">
            {/* Category Pills (if any exist) */}
            {categoryList.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
                  Weave:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-r from-primary via-[#0E5343] to-primary text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  All Weaves
                </button>
                {categoryList.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? "bg-gradient-to-r from-primary via-[#0E5343] to-primary text-white shadow-xs"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
                  selectedTag === "all"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setSelectedTag("offers")}
                className={`px-3 py-1 rounded-full font-medium transition-all inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  selectedTag === "offers"
                    ? "bg-gradient-to-r from-primary via-[#0E5343] to-primary text-white shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <span>On Offer</span>
              </button>

              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full font-medium capitalize transition-all whitespace-nowrap shrink-0 ${
                    selectedTag === tag
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tag.replace(/_/g, " ")}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1 text-muted-foreground hover:text-destructive text-[11px] font-medium inline-flex items-center gap-1 ml-auto shrink-0 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Product Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 my-8">
          <Filter className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
          <h3 className="font-medium text-foreground text-base">No pieces found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {showWishlistOnly
              ? "You haven't saved any pieces to your wishlist yet. Tap the heart icon on any product to save it."
              : "No pieces match your selected filters. Try broadening your criteria or reset the filters."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
