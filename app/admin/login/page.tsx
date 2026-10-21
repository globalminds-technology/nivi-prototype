import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Sign in to access Nivi administrative console.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-linear-to-b from-background via-muted/20 to-background">
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Store
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span>Internal Console</span>
        </div>
      </div>

      <LoginForm />
    </main>
  );
}
