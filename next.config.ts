import type { NextConfig } from "next";

/**
 * R2 public bucket host (gallery images). Derived from R2_BUCKET_URL so the
 * image allow-list follows whatever custom domain / r2.dev URL is configured.
 */
const r2Host = (() => {
  try {
    return process.env.R2_BUCKET_URL
      ? new URL(process.env.R2_BUCKET_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Enables 'use cache' + cacheTag/cacheLife — our cache layer in place of a DB.
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/images/**",
        search: "?*",
      },
      {
        pathname: "/**",
        search: "?*",
      },
    ],
    remotePatterns: [
      ...(r2Host ? [{ protocol: "https" as const, hostname: r2Host }] : []),
      // Zoho-hosted primary item images
      { protocol: "https", hostname: "**.zoho.in" },
      { protocol: "https", hostname: "**.zohoapis.in" },
    ],
  },
};

export default nextConfig;
