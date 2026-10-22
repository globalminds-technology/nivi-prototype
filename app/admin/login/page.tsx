import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Shield, Store } from "lucide-react";
import { LoginForm } from "./login-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Super Admin Sign In · NiVi",
  description: "Sign in to access NiVi administrative console.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  await connection();
  return (
    <main
      className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 25%, rgba(255, 252, 245, 0.85) 0%, rgba(244, 238, 227, 0.95) 45%, #E4DDCD 100%)",
      }}
    >
      {/* Decorative ambient background motifs */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(#C9A45C 0.75px, transparent 0.75px), radial-gradient(#073C35 0.75px, #E4DDCD 0.75px)",
          backgroundSize: "36px 36px",
          backgroundPosition: "0 0, 18px 18px",
        }}
      />

      {/* Top Header Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#073C35] bg-[#FFFCF5]/80 hover:bg-[#FFFCF5] border border-[#D5CCBB] px-3 py-1.5 rounded-full shadow-2xs transition-all group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <Store className="h-3.5 w-3.5 opacity-80" />
          <span>Return to Store</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-[#30251F]/80 font-mono bg-[#073C35]/8 px-3 py-1.5 rounded-full border border-[#073C35]/20 shadow-2xs">
          <Shield className="h-3.5 w-3.5 text-[#073C35]" />
          <span className="font-medium">Super Admin Portal</span>
        </div>
      </div>

      {/* Login Card Form */}
      <div className="w-full max-w-md relative z-10">
        <LoginForm />
      </div>

      {/* Subtle brand copyright */}
      <p className="mt-8 text-xs text-[#6B5A4A] text-center font-serif tracking-wide relative z-10">
        NiVi Luxury Handcrafted Sarees &copy; {new Date().getFullYear()} · All Rights Reserved
      </p>
    </main>
  );
}
