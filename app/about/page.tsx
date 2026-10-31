import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { GoldText } from "@/components/store/gold-text";

export const metadata = {
  title: "About Us · NiVi — Handcrafted Sarees, Born of Heritage & Friendship",
  description:
    "NiVi is a celebration of timeless Indian elegance, born from a beautiful friendship between Nirmala (“Ni”) and Vijayakala (“Vi”). Discover our handcrafted saree collections.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#E4DDCD] text-[#221811] selection:bg-[#073C35]/15 selection:text-[#073C35] antialiased">
      {/* ── STORE HEADER ── */}
      <Header />

      {/* Main content: unboxed overall page with balanced top spacing */}
      <main className="flex-1 relative overflow-hidden pt-6 sm:pt-8 md:pt-10 pb-16 sm:pb-24">
        {/* Ambient atmospheric lighting - soft, glowing gold & emerald aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-[#C9A45C]/12 via-[#073C35]/6 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-3xl relative z-10">
          <div className="space-y-10 sm:space-y-12 text-center">

            {/* ── 1. MASTHEAD / HEADER (Regal & Visually Appealing) ── */}
            <div className="space-y-2.5 sm:space-y-3">
              {/* Traditional Eyebrow */}
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 sm:w-16 bg-[#8C6D37]/45" />
                <span className="text-[11px] sm:text-xs font-serif font-bold tracking-[0.28em] text-[#694208] uppercase">
                  Weaving Elegance · Celebrating Tradition
                </span>
                <span className="h-px w-8 sm:w-16 bg-[#8C6D37]/45" />
              </div>

              {/* Bold Script Title */}
              <div className="pt-0.5">
                <GoldText className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl block font-bold drop-shadow-sm">
                  About Us
                </GoldText>
              </div>

              {/* Ornamental Diamond */}
              <div className="flex items-center justify-center gap-2 text-[#8C6D37]/70">
                <span className="text-xs sm:text-sm">✦</span>
              </div>
            </div>

            {/* ── 2. STANZA 1: ORIGIN & FRIENDSHIP (Bold Serif Typography) ── */}
            <div className="max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1E1611] font-bold leading-[1.3] tracking-tight">
                NiVi is a celebration of timeless Indian elegance, born from a cherished friendship and a shared love for the art of the saree.
              </h2>
            </div>

            {/* ── 3. FOUNDERS EMBLEM & IDENTITY (Grand, Subtle Container with Elegant Italic Typography) ── */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#FAF6EE] via-[#F6F1E5] to-[#FAF6EE] border border-[#C9A45C]/35 shadow-[0_12px_36px_rgba(7,60,53,0.06),0_0_0_1px_rgba(201,164,92,0.15)] p-6 sm:p-8 space-y-4 max-w-2xl mx-auto">
              {/* Founders emblem banner: Ni ✦ Vi · Nirmala & Vijayakala */}
              <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 py-2.5 px-6 rounded-2xl bg-[#FFFDF9] border border-[#C9A45C]/35 shadow-2xs text-[#996515]">
                {/* Monogram with flowing italic serif in signature NiVi logo gold */}
                <div className="flex items-center gap-2 font-serif italic text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight select-none text-[#996515]">
                  <span>Ni</span>
                  <span className="not-italic text-lg sm:text-xl text-[#C9A45C]">✦</span>
                  <span>Vi</span>
                </div>

                <span className="hidden sm:inline-block h-8 w-px bg-[#8C6D37]/35" />

                {/* Founders' Names with graceful italic serif in signature NiVi logo gold */}
                <div className="font-serif italic text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide text-[#996515]">
                  <span>Nirmala &amp; Vijayakala</span>
                </div>
              </div>

              {/* Story Narrative with Signature Heading Tone */}
              <p className="font-serif text-base sm:text-lg md:text-xl text-[#2A1D15] font-bold leading-relaxed pt-1">
                Our name reflects the bond of its founders—
                <span className="text-[#996515] font-extrabold italic mx-1">
                  “Ni” for Nirmala
                </span>
                and
                <span className="text-[#996515] font-extrabold italic mx-1">
                  “Vi” for Vijayakala
                </span>
                —a lifelong friendship that blossomed into a shared dream of bringing authentic, heirloom-quality sarees to every woman.
              </p>
            </div>

            {/* Hairline Separator */}
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#8C6D37]/45 to-transparent" />

            {/* ── 4. STANZA 2: CURATION & CRAFTSMANSHIP (Bold & Elegant) ── */}
            <div className="max-w-2xl mx-auto space-y-3.5">
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1E1611] font-bold leading-snug">
                At NiVi, we curate sarees that unite centuries-old heritage, impeccable handloom craftsmanship, and modern grace.
              </h3>
              <p className="font-serif text-base sm:text-lg text-[#3A2D23] font-bold leading-relaxed">
                From pure Kanchipuram silks and ornate Banarasi zari to breathable Sungudi cottons and featherlight festive drapes, every saree is thoughtfully handpicked to ensure every woman feels confident, poised, and radiant.
              </p>
            </div>

            {/* Hairline Separator */}
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#8C6D37]/45 to-transparent" />

            {/* ── 5. FOUNDERS' ADDRESSES: PERAIYUR & MARAIMALAINAGAR (Clean, No Repetition) ── */}
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-6 bg-[#8C6D37]/40" />
                  <span className="text-[11px] sm:text-xs font-serif font-bold uppercase tracking-[0.25em] text-[#694208]">
                    Studio &amp; Presence
                  </span>
                  <span className="h-px w-6 bg-[#8C6D37]/40" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1611]">
                  Our Roots Across Tamil Nadu
                </h3>
                <p className="font-serif text-xs sm:text-sm text-[#4A392D] font-bold max-w-md mx-auto">
                  Proudly rooted in Tamil Nadu, bridging heritage weaving clusters with doorstep delivery across India.
                </p>
              </div>

              {/* Dual Address Columns (Stated cleanly once without duplication) */}
              <div className="rounded-2xl bg-[#FAF6EE]/85 border border-[#C9A45C]/30 p-6 sm:p-7 shadow-[0_4px_20px_rgba(7,60,53,0.03)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left">
                  {/* Peraiyur Address */}
                  <div className="space-y-2 sm:border-r sm:border-[#8C6D37]/25 sm:pr-6">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#996515]/10 border border-[#996515]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-[#996515]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1E1611] leading-tight">
                          Peraiyur
                        </h4>
                        <p className="text-sm text-[#2A1D15] font-serif font-bold leading-relaxed">
                          Madurai District, Tamil Nadu, India.
                        </p>
                        <div className="pt-1 text-xs text-[#694208] font-bold flex items-center gap-1.5 font-serif">
                          <Sparkles className="h-3.5 w-3.5 text-[#C9A45C]" />
                          <span>Artisan Weave Curation &amp; Sourcing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Maraimalainagar Address */}
                  <div className="space-y-2 sm:pl-2">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#996515]/10 border border-[#996515]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-[#996515]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1E1611] leading-tight">
                          Maraimalainagar
                        </h4>
                        <p className="text-sm text-[#2A1D15] font-serif font-bold leading-relaxed">
                          Chengalpattu District, Tamil Nadu, India.
                        </p>
                        <div className="pt-1 text-xs text-[#694208] font-bold flex items-center gap-1.5 font-serif">
                          <Sparkles className="h-3.5 w-3.5 text-[#C9A45C]" />
                          <span>Client Styling &amp; Operations Studio</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hairline Separator */}
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#8C6D37]/45 to-transparent" />

            {/* ── 6. CONTACT US DIRECTLY (Clean, Normal Number Styling) ── */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="space-y-1">
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1611]">
                  Contact Us Directly
                </h4>
                <p className="font-serif text-xs sm:text-sm text-[#4A392D] font-bold">
                  Connect with us for personalized saree recommendations, styling advice &amp; orders.
                </p>
              </div>

              {/* Normal number styling (sans-serif, clean & legible) */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap text-xs sm:text-sm">
                <a
                  href="https://wa.me/919150992863?text=Hello%20NiVi%2C%20I%20would%20like%20to%20connect%20regarding%20your%20handcrafted%20sarees."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full bg-[#073C35]/10 border border-[#073C35]/30 text-[#073C35] hover:bg-[#073C35] hover:text-[#FAF7F0] font-sans font-medium transition-all flex items-center gap-2 shadow-xs"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>WhatsApp (+91 91509 92863)</span>
                </a>
                <a
                  href="tel:+919150992863"
                  className="px-4 py-2 rounded-full bg-[#FAF6EE] border border-[#8C6D37]/40 text-[#694208] hover:bg-[#8C6D37] hover:text-[#FAF7F0] font-sans font-medium transition-all flex items-center gap-2 shadow-xs"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+91 91509 92863</span>
                </a>
                <a
                  href="mailto:connect@brandnivi.com"
                  className="px-4 py-2 rounded-full bg-[#FAF6EE] border border-[#8C6D37]/40 text-[#694208] hover:bg-[#8C6D37] hover:text-[#FAF7F0] font-sans font-medium transition-all flex items-center gap-2 shadow-xs"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>connect@brandnivi.com</span>
                </a>
              </div>
            </div>

            {/* Hairline Separator */}
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#8C6D37]/45 to-transparent" />

            {/* ── 7. STANZA 3: THE POETIC CREED & INVITATION ── */}
            <div className="space-y-5 max-w-2xl mx-auto">
              <blockquote>
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#073C35] font-bold italic leading-snug tracking-tight">
                  &ldquo;NiVi — where every weave tells a story, and every saree becomes a cherished memory.&rdquo;
                </p>
              </blockquote>

              <div className="pt-2">
                <Link
                  href="/collections"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#073C35] hover:bg-[#073C35]/90 text-[#FAF7F0] font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
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
