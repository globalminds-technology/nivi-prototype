import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Feather } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#221811] antialiased">
      <Header />

      <main className="flex-1">
        {/* ── HERO SECTION: Warm, editorial, celebratory ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F4EFE6] via-[#FAF8F5] to-[#FAF8F5] pt-14 pb-16 md:pt-20 md:pb-24 border-b border-[#E7DFD5]">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-[#694208]/5 to-transparent blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10 text-center">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE8DC] border border-[#D9CDBF] text-[#694208] text-xs md:text-sm font-medium tracking-wide uppercase shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#694208]" />
              <span>Weaving Elegance, Celebrating Tradition</span>
            </div>

            <div className="mb-4">
              <GoldText className="text-3xl sm:text-4xl md:text-5xl">About Us</GoldText>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#30251F] font-normal leading-relaxed max-w-2xl mx-auto">
              Timeless Indian elegance, born from friendship &amp; a shared love for sarees.
            </h1>
          </div>
        </section>

        {/* ── CORE BRAND STORY SECTION ── */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl space-y-16">
            
            {/* 1. Origin & Friendship */}
            <div className="bg-[#FFFFFF] border border-[#E7DFD5] rounded-2xl p-8 sm:p-12 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#694208]/5 rounded-bl-full pointer-events-none" />
              
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-[#694208] text-xs font-semibold uppercase tracking-widest mb-3">
                  <Heart className="h-4 w-4 fill-[#694208]/20" />
                  <span>The Origin of Our Name</span>
                </div>

                <p className="text-lg sm:text-xl text-[#30251F] leading-relaxed font-serif mb-6">
                  NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship and a shared love for sarees.
                </p>

                <p className="text-base text-[#4E4039] leading-relaxed mb-8">
                  Our name carries a special meaning to us—<strong className="text-[#30251F] font-semibold">“Ni” for Nirmala</strong> and <strong className="text-[#30251F] font-semibold">“Vi” for Vijayakala</strong>, representing a friendship that blossomed into a beautiful dream.
                </p>

                {/* Name Monogram Showcase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#EFE8DC]">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] flex items-center gap-4">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-[#073C35] text-[#FAF8F5] font-serif font-bold text-xl">
                      Ni
                    </span>
                    <div>
                      <div className="font-serif font-bold text-[#30251F] text-base">Nirmala</div>
                      <div className="text-xs text-[#786960]">Co-Founder · Vision &amp; Heritage</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] flex items-center gap-4">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-[#694208] text-[#FAF8F5] font-serif font-bold text-xl">
                      Vi
                    </span>
                    <div>
                      <div className="font-serif font-bold text-[#30251F] text-base">Vijayakala</div>
                      <div className="text-xs text-[#786960]">Co-Founder · Curation &amp; Artistry</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Curation & Craftsmanship */}
            <div className="bg-[#FFFFFF] border border-[#E7DFD5] rounded-2xl p-8 sm:p-12 shadow-xs">
              <div className="flex items-center gap-2 text-[#073C35] text-xs font-semibold uppercase tracking-widest mb-3">
                <Feather className="h-4 w-4" />
                <span>Our Curation Philosophy</span>
              </div>

              <p className="text-lg sm:text-xl text-[#30251F] font-serif leading-relaxed mb-6">
                At NiVi, we curate sarees that bring together tradition, craftsmanship, quality and contemporary elegance.
              </p>

              <p className="text-base text-[#4E4039] leading-relaxed mb-8">
                From exquisite silks and handwoven classics to versatile cottons and contemporary weaves, every saree is thoughtfully selected to make every woman feel graceful, confident and beautiful.
              </p>

              {/* Three Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#EFE8DC]">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-[#694208] text-base">Exquisite Silks</h3>
                  <p className="text-xs sm:text-sm text-[#786960] leading-relaxed">
                    Handwoven pure silks steeped in centuries of heritage, weaving royal lustre into every celebratory drape.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-[#694208] text-base">Handwoven Classics</h3>
                  <p className="text-xs sm:text-sm text-[#786960] leading-relaxed">
                    Authentic weaves honouring master artisans with impeccable textures and enduring heirloom quality.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-[#694208] text-base">Versatile Cottons</h3>
                  <p className="text-xs sm:text-sm text-[#786960] leading-relaxed">
                    Light, breathable, and effortlessly sophisticated weaves curated for modern everyday poise.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. The Poetic Creed (Closing Quote) */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#073C35] to-[#042420] text-[#FAF8F5] p-8 sm:p-14 text-center shadow-md overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <p className="font-serif text-2xl sm:text-3xl italic leading-relaxed text-[#F5F0EB]">
                  “NiVi — where every weave tells a story, and every saree becomes a cherished memory.”
                </p>

                <div className="pt-4">
                  <Link
                    href="/collections"
                    className={buttonVariants({
                      variant: "default",
                      className:
                        "bg-[#C5A880] hover:bg-[#B39368] text-[#221811] font-medium px-8 py-3 rounded-full text-sm sm:text-base inline-flex items-center gap-2 shadow-xs transition-colors",
                    })}
                  >
                    <span>Explore Handcrafted Collections</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
