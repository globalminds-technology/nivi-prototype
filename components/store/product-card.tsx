"use client";

import Link from "next/link";
import { Heart, Package, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceTag } from "@/components/store/price-tag";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

export interface StoreProductData {
  id: string;
  sku: string;
  name: string;
  slug: string;
  priceMinor: number;
  stock: number;
  primaryImageUrl: string | null;
  tags: readonly string[];
  category?: string | null;
  offer: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label?: string;
  } | null;
}

interface ProductCardProps {
  product: StoreProductData;
  priority?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  const isFavorited = isInWishlist(product.sku);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const added = addItem(product.sku, 1, product.stock);
    if (!added) {
      toast.error(`Cannot add more. You have reached the available stock limit (${product.stock}).`);
      return;
    }
    toast.success(`Added "${product.name}" to cart`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.sku);
    if (!isFavorited) {
      toast.success(`Saved "${product.name}" to your wishlist`);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-[14px] bg-[#faf8f2] border border-[#d2c8b5]/80 shadow-[0_3px_14px_rgba(70,50,20,0.06)] hover:shadow-[0_8px_24px_rgba(70,50,20,0.12)] hover:border-brand/50 transition-all duration-300 flex flex-col h-full p-0">
        {/* Media container - square 1:1 aspect ratio for a compact card height */}
        <Link href={`/products/${product.slug}`} className="block relative overflow-hidden rounded-t-[14px] w-full">
          <AspectRatio ratio={1 / 1} className="bg-[#ede7d8]">
            {product.primaryImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#ede7d8] text-neutral-400">
                <Package className="h-8 w-8" />
              </div>
            )}
          </AspectRatio>

          {/* Top Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {product.offer?.active && (
              <Badge className="bg-gradient-to-r from-primary to-[#0E5343] text-white font-medium text-[8px] sm:text-[9px] px-1.5 py-0.5 gap-0.5 shadow-sm border border-brand/30">
                <Sparkles className="h-2 w-2 text-brand" />
                <span>{product.offer.label || `${product.offer.value}% OFF`}</span>
              </Badge>
            )}

            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[8px] sm:text-[9px] px-1.5 py-0.5 uppercase font-mono shadow-sm">
                Sold Out
              </Badge>
            ) : product.tags.length > 0 ? (
              <Badge variant="secondary" className="text-[8px] sm:text-[9px] px-1.5 py-0.5 capitalize shadow-2xs backdrop-blur-xs bg-[#faf8f2]/95 text-neutral-800 border border-[#d2c8b5]/80">
                {product.tags[0].replace(/_/g, " ")}
              </Badge>
            ) : null}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-1.5 right-1.5 z-10 h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-full flex items-center justify-center transition-all ${
              isFavorited
                ? "bg-red-50 text-red-500 shadow-sm"
                : "bg-[#faf8f2]/90 text-neutral-600 backdrop-blur-xs hover:text-neutral-900 hover:bg-[#faf8f2] border border-[#d2c8b5]/60 shadow-2xs"
            }`}
          >
            <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isFavorited ? "fill-red-500" : ""}`} />
          </button>
        </Link>

        {/* Card Content & Details - Compact Height */}
        <CardContent className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between gap-1 sm:gap-1.5">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-1 text-[8.5px] sm:text-[9.5px] font-mono text-muted-foreground uppercase tracking-wider">
              <span>{product.sku}</span>
              {product.category && (
                <span className="font-sans normal-case text-primary font-semibold truncate max-w-[80px] sm:max-w-[100px]" title={product.category}>
                  {product.category}
                </span>
              )}
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="font-medium text-[11px] sm:text-xs text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug block"
            >
              {product.name}
            </Link>
          </div>

          <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#d2c8b5]/50">
            <PriceTag
              priceMinor={product.priceMinor}
              offer={product.offer}
              size="sm"
            />

            <Button
              type="button"
              size="icon-xs"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
              className="h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-full bg-gradient-to-r from-primary via-[#0E5343] to-primary text-white hover:from-[#052920] hover:to-[#052920] shadow-2xs hover:shadow-xs transition-all duration-300 border border-brand/30 shrink-0"
            >
              <ShoppingBag className="h-3 w-3" />
              <span className="sr-only">Add to Cart</span>
            </Button>
          </div>
        </CardContent>
      </div>
  );
}
