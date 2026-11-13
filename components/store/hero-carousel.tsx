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
    <section className="w-full px-3.5 sm:px-5 md:px-0 pt-2 sm:pt-3 md:pt-0 pb-1 sm:pb-0">
      <div
        className="relative w-full overflow-hidden select-none rounded-2xl md:rounded-none shadow-xs md:shadow-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, idx) => {
          const isActive = currentSlide === idx;

          if (slide.type === "hero") {
            const banner = slide.banner;
            const heroImgSrc = banner.imageUrl || "/hero-flagship-exact.png";
            const heroObjectPos =
              banner.objectPosition ||
              (banner.imagePositionX !== undefined && banner.imagePositionY !== undefined
                ? `${banner.imagePositionX}% ${banner.imagePositionY}%`
                : "85% 15%");
            const textPos = banner.textPosition || "left";
            const showOverlay = banner.showOverlay !== false;

            return (
              <div
                key={slide.id}
                className={`transition-opacity duration-700 ease-in-out ${
                  isActive ? "block opacity-100" : "hidden opacity-0"
                }`}
              >
                {/* 3:1 banner with rounded corners on mobile */}
                <div className="relative w-full overflow-hidden aspect-[3/1] rounded-2xl md:rounded-none group">
                  <Link
                    href={banner.primaryCtaLink || "/collections"}
                    className="block w-full h-full cursor-pointer overflow-hidden"
                    aria-label={banner.title || "The Saree Studio Collection"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImgSrc}
                      alt={banner.title || "The Saree Studio Collection"}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.008]"
                      style={{ objectPosition: heroObjectPos }}
                    />
                  </Link>

                  {/* Contrast Gradient & Text Overlay */}
                  {showOverlay && (
                    <>
                      <div
                        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                          textPos === "right"
                            ? "bg-gradient-to-l from-black/85 via-black/45 to-transparent right-0 left-auto w-[85%] sm:w-[65%] md:w-[50%]"
                            : textPos === "center"
                            ? "bg-black/45"
                            : "bg-gradient-to-r from-black/85 via-black/45 to-transparent w-[85%] sm:w-[65%] md:w-[50%]"
                        }`}
                      />

                      <div
                        className={`absolute inset-0 z-10 px-5 sm:px-10 md:px-14 lg:px-20 py-3 sm:py-6 md:py-8 flex flex-col justify-center text-white pointer-events-none ${
                          textPos === "center"
                            ? "items-center text-center"
                            : textPos === "right"
                            ? "items-end text-right"
                            : "items-start text-left"
                        }`}
                      >
                        {/* Tagline / Pill Badge */}
                        {banner.tagline && (
                          <span className="inline-block text-[8px] xs:text-[9.5px] sm:text-xs font-serif tracking-widest uppercase text-amber-200 border border-amber-300/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/45 backdrop-blur-xs mb-1 sm:mb-2 shadow-xs select-none">
                            {banner.tagline}
                          </span>
                        )}

                        {/* Headline Title */}
                        <h2 className="font-serif text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.6rem] font-bold leading-tight max-w-xs sm:max-w-md lg:max-w-xl text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                          {banner.title || "Sarees for Every Story"}
                        </h2>

                        {/* Subtitle */}
                        {banner.subtitle && (
                          <p className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm lg:text-base text-neutral-200/90 line-clamp-2 max-w-xs sm:max-w-md lg:max-w-lg mt-0.5 sm:mt-2 drop-shadow-sm font-sans">
                            {banner.subtitle}
                          </p>
                        )}

                        {/* CTAs */}
                        {(banner.primaryCtaText || banner.primaryCtaLink) && (
                          <div className="mt-2 sm:mt-3.5 md:mt-5 flex items-center gap-2 sm:gap-3 pointer-events-auto">
                            <Link
                              href={banner.primaryCtaLink || "/collections"}
                              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1 sm:py-2 rounded-md sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium tracking-wide bg-[#C9A45C] hover:bg-[#d4ae65] text-[#30251F] font-serif shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <span>{banner.primaryCtaText || "Shop Collection"}</span>
                              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Link>

                            {banner.secondaryCtaText && banner.secondaryCtaLink && (
                              <Link
                                href={banner.secondaryCtaLink}
                                className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-1 sm:py-2 rounded-md sm:rounded-xl text-xs md:text-sm font-medium tracking-wide bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <span>{banner.secondaryCtaText}</span>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
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
              <div className="relative w-full overflow-hidden aspect-[3/1] rounded-2xl md:rounded-none group">
                <Link
                  href={ctaLink}
                  className="block w-full h-full cursor-pointer overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={camp.bannerImageUrl!}
                    alt={camp.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    style={{ objectPosition: campObjectPos }}
                  />
                </Link>

                {/* If campaign has title AND showOverlay is explicitly enabled, render overlay */}
                {camp.showOverlay === true && Boolean(camp.bannerTitle?.trim()) && (
                  <>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/80 via-black/40 to-transparent w-[85%] sm:w-[65%] md:w-[50%]" />
                    <div className="absolute inset-0 z-10 px-5 sm:px-10 md:px-14 lg:px-20 py-3 sm:py-6 md:py-8 flex flex-col justify-center items-start text-left text-white pointer-events-none">
                      <span className="inline-block text-[8px] xs:text-[9.5px] sm:text-xs font-serif tracking-widest uppercase text-amber-200 border border-amber-300/40 px-2.5 sm:px-3 py-0.5 rounded-full bg-black/45 backdrop-blur-xs mb-1 sm:mb-2 shadow-xs select-none">
                        {camp.label || "Special Offer"}
                      </span>
                      <h2 className="font-serif text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-xs sm:max-w-md text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                        {camp.bannerTitle}
                      </h2>
                      {camp.bannerSubtitle && (
                        <p className="text-[9px] xs:text-[11px] sm:text-xs md:text-sm text-neutral-200/90 line-clamp-2 max-w-xs sm:max-w-md mt-0.5 sm:mt-1 drop-shadow-xs font-sans">
                          {camp.bannerSubtitle}
                        </p>
                      )}
                      <div className="mt-2 sm:mt-3.5 pointer-events-auto">
                        <Link
                          href={ctaLink}
                          className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1 sm:py-2 rounded-md sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium bg-[#C9A45C] hover:bg-[#d4ae65] text-[#30251F] font-serif shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>{camp.bannerCtaText || "View Offers"}</span>
                          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Carousel Indicators (hidden on mobile for clean card aesthetic, swipeable via touch) */}
        {totalSlides > 1 && (
          <div className="hidden sm:flex absolute bottom-3 sm:bottom-4 md:bottom-5 left-4 sm:left-8 md:left-12 z-20 items-center gap-2">
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

        {/* Navigation Arrows (hidden on mobile, touch swipe handled on touch devices) */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide - 1)}
              className="hidden sm:flex absolute left-2.5 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/75 hover:bg-white text-[#30251F] shadow-sm items-center justify-center transition-all hover:scale-105"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide + 1)}
              className="hidden sm:flex absolute right-2.5 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/75 hover:bg-white text-[#30251F] shadow-sm items-center justify-center transition-all hover:scale-105"
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
