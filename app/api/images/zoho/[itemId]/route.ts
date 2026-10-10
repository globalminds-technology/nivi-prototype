import { NextRequest } from "next/server";
import { container } from "@/infrastructure/di/container";

// Regal NiVi Brand Placeholder SVG
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05221b"/>
      <stop offset="50%" stop-color="#0a3d31"/>
      <stop offset="100%" stop-color="#041a14"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2cf9d"/>
      <stop offset="50%" stop-color="#c5a059"/>
      <stop offset="100%" stop-color="#9a7837"/>
    </linearGradient>
    <pattern id="motif" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#c5a059" stroke-width="0.75" stroke-opacity="0.12"/>
      <circle cx="20" cy="20" r="1.5" fill="#c5a059" fill-opacity="0.2"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="600" height="750" fill="url(#bg)"/>
  <rect width="600" height="750" fill="url(#motif)"/>

  <!-- Ornate Border -->
  <rect x="24" y="24" width="552" height="702" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-opacity="0.4"/>
  <rect x="32" y="32" width="536" height="686" fill="none" stroke="url(#gold)" stroke-width="0.75" stroke-opacity="0.25"/>

  <!-- Center Halo & Icon -->
  <g transform="translate(300, 340)">
    <!-- Outer radiating ring -->
    <circle cx="0" cy="0" r="90" fill="none" stroke="url(#gold)" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4"/>
    <circle cx="0" cy="0" r="76" fill="#05221b" stroke="url(#gold)" stroke-width="2" stroke-opacity="0.8"/>
    
    <!-- Stylized Lotus / Saree Pallu Motif -->
    <path d="M0 -42 C18 -20 28 5 0 38 C-28 5 -18 -20 0 -42 Z" fill="url(#gold)" fill-opacity="0.25" stroke="url(#gold)" stroke-width="1.5"/>
    <path d="M0 -34 C12 -16 20 4 0 30 C-20 4 -12 -16 0 -34 Z" fill="url(#gold)" fill-opacity="0.6"/>
    <circle cx="0" cy="4" r="5" fill="#ffffff" fill-opacity="0.9"/>
  </g>

  <!-- Brand Typography -->
  <text x="300" y="475" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', 'Times New Roman', serif" font-size="34" letter-spacing="14" fill="url(#gold)" font-weight="600">N I V I</text>
  <text x="300" y="505" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" letter-spacing="4" fill="#e2cf9d" fill-opacity="0.7" text-transform="uppercase">HERITAGE SILK &amp; FESTIVE ELEGANCE</text>

  <!-- Status subtitle -->
  <rect x="220" y="540" width="160" height="24" rx="12" fill="#041a14" stroke="url(#gold)" stroke-width="0.75" stroke-opacity="0.3"/>
  <text x="300" y="556" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" letter-spacing="1.5" fill="#c5a059" fill-opacity="0.8">IMAGE PREVIEW</text>
</svg>`;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await context.params;

  if (!itemId || !itemId.trim()) {
    return new Response(FALLBACK_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml;charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const image = await container.getZohoItemImage(itemId.trim());

    if (!image || !image.data || image.data.byteLength === 0) {
      return new Response(FALLBACK_SVG, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml;charset=utf-8",
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    // Stream binary image with high-performance caching headers
    return new Response(Buffer.from(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.contentType || "image/jpeg",
        "Content-Length": image.data.byteLength.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error(`[Zoho Image Proxy] Failed to fetch image for item ${itemId}:`, error);

    return new Response(FALLBACK_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml;charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}
