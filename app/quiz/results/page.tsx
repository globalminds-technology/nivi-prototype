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
  Sparkles,
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
    <div className="min-h-screen flex flex-col bg-[#E4DDCD]">
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

          {/* Grand Regal Editorial Hero Banner (Luminous Ivory & Gold Canvas) */}
          <div className="relative rounded-3xl bg-linear-to-br from-[#FFFDF9] via-[#FAF4EA] to-[#F3E8D5] text-[#221811] p-7 sm:p-11 lg:p-13 shadow-[0_12px_45px_rgba(78,52,24,0.07)] overflow-hidden border border-[#D5CCBB]">
            {/* Ambient luxury glow aura */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#C9A45C]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#C9A45C]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Title, Focus, Story */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0DC] text-[#694208] text-xs font-semibold border border-[#D4B26F]/60 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#8C6D37]" />
                  <span>Curated Style Recommendation</span>
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

                <div className="pt-3 flex items-center gap-4">
                  <Link
                    href="/quiz"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-[#073C35] hover:bg-[#073C35]/90 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#C9A45C]" />
                    <span>Find Another Match</span>
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
                    <span className="font-semibold text-[#221811] text-right">{answers.colourPalette?.split("—")[0] || "Curated"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: In-Stock Matching Sarees Showcase (IMMEDIATELY BELOW HERO FOR HIGH CONVERSION) */}
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

          {/* SECTION 3: The Couture Atelier Lookbook (2-Column Magazine Spread) */}
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
                  {/* Subhead */}
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

                  {/* Saree Style Suggestion */}
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                      Style Suggestion
                    </h4>
                    <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                      {recommendation.styleSuggestion}
                    </p>
                  </div>

                  {/* Draping Tip */}
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                      Master Draping Technique
                    </h4>
                    <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                      {recommendation.drapingTip}
                    </p>
                  </div>

                  {/* Personalized Silhouette & Drape Notes */}
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
                  {/* Subhead */}
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

                  {/* Blouse Recommendation */}
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                      Blouse Cut &amp; Silhouette
                    </h4>
                    <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                      {recommendation.blouseRecommendation}
                    </p>
                  </div>

                  {/* Jewellery & Accessories */}
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                      Jewellery &amp; Accessories
                    </h4>
                    <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                      {recommendation.jewelleryAndAccessories}
                    </p>
                  </div>

                  {/* Colour Guidance */}
                  <div className="space-y-2">
                    <h4 className="font-serif text-base font-semibold text-[#221811] flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A45C]" />
                      Colour Alchemy
                    </h4>
                    <p className="text-sm text-[#4A3D34] leading-relaxed pl-3.5 border-l-2 border-[#E5DAC6]">
                      {recommendation.colourGuidance}
                    </p>
                  </div>

                  {/* Personalized Undertone Notes */}
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
