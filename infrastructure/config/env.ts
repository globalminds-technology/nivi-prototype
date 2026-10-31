import "server-only";
import { z } from "zod";

/**
 * Single source of truth for server configuration.
 * Validated lazily on first access so `next build` and tests don't require secrets
 * that a given route never touches; any route/adapter that does touch them fails fast via requireEnv.
 */
/**
 * Helper to treat empty strings in .env files as undefined so optional
 * variables and defaults work without requiring keys to be completely deleted.
 */
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === "string" && val.trim() === "") return undefined;
    return val;
  }, schema);

const optionalString = emptyToUndefined(z.string().min(1).optional());

const envSchema = z.object({
  // Zoho Books
  ZOHO_CLIENT_ID: optionalString,
  ZOHO_CLIENT_SECRET: optionalString,
  ZOHO_REFRESH_TOKEN: optionalString,
  ZOHO_API_DOMAIN: emptyToUndefined(z.string().url().default("https://www.zohoapis.in")),
  ZOHO_ACCOUNTS_URL: emptyToUndefined(z.string().url().default("https://accounts.zoho.in")),
  ZOHO_ORG_ID: optionalString,

  // Cloudflare R2
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_BUCKET_URL: emptyToUndefined(z.string().url().optional()),

  // Payments & email
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  MAIL_FROM: optionalString,

  // SMTP Email Configuration
  MAIL_SERVER: optionalString,
  MAIL_PORT: emptyToUndefined(z.coerce.number().optional()),
  MAIL_USE_TLS: emptyToUndefined(z.string().optional()),
  MAIL_USERNAME: optionalString,
  MAIL_PASSWORD: optionalString,

  // Security & Admin Auth
  CRON_SECRET: optionalString,
  ADMIN_EMAIL: emptyToUndefined(z.string().email().optional()),
  ADMIN_PASSWORD: optionalString,
  ADMIN_PASSWORD_HASH: optionalString,
  MANAGER_EMAIL: emptyToUndefined(z.string().email().optional()),
  MANAGER_PASSWORD: optionalString,
  MANAGER_PASSWORD_HASH: optionalString,
  AUTH_SECRET: optionalString,
  REVIEW_LINK_SECRET: optionalString,

  // Reviews — Option C only
  GOOGLE_SHEETS_CLIENT_EMAIL: optionalString,
  GOOGLE_SHEETS_PRIVATE_KEY: optionalString,
  GOOGLE_SHEET_ID: optionalString,

  // Public
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(z.string().url().default("http://localhost:3000")),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Narrow a feature's optional vars to required, with a clear error. */
export function requireEnv<K extends keyof Env>(
  ...keys: K[]
): { [P in K]-?: NonNullable<Env[P]> } {
  const e = env();
  const missing = keys.filter((k) => e[k] === undefined || e[k] === "");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return Object.fromEntries(keys.map((k) => [k, e[k]])) as {
    [P in K]-?: NonNullable<Env[P]>;
  };
}
