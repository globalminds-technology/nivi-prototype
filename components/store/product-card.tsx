"use client";

import Link from "next/link";
import { Heart, Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
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

  const originalPrice = product.priceMinor / 100;
  let effectivePrice = originalPrice;
  if (product.offer?.active) {
    if (product.offer.type === "percent") {
      const discount = (originalPrice * product.offer.value) / 100;
      effectivePrice = Math.max(0, originalPrice - discount);
    } else {
      effectivePrice = Math.max(0, originalPrice - product.offer.value);
    }
  }
  const hasDiscount = product.offer?.active && effectivePrice < originalPrice;

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
    <div className="group relative flex flex-col h-full bg-transparent border-0 shadow-none p-0 text-center">
      {/* Media container - Portrait 3:4 aspect ratio matching reference */}
      <div className="relative overflow-hidden rounded-2xl bg-[#ede7d8]/40 shadow-xs">
        <Link href={`/products/${product.slug}`} className="block relative w-full">
          <AspectRatio ratio={3 / 4} className="bg-[#ede7d8]/40">
            {product.primaryImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#ede7d8] text-[#7AA79D]">
                <Package className="h-8 w-8" />
              </div>
            )}
          </AspectRatio>
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {product.tags.includes("new_arrival") && (
            <span className="bg-[#DCAEB6] text-[#30251F] font-semibold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-xs">
              New
            </span>
          )}

          {product.offer?.active && (
            <Badge className="bg-[#073C35]/90 text-white font-medium text-[8px] sm:text-[9px] px-1.5 py-0.5 shadow-xs backdrop-blur-xs border-0">
              {product.offer.label || `${product.offer.value}% OFF`}
            </Badge>
          )}

          {isOutOfStock && (
            <Badge variant="destructive" className="text-[8px] sm:text-[9px] px-1.5 py-0.5 uppercase font-mono shadow-xs">
              Sold Out
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 z-10 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all ${
            isFavorited
              ? "bg-white/95 text-red-500 shadow-sm"
              : "bg-white/80 text-[#073C35] hover:bg-white hover:text-[#073C35] shadow-xs backdrop-blur-xs"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorited ? "fill-red-500" : ""}`} />
        </button>
      </div>

      {/* Product Details - Left-aligned title, price with INR symbol and cart icon on right */}
      <div className="pt-2 sm:pt-2.5 space-y-1 text-left">
        <Link
          href={`/products/${product.slug}`}
          className="text-xs sm:text-[13px] md:text-sm font-medium text-[#30251F] hover:text-[#073C35] transition-colors line-clamp-1 block text-left"
          title={product.name}
        >
          {product.name}
        </Link>

        <div className="flex items-center justify-between gap-1 pt-0.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-[13.5px] font-semibold text-[#30251F]">
              ₹{Math.round(effectivePrice).toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-[#6B5A4A] line-through">
                ₹{Math.round(originalPrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-full flex items-center justify-center text-[#30251F] hover:text-[#073C35] hover:bg-[#073C35]/10 active:scale-90 transition-all shrink-0"
              title="Add to cart"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
