"use client";

import { useState } from "react";
import { Heart, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

interface ProductActionsProps {
  sku: string;
  name: string;
  stock: number;
}

export function ProductActions({ sku, name, stock }: ProductActionsProps) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorited = isInWishlist(sku);
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const added = addItem(sku, qty, stock);
    if (!added) {
      toast.error(`Cannot add more. You have reached the available stock limit (${stock}) for "${name}".`);
      return;
    }
    toast.success(`Added ${qty} × "${name}" to your bag!`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(sku);
    if (!isFavorited) {
      toast.success(`Saved "${name}" to your wishlist`);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello NiVi, I would like to inquire about "${name}" (SKU: ${sku}).`,
  );
  const whatsappUrl = `https://wa.me/919150992863?text=${whatsappMessage}`;

  return (
    <div className="space-y-4 pt-4 border-t border-border/60">
      {/* Quantity & Add to Cart row */}
      <div className="flex items-center gap-3">
        {/* Quantity selector */}
        <div className="flex items-center border border-border rounded-lg bg-background h-11 px-1">
          <button
            type="button"
            disabled={qty <= 1 || isOutOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-mono font-medium">{qty}</span>
          <button
            type="button"
            disabled={qty >= stock || isOutOfStock}
            onClick={() => {
              if (qty >= stock) {
                toast.error(`Only ${stock} items available in stock.`);
                return;
              }
              setQty((q) => q + 1);
            }}
            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Add to Bag Button */}
        <Button
          size="lg"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="flex-1 h-11 gap-2 shadow-md text-sm rounded-full bg-gradient-to-r from-[#083B2F] via-[#0E5343] to-[#04261D] hover:from-[#052920] hover:via-[#083B2F] hover:to-[#04261D] text-white border border-brand/40 transition-all duration-300"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{isOutOfStock ? "Out of Stock" : "Add to Shopping Bag"}</span>
        </Button>

        {/* Wishlist Button */}
        <Button
          size="icon-lg"
          variant="outline"
          onClick={handleToggleWishlist}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
          className={`h-11 w-11 shrink-0 ${
            isFavorited ? "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20" : ""
          }`}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500" : ""}`} />
        </Button>
      </div>

      {/* WhatsApp Concierge Assistance */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>Inquire or Custom Order via WhatsApp</span>
      </a>
    </div>
  );
}
