# NiVi: Admin Panel Subdomain & Deployment Strategy

This document outlines the architectural roadmap for serving the **Storefront (`nivi.in`)** and the **Admin Console (`admin.nivi.in`)**, starting with a zero-cost single-deployment subdomain setup, and an optional future migration to a Turborepo monorepo.

---

## Part 1: Single Deployment with Subdomain Routing (Recommended)

You can run both `nivi.in` and `admin.nivi.in` on a **single deployment** (one repository, one hosting instance, zero extra domain fees).

### How It Works
- Domains:
  - **Storefront**: `https://nivi.in` (and `https://www.nivi.in`)
  - **Admin Console**: `https://admin.nivi.in`
- A single Next.js project is deployed (e.g. on Vercel or Cloudflare).
- Both `nivi.in` and `admin.nivi.in` point to the same Vercel deployment.
- A lightweight Next.js `middleware.ts` rewrites incoming requests dynamically based on the hostname.

---

### Step 1: DNS Setup (Zero Extra Cost)
In your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.):
1. **Root Domain**:
   - Type: `A` or `CNAME` pointing to your Vercel/hosting server (e.g., `76.76.21.21` or `cname.vercel-dns.com`).
2. **Admin Subdomain**:
   - Type: `CNAME`
   - Name / Host: `admin`
   - Target / Value: `cname.vercel-dns.com` (or your host's CNAME target).

In Vercel Project Settings ➔ **Domains**:
- Add `nivi.in`
- Add `admin.nivi.in`

---

### Step 2: Next.js Subdomain Routing (`proxy.ts`)
In Next.js 16, `middleware.ts` is replaced by `proxy.ts` (located at [proxy.ts](file:///d:/personal/nivi/proxy.ts)):

```typescript
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const sessionCookie = request.cookies.get("admin_session")?.value;

  const isLocalhost = hostname.includes("localhost");
  const isAdminSubdomain =
    hostname.startsWith("admin.") ||
    (isLocalhost && hostname.startsWith("admin.localhost"));

  // 1. ADMIN DOMAIN (e.g. admin.nivi.in)
  if (isAdminSubdomain) {
    if (pathname === "/") {
      const target = sessionCookie ? "/admin" : "/admin/login";
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname === "/admin/login" && sessionCookie) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 2. STOREFRONT DOMAIN (nivi.in / www.nivi.in)
  const isCustomDomainStorefront = hostname === "nivi.in" || hostname === "www.nivi.in";
  if (isCustomDomainStorefront && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(`https://admin.nivi.in${pathname}`, request.url));
  }

  // 3. Fallback for localhost / preview deployments
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/admin/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}
```

---

### Step 3: Local Testing with Subdomains
To test `admin.localhost:3000` on your development machine:
1. Open your Windows hosts file (`C:\Windows\System32\drivers\etc\hosts`) as Administrator.
2. Add the following line:
   ```text
   127.0.0.1 admin.localhost
   ```
3. Run `npm run dev` or `pnpm dev`.
4. Visit `http://admin.localhost:3000` to test the admin panel, and `http://localhost:3000` for the storefront.

---

## Part 2: Future Full Monorepo Migration (Turborepo + pnpm)

If the business grows and you want **physically separate deployments** (e.g., different CI/CD pipelines, strict code isolation where admin source code is never packaged into the storefront deploy), follow this monorepo migration plan.

### Target Architecture

```
nivi/
├── apps/
│   ├── web/                     # Public Storefront Next.js App (nivi.in)
│   │   ├── app/                 # Storefront pages (catalog, product detail, cart, checkout)
│   │   ├── components/store/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── admin/                   # Admin Console Next.js App (admin.nivi.in)
│       ├── app/                 # Admin console (dashboard, inventory, orders, offers)
│       ├── components/admin/
│       ├── package.json
│       └── next.config.ts
│
├── packages/
│   ├── core/                    # Domain entities, value objects, ports, use cases (Pure TS)
│   │   ├── src/                 # Sku, Money, Product, Offer, Use Cases
│   │   └── package.json         # @nivi/core
│   │
│   ├── infrastructure/          # Zoho Books, Razorpay, Resend, R2, Auth providers
│   │   ├── src/                 # ZohoHttpClient, ZohoProductRepository, etc.
│   │   └── package.json         # @nivi/infrastructure
│   │
│   └── ui/                      # Shared shadcn/ui components, emerald & gold theme tokens
│       ├── src/                 # button, dialog, dropdown, input, etc.
│       └── package.json         # @nivi/ui
│
├── turbo.json                   # Turborepo task pipeline
├── pnpm-workspace.yaml          # pnpm workspace config
└── package.json                 # Root dependencies & orchestrator scripts
```

---

### Step-by-Step Monorepo Migration Process

#### 1. Setup Workspace Files
Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

#### 2. Move Packages (Zero Logic Changes)
Thanks to Clean Architecture:
- `core/` ➔ `packages/core` (`@nivi/core`): Pure TypeScript, zero Next.js dependencies.
- `infrastructure/` ➔ `packages/infrastructure` (`@nivi/infrastructure`): Implements ports for Zoho, Razorpay, R2, and Resend.
- `components/ui/` ➔ `packages/ui` (`@nivi/ui`): Reusable shadcn/ui primitives.

#### 3. Separate the Apps
- **`apps/web`**: Contains customer storefront pages (`/`, `/products/[slug]`, `/checkout`, `/order/success`), uses `@nivi/core` and `@nivi/ui`.
- **`apps/admin`**: Contains admin dashboard (`/`, `/orders`, `/inventory`, `/offers`, `/reviews`), uses `@nivi/core`, `@nivi/infrastructure`, and `@nivi/ui`.

#### 4. Vercel Hosting Configuration for Monorepo
In Vercel:
1. Create **Project 1** for Storefront:
   - Root Directory: `apps/web`
   - Domain: `nivi.in`
2. Create **Project 2** for Admin Console:
   - Root Directory: `apps/admin`
   - Domain: `admin.nivi.in` (free subdomain)
   - Environment Variables: Add admin secret keys (`ADMIN_PASSWORD_HASH`, `AUTH_SECRET`, etc.) only to this project.
