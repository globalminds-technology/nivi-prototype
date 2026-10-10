"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headphones,
  Heart,
  Home,
  LayoutGrid,
  ShoppingBag,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { CartSheet } from "./cart-sheet";
import { SearchDropdown } from "./search-dropdown";
import type { StoreProductData } from "./product-card";

interface HeaderProps {
  products: StoreProductData[];
}

export function Header({ products }: HeaderProps) {
  const pathname = usePathname();
  const { totalCount: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [cartOpen, setCartOpen] = useState(false);

  const navLinks = [
    { label: "Collection", href: "/collections" },
    { label: "New Arrivals", href: "/collections?tag=new_arrival" },
    { label: "Featured", href: "/collections?tag=featured" },
    { label: "Special Offers", href: "/offers", isOffer: true },
  ];

  return (
    <>
      {/* ========================================================
          TOP HEADER
          - Header background stays clean warm sand (#e4ddcd / bg-background)
          - Logo alone (larger, prominent, no container box, no duplicate text)
          - Tabs use Deep Teal (#083e3e) background with warm gold text (#f3d998)
         ======================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#d2c8b5]/80 bg-background/95 backdrop-blur-md shadow-2xs">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* MOBILE ONLY: Logo Alone (Larger, unboxed, clear) */}
          <div className="flex md:hidden items-center">
            <Link href="/" className="flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi — Woven with tradition"
                className="h-11 sm:h-12 w-auto object-contain rounded-lg shadow-2xs"
              />
            </Link>
          </div>

          {/* DESKTOP ONLY: Logo Alone & Deep Teal Navigation Tabs */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <Link href="/" className="flex items-center shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi — Woven with tradition"
                className="h-14 sm:h-16 w-auto object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            {/* Desktop Center Navigation Tabs in Deep Teal & Gold */}
            <nav className="flex items-center gap-2 lg:gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 shadow-2xs border ${
                      isActive
                        ? "bg-[#052920] text-[#fde68a] border-[#dfb76c] ring-2 ring-[#dfb76c]/40 shadow-xs scale-[1.02]"
                        : "bg-[#083e3e] text-[#f3d998] border-[#083e3e] hover:bg-[#062c2b] hover:text-[#fff1cc] hover:border-[#dfb76c]/60 hover:shadow-xs"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT ACTIONS: Search Dropdown + Wishlist + Cart Bag */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Dropdown / Trigger */}
            <SearchDropdown products={products} />

            {/* Desktop Wishlist */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className={buttonVariants({
                variant: "ghost",
                size: "icon-sm",
                className: "hidden md:inline-flex relative text-neutral-700 hover:text-primary hover:bg-neutral-200/60 rounded-full",
              })}
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Desktop Cart Bag */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCartOpen(true)}
              aria-label="Shopping Cart"
              className="hidden md:inline-flex relative text-neutral-800 hover:text-primary hover:bg-neutral-200/60 rounded-full"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#083e3e] text-[#f3d998] font-mono text-[9px] flex items-center justify-center font-bold shadow-xs border border-[#dfb76c]/40">
                {cartCount}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION (md:hidden alone)
          Clean warm sand bar matching the theme
          1. Home
          2. Shop -> /collections
          3. Wishlist -> /wishlist
          4. Cart (with badge)
          5. Support (with WhatsApp link)
         ======================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-[#d2c8b5]/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all"
      >
        <div className="grid grid-cols-5 items-center max-w-md mx-auto px-1">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname === "/"
                ? "text-primary font-bold"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative">
              <Home className={`h-5 w-5 ${pathname === "/" ? "stroke-[2.4px]" : "stroke-[1.8px]"}`} />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Home</span>
          </Link>

          {/* 2. Shop (Collections) */}
          <Link
            href="/collections"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname === "/collections"
                ? "text-primary font-bold"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative">
              <LayoutGrid className="h-5 w-5 stroke-[1.8px]" />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Shop</span>
          </Link>

          {/* 3. Wishlist */}
          <Link
            href="/wishlist"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname === "/wishlist"
                ? "text-primary font-bold"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative">
              <Heart className={`h-5 w-5 ${pathname === "/wishlist" ? "fill-primary/20 stroke-[2.4px]" : "stroke-[1.8px]"}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Wishlist</span>
          </Link>

          {/* 4. Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open Shopping Cart"
            className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5 stroke-[1.8px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-[#083e3e] text-[#f3d998] font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Cart</span>
          </button>

          {/* 5. Support */}
          <a
            href="https://wa.me/919999999999?text=Hello%20NiVi%2C%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20sarees."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Concierge Support"
            className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <div className="relative">
              <Headphones className="h-5 w-5 stroke-[1.8px]" />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Support</span>
          </a>
        </div>
      </nav>

      {/* Cart Slideover Sheet */}
      <CartSheet
        products={products}
        open={cartOpen}
        onOpenChange={setCartOpen}
      />
    </>
  );
}
