"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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

  // Reset currentSlide if it exceeds totalSlides
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
    <section className="container mx-auto px-3 xs:px-4 sm:px-6 pt-2 sm:pt-3">
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[28px] border border-neutral-200/60 shadow-sm bg-neutral-950 text-white w-full h-[42vh] sm:h-[50vh] md:h-[58vh] lg:h-[64vh] min-h-[280px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[560px] xl:min-h-[600px] max-h-[660px] flex items-center select-none"
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
            const objectPos =
              banner.objectPosition ||
              `${banner.imagePositionX ?? 85}% ${banner.imagePositionY ?? 15}%`;
            const showOverlay = banner.showOverlay !== false;
            const textPos = banner.textPosition || "left";

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive
                    ? "opacity-100 z-10 pointer-events-auto"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                {!showOverlay ? (
                  /* Pure Banner Graphic Mode (Clickable directly) */
                  <Link
                    href={banner.primaryCtaLink || "/collections"}
                    className="absolute inset-0 block w-full h-full cursor-pointer z-10 group overflow-hidden bg-neutral-950"
                    aria-label={banner.title || "NiVi Collection"}
                  >
                    <Image
                      src={heroImgSrc}
                      alt={banner.title || "NiVi Luxury Handcrafted Silk Sarees"}
                      fill
                      priority={idx === 0}
                      unoptimized
                      sizes="(max-width: 1280px) 100vw, 1280px"
                      className="object-cover brightness-[0.95] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                      style={{ objectPosition: objectPos }}
                    />
                  </Link>
                ) : (
                  <>
                    {/* Background Hero Photo */}
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={heroImgSrc}
                        alt={banner.title || "NiVi Luxury Handcrafted Silk Sarees"}
                        fill
                        priority={idx === 0}
                        unoptimized
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className="object-cover brightness-[0.92]"
                        style={{ objectPosition: objectPos }}
                      />
                      {/* Soft directional gradient based on textPosition */}
                      {textPos === "left" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent w-[65%] sm:w-[55%] md:w-[50%]" />
                      )}
                      {textPos === "right" && (
                        <div className="absolute inset-0 left-auto right-0 bg-gradient-to-l from-black/90 via-black/60 to-transparent w-[65%] sm:w-[55%] md:w-[50%]" />
                      )}
                      {textPos === "center" && (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />
                      )}
                    </div>

                    {/* Content Overlay */}
                    <div
                      className={`relative z-10 w-full h-full flex items-center px-4 xs:px-6 sm:px-10 md:px-14 py-3 sm:py-6 md:py-10 ${
                        textPos === "center"
                          ? "justify-center text-center"
                          : textPos === "right"
                          ? "justify-end text-right"
                          : "justify-start text-left"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] xs:max-w-[60%] sm:max-w-[50%] md:max-w-xl space-y-1.5 xs:space-y-2 sm:space-y-4 ${
                          textPos === "center" ? "mx-auto text-center" : ""
                        }`}
                      >
                        {/* Brand Tagline Badge */}
                        {banner.tagline && (
                          <div
                            className={`inline-flex items-center gap-1 sm:gap-2 rounded-full border border-[#B87333]/50 bg-black/40 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] xs:text-[9px] sm:text-xs font-medium text-[#E8C19A] shadow-2xs ${
                              textPos === "center" ? "mx-auto" : ""
                            }`}
                          >
                            <Sparkles className="h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3.5 sm:w-3.5 text-[#D4956A] shrink-0" />
                            <span className="font-serif tracking-wider uppercase">
                              {banner.tagline}
                            </span>
                          </div>
                        )}

                        {/* Main Headline */}
                        {banner.title && (
                          <h1 className="font-serif text-[13px] xs:text-base sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.18] drop-shadow-sm">
                            {banner.title}
                          </h1>
                        )}

                        {/* Description */}
                        {banner.subtitle && (
                          <p className="text-[8.5px] xs:text-[10px] sm:text-xs md:text-sm text-neutral-200 leading-tight sm:leading-relaxed font-sans line-clamp-2 max-w-xs sm:max-w-md">
                            {banner.subtitle}
                          </p>
                        )}

                        {/* CTA Buttons */}
                        <div
                          className={`flex items-center gap-1.5 xs:gap-2 pt-1 sm:pt-2 flex-wrap ${
                            textPos === "center"
                              ? "justify-center"
                              : textPos === "right"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {banner.primaryCtaText && (
                            <Link
                              href={banner.primaryCtaLink || "/collections"}
                              className="group relative inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-gradient-to-r from-[#023036] via-[#035354] to-[#023036] hover:from-[#034F58] hover:via-[#056677] text-white px-2.5 py-1 xs:px-3.5 xs:py-1.5 sm:px-6 sm:py-2.5 text-[8.5px] xs:text-[10.5px] sm:text-sm font-semibold tracking-wide border border-[#B87333]/40 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                            >
                              <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
                              <span className="relative z-10 font-medium">
                                {banner.primaryCtaText}
                              </span>
                              <ArrowRight className="relative z-10 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-[#D4956A] transition-transform duration-300 group-hover:translate-x-0.5" />
                            </Link>
                          )}

                          {banner.secondaryCtaText && (
                            <Link
                              href={banner.secondaryCtaLink || "/offers"}
                              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-2 py-1 xs:px-2.5 xs:py-1.5 sm:px-4 sm:py-2.5 text-[8px] xs:text-[9.5px] sm:text-xs font-medium border border-white/25 transition-all duration-300"
                            >
                              <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 text-[#D4956A]" />
                              <span>{banner.secondaryCtaText}</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          }

          // Campaign Slide
          const camp = slide.campaign;
          const ctaLink = `/offers/${camp.id}`;
          const hasCustomOverlay = Boolean(camp.bannerTitle && camp.bannerTitle.trim());
          const campObjectPos =
            camp.imagePosition ||
            (camp.imagePositionX !== undefined &&
            camp.imagePositionX !== null &&
            camp.imagePositionY !== undefined &&
            camp.imagePositionY !== null
              ? `${camp.imagePositionX}% ${camp.imagePositionY}%`
              : "center");

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {!hasCustomOverlay ? (
                /* Pure Banner Graphic Mode: Entire banner is clickable */
                <Link
                  href={ctaLink}
                  className="absolute inset-0 block w-full h-full cursor-pointer z-10 group overflow-hidden bg-neutral-950"
                  aria-label={`View ${camp.name} collection`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={camp.bannerImageUrl!}
                    alt={camp.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    style={{ objectPosition: campObjectPos }}
                  />
                </Link>
              ) : (
                /* Text Overlay Mode: When headline/text are explicitly configured */
                <>
                  <div className="absolute inset-0 z-0 bg-neutral-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={camp.bannerImageUrl!}
                      alt={camp.bannerTitle || camp.name}
                      className="w-full h-full object-cover brightness-[0.9]"
                      style={{ objectPosition: campObjectPos }}
                    />
                    <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/60 to-transparent w-[60%] sm:w-[55%] md:w-[50%]" />
                  </div>

                  <div className="relative z-20 w-full h-full flex items-center px-3.5 xs:px-6 sm:px-10 md:px-14 py-2 sm:py-6 md:py-8">
                    <div className="max-w-[54%] sm:max-w-[50%] md:max-w-xl space-y-1 xs:space-y-1.5 sm:space-y-3 text-left">
                      {/* Discount Badge */}
                      <div className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-[#B87333]/60 bg-black/50 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-0.5 text-[8px] xs:text-[9px] sm:text-xs font-medium text-[#E8C19A] shadow-2xs">
                        <Sparkles className="h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3 text-[#D4956A] shrink-0" />
                        <span className="font-serif tracking-wider uppercase font-semibold">
                          {camp.label || `${camp.value}% OFF`}
                        </span>
                        {camp.expiry && (
                          <span className="text-[7.5px] xs:text-[9px] sm:text-[10px] text-amber-300/80 pl-1 border-l border-amber-400/30">
                            Ends {camp.expiry}
                          </span>
                        )}
                      </div>

                      {/* Main Headline */}
                      <h2 className="font-serif text-[12px] xs:text-sm sm:text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-[1.14] sm:leading-[1.16] drop-shadow-sm">
                        {camp.bannerTitle}
                      </h2>

                      {/* Subtitle / Description */}
                      {camp.bannerSubtitle && (
                        <p className="text-[8px] xs:text-[9.5px] sm:text-xs md:text-sm text-neutral-200 leading-tight sm:leading-relaxed font-sans line-clamp-2 max-w-xs sm:max-w-md">
                          {camp.bannerSubtitle}
                        </p>
                      )}

                      {/* CTA Buttons */}
                      <div className="flex items-center gap-1.5 xs:gap-2 pt-1 sm:pt-2.5">
                        <Link
                          href={ctaLink}
                          className="group relative inline-flex items-center justify-center gap-1 sm:gap-2 rounded-full bg-gradient-to-r from-[#023036] via-[#035354] to-[#023036] hover:from-[#034F58] hover:via-[#056677] text-white px-2.5 py-1 xs:px-3.5 xs:py-1.5 sm:px-6 sm:py-2.5 text-[8.5px] xs:text-[10.5px] sm:text-sm font-semibold tracking-wide border border-[#B87333]/40 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
                          <span className="relative z-10 font-medium">
                            {camp.bannerCtaText || "Explore Offers"}
                          </span>
                          <ArrowRight className="relative z-10 h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-[#D4956A] transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>

                        <Link
                          href="/offers"
                          className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-2 py-1 xs:px-2.5 xs:py-1.5 sm:px-4 sm:py-2.5 text-[8px] xs:text-[9.5px] sm:text-xs font-medium border border-white/25 transition-all duration-300"
                        >
                          <span>All Offers</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Carousel Navigation Arrows */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide - 1)}
              className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-6 w-6 sm:h-10 sm:w-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToSlide(currentSlide + 1)}
              className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-6 w-6 sm:h-10 sm:w-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        {/* Carousel Bottom Indicator Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-1.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/15">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(i)}
                className={`transition-all rounded-full ${
                  currentSlide === i
                    ? "w-3 sm:w-7 h-1 sm:h-1.5 bg-[#D4956A]"
                    : "w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
