import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
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
import { QuizResultsView, type QuizResultsProductItem } from "@/components/store/quiz-results-view";
import type { StoreProductData } from "@/components/store/product-card";

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
    match?: string;
    matchIndex?: string;
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
  const currentMatchIndex = parseInt(rawParams.matchIndex || rawParams.match || "0", 10) || 0;

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

  // Run matching engine with requested match index
  const { personalizedAdvice, allMatches } = matchRecommendation(answers, currentMatchIndex);

  // Pre-filled edit URL so users can modify an answer without starting from scratch
  const editParams = new URLSearchParams();
  if (answers.bodyShape) editParams.set("bodyShape", answers.bodyShape);
  if (answers.height) editParams.set("height", answers.height);
  if (answers.undertone) editParams.set("undertone", answers.undertone);
  if (answers.occasion) editParams.set("occasion", answers.occasion);
  if (answers.style) editParams.set("style", answers.style);
  if (answers.comfort) editParams.set("comfort", answers.comfort);
  if (answers.border) editParams.set("border", answers.border);
  if (answers.colourPalette) editParams.set("colourPalette", answers.colourPalette);
  const editQuizUrl = `/quiz?${editParams.toString()}`;

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

  // Filter ONLY in-stock products with attributes for client-side instant scoring
  const inStockProducts: QuizResultsProductItem[] = domainProducts
    .filter((p) => p.stock > 0 && p.status === "active")
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: productSlug(p),
      priceMinor: p.price.minor,
      stock: p.stock,
      primaryImageUrl: p.primaryImageUrl,
      tags: p.tags,
      category: p.category ?? null,
      attributes: p.attributes,
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
        <QuizResultsView
          answers={answers}
          allMatches={allMatches}
          personalizedAdvice={personalizedAdvice}
          inStockProducts={inStockProducts}
          initialMatchIndex={currentMatchIndex}
          editQuizUrl={editQuizUrl}
        />
      </main>
      <Footer />
    </div>
  );
}
