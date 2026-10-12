"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { Category } from "@/core/domain/entities/category";

interface CircularCategoryBarProps {
  categories?: Category[];
}

/**
 * The 8 canonical boutique saree collections matching the NiVi design reference mockup.
 */
const CANONICAL_CATEGORIES = [
  {
    id: "kanchipuram",
    name: "Kanchipuram Sarees",
    slug: "kanchipuram-silk-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/kanchipuram-silk-sarees.jpg",
  },
  {
    id: "banarasi",
    name: "Banarasi Sarees",
    slug: "banarasi-silk-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/banarasi-silk-sarees.jpg",
  },
  {
    id: "cotton",
    name: "Cotton Sarees",
    slug: "cotton-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/cotton-sarees.jpg",
  },
  {
    id: "organza",
    name: "Organza Sarees",
    slug: "organza-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/organza-sarees.jpg",
  },
  {
    id: "linen",
    name: "Linen Sarees",
    slug: "linen-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/linen-sarees.jpg",
  },
  {
    id: "silk-cotton",
    name: "Silk Cotton Sarees",
    slug: "silk-cotton",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/kanchipuram-silk-sarees.jpg",
  },
  {
    id: "designer",
    name: "Designer Sarees",
    slug: "designer-sarees",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/banarasi-silk-sarees.jpg",
  },
  {
    id: "festive",
    name: "Festive Collection",
    slug: "festive-collection",
    imageUrl:
      "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/categories/cotton-sarees.jpg",
  },
];

export function CircularCategoryBar({ categories }: CircularCategoryBarProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Merge canonical categories with database categories so custom images & slugs are respected
  const displayCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return CANONICAL_CATEGORIES;
    }

    return CANONICAL_CATEGORIES.map((canonical) => {
      const match = categories.find((c) => {
        const cSlug = (c.slug || c.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetSlug = canonical.slug.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cSlug.includes(targetSlug) || targetSlug.includes(cSlug);
      });

      return {
        id: match?.id || canonical.id,
        name: canonical.name, // Keep clean boutique names from reference mockup
        slug: match?.slug || canonical.slug,
        imageUrl: match?.imageUrl || canonical.imageUrl,
      };
    });
  }, [categories]);

  return (
    <section className="w-full pt-4 sm:pt-5 pb-3 sm:pb-4">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 md:px-6 lg:px-8">
        {/* ========================================================
            DESKTOP VIEW (>= md breakpoint)
            - 8 Large Circles fitting the screen width edge-to-edge
            - Evenly distributed across all desktop screen sizes
            - Immediately visible right beneath the hero banner with category names in full view
           ======================================================== */}
        <div className="hidden md:flex items-start justify-between w-full gap-2 lg:gap-3 xl:gap-5">
          {displayCategories.map((category) => {
            const href = `/categories/${category.slug}`;

            return (
              <Link
                key={category.id}
                href={href}
                className="group flex flex-col items-center flex-1 min-w-0 text-center focus:outline-none transition-transform duration-200"
              >
                {/* Large Circular Thumbnail fitting screen width */}
                <div className="relative w-18 h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28 rounded-full overflow-hidden bg-[#FAF7F0] border-2 border-[#D5CCBB] shadow-xs group-hover:border-[#C9A45C] group-hover:shadow-[0_0_0_4px_rgba(201,164,92,0.25)] group-hover:scale-105 transition-all duration-300 shrink-0">
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

                {/* Category Label Underneath */}
                <span
                  title={category.name}
                  className="mt-1.5 md:mt-2 text-[11px] md:text-xs lg:text-[13px] font-medium text-[#30251F] group-hover:text-[#073C35] transition-colors text-center leading-snug line-clamp-2 px-1"
                >
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ========================================================
            MOBILE VIEW (< md breakpoint)
            - Smooth horizontal scroll with large touch-friendly bubbles
           ======================================================== */}
        <div
          ref={scrollContainerRef}
          className="flex md:hidden overflow-x-auto pb-2 scrollbar-none scroll-smooth overscroll-x-contain touch-pan-x gap-4 sm:gap-6 px-1"
        >
          {displayCategories.map((category) => {
            const href = `/categories/${category.slug}`;

            return (
              <Link
                key={`mob_cat_${category.id}`}
                href={href}
                className="group flex flex-col items-center shrink-0 text-center focus:outline-none"
              >
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#FAF7F0] border-2 border-[#D5CCBB] shadow-sm active:border-[#C9A45C] active:scale-95 transition-all shrink-0">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      unoptimized
                      sizes="160px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#FAF7F0] text-[#6B5A4A]">
                      <Layers className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <span
                  title={category.name}
                  className="mt-2 text-[11px] sm:text-xs font-medium text-[#30251F] text-center max-w-[80px] sm:max-w-[90px] leading-tight line-clamp-2"
                >
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
