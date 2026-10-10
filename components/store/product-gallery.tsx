"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductGalleryProps {
  images: readonly string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeImage = images[selectedIdx] || images[0];

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/30 aspect-4/5 flex items-center justify-center text-muted-foreground/40">
        <Package className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Large Image */}
      <div className="rounded-2xl border border-border/80 overflow-hidden bg-muted/20 shadow-xs relative">
        <AspectRatio ratio={4 / 5}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage}
            alt={productName}
            className="h-full w-full object-cover transition-all duration-300"
          />
        </AspectRatio>
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative h-18 w-18 rounded-xl border overflow-hidden shrink-0 transition-all ${
                selectedIdx === idx
                  ? "border-primary ring-2 ring-primary/20 shadow-xs"
                  : "border-border/70 opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
