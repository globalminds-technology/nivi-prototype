import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Crown,
  Feather,
  Palette,
  RefreshCw,
  Scissors,
} from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";
import { ProductCard, type StoreProductData } from "@/components/store/product-card";
import { connection } from "next/server";
import { productSlug, type Product } from "@/core/domain/entities/product";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import type {
  BorderOption,
  ColourPaletteOption,
  ComfortOption,
  HeightOption,
  OccasionOption,
  SareeQuizAnswers,
  SkinUndertone,
  StyleOption,
} from "@/core/domain/entities/saree-quiz";
import { matchRecommendation } from "@/core/application/use-cases/quiz/match-recommendation";

interface QuizResultsPageProps {
  searchParams: Promise<{
    bodyShape?: string;
    height?: string;
    undertone?: string;
    occasion?: string;
    style?: string;
    comfort?: string;
    border?: string;
    colourPalette?: string;
  }>;
}

export const instant = false;

export const metadata = {
  title: "Your Saree Match — NiVi Matchmaker",
  description:
    "Discover your signature saree match, draping tips, blouse pairings, and matching handcrafted sarees.",
};

export default async function QuizResultsPage({ searchParams }: QuizResultsPageProps) {
  await connection();
  const rawParams = await searchParams;

  const answers: SareeQuizAnswers = {
    bodyShape: rawParams.bodyShape as any,
    height: rawParams.height as HeightOption,
    undertone: rawParams.undertone as SkinUndertone,
    occasion: rawParams.occasion as OccasionOption,
    style: rawParams.style as StyleOption,
    comfort: rawParams.comfort as ComfortOption,
    border: rawParams.border as BorderOption,
    colourPalette: rawParams.colourPalette as ColourPaletteOption,
  };

  // Run matching engine
  const { recommendation, personalizedAdvice } = matchRecommendation(answers);

  // Load in-stock store products
  let allStoreProducts: StoreProductData[] = [];
  let domainProducts: readonly Product[] = [];

  try {
    const listUseCase = container.listProducts();
    domainProducts = await listUseCase.execute({ status: "active" });

    allStoreProducts = domainProducts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: productSlug(p),
      priceMinor: p.price.minor,
      stock: p.stock,
      primaryImageUrl: p.primaryImageUrl,
      tags: p.tags,
      category: p.category ?? null,
      offer: p.offer
        ? {
            active: p.offer.active,
            type: p.offer.type,
            value:
              p.offer.type === "percent"
                ? p.offer.percent
                : Money.toMajor(p.offer.amount),
            label: p.offer.label,
          }
        : null,
    }));
  } catch (err) {
    console.error("[QuizResultsPage] Failed loading products:", err);
  }

  // Filter ONLY in-stock products
  const inStockProducts = domainProducts.filter((p) => p.stock > 0 && p.status === "active");

  // Score products based on recommendation fabric and user preferences
  const targetFabric = (recommendation.fabric || "").toLowerCase();
  const targetOccasion = (answers.occasion || "").toLowerCase();
  const targetBorder = (answers.border || "").toLowerCase();

  const scoredProducts = inStockProducts.map((p) => {
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
      // Partial fabric keywords (e.g. "kanchi", "cotton", "organza", "silk")
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

  // Sort by score descending
  scoredProducts.sort((a, b) => b.score - a.score);

  // Take top matching products (or top in-stock fallbacks if no specific tags yet)
  const topMatchedDomain = scoredProducts
    .filter((sp) => sp.score > 0)
    .map((sp) => sp.product);

  const finalDisplayProducts =
    topMatchedDomain.length > 0
      ? topMatchedDomain
      : inStockProducts.slice(0, 10);

  const matchedStoreProducts: StoreProductData[] = finalDisplayProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: productSlug(p),
    priceMinor: p.price.minor,
    stock: p.stock,
    primaryImageUrl: p.primaryImageUrl,
    tags: p.tags,
    category: p.category ?? null,
    offer: p.offer
      ? {
          active: p.offer.active,
          type: p.offer.type,
          value:
            p.offer.type === "percent"
              ? p.offer.percent
              : Money.toMajor(p.offer.amount),
          label: p.offer.label,
        }
      : null,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F6F0]">
      <Header products={allStoreProducts} />

      <main className="grow py-8 sm:py-12">
        {/* Full container width matching the home screen */}
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

          {/* Grand Editorial Hero Banner */}
          <div className="relative rounded-3xl bg-linear-to-br from-[#042A24] via-[#073C35] to-[#0A4E45] text-white p-7 sm:p-12 lg:p-14 shadow-2xl overflow-hidden border border-[#C9A45C]/40">
            {/* Ambient luxury glow aura */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C9A45C]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#4B9488]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Title, Focus, Story */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFCF5]/15 text-[#EFE3CF] text-xs font-semibold backdrop-blur-md border border-[#C9A45C]/40 shadow-xs">
                  <span>Curated For Your Occasion & Style</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FFFDF8] leading-tight">
                  {recommendation.title}
                </h1>

                {recommendation.styleFocus && (
                  <div className="inline-block px-3 py-1 rounded-md bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#FAF7F0] text-xs font-medium tracking-wide">
                    Style Focus: <span className="font-semibold text-[#EFE3CF]">{recommendation.styleFocus}</span>
                  </div>
                )}

                <p className="text-sm sm:text-base text-white/90 leading-relaxed font-sans pt-1">
                  {recommendation.whyItWorks}
                </p>

                <div className="pt-2 flex items-center gap-4">
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F0] border border-white/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Find Another Match</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Quick Profile Matrix */}
              <div className="lg:col-span-5 bg-[#03231E]/80 backdrop-blur-md border border-[#C9A45C]/35 rounded-2xl p-6 sm:p-7 space-y-4 shadow-inner">
                <div className="flex items-center gap-2 border-b border-[#C9A45C]/25 pb-3">
                  <Crown className="h-4 w-4 text-[#C9A45C]" />
                  <span className="font-serif text-xs font-bold uppercase tracking-widest text-[#EFE3CF]">
                    Style Blueprint
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-[#C5BAA9]">Signature Weave</span>
                    <span className="font-semibold text-[#FFFDF8] text-right">{recommendation.fabric}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-[#C5BAA9]">Ideal Occasions</span>
                    <span className="font-semibold text-[#FFFDF8] text-right">{recommendation.occasions}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-[#C5BAA9]">Selected Border</span>
                    <span className="font-semibold text-[#FFFDF8] text-right">{answers.border || "Harmonized"}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[#C5BAA9]">Colour Mood</span>
                    <span className="font-semibold text-[#FFFDF8] text-right">{answers.colourPalette?.split("—")[0] || "Curated"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Styling Advice: 4 Luxury Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#073C35]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#221811]">
                Complete Styling Guide
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Saree Style */}
              <div className="bg-[#FFFCF7] border border-[#E5DAC6] border-t-4 border-t-[#073C35] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-[#073C35]/10 flex items-center justify-center text-[#073C35]">
                    <Feather className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      The Silhouette
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#221811] mt-0.5">
                      Saree Style
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3E31] leading-relaxed">
                    {recommendation.styleSuggestion}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E5DAC6]/60 text-[11px] text-[#6B5A4A] mt-4">
                  Fabric: <strong className="text-[#221811]">{recommendation.fabric}</strong>
                </div>
              </div>

              {/* Card 2: Blouse Pairing */}
              <div className="bg-[#FFFCF7] border border-[#E5DAC6] border-t-4 border-t-[#8C6D37] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-[#8C6D37]/10 flex items-center justify-center text-[#8C6D37]">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      Cut & Neckline
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#221811] mt-0.5">
                      Blouse Recommendation
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3E31] leading-relaxed">
                    {recommendation.blouseRecommendation}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E5DAC6]/60 text-[11px] text-[#6B5A4A] mt-4">
                  Tailored to balance the saree pallu & border
                </div>
              </div>

              {/* Card 3: Draping Tip */}
              <div className="bg-[#FFFCF7] border border-[#E5DAC6] border-t-4 border-t-[#073C35] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-[#073C35]/10 flex items-center justify-center text-[#073C35]">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      Drape & Pleats
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#221811] mt-0.5">
                      Draping Technique
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3E31] leading-relaxed">
                    {recommendation.drapingTip}
                  </p>

                  {personalizedAdvice?.drapingNote && (
                    <div className="bg-[#073C35]/8 border border-[#073C35]/20 p-2.5 rounded-lg text-xs text-[#073C35] flex items-start gap-1.5 mt-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{personalizedAdvice.drapingNote}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-[#E5DAC6]/60 text-[11px] text-[#6B5A4A] mt-4">
                  Keeps pleats immaculate throughout the day
                </div>
              </div>

              {/* Card 4: Jewellery & Colours */}
              <div className="bg-[#FFFCF7] border border-[#E5DAC6] border-t-4 border-t-[#8C6D37] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-[#8C6D37]/10 flex items-center justify-center text-[#8C6D37]">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-[#8C6D37] uppercase tracking-wider block">
                      Accessories & Palette
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#221811] mt-0.5">
                      Jewellery & Colours
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-[#4A3E31]">
                    <p>
                      <strong className="text-[#221811]">Jewellery:</strong> {recommendation.jewelleryAndAccessories}
                    </p>
                    <p>
                      <strong className="text-[#221811]">Colours:</strong> {recommendation.colourGuidance}
                    </p>
                  </div>

                  {personalizedAdvice?.jewelleryNote && (
                    <div className="bg-[#8C6D37]/10 border border-[#8C6D37]/25 p-2.5 rounded-lg text-xs text-[#694208] flex items-start gap-1.5 mt-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#8C6D37]" />
                      <span>{personalizedAdvice.jewelleryNote}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-[#E5DAC6]/60 text-[11px] text-[#6B5A4A] mt-4">
                  Harmonized with your undertone
                </div>
              </div>
            </div>
          </div>

          {/* In-Stock Matching Sarees Showcase */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E5DAC6] pb-4">
              <div>
                <span className="text-xs font-bold text-[#8C6D37] uppercase tracking-widest block mb-1">
                  Ready to Wear
                </span>
                <GoldText>Matching In-Stock Sarees</GoldText>
                <p className="text-xs sm:text-sm text-[#6B5A4A] mt-1">
                  Handcrafted sarees in stock, matching your recommended weave, occasion, and style profile.
                </p>
              </div>

              <Link
                href="/quiz"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#073C35] hover:text-[#073C35]/80 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Find Another Match / Edit Preferences</span>
              </Link>
            </div>

            {matchedStoreProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                {matchedStoreProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-[#FFFCF7] border border-[#E5DAC6] rounded-2xl space-y-3">
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

            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-7 py-3 rounded-full bg-[#073C35] text-[#FAF7F0] hover:bg-[#073C35]/90 transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retake Saree Matchmaker</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
