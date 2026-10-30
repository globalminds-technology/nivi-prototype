"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { container } from "@/infrastructure/di/container";

const { adminAuth } = container;

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  success?: boolean;
  error?: string;
};

export async function loginAdminAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const user = await adminAuth.verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const token = await adminAuth.createSessionToken(user.email, user.role, user.hideZohoBooks);
  await adminAuth.setSessionCookie(token);

  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  await adminAuth.clearSessionCookie();
  redirect("/admin/login");
}
