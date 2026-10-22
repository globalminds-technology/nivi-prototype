"use client";

import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard, type StoreProductData } from "@/components/store/product-card";
import { GoldText } from "@/components/store/gold-text";

interface WishlistClientProps {
  products: StoreProductData[];
}

export function WishlistClient({ products }: WishlistClientProps) {
  const { wishlist, count } = useWishlist();

  const savedProducts = products.filter((p) => wishlist.includes(p.sku));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Centered Heading with GoldText */}
      <div className="text-center space-y-2">
        <GoldText>Saved Heritage Wishlist</GoldText>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
          {count > 0
            ? `You have saved ${count} handcrafted piece${count === 1 ? "" : "s"} for your upcoming celebrations.`
            : "Keep track of masterweaves and festive sarees you love by clicking the heart icon on any product."}
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-neutral-50/60 rounded-3xl border border-neutral-200/80 max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-neutral-800">Your wishlist is empty</h3>
            <p className="text-xs text-neutral-500">
              Explore our exquisite collection of Kanchipuram and Banarasi sarees to find your favorites.
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#083B2F] via-[#0E5343] to-[#04261D] text-white text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-300"
          >
            <span>Explore Handloom Collections</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {savedProducts.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}

      <div className="pt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
