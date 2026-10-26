"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Layers,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Store,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react";
import { logoutAdminAction } from "@/app/actions/admin-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import "@/components/store/gold-text.css";

interface AdminHeaderProps {
  adminEmail: string;
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storefrontHref, setStorefrontHref] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("admin.")) {
        const rootHost = host.replace(/^admin\./, "");
        setStorefrontHref(`${window.location.protocol}//${rootHost}/`);
      } else {
        setStorefrontHref("/");
      }
    }
  }, []);

  const handleStorefrontClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("admin.")) {
        e.preventDefault();
        const rootHost = host.replace(/^admin\./, "");
        const targetUrl = `${window.location.protocol}//${rootHost}/`;
        if (e.metaKey || e.ctrlKey) {
          window.open(targetUrl, "_blank");
        } else {
          window.location.href = targetUrl;
        }
      }
    }
  };

  // 4 Primary Section Navigation Tabs for the desktop header
  const desktopNavItems = [
    { label: "Products", href: "/admin", exact: true, icon: Package },
    { label: "Categories", href: "/admin/categories", exact: false, icon: Layers },
    { label: "Offers & Banners", href: "/admin/offers", exact: false, icon: Tag },
    { label: "Shipping", href: "/admin/shipping", exact: false, icon: Truck },
  ];

  // Mobile Drawer gets all items including quick Add Product
  const drawerNavItems = [
    ...desktopNavItems,
    { label: "Add Product", href: "/admin/products/new", exact: true, icon: PlusCircle },
  ];

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#D5CCBB]/80 shadow-[0_2px_12px_rgba(7,60,53,0.04)] backdrop-blur-md"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 252, 245, 0.98) 0%, rgba(249, 244, 235, 0.96) 60%, rgba(228, 221, 205, 0.94) 100%)",
        }}
      >
        <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 lg:gap-4">
          {/* MOBILE/TABLET ONLY: Hamburger & Logo (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="text-[#073C35] hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-lg -ml-1"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi"
                className="h-9 sm:h-10 w-auto object-contain rounded-xl shadow-xs"
              />
              <div className="flex flex-col text-left justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nivi-wordmark.png"
                  alt="NiVi"
                  className="h-5 sm:h-6 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
                <span className="hidden sm:inline-block gold-quote text-[0.76rem] leading-none select-none">
                  Women with tradition, styled for today
                </span>
              </div>
            </Link>
          </div>

          {/* DESKTOP (>= 1024px): Dual Logo + Tagline + Navigation */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-5 min-w-0">
            <Link href="/admin" className="flex items-center gap-2.5 lg:gap-3 shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nivi-logo.jpeg"
                alt="NiVi"
                className="h-10 lg:h-11 w-auto object-contain rounded-xl shadow-xs transition-transform group-hover:scale-[1.02]"
              />
              <div className="flex flex-col text-left justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nivi-wordmark.png"
                  alt="NiVi"
                  className="h-6 lg:h-7 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
                <div>
                  <span className="gold-quote text-[0.84rem] xl:text-[0.92rem] leading-tight select-none mt-0.5">
                   Women with tradition, styled for today.
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation: 4 Section Tabs */}
            <nav className="flex items-center gap-1 xl:gap-2 shrink-0">
              {desktopNavItems.map((item) => {
                const active = isNavActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs xl:text-[13px] font-medium tracking-wide transition-all duration-200 relative shrink-0 whitespace-nowrap ${
                      active
                        ? "text-[#073C35] bg-[#073C35]/8 font-semibold"
                        : "text-[#30251F]/75 hover:text-[#073C35] hover:bg-[#073C35]/5"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 xl:h-4 xl:w-4 ${active ? "text-[#073C35]" : "text-[#30251F]/60"}`} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#073C35] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-1.5 xl:gap-2.5 shrink-0">

            {/* View Storefront */}
            <Link
              href={storefrontHref}
              onClick={handleStorefrontClick}
              title="Navigate to Customer Storefront"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "gap-1.5 text-xs text-[#073C35] bg-[#FFFCF5]/70 border-[#D5CCBB] hover:bg-[#073C35]/10 hover:border-[#073C35]/30 rounded-lg shadow-2xs font-medium px-2.5 sm:px-3 cursor-pointer",
              })}
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Storefront</span>
              <ExternalLink className="h-3 w-3 opacity-60 hidden xl:inline" />
            </Link>

            {/* Zoho Books (Visible on 2xl screens) */}
            <a
              href="https://books.zoho.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Zoho Books in new tab"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className:
                  "hidden 2xl:inline-flex gap-1.5 text-xs text-[#30251F]/70 hover:text-[#073C35] hover:bg-[#073C35]/8 rounded-lg",
              })}
            >
              <span>Zoho Books</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>

            {/* Admin Badge: Full pill on 2xl, compact user icon on xl */}
            <div
              title={adminEmail}
              className="hidden xl:flex items-center gap-1.5 text-xs text-[#30251F]/85 font-mono bg-[#073C35]/8 border border-[#073C35]/15 px-2.5 py-1 rounded-full shadow-2xs cursor-default"
            >
              <User className="h-3.5 w-3.5 text-[#073C35]" />
              <span className="hidden 2xl:inline truncate max-w-[140px] font-medium">{adminEmail}</span>
            </div>

            {/* Sign Out */}
            <form action={logoutAdminAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                title="Sign Out"
                className="text-xs text-[#30251F]/70 hover:text-red-700 hover:bg-red-50 gap-1.5 rounded-lg px-2 sm:px-2.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (< 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#073C35]/40 backdrop-blur-xs transition-opacity animate-in fade-in-50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div
            className="relative w-4/5 max-w-sm h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-[#D5CCBB]"
            style={{
              background:
                "linear-gradient(180deg, #FFFCF5 0%, #F9F4EB 60%, #E4DDCD 100%)",
            }}
          >
            {/* Drawer Header */}
            <div>
              <div className="p-4 flex items-center justify-between border-b border-[#D5CCBB]">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/nivi-logo.jpeg"
                    alt="NiVi"
                    className="h-10 w-auto object-contain rounded-xl shadow-xs"
                  />
                  <div className="flex flex-col text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/nivi-wordmark.png"
                      alt="NiVi"
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#073C35] hover:bg-[#073C35]/8 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links (Includes all items + Add Product) */}
              <div className="p-4 space-y-1">
                {drawerNavItems.map((item) => {
                  const active = isNavActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        active
                          ? "bg-[#073C35] text-white font-semibold shadow-xs"
                          : "text-[#30251F]/80 hover:bg-[#073C35]/8 hover:text-[#073C35]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-[#073C35]"}`} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-[#D5CCBB] mt-3 space-y-1">
                  <Link
                    href={storefrontHref}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleStorefrontClick(e);
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#073C35] hover:bg-[#073C35]/8 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4" />
                      <span>View Customer Store</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </Link>

                  <a
                    href="https://books.zoho.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#30251F]/80 hover:bg-[#073C35]/8"
                  >
                    <span>Open Zoho Books</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer with Admin Email & Sign Out */}
            <div className="p-4 border-t border-[#D5CCBB] space-y-3 bg-[#FFFCF5]/80">
              <div className="flex items-center gap-2 text-xs text-[#30251F]/80 font-mono bg-[#073C35]/8 border border-[#073C35]/15 px-3 py-2 rounded-xl">
                <User className="h-4 w-4 text-[#073C35] shrink-0" />
                <span className="truncate">{adminEmail}</span>
              </div>

              <form action={logoutAdminAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-center text-xs text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2 py-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Console</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
