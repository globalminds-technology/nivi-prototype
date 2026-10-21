"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {} from "lucide-react";
import { Great_Vibes } from "next/font/google";
import { StorePoliciesDialog, type PolicyTabKey } from "./store-policies-dialog";
import "./gold-text.css";

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"] });

/* ── Inline SVG Social Icons matching the circular outline design ── */
function InstagramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function PinterestIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="9" x2="12" y2="22" />
      <path d="M8 22a10 10 0 1 1 10-10c0 4.4-3.6 8-8 8" />
      <path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5 2 0 3.5 1.5 3.5 3.5 0 2.5-1.5 4.5-3.5 4.5-1 0-1.8-.5-2.2-1.2" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  );
}

/* ── Antique Gold Filigree Divider between columns ── */
function GoldFiligreeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center opacity-75 px-1 select-none pointer-events-none self-stretch pt-2 ${className}`} aria-hidden="true">
      <svg width="12" height="26" viewBox="0 0 14 28" fill="none" className="text-[#8A5A12]">
        <path d="M7 0L8.8 5L7 10L5.2 5L7 0Z" fill="currentColor" fillOpacity="0.9" />
        <circle cx="7" cy="14" r="2" fill="currentColor" />
        <path d="M7 28L8.8 23L7 18L5.2 23L7 28Z" fill="currentColor" fillOpacity="0.9" />
        <path d="M0 14L4.5 12.5L7 14L4.5 15.5L0 14Z" fill="currentColor" fillOpacity="0.75" />
        <path d="M14 14L9.5 12.5L7 14L9.5 15.5L14 14Z" fill="currentColor" fillOpacity="0.75" />
      </svg>
    </div>
  );
}

export function Footer() {
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedPolicyTab, setSelectedPolicyTab] = useState<PolicyTabKey>("shipping");



  const handleOpenPolicy = (tab: PolicyTabKey) => {
    setSelectedPolicyTab(tab);
    setPolicyDialogOpen(true);
  };



  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative w-full overflow-hidden bg-[#E4DDCD] text-[#30251F] mt-auto select-none">
      {/* ========================================================
          DESKTOP PANORAMIC BANNER (>= 1024px, Aspect Ratio 3:1)
          - Zero cropping: The entire illustration is 100% visible on desktop screens
         ======================================================== */}
      <div className="hidden md:block w-full overflow-hidden">
        <div className="relative w-full aspect-[2172/724]">
          {/* LAYER 1: Base Uncropped Panoramic Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Golden Heritage Lake at Dusk.png"
            alt="NiVi Golden Heritage Lake at Dusk"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
          />

          {/* ========================================================
              LAYER 2: GRADIENT SHADE OVER SKY
              - Layer stack: Image (z-0) -> Gradient Shade (z-[5]) -> Content (z-10)
              - Softens the bright sky highlights to ensure crisp text visibility
              - Seamlessly blends into the above page background with no harsh line
             ======================================================== */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-[5]"
            style={{
              background:
                "linear-gradient(180deg, rgba(234, 224, 208, 0.94) 0%, rgba(246, 238, 226, 0.88) 18%, rgba(246, 238, 226, 0.55) 34%, rgba(246, 238, 226, 0) 50%)",
            }}
          />

          {/* ========================================================
              LAYER 3: FOREGROUND CONTENT (z-10)
              - Top Row (y: 8% - 35%): Sits in the dusk sky between the women
              - Middle Area: Preserves the lake, palaces, and saree pallu
              - Bottom Row (y: 88% - 95%): Sits inside the deep green wave
             ======================================================== */}
          <div className="absolute inset-0 w-full h-full flex flex-col justify-between z-10 pointer-events-auto">
            {/* ── TOP SKY SECTION: Navigation & Brand Columns ── */}
            <div className="w-full pt-[2.2%] md:pt-[2.4%] px-[5%] md:px-[6%] lg:px-[8%] xl:px-[11.8%]">
              <div className="flex items-start justify-between gap-2 md:gap-3 xl:gap-5">
                {/* 1. BRAND IDENTITY COLUMN */}
                <div className="flex items-start gap-2 md:gap-3 xl:gap-4 max-w-[240px] md:max-w-[300px] xl:max-w-[380px]">
                  {/* Header-Style Logo Container (Bigger, Clean without border or zoom) */}
                  <Link href="/" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/nivi-logo.jpeg"
                      alt="NiVi"
                      className="h-11 md:h-14 lg:h-18 xl:h-[84px] w-auto object-contain rounded-xl lg:rounded-2xl shadow-xs"
                    />
                  </Link>

                  {/* NiVi Wordmark + Center-Aligned Tagline + Social Icons Aligned under NiVi */}
                  <div className="flex flex-col items-center text-center justify-center">
                    <Link href="/" className="inline-block select-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/nivi-wordmark.png"
                        alt="NiVi"
                        className="h-6 md:h-8 lg:h-10 xl:h-[48px] w-auto object-contain select-none pointer-events-none drop-shadow-md"
                      />
                    </Link>
                    <span
                      className="gold-quote text-center whitespace-nowrap text-[0.72rem] md:text-[0.82rem] lg:text-[1rem] xl:text-[1.18rem] mt-1 md:mt-1.5 lg:mt-2.5 select-none"
                    >
                      Weaving Elegance, Celebrating Tradition.
                    </span>

                    {/* Circular Outline Social Icons (Instagram, Facebook, YouTube) starting under NiVi */}
                    <div className="flex items-center justify-center gap-1.5 md:gap-2 lg:gap-2.5 pt-1 md:pt-2 lg:pt-2.5 w-full">
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="h-5.5 w-5.5 md:h-6.5 md:w-6.5 lg:h-7 lg:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                      >
                        <InstagramIcon className="h-3.5 w-3.5" />
                      </a>

                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="h-5.5 w-5.5 md:h-6.5 md:w-6.5 lg:h-7 lg:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                      >
                        <FacebookIcon className="h-3.5 w-3.5" />
                      </a>

                      <a
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="h-5.5 w-5.5 md:h-6.5 md:w-6.5 lg:h-7 lg:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                      >
                        <YouTubeIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Antique Gold Divider (Shifted slightly right, aligned on exact horizontal line) */}
                <GoldFiligreeDivider className="ml-2 md:ml-4 lg:ml-6 xl:ml-9" />

                {/* 2. SHOP COLUMN (Shifted slightly right) */}
                <div className="space-y-1.5 xl:space-y-2 min-w-[95px] xl:min-w-[110px] pl-1 sm:pl-2">
                  <h4 className="font-serif text-[12px] xl:text-[13px] font-bold tracking-wider text-[#694208] uppercase">
                    SHOP
                  </h4>
                  <ul className="space-y-1 text-[11px] xl:text-[12px] text-[#221811] font-medium leading-tight">
                    <li>
                      <Link href="/collections" className="hover:text-[#073C35] transition-colors inline-block">
                        Collections
                      </Link>
                    </li>
                    <li>
                      <Link href="/collections" className="hover:text-[#073C35] transition-colors inline-block">
                        Sarees
                      </Link>
                    </li>
                    <li>
                      <Link href="/collections?tag=new_arrival" className="hover:text-[#073C35] transition-colors inline-block">
                        New Arrivals
                      </Link>
                    </li>
                    <li>
                      <Link href="/offers" className="hover:text-[#073C35] transition-colors inline-block">
                        Special Offers
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Antique Gold Divider */}
                <GoldFiligreeDivider />

                {/* 3. ABOUT COLUMN */}
                <div className="space-y-1.5 xl:space-y-2 min-w-[95px] xl:min-w-[110px]">
                  <h4 className="font-serif text-[12px] xl:text-[13px] font-bold tracking-wider text-[#694208] uppercase">
                    ABOUT
                  </h4>
                  <ul className="space-y-1 text-[11px] xl:text-[12px] text-[#221811] font-medium leading-tight">
                    <li>
                      <Link href="/about" className="hover:text-[#073C35] transition-colors inline-block">
                        Our Story
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("disclaimers")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        Craftsmanship
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("disclaimers")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        Sustainability
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("disclaimers")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        Blog
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Antique Gold Divider */}
                <GoldFiligreeDivider />

                {/* 4. CUSTOMER CARE COLUMN */}
                <div className="space-y-1.5 xl:space-y-2 min-w-[115px] xl:min-w-[130px]">
                  <h4 className="font-serif text-[12px] xl:text-[13px] font-bold tracking-wider text-[#694208] uppercase">
                    CUSTOMER CARE
                  </h4>
                  <ul className="space-y-1 text-[11px] xl:text-[12px] text-[#221811] font-medium leading-tight">
                    <li>
                      <a href="mailto:connect@brandnivi.com" className="hover:text-[#073C35] transition-colors inline-block text-[10px] xl:text-[11px]">
                        connect@brandnivi.com
                      </a>
                    </li>
                    <li>
                      <a href="https://wa.me/919150992863" target="_blank" rel="noopener noreferrer" className="hover:text-[#073C35] transition-colors inline-block">
                        +91 91509 92863
                      </a>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("shipping")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        Shipping & Delivery
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("returns")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        Returns & Refunds
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => handleOpenPolicy("disclaimers")}
                        className="hover:text-[#073C35] transition-colors text-left inline-block cursor-pointer"
                      >
                        FAQs
                      </button>
                    </li>
                  </ul>
                </div>


              </div>
            </div>

            {/* ── BOTTOM SECTION: Inside the Deep Green Wave ── */}
            <div className="w-full pb-[1.4%] md:pb-[1.6%] px-[5%] md:px-[6%] lg:px-[7%] xl:px-[7.8%]">
              <div className="w-full flex items-center justify-between text-[#EAE0D0] text-[9px] md:text-[10px] lg:text-[11px] xl:text-xs">
                {/* Copyright on left of green wave */}
                <p className="font-sans text-[#EAE0D0]/95 tracking-wide">
                  © {currentYear} NiVi. All rights reserved.
                </p>

                {/* Legal links on right of green wave */}
                <div className="flex items-center gap-3 sm:gap-4 text-[#EAE0D0]/90">
                  <button
                    type="button"
                    onClick={() => handleOpenPolicy("disclaimers")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-[#EAE0D0]/40">|</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPolicy("shipping")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                  <span className="text-[#EAE0D0]/40">|</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPolicy("disclaimers")}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Sitemap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE FOOTER (< 768px)
          - Built with "/footer mobile.png" (1024 x 1536 portrait base)
          - Compact aspect ratio to eliminate excessive empty green space
         ======================================================== */}
      <div className="block md:hidden relative w-full overflow-hidden bg-[#03332a]">
        <div className="relative w-full aspect-[1024/1050] sm:aspect-[16/11]">
          {/* Base Mobile Illustration - Object cover with top alignment */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/footer mobile.png"
            alt="NiVi Heritage"
            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
          />

          {/* Soft Sky Gradient */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-[5]"
            style={{
              background:
                "linear-gradient(180deg, rgba(234, 224, 208, 0.96) 0%, rgba(246, 238, 226, 0.92) 26%, rgba(246, 238, 226, 0.55) 38%, rgba(246, 238, 226, 0) 52%)",
            }}
          />

          {/* Foreground Content Stack */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between pt-4 px-3 sm:pt-6 sm:px-6 md:pt-7 md:px-8 pointer-events-auto">
            {/* Top Area: Mobile Stack vs Tablet Horizontal Spread */}
            <div className="w-full">
              {/* MOBILE LAYOUT (< 640px) */}
              <div className="flex sm:hidden flex-col items-center text-center">
                {/* Brand Logo & Wordmark */}
                <div className="flex flex-col items-center">
                  <Link href="/" className="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/nivi-logo.jpeg"
                      alt="NiVi"
                      className="h-11 w-auto object-contain rounded-xl shadow-xs"
                    />
                  </Link>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nivi-wordmark.png"
                    alt="NiVi"
                    className="h-6 w-auto object-contain mt-1 drop-shadow-sm"
                  />
                  <span className="gold-quote text-center text-[0.88rem] mt-0.5">
                    Weaving Elegance, Celebrating Tradition.
                  </span>

                  {/* Social Icons */}
                  <div className="flex items-center justify-center gap-2 pt-1.5">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="h-6 w-6 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <InstagramIcon className="h-2.5 w-2.5" />
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="h-6 w-6 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <FacebookIcon className="h-2.5 w-2.5" />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="h-6 w-6 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <YouTubeIcon className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* Navigation Grid (Shop, About, Customer Care) */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs mt-2.5 text-center">
                  <div>
                    <h4 className="font-serif text-[10.5px] font-bold tracking-wider text-[#694208] uppercase mb-0.5">
                      Shop
                    </h4>
                    <ul className="space-y-0.5 text-[9.5px] text-[#221811] font-medium">
                      <li><Link href="/collections" className="hover:text-[#073C35]">Collections</Link></li>
                      <li><Link href="/collections" className="hover:text-[#073C35]">Sarees</Link></li>
                      <li><Link href="/collections?tag=new_arrival" className="hover:text-[#073C35]">New</Link></li>
                      <li><Link href="/offers" className="hover:text-[#073C35]">Offers</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-serif text-[10.5px] font-bold tracking-wider text-[#694208] uppercase mb-0.5">
                      About
                    </h4>
                    <ul className="space-y-0.5 text-[9.5px] text-[#221811] font-medium">
                      <li><Link href="/about" className="hover:text-[#073C35]">Our Story</Link></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">Craft</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">Ethics</button></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-serif text-[10.5px] font-bold tracking-wider text-[#694208] uppercase mb-0.5">
                      Care
                    </h4>
                    <ul className="space-y-0.5 text-[9.5px] text-[#221811] font-medium">
                      <li><a href="mailto:connect@brandnivi.com" className="hover:text-[#073C35] break-all">connect@brandnivi.com</a></li>
                      <li><a href="tel:9150992863" className="hover:text-[#073C35]">+91 91509 92863</a></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("shipping")} className="hover:text-[#073C35]">Shipping</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("returns")} className="hover:text-[#073C35]">Returns</button></li>
                    </ul>
                  </div>
                </div>


              </div>

              {/* TABLET LAYOUT (>= 640px and < 1024px) - Elegant 3-Column Spread */}
              <div className="hidden sm:flex items-start justify-between gap-5 md:gap-8 max-w-4xl mx-auto w-full">
                {/* 1. Brand Identity */}
                <div className="flex flex-col items-start text-left min-w-[170px] md:min-w-[200px]">
                  <Link href="/" className="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/nivi-logo.jpeg"
                      alt="NiVi"
                      className="h-11 md:h-13 w-auto object-contain rounded-xl shadow-xs"
                    />
                  </Link>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nivi-wordmark.png"
                    alt="NiVi"
                    className="h-6 md:h-7.5 w-auto object-contain mt-1 drop-shadow-sm"
                  />
                  <span className="gold-quote text-[0.88rem] md:text-[0.98rem] mt-0.5 select-none">
                    Weaving Elegance, Celebrating Tradition.
                  </span>

                  {/* Social Icons */}
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="h-6.5 w-6.5 md:h-7 md:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <InstagramIcon className="h-3 w-3" />
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="h-6.5 w-6.5 md:h-7 md:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <FacebookIcon className="h-3 w-3" />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="h-6.5 w-6.5 md:h-7 md:w-7 rounded-full border border-[#221811]/60 bg-[#FFFCF5]/85 text-[#221811] hover:bg-[#073C35] hover:text-[#FAF7F0] hover:border-[#073C35] transition-all flex items-center justify-center shadow-xs"
                    >
                      <YouTubeIcon className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* 2. Navigation Columns (Shop, About, Care) */}
                <div className="grid grid-cols-3 gap-4 md:gap-7 text-left">
                  <div className="space-y-1">
                    <h4 className="font-serif text-[11px] md:text-xs font-bold tracking-wider text-[#694208] uppercase">
                      Shop
                    </h4>
                    <ul className="space-y-1 text-[10.5px] md:text-[11.5px] text-[#221811] font-medium leading-tight">
                      <li><Link href="/collections" className="hover:text-[#073C35]">Collections</Link></li>
                      <li><Link href="/collections" className="hover:text-[#073C35]">Sarees</Link></li>
                      <li><Link href="/collections?tag=new_arrival" className="hover:text-[#073C35]">New Arrivals</Link></li>
                      <li><Link href="/offers" className="hover:text-[#073C35]">Offers</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-serif text-[11px] md:text-xs font-bold tracking-wider text-[#694208] uppercase">
                      About
                    </h4>
                    <ul className="space-y-1 text-[10.5px] md:text-[11.5px] text-[#221811] font-medium leading-tight">
                      <li><Link href="/about" className="hover:text-[#073C35]">Our Story</Link></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">Craft</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">Ethics</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">Blog</button></li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-serif text-[11px] md:text-xs font-bold tracking-wider text-[#694208] uppercase">
                      Care
                    </h4>
                    <ul className="space-y-1 text-[10.5px] md:text-[11.5px] text-[#221811] font-medium leading-tight">
                      <li><a href="mailto:connect@brandnivi.com" className="hover:text-[#073C35]">connect@brandnivi.com</a></li>
                      <li><a href="tel:9150992863" className="hover:text-[#073C35]">+91 91509 92863</a></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("shipping")} className="hover:text-[#073C35]">Shipping</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("returns")} className="hover:text-[#073C35]">Returns</button></li>
                      <li><button type="button" onClick={() => handleOpenPolicy("disclaimers")} className="hover:text-[#073C35]">FAQs</button></li>
                    </ul>
                  </div>
                </div>


              </div>
            </div>

            {/* ── BOTTOM ROW: Directly inside the Emerald Green Wave ── */}
            <div className="w-full pb-18 sm:pb-14 md:pb-4 text-center pointer-events-auto">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[#EAE0D0]/95 text-[9.5px] sm:text-[10.5px] md:text-[11px] mb-1">
                <button
                  type="button"
                  onClick={() => handleOpenPolicy("disclaimers")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span className="text-[#EAE0D0]/40">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy("shipping")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
                <span className="text-[#EAE0D0]/40">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy("disclaimers")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sitemap
                </button>
              </div>
              <p className="text-[#EAE0D0]/80 text-[9px] sm:text-[10px] md:text-[10.5px]">
                © {currentYear} NiVi. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Policy Modal for quick read-throughs */}
      <StorePoliciesDialog
        open={policyDialogOpen}
        onClose={() => setPolicyDialogOpen(false)}
        defaultTab={selectedPolicyTab}
      />
    </footer>
  );
}
