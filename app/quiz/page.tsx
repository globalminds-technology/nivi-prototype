import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";
import { SareeQuizFlow } from "@/components/store/saree-quiz-flow";

export const metadata: Metadata = {
  title: "Find Your Perfect Saree — The Saree Studio Matchmaker",
  description:
    "Answer 8 quick questions about your occasion, comfort, and style preferences to discover your signature handcrafted saree match and personalized styling advice.",
};

export default function SareeQuizPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#E4DDCD]">
      <Header />
      <main className="grow py-4 sm:py-6 px-3 sm:px-6 flex flex-col justify-center">
        {/* Compact, elegant luxury masthead */}
        <div className="max-w-2xl mx-auto text-center mb-3 sm:mb-5 space-y-1 flex flex-col items-center">
          <div className="flex items-center justify-center gap-2.5">
            <span className="h-px w-5 sm:w-8 bg-[#8C6D37]/50" />
            <span className="text-[10px] sm:text-[11px] font-bold text-[#8C6D37] tracking-[0.2em] uppercase">
              Personalized Saree Matchmaker
            </span>
            <span className="h-px w-5 sm:w-8 bg-[#8C6D37]/50" />
          </div>
          <div className="block leading-tight">
            <GoldText>Find Your Perfect Saree</GoldText>
          </div>
          <p className="max-w-lg mx-auto text-xs sm:text-xs text-[#5C4D3C] leading-snug">
            Answer 8 quick questions to discover your signature weave, blouse styling, and in-stock sarees.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-[#6B5A4A] font-serif text-sm">Loading matchmaker...</div>}>
          <SareeQuizFlow />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
