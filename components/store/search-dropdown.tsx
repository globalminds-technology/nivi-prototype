"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Package, Search, Sparkles, X } from "lucide-react";
import type { StoreProductData } from "./product-card";

interface SearchDropdownProps {
  products: StoreProductData[];
}

export function SearchDropdown({ products }: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        const target = e.target as HTMLElement;
        if (
          target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Filtered results based on query
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, show top 4 featured / new items as suggestions
      return products.slice(0, 4);
    }
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const catMatch = (p.category || "").toLowerCase().includes(q);
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q));
      return nameMatch || skuMatch || catMatch || tagMatch;
    });
  }, [products, query]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  };

  const quickCategories = ["Kanchipuram", "Banarasi", "Cotton", "Organza", "Linen"];

  return (
    <div ref={containerRef} className="relative">
      {/* Mobile Search Icon Trigger (md:hidden) */}
      <div className="md:hidden">
        {isOpen ? (
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#B87333]/60 ring-2 ring-[#B87333]/20 bg-white/95 text-neutral-900 w-48 sm:w-56 shadow-sm">
            <Search className="h-3.5 w-3.5 text-[#056677] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="text-neutral-400 hover:text-neutral-700 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            aria-label="Open search"
            className="h-9 w-9 rounded-full flex items-center justify-center bg-white/70 border border-[#d2c8b5] text-[#023036] hover:bg-white hover:text-[#035354] transition-colors shadow-2xs"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Desktop Search Bar — responsive width on tablet & desktop, clean and simple */}
      <div
        className={`hidden md:flex items-center gap-1.5 md:gap-2 h-8.5 sm:h-9 px-2.5 md:px-3 rounded-full border transition-all w-28 md:w-32 lg:w-48 xl:w-60 focus-within:w-40 md:focus-within:w-44 lg:focus-within:w-56 xl:focus-within:w-64 ${
          isOpen
            ? "bg-white border-[#056677] ring-2 ring-[#056677]/15 shadow-sm text-neutral-900"
            : "bg-white/70 border-[#d2c8b5] text-[#023036] hover:border-[#056677]/40 hover:bg-white shadow-2xs"
        }`}
      >
        <Search className={`h-3.5 w-3.5 shrink-0 ${isOpen ? "text-[#056677]" : "text-[#056677]/80"}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-500/80 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-neutral-400 hover:text-neutral-700 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dropdown Menu attached directly beneath search bar */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:w-96 bg-white rounded-2xl border border-[#d2c8b5] shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Quick Categories Bar (when query is empty) */}
          {!query.trim() && (
            <div className="p-3 border-b border-[#d2c8b5]/60 bg-[#faf8f2]">
              <span className="text-[10px] font-mono text-[#056677] uppercase tracking-wider block mb-2 font-medium">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setQuery(cat);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-[#d2c8b5]/80 text-[#023036] hover:border-[#056677] hover:text-[#056677] transition-colors shadow-2xs"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#d2c8b5]/40 p-1.5 scrollbar-thin">
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#056677] font-medium">
              {query.trim()
                ? `Results (${filteredProducts.length})`
                : "Suggested Masterweaves"}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <p className="text-xs font-medium text-neutral-700">
                  No sarees found for &quot;{query}&quot;
                </p>
                <p className="text-[11px] text-neutral-400">
                  Try searching by weave (e.g. Silk, Banarasi, Cotton) or SKU.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.sku}
                  type="button"
                  onClick={() => handleSelect(product.slug)}
                  className="w-full flex items-center justify-between gap-3 p-2 rounded-xl text-left hover:bg-[#023036]/5 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#ede7d8] border border-[#d2c8b5]/80 shrink-0">
                      {product.primaryImageUrl ? (
                        <Image
                          src={product.primaryImageUrl}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#7AA79D]">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-neutral-800 group-hover:text-[#023036] transition-colors truncate block">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-neutral-400">
                          {product.sku}
                        </span>
                        {product.category && (
                          <span className="text-[10px] text-[#056677] font-medium truncate max-w-[100px]">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="font-mono text-xs font-semibold text-neutral-900">
                      ₹{(product.priceMinor / 100).toLocaleString("en-IN")}
                    </span>
                    {product.offer?.active && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#B87333]">
                        <Sparkles className="w-2.5 h-2.5 text-[#B87333]" />
                        {product.offer.label || `${product.offer.value}% OFF`}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer of Dropdown */}
          <div className="p-2 border-t border-[#d2c8b5]/60 bg-[#faf8f2] flex items-center justify-between text-[11px] text-[#3d5a5e] px-3">
            <span>Press Esc to close</span>
            <Link
              href="/#catalog"
              onClick={() => setIsOpen(false)}
              className="font-medium text-[#023036] hover:text-[#056677] hover:underline"
            >
              View all collections →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
