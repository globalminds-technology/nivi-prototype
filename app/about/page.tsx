import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";

export const metadata = {
  title: "About Us · NiVi — Weaving Elegance, Celebrating Tradition.",
  description:
    "NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship between Nirmala and Vijayakala. Discover our handcrafted saree collections.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#E4DDCD] text-[#30251F] selection:bg-[#073C35]/15 selection:text-[#073C35] antialiased">
      {/* ── STORE HEADER ── */}
      <Header />

      <main className="flex-1 relative overflow-hidden py-16 sm:py-24 md:py-32">
        {/* Ambient atmospheric lighting - soft, glowing, unboxed */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#C9A45C]/10 via-[#073C35]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 sm:px-8 max-w-3xl relative z-10">
          <div className="space-y-14 sm:space-y-20 text-center">
            {/* ── MASTHEAD / HEADER ── */}
            <div className="space-y-4 sm:space-y-6">
              {/* Tagline */}
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 sm:w-12 bg-[#C9A45C]/60" />
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#694208] uppercase">
                  Weaving Elegance, Celebrating Tradition
                </span>
                <span className="h-px w-8 sm:w-12 bg-[#C9A45C]/60" />
              </div>

              {/* Title in script */}
              <div className="pt-2">
                <GoldText className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl block">
                  About Us
                </GoldText>
              </div>

              {/* Minimalist ornamental diamond */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[#C9A45C]">
                <span className="text-xs">✦</span>
              </div>
            </div>

            {/* ── STANZA 1: ORIGIN & FRIENDSHIP ── */}
            <div className="space-y-6 max-w-2xl mx-auto">
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#30251F] font-normal leading-[1.35] tracking-tight">
                NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship and a shared love for sarees.
              </p>

              <p className="text-base sm:text-lg md:text-xl text-[#5A4A3D] leading-relaxed font-light">
                Our name carries a special meaning to us—<strong className="text-[#073C35] font-medium font-serif">&ldquo;Ni&rdquo; for Nirmala</strong> and <strong className="text-[#694208] font-medium font-serif">&ldquo;Vi&rdquo; for Vijayakala</strong>, representing a friendship that blossomed into a beautiful dream.
              </p>

              {/* Artistic Typographic Monogram Accent (No container, pure typography) */}
              <div className="pt-4 flex items-center justify-center gap-4 text-xs tracking-widest uppercase text-[#786960]">
                <span className="font-serif font-bold text-base text-[#073C35]">Ni</span>
                <span className="text-[#C9A45C] font-serif text-sm">✦</span>
                <span className="font-serif font-bold text-base text-[#694208]">Vi</span>
                <span className="text-[10px] text-[#A69788] pl-2 font-medium tracking-[0.2em]">
                  Nirmala &amp; Vijayakala
                </span>
              </div>
            </div>

            {/* Subtle hairline separator */}
            <div className="w-16 h-px mx-auto bg-gradient-to-r from-transparent via-[#C9A45C]/60 to-transparent" />

            {/* ── STANZA 2: CURATION & CRAFTSMANSHIP ── */}
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="font-serif text-lg sm:text-xl md:text-2xl text-[#4A3D34] leading-relaxed font-light italic">
                At NiVi, we curate sarees that bring together tradition, craftsmanship, quality and contemporary elegance.
              </p>
              <p className="text-base sm:text-lg text-[#5A4A3D] leading-relaxed font-light">
                From exquisite silks and handwoven classics to versatile cottons and contemporary weaves, every saree is thoughtfully selected to make every woman feel graceful, confident and beautiful.
              </p>
            </div>

            {/* Subtle hairline separator */}
            <div className="w-16 h-px mx-auto bg-gradient-to-r from-transparent via-[#C9A45C]/60 to-transparent" />

            {/* ── STANZA 3: THE POETIC CREED & INVITATION ── */}
            <div className="space-y-8 max-w-2xl mx-auto">
              <blockquote className="space-y-3">
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#073C35] font-normal italic leading-snug tracking-tight">
                  &ldquo;NiVi — where every weave tells a story, and every saree becomes a cherished memory.&rdquo;
                </p>
              </blockquote>

              <div className="pt-4">
                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#073C35] hover:bg-[#073C35]/90 text-[#FAF7F0] font-medium text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <span>Explore Handcrafted Collections</span>
                  <ArrowRight className="h-4 w-4 text-[#C9A45C] group-hover:translate-x-1 transition-transform" />
                </Link>
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
