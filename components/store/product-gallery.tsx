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
    <div className="w-full max-w-[460px] mx-auto space-y-3">
      {/* Main Image Container with Viewport-Friendly Height */}
      <div className="relative w-full rounded-2xl border border-[#D5CCBB]/80 overflow-hidden bg-[#FAF7F0] shadow-sm aspect-[4/5] max-h-[500px] flex items-center justify-center group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={productName}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />

        {/* Image index counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-mono tracking-wider backdrop-blur-xs select-none">
            {selectedIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`relative h-15 w-15 sm:h-16 sm:w-16 rounded-xl border overflow-hidden shrink-0 transition-all duration-200 cursor-pointer ${
                selectedIdx === idx
                  ? "border-[#C9A45C] ring-2 ring-[#C9A45C]/40 shadow-xs scale-105"
                  : "border-[#D5CCBB]/70 opacity-65 hover:opacity-100 hover:border-[#C9A45C]/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
