"use client";

import { useActionState } from "react";
import Image from "next/image";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { loginAdminAction, type LoginState } from "@/app/actions/admin-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  return (
    <Card className="w-full max-w-md shadow-xl border-border/60 backdrop-blur-xs">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="relative w-16 h-20 mx-auto rounded-lg overflow-hidden border border-brand/50 shadow-md mb-2">
          <Image
            src="/nivi-logo.jpeg"
            alt="NiVi Emblem"
            fill
            sizes="64px"
            className="object-cover object-center"
            priority
          />
        </div>
        <CardTitle className="text-2xl font-serif tracking-tight text-primary">NiVi Console</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter administrative credentials to manage products, offers, and inventory.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="email">Admin Email</FieldLabel>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@nivi.in"
                disabled={isPending}
                className="pl-9"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <FieldDescription>Authorized administrator email address</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                disabled={isPending}
                className="pl-9"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </Field>
        </CardContent>

        <CardFooter className="pt-2 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              "Sign In to Console"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Zoho Books is the system of record. Changes made in this portal sync bidirectionally.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
