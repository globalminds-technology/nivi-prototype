import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";
import { SareeQuizFlow } from "@/components/store/saree-quiz-flow";

export const metadata: Metadata = {
  title: "Find Your Perfect Saree — NiVi Matchmaker",
  description:
    "Answer 8 quick questions about your occasion, comfort, and style preferences to discover your signature handcrafted saree match and personalized styling advice.",
};

export default function SareeQuizPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F6F0]">
      <Header />
      <main className="grow py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-8 space-y-1">
          <span className="inline-block text-[11px] font-bold text-[#8C6D37] tracking-[0.2em] uppercase mb-1">
            Personalized Saree Matchmaker
          </span>
          <GoldText>Find Your Perfect Saree</GoldText>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-[#5C4D3C] mt-2.5 leading-relaxed">
            Take our 2-minute Saree Matchmaker. We will recommend the ideal weave, blouse silhouette, draping advice,
            and in-stock sarees crafted just for your occasion.
          </p>
        </div>

        <SareeQuizFlow />
      </main>
      <Footer />
    </div>
  );
}
