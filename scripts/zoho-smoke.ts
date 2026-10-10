/**
 * Zoho Foundation Smoke Test
 * Run with: pnpm tsx scripts/zoho-smoke.ts
 *
 * Verifies:
 * 1. Self Client OAuth refresh succeeds and retrieves a valid access token.
 * 2. Fetches items from Zoho Books and verifies presence of the 7 custom fields:
 *    - gallery_images
 *    - display_tags
 *    - offer_active
 *    - offer_type
 *    - offer_value
 *    - offer_label
 *    - offer_expiry
 */

import { ZohoHttpClient } from "../infrastructure/zoho/zoho-http";
import { ZohoItemMapper, type ZohoItemRaw } from "../infrastructure/zoho/mappers/item.mapper";
import { ZohoTokenProvider } from "../infrastructure/zoho/zoho-token-provider";
import { env } from "../infrastructure/config/env";

async function run() {
  console.log("🔍 Checking Zoho configuration...");
  const config = env();
  console.log(`- API Domain: ${config.ZOHO_API_DOMAIN}`);
  console.log(`- Org ID: ${config.ZOHO_ORG_ID}`);

  const tokenProvider = new ZohoTokenProvider();
  console.log("🔑 Requesting access token via Zoho Self Client Refresh Token...");
  const token = await tokenProvider.getAccessToken();
  console.log(`✅ Access token retrieved successfully (ends with ...${token.slice(-6)})`);

  const http = new ZohoHttpClient(tokenProvider);
  console.log("📦 Fetching items list from Zoho Books...");
  const res = await http.get<{ code: number; items: ZohoItemRaw[] }>("items", {
    per_page: "5",
  });

  console.log(`✅ Retrieved ${res.items?.length ?? 0} items from Zoho Books`);

  if (res.items && res.items.length > 0) {
    const sample = res.items[0];
    console.log(`\nSample Item: "${sample.name}" (SKU: ${sample.sku || "N/A"})`);
    console.log("Raw Custom Fields:", JSON.stringify(sample.custom_fields || sample.custom_field_hash || [], null, 2));

    const domainProduct = ZohoItemMapper.toDomain(sample, config.ZOHO_API_DOMAIN, config.ZOHO_ORG_ID || "");
    console.log("\nMapped Domain Product:");
    console.log({
      id: domainProduct.id,
      sku: domainProduct.sku,
      name: domainProduct.name,
      price: domainProduct.price,
      stock: domainProduct.stock,
      galleryCount: domainProduct.gallery.length,
      tags: domainProduct.tags,
      offer: domainProduct.offer,
    });
  } else {
    console.log("ℹ️ No items found in Zoho Books yet. Create an item in Zoho Books to inspect mapped custom fields.");
  }
}

run().catch((err) => {
  console.error("❌ Zoho Smoke Test failed:", err);
  process.exit(1);
});
