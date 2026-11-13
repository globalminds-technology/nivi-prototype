"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { StoreProductData } from "./product-card";

interface SearchDialogProps {
  products: StoreProductData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ products, open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Saree Catalog"
      description="Quickly jump to products, offers, or collections"
    >
      <CommandInput placeholder="Search sarees, dresses, silk, jewelry..." />
      <CommandList className="max-h-[320px]">
        <CommandEmpty>No pieces found matching your query.</CommandEmpty>

        <CommandGroup heading="Curated Collection">
          {products.map((product) => (
            <CommandItem
              key={product.sku}
              value={`${product.name} ${product.sku} ${product.tags.join(" ")}`}
              onSelect={() => handleSelect(product.slug)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-muted/50 border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
                  {product.primaryImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.primaryImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground/60" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-xs text-foreground line-clamp-1">
                    {product.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {product.sku}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {product.offer?.active && (
                  <span className="text-[10px] text-primary font-medium">
                    Offer
                  </span>
                )}
                <span className="font-mono text-xs font-semibold">
                  ₹{(product.priceMinor / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
