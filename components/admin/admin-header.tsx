"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Layers, LogOut, Package, PlusCircle, ShieldCheck, Sparkles } from "lucide-react";
import { logoutAdminAction } from "@/app/actions/admin-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdminHeaderProps {
  adminEmail: string;
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & navigation */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="relative w-7 h-9 rounded-sm overflow-hidden border border-brand/50 shadow-2xs shrink-0">
              <Image
                src="/nivi-logo.jpeg"
                alt="NiVi"
                fill
                sizes="28px"
                className="object-cover object-center"
                priority
              />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-primary">NiVi</span>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-brand/15 text-primary border border-brand/30 font-semibold px-2 py-0.5 rounded-full">
              Console
            </span>
          </Link>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          <nav className="hidden sm:flex items-center gap-2">
            <Link
              href="/admin"
              className={buttonVariants({
                variant: pathname === "/admin" ? "secondary" : "ghost",
                size: "sm",
                className: "gap-2",
              })}
            >
              <Package className="h-4 w-4" />
              Products
            </Link>

            <Link
              href="/admin/categories"
              className={buttonVariants({
                variant: pathname === "/admin/categories" ? "secondary" : "ghost",
                size: "sm",
                className: "gap-2",
              })}
            >
              <Layers className="h-4 w-4" />
              Categories
            </Link>

            <Link
              href="/admin/offers"
              className={buttonVariants({
                variant: pathname === "/admin/offers" ? "secondary" : "ghost",
                size: "sm",
                className: "gap-2",
              })}
            >
              <Sparkles className="h-4 w-4" />
              Offers
            </Link>

            <Link
              href="/admin/products/new"
              className={buttonVariants({
                variant: pathname === "/admin/products/new" ? "secondary" : "ghost",
                size: "sm",
                className: "gap-2",
              })}
            >
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Link>
          </nav>
        </div>

        {/* Action buttons & user profile */}
        <div className="flex items-center gap-3">
          <a
            href="https://books.zoho.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Zoho Books in a new tab"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "hidden md:inline-flex gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            })}
          >
            <span>Zoho Books</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-1 rounded-md">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            <span className="truncate max-w-[160px]">{adminEmail}</span>
          </div>

          <form action={logoutAdminAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
