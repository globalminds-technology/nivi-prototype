"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Crown,
  Feather,
  RefreshCw,
  Scissors,
  Sparkles,
} from "lucide-react";
import { GoldText } from "./gold-text";
import { ProductCard, type StoreProductData } from "./product-card";
import type { RecommendationProfile, SareeQuizAnswers } from "@/core/domain/entities/saree-quiz";

export interface RankedMatch {
  recommendation: RecommendationProfile;
  score: number;
}

export interface QuizResultsProductItem extends StoreProductData {
  attributes?: {
    fabric?: string | null;
    occasion?: readonly string[];
    border?: string | null;
  };
}

interface QuizResultsViewProps {
  answers: SareeQuizAnswers;
  allMatches: RankedMatch[];
  personalizedAdvice?: {
    drapingNote?: string;
    jewelleryNote?: string;
    bodyShapeNote?: string;
    heightNote?: string;
    undertoneNote?: string;
  };
  inStockProducts: QuizResultsProductItem[];
  initialMatchIndex?: number;
  editQuizUrl: string;
}

export function QuizResultsView({
  answers,
  allMatches,
  personalizedAdvice,
  inStockProducts,
  initialMatchIndex = 0,
  editQuizUrl,
}: QuizResultsViewProps) {
  const [matchIndex, setMatchIndex] = useState(initialMatchIndex);

  const totalMatches = allMatches.length;
  const currentMatch = allMatches[matchIndex] || allMatches[0];
  const recommendation = currentMatch.recommendation;

  // Instant match switching in 0ms! Zero server roundtrip or delay
  const handleNextMatch = () => {
    const nextIdx = (matchIndex + 1) % totalMatches;
    setMatchIndex(nextIdx);

    // Silently update browser URL without any page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("match", nextIdx.toString());
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Instant client-side product matching based on the active recommendation
  const matchedStoreProducts = useMemo(() => {
    const targetFabric = (recommendation.fabric || "").toLowerCase();
    const targetOccasion = (answers.occasion || "").toLowerCase();
    const targetBorder = (answers.border || "").toLowerCase();

    const scored = inStockProducts.map((p) => {
      let score = 0;
      const pName = p.name.toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pFabric = (p.attributes?.fabric || "").toLowerCase();

      // 1. Fabric match
      if (
        (pFabric && targetFabric.includes(pFabric)) ||
        (targetFabric && (pName.includes(targetFabric) || pCat.includes(targetFabric)))
      ) {
        score += 15;
      } else {
        const keywords = targetFabric.split(/\s+/).filter((w) => w.length > 3);
        for (const kw of keywords) {
          if (pName.includes(kw) || pCat.includes(kw) || pFabric.includes(kw)) {
            score += 5;
          }
        }
      }

      // 2. Occasion match
      if (p.attributes?.occasion && p.attributes.occasion.length > 0 && targetOccasion) {
        if (p.attributes.occasion.some((occ) => targetOccasion.includes(occ.toLowerCase()))) {
          score += 8;
        }
      }

      // 3. Border match
      if (p.attributes?.border && targetBorder) {
        if (targetBorder.includes(p.attributes.border.toLowerCase())) {
          score += 6;
        }
      }

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const filtered = scored.filter((sp) => sp.score > 0).map((sp) => sp.product);
    return filtered.length > 0 ? filtered : inStockProducts.slice(0, 10);
  }, [recommendation, answers, inStockProducts]);

  return (
    <div className="container mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#6B5A4A]">
        <Link href="/" className="hover:text-[#073C35] transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#B0A292]" />
        <Link href="/quiz" className="hover:text-[#073C35] transition-colors">
          Find Your Match
        </Link>
        <ChevronRight className="h-3 w-3 text-[#B0A292]" />
        <span className="font-semibold text-[#073C35] bg-[#073C35]/8 px-2 py-0.5 rounded">
          Your Saree Match
        </span>
      </nav>

      {/* Grand Regal Editorial Hero Banner */}
      <div className="relative rounded-3xl bg-linear-to-br from-[#FFFDF9] via-[#FAF4EA] to-[#F3E8D5] text-[#221811] p-7 sm:p-11 lg:p-13 shadow-[0_12px_45px_rgba(78,52,24,0.07)] overflow-hidden border border-[#D5CCBB]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C9A45C]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#C9A45C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Title, Focus, Story */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0DC] text-[#694208] text-xs font-semibold border border-[#D4B26F]/60 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[#8C6D37]" />
                <span>Curated Style Recommendation</span>
              </div>
              {totalMatches > 1 && (
                <span className="text-[11px] font-semibold text-[#8C6D37] bg-white/80 px-2.5 py-1 rounded-full border border-[#D5CCBB]">
                  Match {matchIndex + 1} of {totalMatches}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#221811] leading-tight">
              {recommendation.title}
            </h1>

            {recommendation.styleFocus && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#C9A45C]/15 border border-[#C9A45C]/40 text-[#694208] text-xs font-semibold tracking-wide">
                <span>Style Focus:</span>
                <span className="font-bold text-[#30251F]">{recommendation.styleFocus}</span>
              </div>
            )}

            <p className="text-sm sm:text-base text-[#4A3D34] leading-relaxed font-normal pt-1">
              {recommendation.whyItWorks}
            </p>

            {/* Instant Switching Controls */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleNextMatch}
                className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#073C35] hover:bg-[#073C35]/90 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 select-none"
                aria-label="Find Another Match"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#C9A45C]" />
                <span>
                  {totalMatches > 1
                    ? `Find Another Match (${matchIndex + 1}/${totalMatches})`
                    : "Find Another Match"}
                </span>
              </button>

              <Link
                href={editQuizUrl}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-[#D5CCBB] text-[#5C4D3C] hover:bg-white hover:text-[#073C35] transition-all cursor-pointer shadow-2xs"
              >
                <span>Edit Preferences</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Style Blueprint Card */}
          <div className="lg:col-span-5 bg-[#FFFCF7] border border-[#D5CCBB] rounded-2xl p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_rgba(78,52,24,0.05)]">
            <div className="flex items-center justify-between border-b border-[#E5DAC6] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#C9A45C]/15 flex items-center justify-center text-[#8C6D37]">
                  <Crown className="h-4 w-4" />
                </div>
                <span className="font-serif text-xs font-bold uppercase tracking-widest text-[#694208]">
                  Style Blueprint
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#C9A45C]/15 text-[#8C6D37] px-2 py-0.5 rounded border border-[#C9A45C]/30 font-semibold">
                Personalized
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center gap-2 pb-2.5 border-b border-[#E5DAC6]/60">
                <span className="text-[#6B5A4A]">Signature Weave</span>
                <span className="font-semibold text-[#221811] text-right">{recommendation.fabric}</span>
              </div>
              <div className="flex justify-between items-center gap-2 pb-2.5 border-b border-[#E5DAC6]/60">
                <span className="text-[#6B5A4A]">Occasions</span>
                <span className="font-semibold text-[#221811] text-right">{recommendation.occasions}</span>
              </div>
              <div className="flex justify-between items-center gap-2 pb-2.5 border-b border-[#E5DAC6]/60">
                <span className="text-[#6B5A4A]">Selected Border</span>
                <span className="font-semibold text-[#221811] text-right">{answers.border || "Harmonized"}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[#6B5A4A]">Colour Palette</span>
                <span className="font-semibold text-[#221811] text-right">
                  {answers.colourPalette?.split("—")[0] || "Curated"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: In-Stock Matching Sarees Showcase */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D5CCBB] pb-4">
          <div>
            <span className="text-xs font-bold text-[#8C6D37] uppercase tracking-widest block mb-1">
              Ready to Wear
            </span>
            <GoldText>Curated Handcrafted Sarees</GoldText>
            <p className="text-xs sm:text-sm text-[#6B5A4A] mt-1">
              In-stock masterweaves matching your {recommendation.fabric} recommendation and occasion profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleNextMatch}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#073C35] hover:text-[#073C35]/80 transition-colors cursor-pointer select-none"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#073C35]" />
              <span>
                {totalMatches > 1
                  ? `Explore Match #${((matchIndex + 1) % totalMatches) + 1} (${((matchIndex + 1) % totalMatches) + 1}/${totalMatches})`
                  : "Find Another Match"}
              </span>
            </button>
            <span className="text-[#B0A292] text-xs">|</span>
            <Link
              href={editQuizUrl}
              className="text-xs font-semibold text-[#6B5A4A] hover:text-[#073C35] transition-colors"
            >
              Edit Preferences
            </Link>
          </div>
        </div>

        {matchedStoreProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {matchedStoreProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-[#FFFCF7] border border-[#D5CCBB] rounded-3xl space-y-3">
            <p className="font-serif text-lg font-semibold text-[#221811]">
              Currently crafting more sarees in this weave
            </p>
            <p className="text-xs sm:text-sm text-[#6B5A4A] max-w-md mx-auto">
              Our master artisans are weaving new editions. In the meantime, explore all handcrafted sarees in our catalog.
            </p>
            <Link
              href="/collections"
              className="inline-block mt-3 text-xs font-semibold px-6 py-2.5 rounded-full bg-[#073C35] text-white hover:bg-[#073C35]/90 transition-all shadow-xs"
            >
              Explore All Collections
            </Link>
          </div>
        )}
      </div>

      {/* SECTION 3: The Couture Atelier Lookbook */}
      <div className="space-y-6 pt-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#8C6D37] uppercase tracking-[0.2em] block">
            Atelier Styling Consultation
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#221811]">
            Complete Styling &amp; Drape Guide
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5A4A]">
            Comprehensive artisan advice on draping, blouse tailoring, and accent pairings tailored specifically for your profile.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          {/* WING 1: The Saree Silhouette & Draping Technique */}
          <div className="bg-gradient-to-b from-[#FFFDF8] to-[#FAF3E5] border border-[#D5CCBB] rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(60,35,5,0.05)] space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5DAC6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#C9A45C]/15 border border-[#D4B26F]/60 flex items-center justify-center text-[#8C6D37]">
                    <Feather className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      Lookbook Part I
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#221811]">
                      The Saree &amp; Silhouette
                    </h3>
                  </div>
                </div>
                <span className="font-serif text-3xl font-bold text-[#C9A45C]/25">01</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                  Style Suggestion
                </h4>
                <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                  {recommendation.styleSuggestion}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                  Master Draping Technique
                </h4>
                <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                  {recommendation.drapingTip}
                </p>
              </div>

              {(personalizedAdvice?.drapingNote || personalizedAdvice?.bodyShapeNote || personalizedAdvice?.heightNote) && (
                <div className="bg-[#FAF0DC]/80 border border-[#D4B26F]/50 rounded-2xl p-4 sm:p-5 space-y-2 text-xs text-[#5C3A06]">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#694208]">
                    <Sparkles className="h-4 w-4 text-[#8C6D37]" />
                    <span>Tailored Silhouette Advice</span>
                  </div>
                  {personalizedAdvice.bodyShapeNote && (
                    <p className="leading-relaxed">
                      <strong>Frame ({answers.bodyShape}):</strong> {personalizedAdvice.bodyShapeNote}
                    </p>
                  )}
                  {personalizedAdvice.heightNote && (
                    <p className="leading-relaxed">
                      <strong>Height ({answers.height}):</strong> {personalizedAdvice.heightNote}
                    </p>
                  )}
                  {personalizedAdvice.drapingNote && (
                    <p className="leading-relaxed">
                      <strong>Drape Note:</strong> {personalizedAdvice.drapingNote}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5DAC6]/70 flex items-center justify-between text-xs text-[#6B5A4A]">
              <span>Fabric Focus: <strong className="text-[#221811]">{recommendation.fabric}</strong></span>
              <span>Occasion: <strong className="text-[#221811]">{answers.occasion || "Versatile"}</strong></span>
            </div>
          </div>

          {/* WING 2: The Ensemble, Blouse & Accent Harmony */}
          <div className="bg-gradient-to-b from-[#FFFDF8] to-[#FAF3E5] border border-[#D5CCBB] rounded-3xl p-7 sm:p-9 shadow-[0_8px_30px_rgba(60,35,5,0.05)] space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5DAC6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#C9A45C]/15 border border-[#D4B26F]/60 flex items-center justify-center text-[#8C6D37]">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      Lookbook Part II
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#221811]">
                      Blouse &amp; Accent Harmony
                    </h3>
                  </div>
                </div>
                <span className="font-serif text-3xl font-bold text-[#C9A45C]/25">02</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                  Blouse Cut &amp; Silhouette
                </h4>
                <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                  {recommendation.blouseRecommendation}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                  Jewellery &amp; Accessories
                </h4>
                <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                  {recommendation.jewelleryAndAccessories}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                  Colour Alchemy
                </h4>
                <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                  {recommendation.colourGuidance}
                </p>
              </div>

              {personalizedAdvice?.undertoneNote && (
                <div className="bg-[#FAF0DC]/80 border border-[#D4B26F]/50 rounded-2xl p-4 sm:p-5 space-y-1.5 text-xs text-[#5C3A06]">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#694208]">
                    <Sparkles className="h-4 w-4 text-[#8C6D37]" />
                    <span>Complexion &amp; Metal Harmony</span>
                  </div>
                  <p className="leading-relaxed">
                    {personalizedAdvice.undertoneNote}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5DAC6]/70 flex items-center justify-between text-xs text-[#6B5A4A]">
              <span>Palette: <strong className="text-[#221811]">{answers.colourPalette?.split("—")[0] || "Curated"}</strong></span>
              <span>Border: <strong className="text-[#221811]">{answers.border || "Harmonized"}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Retake Matchmaker CTA Card */}
      <div className="bg-[#FFFCF7] border border-[#E5DAC6] rounded-2xl p-7 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="font-serif text-xl font-bold text-[#221811]">
            Shopping for another special occasion?
          </h3>
          <p className="text-xs sm:text-sm text-[#6B5A4A] max-w-xl">
            Explore tailored advice for a wedding, family festival, daily comfort, or formal office wear with a fresh matchmaker session.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleNextMatch}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-7 py-3 rounded-full bg-[#073C35] text-[#FAF7F0] hover:bg-[#073C35]/90 transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95 cursor-pointer select-none"
          >
            <RefreshCw className="h-4 w-4 text-[#C9A45C]" />
            <span>Find Another Match</span>
          </button>
          <Link
            href="/quiz"
            className="text-xs font-semibold text-[#6B5A4A] hover:text-[#073C35] underline underline-offset-4 px-2 py-1"
          >
            Start Completely Fresh
          </Link>
        </div>
      </div>
    </div>
  );
}
