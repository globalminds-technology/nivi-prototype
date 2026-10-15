"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Headphones,
  Heart,
  Home,
  Layers,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Category } from "@/core/domain/entities/category";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { CartSheet } from "./cart-sheet";
import { SearchDropdown } from "./search-dropdown";
import type { StoreProductData } from "./product-card";
import "./gold-text.css";

interface HeaderProps {
  products?: StoreProductData[];
  categories?: Category[];
}

export function Header({ products = [], categories }: HeaderProps) {
  const pathname = usePathname();
  const { totalCount: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Derive categories list (from prop or unique from products)
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      }));
    }
    const uniqueNames = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    ) as string[];

    return uniqueNames.map((name, idx) => ({
      id: `cat_${idx}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    }));
  }, [categories, products]);

  // Exact navigation items from desktop reference
  const navItems = [
    { label: "Collections", href: "/collections" },
    { label: "Sarees", href: "/collections" },
    { label: "Offers", href: "/offers", badge: "New" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <>
      {/* ========================================================
          TOP HEADER
          - Warm ivory surface with subtle beige border
          - Desktop: Logo | Collections Sarees Offers About Contact | Search | Wishlist | Account | Cart
          - Mobile: Menu | Logo | Wishlist | Cart
         ======================================================== */}
      <header
        className="sticky top-0 z-40 border-b border-[#D5CCBB]/80 shadow-[0_2px_12px_rgba(7,60,53,0.04)] backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, rgba(255, 252, 245, 0.98) 0%, rgba(249, 244, 235, 0.96) 60%, rgba(228, 221, 205, 0.94) 100%)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* MOBILE ONLY: Hamburger Menu & Logo */}
          <div className="flex md:hidden items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="text-[#073C35] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-lg -ml-1"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi"
                className="h-11 sm:h-12 w-auto object-contain rounded-xl shadow-xs"
              />
              <div className="flex flex-col text-left justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nivi-wordmark.png"
                  alt="NiVi"
                  className="h-7 sm:h-8 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
                <span className="hidden sm:inline-block gold-quote text-[0.88rem] leading-tight select-none mt-0.5">
                  Woven with tradition, styled for today
                </span>
              </div>
            </Link>
          </div>

          {/* DESKTOP ONLY: Logo & Navigation Links (Responsive for Tablet & Desktop) */}
          <div className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6 xl:gap-9 min-w-0">
            <Link href="/" className="flex items-center gap-2 md:gap-2.5 lg:gap-3.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi"
                className="h-10 md:h-11 lg:h-13 xl:h-15 w-auto object-contain rounded-xl sm:rounded-2xl shadow-xs"
              />
              <div className="flex flex-col text-left justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nivi-wordmark.png"
                  alt="NiVi"
                  className="h-6.5 md:h-7 lg:h-8.5 xl:h-9.5 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
                <div className="hidden xl:block">
                  <span className="gold-quote text-[0.92rem] lg:text-[1.05rem] leading-tight select-none mt-0.5">
                    Woven with tradition, styled for today
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Center Navigation */}
            <nav className="flex items-center gap-2 md:gap-3 lg:gap-5 xl:gap-8 shrink-0">
              {navItems.map((item) => {
                const isActive = item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-[11.5px] md:text-[12px] lg:text-[13px] xl:text-[14px] font-medium tracking-wide transition-all duration-200 relative py-1 shrink-0 whitespace-nowrap ${
                      isActive
                        ? "text-[#073C35] font-semibold"
                        : "text-[#30251F]/80 hover:text-[#073C35]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#073C35] rounded-full" />
                    )}
                    {item.badge && (
                      <span className="ml-1 text-[8.5px] font-semibold px-1 py-0.5 rounded-full uppercase tracking-wider bg-[#DCAEB6] text-[#30251F]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT ACTIONS: Search Dropdown + Wishlist + Account + Cart Bag */}
          <div className="flex items-center gap-1.5 md:gap-2 sm:gap-3 shrink-0">
            {/* Search Dropdown / Trigger */}
            <SearchDropdown products={products} />

            {/* DESKTOP ONLY: Wishlist, Account, and Cart Bag (Mobile accesses these via bottom navigation bar) */}
            <div className="hidden md:flex items-center gap-1 md:gap-1.5 lg:gap-2.5">
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                  className:
                    "relative text-[#073C35] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-full h-8 w-8 md:h-8.5 md:w-8.5",
                })}
              >
                <Heart className="h-4 w-4 md:h-4.5 md:w-4.5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 md:h-4 md:w-4 rounded-full bg-[#DCAEB6] text-[#30251F] font-mono text-[8.5px] md:text-[9px] flex items-center justify-center font-bold shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin"
                aria-label="Account / Admin"
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                  className:
                    "text-[#073C35] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-full h-8 w-8 md:h-8.5 md:w-8.5",
                })}
                title="Account / Admin"
              >
                <User className="h-4 w-4 md:h-4.5 md:w-4.5" />
              </Link>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCartOpen(true)}
                aria-label="Shopping Cart"
                className="relative text-[#073C35] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-full"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#073C35] text-white font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          MOBILE NAVIGATION DRAWER (Slide-over)
          Updated with teal/copper theme
         ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in-0 duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-[#faf8f2] text-neutral-900 h-full shadow-2xl flex flex-col z-10 border-r border-[#d2c8b5]">
            {/* Drawer Header */}
            <div
              className="p-4 border-b border-[#023036]/10 flex items-center justify-between"
              style={{ background: "linear-gradient(180deg, #FAF8F5 0%, #EFEAE1 100%)" }}
            >
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nivi-logo.jpeg"
                  alt="NiVi"
                  className="h-9 w-auto object-contain rounded-md ring-1 ring-[#023036]/10"
                />
                <span className="font-serif text-lg font-bold text-[#023036]">NiVi</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-[#023036] hover:bg-[#023036]/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Flat Navigation Links */}
              <Link
                href="/collections"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#023036]/5 border border-[#023036]/10 hover:bg-[#023036]/10 transition-colors"
              >
                <LayoutGrid className="h-4.5 w-4.5 text-[#056677]" />
                <div>
                  <span className="text-sm font-semibold text-[#023036]">Collections</span>
                  <p className="text-[10px] text-[#3d5a5e] mt-0.5">Explore our complete curated catalog</p>
                </div>
              </Link>

              <Link
                href="/collections?tag=new_arrival"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#023036]/5 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-[#B87333]" />
                <span className="text-sm font-medium text-[#023036]">New Arrivals</span>
              </Link>

              <Link
                href="/collections?tag=featured"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#023036]/5 transition-colors"
              >
                <Tag className="h-4 w-4 text-[#208280]" />
                <span className="text-sm font-medium text-[#023036]">Featured</span>
              </Link>

              <Link
                href="/collections?tag=bestseller"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#023036]/5 transition-colors"
              >
                <Heart className="h-4 w-4 text-[#4B9488]" />
                <span className="text-sm font-medium text-[#023036]">Best Sellers</span>
              </Link>

              {/* Divider */}
              <div className="border-t border-[#d2c8b5]/60 my-2" />

              {/* Offers */}
              <Link
                href="/offers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#023036]/5 to-[#056677]/10 border border-[#023036]/15 hover:bg-[#023036]/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#B87333]" />
                  <span className="text-sm font-semibold text-[#023036]">Special Offers</span>
                </span>
                <Badge className="text-[9px] bg-[#023036] text-white">
                  Deals
                </Badge>
              </Link>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#023036]/15 space-y-2 bg-[#FAF8F5]">
              <a
                href="https://wa.me/919999999999?text=Hello%20NiVi%2C%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20sarees."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#023036] hover:bg-[#035354] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Headphones className="h-4 w-4" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION (md:hidden alone)
         ======================================================== */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-[#D5CCBB] shadow-[0_-4px_20px_rgba(7,60,53,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all"
        style={{
          background: "linear-gradient(180deg, rgba(255, 252, 245, 0.98) 0%, rgba(244, 238, 227, 0.98) 100%)",
        }}
      >
        <div className="grid grid-cols-5 items-center max-w-md mx-auto px-1">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname === "/"
                ? "text-[#073C35] font-bold"
                : "text-[#6B5A4A] hover:text-[#073C35]"
            }`}
          >
            <div className="relative">
              <Home className={`h-5 w-5 ${pathname === "/" ? "stroke-[2.4px]" : "stroke-[1.8px]"}`} />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Home</span>
          </Link>

          {/* 2. Collections */}
          <Link
            href="/collections"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname.startsWith("/collections")
                ? "text-[#073C35] font-bold"
                : "text-[#6B5A4A] hover:text-[#073C35]"
            }`}
          >
            <div className="relative">
              <LayoutGrid className="h-5 w-5 stroke-[1.8px]" />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Collections</span>
          </Link>

          {/* 3. Bag (Cart) */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Shopping Bag"
            className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
              cartOpen ? "text-[#073C35] font-bold" : "text-[#6B5A4A] hover:text-[#073C35]"
            }`}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5 stroke-[1.8px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-[#073C35] text-white font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Bag</span>
          </button>

          {/* 4. Wishlist */}
          <Link
            href="/wishlist"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname === "/wishlist"
                ? "text-[#073C35] font-bold"
                : "text-[#6B5A4A] hover:text-[#073C35]"
            }`}
          >
            <div className="relative">
              <Heart
                className={`h-5 w-5 ${
                  pathname === "/wishlist" ? "fill-[#DCAEB6] text-[#073C35] stroke-[2px]" : "stroke-[1.8px]"
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-[#DCAEB6] text-[#30251F] font-mono text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Wishlist</span>
          </Link>

          {/* 5. Account */}
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              pathname.startsWith("/admin")
                ? "text-[#073C35] font-bold"
                : "text-[#6B5A4A] hover:text-[#073C35]"
            }`}
          >
            <div className="relative">
              <User className="h-5 w-5 stroke-[1.8px]" />
            </div>
            <span className="text-[10px] tracking-tight mt-1">Account</span>
          </Link>
        </div>
      </nav>

      {/* Cart Slideover Sheet */}
      <CartSheet products={products} open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
