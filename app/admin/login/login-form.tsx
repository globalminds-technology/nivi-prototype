"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAdminAction, type LoginState } from "@/app/actions/admin-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import "@/components/store/gold-text.css";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full max-w-md shadow-[0_16px_50px_rgba(7,60,53,0.1)] border-[#D5CCBB] bg-[#FFFCF5] rounded-2xl overflow-hidden">
      {/* Top Accent Gold Border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#073C35] via-[#C9A45C] to-[#073C35]" />

      <CardHeader className="space-y-3 text-center pt-8 pb-5 px-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center space-y-1">
          <span className="font-serif text-3xl font-bold tracking-tight text-[#073C35]">
            The Saree Studio
          </span>
          <span className="text-xs uppercase tracking-widest text-[#8C6D37] font-medium">
            Administrative Console
          </span>
        </div>

        <div className="pt-2">
          <CardTitle className="font-serif text-2xl font-bold tracking-tight text-[#073C35]">
            Console Sign In
          </CardTitle>
          <CardDescription className="text-xs text-[#6B5A4A] mt-1">
            Enter administrative credentials to manage products, banners, offers, and inventory.
          </CardDescription>
        </div>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4 px-6">
          {state?.error && (
            <Alert variant="destructive" className="animate-in fade-in-50 bg-red-50 border-red-200 text-red-900 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-xs font-bold">Authentication Failed</AlertTitle>
              <AlertDescription className="text-xs text-red-700">{state.error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#30251F]">
              Admin Email Address
            </FieldLabel>
            <div className="relative mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@thesareestudio.com"
                disabled={isPending}
                className="pl-10 h-11 bg-white border-[#D5CCBB] text-[#30251F] placeholder:text-[#6B5A4A]/50 focus-visible:border-[#073C35] focus-visible:ring-[#073C35] rounded-xl shadow-2xs"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#073C35]/70 pointer-events-none" />
            </div>
            <FieldDescription className="text-[11px] text-[#6B5A4A] mt-1">
              Authorized administrator email address
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="password" className="text-xs font-semibold text-[#30251F]">
              Password
            </FieldLabel>
            <div className="relative mt-1">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                disabled={isPending}
                className="pl-10 pr-10 h-11 bg-white border-[#D5CCBB] text-[#30251F] placeholder:text-[#6B5A4A]/50 focus-visible:border-[#073C35] focus-visible:ring-[#073C35] rounded-xl shadow-2xs"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#073C35]/70 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-3 text-[#6B5A4A] hover:text-[#073C35] p-0.5 rounded transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </CardContent>

        <CardFooter className="pt-3 pb-6 px-6 flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full h-11 bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Signing In...
              </>
            ) : (
              "Sign In to Console"
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B5A4A] mt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#073C35]" />
            <span>Zoho Books is the system of record. Sync is bidirectional.</span>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
