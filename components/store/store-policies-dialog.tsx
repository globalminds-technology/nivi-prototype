"use client";

import { useState } from "react";
import {
  Truck,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Video,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { STORE_POLICIES, type PolicySection } from "@/core/domain/constants/store-policies";

export type PolicyTabKey = "shipping" | "returns" | "cancellation" | "disclaimers";

interface StorePoliciesDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: PolicyTabKey;
}

const TAB_CONFIG: { key: PolicyTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "shipping", label: "Shipping Policy", icon: Truck },
  { key: "returns", label: "Return & Exchange", icon: RotateCcw },
  { key: "cancellation", label: "Cancellation", icon: XCircle },
  { key: "disclaimers", label: "Craft Disclaimers", icon: Info },
];

export function StorePoliciesDialog({
  open,
  onClose,
  defaultTab = "shipping",
}: StorePoliciesDialogProps) {
  const [activeTab, setActiveTab] = useState<PolicyTabKey>(defaultTab);

  if (!open) return null;

  const currentPolicy: PolicySection = STORE_POLICIES[activeTab] || STORE_POLICIES.shipping;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] text-[#30251F] rounded-2xl md:rounded-3xl border border-[#D5CCBB] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D5CCBB]/70 flex items-center justify-between bg-[#F4EFE6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#073C35]/10 border border-[#073C35]/20 flex items-center justify-center text-[#073C35] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg md:text-xl font-bold text-[#073C35] leading-tight">
                The Saree Studio — Policies &amp; Craft Notes
              </h3>
              <p className="text-[11px] text-[#6B5A4A]">
                Women with tradition, styled for today.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E4DDCD] text-[#6B5A4A] hover:text-[#30251F] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#D5CCBB] bg-[#EDE6D8]/50 text-xs font-semibold">
          {TAB_CONFIG.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 text-center ${
                  isActive
                    ? "border-[#073C35] bg-[#FAF7F0] text-[#073C35] font-bold shadow-2xs"
                    : "border-transparent text-[#6B5A4A] hover:text-[#30251F] hover:bg-[#FAF7F0]/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#073C35]" : "text-[#6B5A4A]"}`} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-xs sm:text-[13px] leading-relaxed">
          {/* Badge & Title */}
          <div className="flex items-center justify-between gap-2 border-b border-[#D5CCBB]/50 pb-3">
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#073C35]">
              {currentPolicy.title}
            </h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#073C35]/10 text-[#073C35] border border-[#073C35]/20">
              {currentPolicy.badge}
            </span>
          </div>

          {/* Policy Sections */}
          {currentPolicy.content.map((sec, idx) => (
            <div key={idx} className="space-y-3 pt-1">
              {sec.heading && (
                <h5 className="font-semibold text-sm sm:text-base text-[#30251F] flex items-center gap-1.5">
                  {sec.heading}
                </h5>
              )}

              {sec.paragraphs && sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-[#4A3D34]">
                  {p}
                </p>
              ))}

              {sec.bulletPoints && (
                <ul className="space-y-2 pl-1">
                  {sec.bulletPoints.map((bp, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-[#4A3D34]">
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
                <div className="space-y-2.5 pt-1">
                  {sec.callouts.map((c, cIdx) => (
                    <div
                      key={cIdx}
                      className={`p-3.5 rounded-xl border ${
                        c.type === "warning"
                          ? "bg-amber-500/10 border-amber-600/30 text-amber-950"
                          : c.type === "success"
                          ? "bg-emerald-500/10 border-emerald-600/30 text-emerald-950"
                          : "bg-[#073C35]/10 border-[#073C35]/20 text-[#073C35]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                        {c.type === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : c.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-[#073C35] shrink-0" />
                        )}
                        <span>{c.title}</span>
                      </div>
                      <p className="whitespace-pre-line text-[12px] opacity-90 pl-5">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#D5CCBB] bg-[#F4EFE6] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B5A4A]">
          <span>Need help? WhatsApp/Phone: +91 98000 00000 | Email: hello@thesareestudio.com</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#073C35] hover:bg-[#073C35]/90 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
