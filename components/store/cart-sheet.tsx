"use client";

import Link from "next/link";
import { ArrowRight, Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import type { StoreProductData } from "./product-card";

interface CartSheetProps {
  products: StoreProductData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ products, open, onOpenChange }: CartSheetProps) {
  const { items, updateQuantity, removeItem, clearCart, totalCount } = useCart();

  // Reconcile items with catalog to get names, prices and images
  const cartEntries = items.map((item) => {
    const matched = products.find(
      (p) => p.sku.toLowerCase() === item.sku.toLowerCase(),
    );
    return {
      sku: item.sku,
      qty: item.qty,
      product: matched,
    };
  });

  // Calculate server-aligned subtotal
  const subtotalMinor = cartEntries.reduce((sum, entry) => {
    if (!entry.product) return sum;
    const base = entry.product.priceMinor;
    let unit = base;
    if (entry.product.offer?.active) {
      if (entry.product.offer.type === "percent") {
        unit = Math.round(base * (1 - entry.product.offer.value / 100));
      } else {
        unit = Math.max(0, base - entry.product.offer.value * 100);
      }
    }
    return sum + unit * entry.qty;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full sm:max-w-md flex flex-col p-4 sm:p-6 bg-[#FAF4EA] text-[#221811] border-l border-[#D5CCBB] h-full"
      >
        {/* Header with clearance for close button */}
        <SheetHeader className="space-y-1 text-left border-b border-[#D5CCBB] pb-3.5 sm:pb-4 pr-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#073C35]/10 flex items-center justify-center text-[#073C35] shrink-0">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <SheetTitle className="font-serif text-lg sm:text-xl font-bold text-[#221811] leading-tight">
                Your Shopping Bag
              </SheetTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono font-medium text-[#8C6D37] bg-[#C9A45C]/15 px-2 py-0.5 rounded-full border border-[#C9A45C]/30">
                  {totalCount} {totalCount === 1 ? "piece" : "pieces"}
                </span>
                <span className="text-[11px] text-[#6B5A4A] hidden xs:inline">
                  Handcrafted Edition
                </span>
              </div>
            </div>
          </div>
          <SheetDescription className="text-xs text-[#6B5A4A] pt-1">
            Review your selected handcrafted weaves before checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto py-3.5 sm:py-4 space-y-3 sm:space-y-3.5 pr-0.5">
          {cartEntries.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#E4DDCD]/50 border border-[#D5CCBB] flex items-center justify-center text-[#8C6D37]/70 shadow-2xs">
                <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="font-serif text-lg font-bold text-[#221811]">
                  Your bag is empty
                </p>
                <p className="text-xs text-[#6B5A4A] leading-relaxed">
                  Explore our curated collection of authentic Kanchipuram silks, festive weaves, and bespoke creations.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-2 text-xs font-semibold border-[#D5CCBB] bg-[#FFFCF7] text-[#221811] hover:bg-[#FAF4EA] rounded-full px-5 py-2 cursor-pointer shadow-2xs"
              >
                Explore Collections
              </Button>
            </div>
          ) : (
            cartEntries.map(({ sku, qty, product }) => {
              const unitPrice = product ? product.priceMinor / 100 : 0;
              let effectiveUnit = unitPrice;
              if (product?.offer?.active) {
                if (product.offer.type === "percent") {
                  effectiveUnit = unitPrice * (1 - product.offer.value / 100);
                } else {
                  effectiveUnit = Math.max(0, unitPrice - product.offer.value);
                }
              }

              return (
                <div
                  key={sku}
                  className="flex gap-3 sm:gap-3.5 p-3 sm:p-3.5 rounded-2xl border border-[#D5CCBB] bg-[#FFFCF7] shadow-2xs hover:border-[#C9A45C]/60 transition-colors"
                >
                  {/* Thumbnail: Slightly taller to display saree drape gracefully */}
                  <div className="h-20 w-16 sm:h-22 sm:w-18 rounded-xl border border-[#E5DAC6] overflow-hidden bg-[#FAF4EA] shrink-0 relative">
                    {product?.primaryImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#B0A292]">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Product Details & Responsive Stepper */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {/* Top Row: Title, SKU & Remove Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 pr-1">
                        <span className="text-[10px] font-mono font-medium text-[#8C6D37] uppercase tracking-wider block">
                          {sku}
                        </span>
                        <h4 className="text-xs sm:text-sm font-serif font-semibold text-[#221811] leading-snug line-clamp-2">
                          {product?.name || "Curated Weave"}
                        </h4>
                      </div>

                      {/* Accessible Remove Button with 32px touch target */}
                      <button
                        type="button"
                        onClick={() => removeItem(sku)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-[#B0A292] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Remove piece"
                        aria-label={`Remove ${product?.name || sku} from bag`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Bottom Row: Price & Quantity Stepper */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5DAC6]/50 mt-2">
                      {/* Price Display */}
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-xs sm:text-sm font-bold text-[#221811]">
                            ₹{Math.round(effectiveUnit).toLocaleString("en-IN")}
                          </span>
                          {product?.offer?.active && effectiveUnit < unitPrice && (
                            <span className="text-[10px] font-mono text-[#8C6D37] line-through">
                              ₹{Math.round(unitPrice).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {product?.offer?.active && (
                          <span className="text-[9px] font-medium text-[#073C35] font-sans">
                            {product.offer.label || "Offer Applied"}
                          </span>
                        )}
                      </div>

                      {/* Touch-Friendly Quantity Stepper */}
                      <div className="flex items-center border border-[#D5CCBB] rounded-lg bg-[#FAF4EA] shadow-2xs">
                        <button
                          type="button"
                          disabled={qty <= 1}
                          onClick={() => updateQuantity(sku, qty - 1)}
                          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-[#6B5A4A] hover:text-[#221811] hover:bg-[#E4DDCD]/40 rounded-l-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 sm:w-7 text-center text-xs font-mono font-semibold text-[#221811]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={product ? qty >= product.stock : false}
                          onClick={() => {
                            const maxStock = product?.stock ?? 99;
                            if (qty >= maxStock) {
                              toast.error(`Only ${maxStock} pieces available in stock.`);
                              return;
                            }
                            const updated = updateQuantity(sku, qty + 1, maxStock);
                            if (!updated) {
                              toast.error(`Only ${maxStock} pieces available in stock.`);
                            }
                          }}
                          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-[#6B5A4A] hover:text-[#221811] hover:bg-[#E4DDCD]/40 rounded-r-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout with mobile safe-area spacing */}
        {cartEntries.length > 0 && (
          <SheetFooter className="border-t border-[#D5CCBB] pt-3.5 sm:pt-4 flex-col gap-3 sm:flex-col shrink-0 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-[#6B5A4A] font-medium">Estimated Subtotal</span>
                <span className="font-mono font-bold text-base sm:text-lg text-[#221811]">
                  ₹{(subtotalMinor / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#6B5A4A] pt-0.5">
                <span>Free Insured Shipping</span>
                <span className="text-[#073C35] font-semibold">Across India</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-[#6B5A4A] hover:text-red-700 hover:bg-red-50/50 rounded-xl px-3 py-2 cursor-pointer h-10 sm:h-11"
              >
                Clear
              </Button>

              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold h-10 sm:h-11 px-5 rounded-xl bg-[#073C35] hover:bg-[#073C35]/90 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 text-[#C9A45C]" />
              </Link>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
