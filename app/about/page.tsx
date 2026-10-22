import Link from "next/link";
import { ArrowRight, Sparkles, Heart } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "About Us · NiVi — Weaving Elegance, Celebrating Tradition.",
  description:
    "NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship between Nirmala and Vijayakala. Discover our handcrafted saree collections.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#30251F] selection:bg-[#073C35]/15 selection:text-[#073C35] antialiased">
      {/* ── STORE HEADER ── */}
      <Header />

      <main className="flex-1 py-10 sm:py-16 md:py-20 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          {/* ── LUXURY EDITORIAL PARCHMENT CARD ── */}
          <div className="relative rounded-3xl bg-[#FFFCF7] border border-[#D5CCBB] shadow-[0_12px_40px_rgba(48,37,31,0.06)] p-6 sm:p-10 md:p-14 overflow-hidden">
            {/* Subtle decorative gold corner watermarks */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#C9A45C]/10 via-[#C9A45C]/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#073C35]/5 via-transparent to-transparent rounded-tr-full pointer-events-none" />

            <div className="relative z-10 space-y-8 sm:space-y-10 text-center">
              {/* Tagline Badge */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F4EFE6] border border-[#C9A45C]/40 text-[#694208] text-xs font-semibold tracking-wider uppercase shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A45C]" />
                  <span>Weaving Elegance, Celebrating Tradition</span>
                </div>

                {/* About Us Heading */}
                <div className="pt-1">
                  <GoldText className="text-4xl sm:text-5xl md:text-6xl">
                    About Us
                  </GoldText>
                </div>

                {/* Delicate Ornamental Divider */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A45C]" />
                  <span className="text-xs text-[#C9A45C]">✦</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A45C]" />
                </div>
              </div>

              {/* 1. Origin & Friendship Paragraph */}
              <div className="space-y-4 text-left sm:text-center max-w-2xl mx-auto">
                <p className="font-serif text-lg sm:text-xl md:text-[22px] text-[#30251F] leading-relaxed font-normal">
                  NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship and a shared love for sarees.
                </p>

                <p className="text-sm sm:text-base text-[#5A4A3D] leading-relaxed">
                  Our name carries a special meaning to us—<strong className="text-[#30251F] font-semibold">&ldquo;Ni&rdquo; for Nirmala</strong> and <strong className="text-[#30251F] font-semibold">&ldquo;Vi&rdquo; for Vijayakala</strong>, representing a friendship that blossomed into a beautiful dream.
                </p>

                {/* Subtle Monogram Seal */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#FAF7F0] border border-[#E4DDCD] shadow-2xs">
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[#073C35] text-[#FAF7F0] font-serif font-bold text-xs shadow-2xs">
                      Ni
                    </span>
                    <Heart className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[#C9A45C] text-[#30251F] font-serif font-bold text-xs shadow-2xs">
                      Vi
                    </span>
                    <span className="text-xs font-serif font-semibold text-[#30251F] pl-1">
                      Nirmala &amp; Vijayakala
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Curation & Philosophy Card */}
              <div className="p-5 sm:p-7 rounded-2xl bg-[#FAF7F0] border border-[#E8DEC8] text-left sm:text-center space-y-3 shadow-2xs">
                <p className="text-sm sm:text-base text-[#4E4039] leading-relaxed">
                  At NiVi, we curate sarees that bring together tradition, craftsmanship, quality and contemporary elegance. From exquisite silks and handwoven classics to versatile cottons and contemporary weaves, every saree is thoughtfully selected to make every woman feel graceful, confident and beautiful.
                </p>
              </div>

              {/* 3. The Poetic Creed (Closing Ribbon) */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#073C35] via-[#052C27] to-[#031C18] text-[#FAF7F0] p-6 sm:p-8 border border-[#C9A45C]/40 shadow-md space-y-4">
                <p className="font-serif text-lg sm:text-xl md:text-2xl italic leading-relaxed text-[#FFFCF5]">
                  &ldquo;NiVi — where every weave tells a story, and every saree becomes a cherished memory.&rdquo;
                </p>

                <div className="pt-2">
                  <Link
                    href="/collections"
                    className={buttonVariants({
                      variant: "default",
                      className:
                        "bg-[#C9A45C] hover:bg-[#B38F46] text-[#221811] font-semibold px-7 py-2.5 rounded-full text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-transform hover:scale-105",
                    })}
                  >
                    <span>Explore Handcrafted Collections</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── STORE FOOTER ── */}
      <Footer />
    </div>
  );
}
