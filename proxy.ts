import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const sessionCookie = request.cookies.get("admin_session")?.value;

  const isLocalhost = hostname.includes("localhost");
  const isAdminSubdomain =
    hostname.startsWith("admin.") ||
    (isLocalhost && hostname.startsWith("admin.localhost"));

  // ---------------------------------------------------------------------------
  // 1. ADMIN DOMAIN TRAFFIC (e.g., admin.nivi.in or admin.localhost:3000)
  // ---------------------------------------------------------------------------
  if (isAdminSubdomain) {
    // If accessing root of admin subdomain, redirect directly to /admin
    if (pathname === "/") {
      const target = sessionCookie ? "/admin" : "/admin/login";
      return NextResponse.redirect(new URL(target, request.url));
    }

    // Protect /admin routes (except /admin/login)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      if (!sessionCookie) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // If logged in and visiting login, forward to /admin
    if (pathname === "/admin/login" && sessionCookie) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // 2. STOREFRONT DOMAIN TRAFFIC (e.g., nivi.in or www.nivi.in)
  // ---------------------------------------------------------------------------
  const isCustomDomainStorefront =
    hostname === "nivi.in" || hostname === "www.nivi.in";

  // In production storefront, redirect any /admin attempt to the dedicated admin subdomain
  if (isCustomDomainStorefront && pathname.startsWith("/admin")) {
    return NextResponse.redirect(
      new URL(`https://admin.nivi.in${pathname}`, request.url)
    );
  }

  // Fallback for preview deployments / localhost without custom subdomain:
  // Still protect /admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/admin/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

