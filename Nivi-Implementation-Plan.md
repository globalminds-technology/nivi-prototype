# Nivi — Implementation Plan

Next.js e-commerce platform on Zoho Books (single source of truth) + Cloudflare R2 (product images only). No separate database. Deployed on Vercel. Development via Antigravity IDE.

## UI Stack Constraint

- **shadcn/ui only, across the entire application** — no other component/UI library (no MUI, Chakra, Ant Design, etc.). All admin panel and storefront components should be built on shadcn/ui primitives + Tailwind.

## Architecture Summary

- **Zoho Books** — products, stock, pricing, tags, offers (via custom fields), sales orders, invoices, payments. The system of record.
- **Cloudflare R2** — product gallery images only (primary image stays in Zoho's native item image field).
- **Next.js (Vercel)** — frontend, API routes as backend, built-in cache/ISR in place of a database for product data.
- **No dedicated database** anywhere in the core flow — reviews, admin auth, and caching are all handled without one (see relevant phases).

## Zoho Books Custom Fields (Items module)

| Field | Type | Purpose |
|---|---|---|
| `gallery_images` | Multi-line text | Up to 11 Cloudflare R2 URLs (primary image stays in Zoho's native item image) |
| `display_tags` | Dropdown / Multi-select | Featured, New Arrivals, etc. — multiple tags per product |
| `offer_active` | Checkbox | Whether an offer is currently live |
| `offer_type` | Dropdown | percent / flat |
| `offer_value` | Decimal | Discount amount or percentage |
| `offer_label` | Single-line text | Display label, e.g. "Diwali Offer" |
| `offer_expiry` | Date | Checked by a daily cron; auto-deactivates `offer_active` when passed |

## .env Credentials

| Variable | Purpose |
|---|---|
| `ZOHO_CLIENT_ID` | OAuth Self Client ID |
| `ZOHO_CLIENT_SECRET` | OAuth Self Client Secret |
| `ZOHO_REFRESH_TOKEN` | Long-lived token used to generate access tokens at runtime |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.in` — base URL for all Zoho Books API calls |
| `ZOHO_ACCOUNTS_URL` | `https://accounts.zoho.in` — used only for refreshing the access token |
| `ZOHO_ORG_ID` | Organization ID; required on every Zoho Books API request |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token secret |
| `R2_BUCKET_URL` | Public URL/custom domain used to build gallery image links |
| `RAZORPAY_KEY_ID` | Razorpay checkout (Test, then Live before launch) |
| `RAZORPAY_KEY_SECRET` | Razorpay checkout (Test, then Live before launch) |
| `RESEND_API_KEY` | Sends Nivi-branded order confirmation email with invoice PDF attached |
| `CRON_SECRET` | Protects scheduled endpoints (offer-expiry, cache revalidation) from public calls |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Credentials for the single/small admin login (NextAuth Credentials provider) |
| `NEXTAUTH_SECRET` | Signs admin session tokens |
| `REVIEW_LINK_SECRET` | Signs the one-time review-form links sent after payment |
| `GOOGLE_SHEETS_CLIENT_EMAIL` / `GOOGLE_SHEETS_PRIVATE_KEY` / `GOOGLE_SHEET_ID` | Only if Review Option C (Google Sheets) is chosen at build time |

## Phase 1 — Zoho Foundation (done)

- Self Client OAuth set up; Client ID, Secret, Refresh Token, Org ID, API Domain obtained.
- Create the 7 custom fields on the Items module (see table above).
- Verify: fetch a manually created test item via API and confirm all custom fields return correctly.

## Phase 2 — Image Pipeline

- Create Cloudflare R2 bucket; generate a scoped API token (Object Read & Write).
- Build a signed-upload API route in Next.js so the admin panel uploads directly to R2.
- Naming convention: `SKU/01.jpg` ... `SKU/12.jpg` (01 = primary, stored natively in Zoho's item image; 02–12 = R2, URLs saved into `gallery_images`).
- Verify: upload a test image, confirm the public URL loads and fits the `gallery_images` field.

## Phase 3 — Admin Authentication

- NextAuth with a Credentials provider; admin email/password-hash stored in `.env` (no user table needed for a handful of admins).
- Session issued as a signed JWT — no database required.
- "Go to Zoho Books" button on the admin dashboard, deep-linking to books.zoho.in (true SSO isn't exposed by Zoho's API — this relies on the admin's existing Zoho browser session, one normal login otherwise).

## Phase 4 — Product Admin (CRUD)

- Add/Edit Product form (shadcn/ui components): name, price, stock, tax, primary image, gallery images, `display_tags`, offer fields.
- On save: images upload to R2 first, then `createItem()`/`updateItem()` writes everything to Zoho Books.
- Verify: create a product from Nivi admin, confirm it appears correctly in Zoho Books UI with every field populated.

## Phase 5 — Cache & Sync Layer (no separate DB)

- Use Next.js's built-in data cache / ISR (revalidate tags) as the cache layer — not a database, just Next.js serving cached product data with a TTL.
- On Free/Professional plan (no Incoming Webhooks): a Vercel Cron hits a `/api/revalidate` route every 2–5 minutes, pulling items from Zoho and calling `revalidateTag('products')`.
- If upgraded to Premium later: Zoho's Incoming Webhook calls the same `/api/revalidate` route directly on item change — no other code changes needed.
- Verify: change stock/price in Zoho UI, confirm the website reflects it within the expected delay.

## Phase 6 — Public Storefront

- Home page: full product grid from cached data, built with shadcn/ui components.
- Featured / New Arrivals sections: filtered by `display_tags`.
- Offers tab: filtered by `offer_active`; product cards show strikethrough pricing when active.
- Wishlist: frontend-only (localStorage) for now — cross-device wishlist is a client-requested scope addition, pending their reply (see Phase 10).
- Verify: toggle `offer_active` in Zoho, confirm the Offers tab and pricing update after the next cache refresh.

## Phase 7 — Checkout & Orders (Razorpay, embedded)

- Cart managed in frontend state; checkout form collects name, email, phone, shipping address, billing address, optional GSTIN.
- Razorpay checkout opens inline on Nivi's own domain (not a redirect to Zoho) — customer never leaves the site.
- On payment success: find-or-create the Zoho Contact, create the Invoice with the server-calculated discount (never trust a price sent from the frontend), record the Payment using the Razorpay payment ID as reference.
- Fetch the invoice as a PDF from Zoho's API and email it via Resend (or similar) in a Nivi-branded confirmation — keeps the whole experience on-brand rather than a Zoho-branded email.
- International (GCC, future) orders: handled manually — WhatsApp contact button instead of checkout; admin can optionally use Zoho's own "Online Payments" Pay Now link for that invoice.
- Verify: place a test order with and without an active offer; confirm invoice shows correct rate/discount/total, stock reduces, payment is recorded.

## Phase 8 — Reviews (no separate DB)

- No customer login — a signed, time-limited link (JWT containing `invoiceId` + SKU) is emailed/WhatsApped after payment.
- Customer opens the link, submits a plain review form (shadcn/ui) — no account needed.
- Backend verifies the link's signature (proves it's genuine) before accepting the review, and cross-checks the invoice/SKU via the Zoho API.
- Storage: pick one of the three options below at implementation time.
- Verify: complete a test purchase, follow the review link, submit, confirm it appears on the product page.

### Review Storage — Three Options (decide at implementation time)

| Option | How it works | Trade-off | Best when |
|---|---|---|---|
| **A. Item-level custom field** | JSON array of reviews stored in one multi-line field on the Item | Simple, but character limit (~15–20 reviews/product) and a race condition if two reviews are submitted at the same moment | Launch-fast, low review volume expected |
| **B. Invoice-level custom field** | Rating/comment stored directly on that invoice's custom field | No race condition, but only works cleanly if each invoice = one product; harder to query "all reviews for this SKU" | Carts are typically single-product |
| **C. Google Sheets (API)** | One row per review, appended via Sheets API; read back filtered by SKU | No size limit, safe concurrent writes, free, easy manual moderation in the sheet itself — slight extra setup (service account) | Expect meaningful review volume; want it scalable from day one |

## Phase 9 — Offer Expiry Automation

- Vercel Cron, daily: find items with `offer_active = true` and `offer_expiry < today`, flip to false via `updateItem()`.
- Verify: set a test offer with a past expiry date, run the job, confirm it deactivates and price reverts on the site.

## Phase 10 — Client-Requested Scope (pending clarification)

- Wishlist (cross-device), coupons, and area-based shipping pricing were flagged to the client as needing a separate database — awaiting their reply (shipping granularity, and what "future compatibility" refers to).
- Worth revisiting once reviews proved solvable without a DB: coupons and shipping-zone rates could potentially use the same Google Sheets (or Zoho CRM custom module) approach as Review Option C, avoiding a database here too — to be decided once the client responds.
- Not to be built until the client's reply is in — this phase is a placeholder, not a commitment.

## Phase 11 — Multi-Region Readiness (future, not built now)

- Keep `ZOHO_ORG_ID` and related config out of hardcoded values so a second Zoho organization (for GCC, its own VAT setup) can be added later without a rewrite.
- Zoho Books is single-base-currency per organization; a second region means a second org, not a currency toggle.

## Known Plan Limitation

Zoho Books Professional (recommended production plan, ₹1,499/mo) does not include Incoming Webhooks — only Premium (₹2,999/mo) does. Handled via cron-based polling (Phase 5); can switch to webhooks later with no architecture change.
