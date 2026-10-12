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
          {product.offer?.active && (
            <Badge className="bg-[#023036]/90 text-white font-medium text-[8px] sm:text-[9px] px-1.5 py-0.5 shadow-xs backdrop-blur-xs border-0">
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
              : "bg-white/80 text-[#023036] hover:bg-white hover:text-[#035354] shadow-xs backdrop-blur-xs"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorited ? "fill-red-500" : ""}`} />
        </button>

        {/* Quick Add to Cart button on hover */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute bottom-2.5 left-2.5 right-2.5 py-2 rounded-xl bg-[#023036]/90 hover:bg-[#023036] text-white text-[11px] sm:text-xs font-medium tracking-wide shadow-md backdrop-blur-xs transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="h-3 w-3" />
            <span>Add to Cart</span>
          </button>
        )}
      </div>

      {/* Product Details - Clean centered title and price */}
      <div className="pt-2.5 sm:pt-3 space-y-1 text-center">
        <Link
          href={`/products/${product.slug}`}
          className="font-serif text-xs sm:text-[13.5px] md:text-[14.5px] text-[#023036] hover:text-[#056677] transition-colors line-clamp-1 leading-snug block text-center"
          title={product.name}
        >
          {product.name}
        </Link>

        <div className="flex items-center justify-center gap-2 text-center flex-wrap">
          <span className="font-serif text-xs sm:text-[13px] text-[#023036] font-normal">
            Rs. {Math.round(effectivePrice).toLocaleString("en-IN")}.00
          </span>
          {hasDiscount && (
            <span className="font-serif text-[11px] sm:text-xs text-[#7AA79D] line-through">
              Rs. {Math.round(originalPrice).toLocaleString("en-IN")}.00
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
