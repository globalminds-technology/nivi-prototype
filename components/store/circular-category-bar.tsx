"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { Category } from "@/core/domain/entities/category";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { GoldText } from "./gold-text";

interface CircularCategoryBarProps {
  categories?: Category[];
}

/**
 * Fallback cover images mapped by fabric keyword for Zoho categories
 * in case imageUrl is missing on any item.
 */
const FABRIC_IMAGE_MAP: Record<string, string> = {
  kanchipuram: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/kanchipuram-silk-sarees.jpg",
  banarasi: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/banarasi-silk-sarees.jpg",
  cotton: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/cotton-sarees.jpg",
  organza: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/organza-sarees.jpg",
  linen: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/linen-sarees.jpg",
  silk: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/kanchipuram-silk-sarees.jpg",
};

function resolveCategoryImageUrl(category: Category): string | null {
  if (category.imageUrl && category.imageUrl.trim().length > 0) {
    return category.imageUrl;
  }
  const searchKey = `${category.slug || ""} ${category.name || ""}`.toLowerCase();
  for (const [fabric, url] of Object.entries(FABRIC_IMAGE_MAP)) {
    if (searchKey.includes(fabric)) {
      return url;
    }
  }
  return null;
}

export function CircularCategoryBar({ categories = [] }: CircularCategoryBarProps) {
  // Only display genuine categories from Zoho Books (no hardcoded dummy categories)
  const displayCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || cat.id,
      imageUrl: resolveCategoryImageUrl(cat),
    }));
  }, [categories]);

  if (displayCategories.length === 0) return null;

  return (
    <section className="w-full pt-2 sm:pt-3 pb-2 sm:pb-3">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        {/* Header: Explore Categories in Brand Script & Antique Gold */}
        <div className="relative flex flex-col items-center justify-center text-center mb-2 sm:mb-3">
          <GoldText>Explore Categories</GoldText>
        </div>

        {/* Categories Carousel */}
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            loop: false,
          }}
          className="w-full relative"
        >
          <CarouselContent className="-ml-3 sm:-ml-4 md:-ml-6">
            {displayCategories.map((category) => {
              const href = `/categories/${category.slug}`;

              return (
                <CarouselItem
                  key={category.id}
                  className="pl-3 sm:pl-4 md:pl-6 basis-[36%] xs:basis-[28%] sm:basis-[22%] md:basis-[20%]"
                >
                  <Link
                    href={href}
                    className="group flex flex-col items-center w-full text-center focus:outline-none transition-transform duration-200"
                  >
                    {/* Circular Thumbnail - completely borderless, ring-free */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 xl:w-26 xl:h-26 rounded-full overflow-hidden bg-[#FAF7F0] border-0 ring-0 outline-none focus:outline-none focus:ring-0 group-hover:border-0 group-hover:ring-0 group-hover:scale-105 transition-all duration-300 shrink-0">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          unoptimized
                          sizes="200px"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#FAF7F0] text-[#6B5A4A] group-hover:text-[#073C35] transition-colors">
                          <Layers className="w-7 h-7" />
                        </div>
                      )}
                    </div>

                    {/* Category Label */}
                    <span
                      title={category.name}
                      className="mt-2 text-xs sm:text-[13px] md:text-sm font-medium text-[#30251F] group-hover:text-[#073C35] transition-colors text-center leading-snug line-clamp-2 px-1 tracking-wide"
                    >
                      {category.name}
                    </span>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Previous & Next arrows: Only appear when items overflow screen bounds */}
          <CarouselPrevious
            className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -left-2 sm:-left-3 lg:-left-4 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20"
          />
          <CarouselNext
            className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -right-2 sm:-right-3 lg:-right-4 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20"
          />
        </Carousel>
      </div>
    </section>
  );
}
