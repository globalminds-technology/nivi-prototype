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
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
        <SheetHeader className="space-y-1 text-left border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-xl flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Your Shopping Bag</span>
            </SheetTitle>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </span>
          </div>
          <SheetDescription className="text-xs">
            Review your selected handcrafted pieces before checkout.
          </SheetDescription>
        </SheetHeader>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cartEntries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Your bag is empty</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Explore our collection of sarees, bespoke dresses, and curated accessories.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-2"
              >
                Continue Browsing
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
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-16 rounded-lg border border-border/80 overflow-hidden bg-muted/40 shrink-0">
                    {product?.primaryImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-mono text-muted-foreground uppercase">{sku}</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {product?.name || "Curated Item"}
                    </p>
                    <div className="flex items-baseline gap-1.5 font-mono text-xs">
                      <span className="font-semibold text-foreground">
                        ₹{Math.round(effectiveUnit).toLocaleString("en-IN")}
                      </span>
                      {product?.offer?.active && effectiveUnit < unitPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          ₹{Math.round(unitPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-md bg-background">
                      <button
                        type="button"
                        disabled={qty <= 1}
                        onClick={() => updateQuantity(sku, qty - 1)}
                        className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-medium">{qty}</span>
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
                        className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(sku)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="text-[10px]">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout */}
        {cartEntries.length > 0 && (
          <SheetFooter className="border-t border-border/60 pt-4 flex-col gap-3 sm:flex-col">
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Subtotal</span>
                <span className="font-mono font-bold text-base text-foreground">
                  ₹{(subtotalMinor / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Taxes and shipping calculated at checkout. Free shipping across India.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear Bag
              </Button>

              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className={buttonVariants({
                  className: "flex-1 gap-2 shadow-sm",
                })}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
