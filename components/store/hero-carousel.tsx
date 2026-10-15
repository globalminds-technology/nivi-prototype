"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_HERO_BANNER,
  type HeroBannerConfig,
} from "@/core/domain/entities/hero-banner";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";

export interface HeroCarouselProps {
  campaigns: OfferCampaign[];
  heroBanner?: HeroBannerConfig | null;
}

type CarouselSlide =
  | {
      id: string;
      type: "hero";
      order: number;
      banner: HeroBannerConfig;
    }
  | {
      id: string;
      type: "campaign";
      order: number;
      campaign: OfferCampaign;
    };

export function HeroCarousel({ campaigns, heroBanner }: HeroCarouselProps) {
  const activeHero = heroBanner || DEFAULT_HERO_BANNER;

  // Build unified slides list sorted by display order
  const slides = useMemo<CarouselSlide[]>(() => {
    const list: CarouselSlide[] = [];

    if (activeHero.active !== false) {
      list.push({
        id: "hero_main",
        type: "hero",
        order: activeHero.displayOrder ?? 0,
        banner: activeHero,
      });
    }

    const validCampaigns = campaigns.filter(
      (c) => c.active && c.bannerImageUrl && c.bannerImageUrl.trim().length > 0,
    );

    validCampaigns.forEach((camp, idx) => {
      list.push({
        id: camp.id,
        type: "campaign",
        order: camp.displayOrder ?? idx + 1,
        campaign: camp,
      });
    });

    return list.sort((a, b) => a.order - b.order);
  }, [activeHero, campaigns]);

  const totalSlides = slides.length;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-play timer (rotates every 7 seconds when not hovered/paused)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 7000);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused]);

  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  if (totalSlides === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentSlide((index + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToSlide(currentSlide - 1);
      } else {
        goToSlide(currentSlide + 1);
      }
    }
    touchStartX.current = null;
  };

  return (
    <section className="w-full">
      <div
        className="relative w-full overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, idx) => {
          const isActive = currentSlide === idx;

          if (slide.type === "hero") {
            const banner = slide.banner;
            const heroImgSrc = banner.imageUrl || "/nivi-hero-banner-v2.jpg";

            return (
              <div
                key={slide.id}
                className={`transition-opacity duration-700 ease-in-out ${
                  isActive ? "block opacity-100" : "hidden opacity-0"
                }`}
              >
                {/* Full-bleed banner maintaining true 3:1 aspect ratio so full text and imagery fit comfortably without cropping */}
                <div className="relative w-full overflow-hidden aspect-[3/1]">
                  <Link
                    href={banner.primaryCtaLink || "/collections"}
                    className="block w-full h-full cursor-pointer overflow-hidden group"
                    aria-label={banner.title || "NiVi Saree Collection"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImgSrc}
                      alt={banner.title || "NiVi Saree Collection"}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.008]"
                    />
                  </Link>
                </div>
              </div>
            );
          }

          // Campaign Slide (Rendered in identical aspect ratio hero box)
          const camp = slide.campaign;
          const ctaLink = `/offers/${camp.id}`;
          const campObjectPos =
            camp.imagePosition ||
            (camp.imagePositionX !== undefined &&
            camp.imagePositionY !== undefined
              ? `${camp.imagePositionX}% ${camp.imagePositionY}%`
              : "center");

          return (
            <div
              key={slide.id}
              className={`transition-opacity duration-700 ease-in-out ${
                isActive ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              <div className="relative w-full overflow-hidden aspect-[3/1]">
                <Link
                  href={ctaLink}
                  className="block w-full h-full cursor-pointer group overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={camp.bannerImageUrl!}
                    alt={camp.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    style={{ objectPosition: campObjectPos }}
                  />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Carousel Indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-4 sm:left-8 md:left-12 z-20 flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(i)}
                className={`transition-all rounded-full ${
                  currentSlide === i
                    ? "w-2.5 h-2.5 bg-[#30251F]"
                    : "w-2.5 h-2.5 bg-[#30251F]/30 hover:bg-[#30251F]/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {totalSlides > 0 && (
          <>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide - 1)}
              className="absolute left-2.5 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/75 hover:bg-white text-[#30251F] shadow-sm flex items-center justify-center transition-all hover:scale-105"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide + 1)}
              className="absolute right-2.5 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/75 hover:bg-white text-[#30251F] shadow-sm flex items-center justify-center transition-all hover:scale-105"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
