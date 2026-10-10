"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import type { Category } from "@/core/domain/entities/category";

interface CircularCategoryBarProps {
  categories: Category[];
}

export function CircularCategoryBar({ categories }: CircularCategoryBarProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If user is already scrolling horizontally (trackpad 2-finger horizontal swipe),
      // allow native browser horizontal scroll to work smoothly
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // If user is scrolling vertically with trackpad / mouse wheel over the category bar
      if (el.scrollWidth > el.clientWidth) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight =
          el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

        if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-background border-b border-[#d2c8b5]/60 sticky top-16 sm:top-20 z-30 backdrop-blur-xs">
      <div className="container mx-auto px-4 sm:px-6">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto py-2 sm:py-2.5 scrollbar-none scroll-smooth overscroll-x-contain touch-pan-x"
        >
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-full w-max justify-start md:[justify-content:safe_center] px-1">
            {/* Amazon-style Borderless Round Category Items */}
            {categories.map((category) => {
              const slug =
                category.slug || category.name.toLowerCase().replace(/\s+/g, "-");
              const href = `/categories/${slug}`;
              const coverImage = category.imageUrl;

              return (
                <Link
                  key={category.id}
                  href={href}
                  className="group flex flex-col items-center shrink-0 text-center focus:outline-none"
                >
                  {/* Borderless Round Image Thumbnail (Compact & Sleek) */}
                  <div className="relative w-12 h-12 sm:w-13.5 sm:h-13.5 md:w-15 md:h-15 rounded-full overflow-hidden bg-[#ede7d8] border border-[#d2c8b5]/60 shadow-2xs group-hover:scale-105 transition-transform duration-200 shrink-0">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={category.name}
                        fill
                        unoptimized
                        sizes="120px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#ede7d8] text-neutral-400 group-hover:text-primary transition-colors">
                        <Layers className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Single Line Category Name */}
                  <span
                    title={category.name}
                    className="mt-1 text-[10px] sm:text-[11px] font-medium text-neutral-800 group-hover:text-primary transition-colors truncate whitespace-nowrap block text-center max-w-[62px] sm:max-w-[72px] md:max-w-[80px] w-full"
                  >
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
