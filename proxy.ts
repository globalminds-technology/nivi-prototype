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
  // 1. ADMIN DOMAIN TRAFFIC (e.g., admin.brandnivi.com or admin.localhost:3000)
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
  // 2. PUBLIC STOREFRONT DOMAIN TRAFFIC (brandnivi.com, www.brandnivi.com, etc.)
  // ---------------------------------------------------------------------------
  // Strict isolation: The admin portal MUST NOT be accessible from the public website.
  // Anyone requesting /admin on the public storefront receives a 404 Not Found.
  if (pathname.startsWith("/admin")) {
    // Allow local development on localhost:3000/admin for developer convenience
    if (isLocalhost) {
      if (!pathname.startsWith("/admin/login") && !sessionCookie) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (pathname === "/admin/login" && sessionCookie) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // In production, block all /admin access on the public domain completely (404 Not Found)
    return new NextResponse(null, { status: 404 });
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

