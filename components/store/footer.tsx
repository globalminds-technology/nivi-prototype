"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Sparkles, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#023036]/10 bg-[#faf8f2]/80 backdrop-blur-xs text-muted-foreground mt-auto pb-20 md:pb-0">
      {/* Guarantees row */}
      <div className="border-b border-border/50 py-8">
        <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center sm:items-start justify-center sm:justify-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                Free Express Delivery
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Delivered across all major Indian cities within 3–5 business days.
              </p>
            </div>
          </div>

          <div className="flex items-center sm:items-start justify-center sm:justify-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                100% Authentic Handloom
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Directly sourced from verified master weavers and craft cooperatives.
              </p>
            </div>
          </div>

          <div className="flex items-center sm:items-start justify-center sm:justify-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                Concierge Assistance
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dedicated styling, sizing, and custom orders via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer links */}
      <div className="container mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-brand/50 shadow-xs shrink-0 bg-neutral-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#023036] leading-none">
                NiVi
              </span>
              <span className="text-[9px] font-sans text-[#B87333] tracking-widest uppercase font-semibold mt-1">
                Woven with tradition, styled for today
              </span>
            </div>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            Curated Indian heritage textiles, modern silhouettes, and bespoke festive ensembles crafted by master artisans for your most cherished celebrations.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/919999999999?text=Hello%20Nivi%2C%20I%20have%20an%20inquiry%20about%20your%20curated%20pieces."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#208280] hover:text-[#056677] hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat on WhatsApp Support</span>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
            Navigation
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                All Collections
              </Link>
            </li>
            <li>
              <Link href="/?tag=new_arrival" className="hover:text-foreground transition-colors">
                New Arrivals
              </Link>
            </li>
            <li>
              <Link href="/?tag=featured" className="hover:text-foreground transition-colors">
                Featured Edits
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-foreground transition-colors">
                Limited-time Offers
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
            Management
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/admin/login" className="hover:text-foreground transition-colors">
                Admin Console
              </Link>
            </li>
            <li>
              <a
                href="https://books.zoho.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Zoho Books Portal
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright line */}
      <div className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/80">
          <p>© 2026 Nivi Collections. All rights reserved.</p>
          <p className="text-[11px] font-mono">Crafted in India • Powered by Next.js & Zoho Books</p>
        </div>
      </div>
    </footer>
  );
}
