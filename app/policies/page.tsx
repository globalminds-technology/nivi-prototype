import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { STORE_POLICIES } from "@/core/domain/constants/store-policies";
import { Truck, RotateCcw, XCircle, AlertTriangle, CheckCircle2, Info, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping, Return & Exchange Policies — NiVi Sarees",
  description: "Official shipping timelines, cancellation terms, mandatory unboxing video guidelines, and Sungudi craft disclaimers for NiVi.",
};

export const instant = false;

interface PoliciesPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function PoliciesPage({ searchParams }: PoliciesPageProps) {
  const { tab } = await searchParams;
  const activeTab = tab && ["shipping", "returns", "cancellation", "disclaimers"].includes(tab)
    ? tab
    : "shipping";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#30251F]">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl space-y-8">
        {/* Back Link & Title */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-[#6B5A4A] hover:text-[#073C35] transition-colors mb-2"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌸</span>
            <h1 className="font-script text-4xl sm:text-5xl md:text-6xl text-[#073C35] leading-tight">
              Store & Craft Policies
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#6B5A4A] max-w-lg mx-auto">
            Please review our shipping timelines, return prerequisites, unboxing video requirements, and handmade textile disclaimers.
          </p>
        </div>

        {/* Tab Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#EDE6D8]/60 p-1.5 rounded-2xl border border-[#D5CCBB]">
          {[
            { key: "shipping", label: "Shipping Policy", icon: Truck },
            { key: "returns", label: "Return & Exchange", icon: RotateCcw },
            { key: "cancellation", label: "Cancellation", icon: XCircle },
            { key: "disclaimers", label: "Craft Disclaimers", icon: Info },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <Link
                key={t.key}
                href={`/policies?tab=${t.key}`}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all text-center ${
                  isActive
                    ? "bg-[#073C35] text-white shadow-xs"
                    : "text-[#6B5A4A] hover:text-[#30251F] hover:bg-[#FAF7F0]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Selected Policy Card */}
        {(() => {
          const currentPolicy = STORE_POLICIES[activeTab] || STORE_POLICIES.shipping;

          return (
            <div className="bg-[#FFFCF5] rounded-3xl border border-[#D5CCBB] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#D5CCBB]/60 pb-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#073C35]">
                  {currentPolicy.title}
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#073C35]/10 text-[#073C35] border border-[#073C35]/20">
                  {currentPolicy.badge}
                </span>
              </div>

              {currentPolicy.content.map((sec, idx) => (
                <div key={idx} className="space-y-3 pt-2">
                  {sec.heading && (
                    <h3 className="font-semibold text-base sm:text-lg text-[#30251F]">
                      {sec.heading}
                    </h3>
                  )}

                  {sec.paragraphs && sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm text-[#4A3D34] leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {sec.bulletPoints && (
                    <ul className="space-y-2 pl-2">
                      {sec.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-sm text-[#4A3D34]">
                          <span className="text-[#C9A45C] mt-1 shrink-0">•</span>
                          <span>
                            {bp.label && <strong className="text-[#30251F] font-semibold">{bp.label} </strong>}
                            {bp.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sec.callouts && (
                    <div className="space-y-3 pt-2">
                      {sec.callouts.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className={`p-4 rounded-2xl border ${
                            c.type === "warning"
                              ? "bg-amber-500/10 border-amber-600/30 text-amber-950"
                              : c.type === "success"
                              ? "bg-emerald-500/10 border-emerald-600/30 text-emerald-950"
                              : "bg-[#073C35]/10 border-[#073C35]/20 text-[#073C35]"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
                            {c.type === "warning" ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : c.type === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Info className="w-4 h-4 text-[#073C35] shrink-0" />
                            )}
                            <span>{c.title}</span>
                          </div>
                          <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed opacity-90 pl-6">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
}
