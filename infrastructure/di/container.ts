import "server-only";
import type { CacheInvalidator } from "@/core/application/ports/cache-invalidator";
import type { Clock } from "@/core/application/ports/clock";
import type { ImageStorage } from "@/core/application/ports/image-storage";
import type { Mailer } from "@/core/application/ports/mailer";
import type { PaymentGateway } from "@/core/application/ports/payment-gateway";
import type { ProductRepository } from "@/core/application/ports/product-repository";
import type { SalesRepository } from "@/core/application/ports/sales-repository";
import type { TokenSigner } from "@/core/application/ports/token-signer";
import { CreateUploadUrl } from "@/core/application/use-cases/media/create-upload-url";
import { CreateProduct } from "@/core/application/use-cases/products/create-product";
import { GetProduct } from "@/core/application/use-cases/products/get-product";
import { GetProductById } from "@/core/application/use-cases/products/get-product-by-id";
import { ListOffers } from "@/core/application/use-cases/products/list-offers";
import { ListProducts } from "@/core/application/use-cases/products/list-products";
import { ListByTag } from "@/core/application/use-cases/products/list-by-tag";
import { UpdateProduct } from "@/core/application/use-cases/products/update-product";
import { ExpireOffers } from "@/core/application/use-cases/offers/expire-offers";
import { RefreshCatalog } from "@/core/application/use-cases/sync/refresh-catalog";
import { QuoteCart } from "@/core/application/use-cases/checkout/quote-cart";
import { CreatePaymentOrder } from "@/core/application/use-cases/checkout/create-payment-order";
import { ConfirmPayment } from "@/core/application/use-cases/checkout/confirm-payment";
import { NextCacheInvalidator } from "@/infrastructure/cache/next-cache-invalidator";
import { R2ImageStorage } from "@/infrastructure/r2/r2-image-storage";
import { SystemClock } from "@/infrastructure/system/system-clock";
import { ZohoHttpClient } from "@/infrastructure/zoho/zoho-http";
import { CachedProductRepository } from "@/infrastructure/cache/cached-product.repository";
import { ZohoProductRepository } from "@/infrastructure/zoho/zoho-product.repository";
import { ZohoSalesRepository } from "@/infrastructure/zoho/zoho-sales.repository";
import { ZohoTokenProvider } from "@/infrastructure/zoho/zoho-token-provider";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";
import { CampaignEnrichedProductRepository } from "@/infrastructure/offers/offer-enricher";
import { RazorpayPaymentGateway } from "@/infrastructure/payments/razorpay-payment-gateway";
import { ResendMailer } from "@/infrastructure/email/resend-mailer";
import { SmtpMailer } from "@/infrastructure/email/smtp-mailer";
import { JoseTokenSigner } from "@/infrastructure/security/jose-token-signer";
import { AdminAuthService } from "@/infrastructure/auth/admin-auth.service";
import { env } from "@/infrastructure/config/env";

/**
 * Composition root — wires adapters (infrastructure) to ports (application).
 * Presentation and API routes import use-cases from here.
 *
 * Each dependency is created lazily on first access, so a route only
 * validates the env vars of the adapters it actually touches.
 */
function lazy<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => (instance ??= factory());
}

import type { ReviewRepository } from "@/core/application/ports/review-repository";
import { SubmitReview } from "@/core/application/use-cases/reviews/submit-review";
import { ListReviews } from "@/core/application/use-cases/reviews/list-reviews";
import { IssueReviewLink } from "@/core/application/use-cases/reviews/issue-review-link";
import { ZohoReviewRepository } from "@/infrastructure/reviews/zoho-review.repository";

import { ZohoShippingRepository } from "@/infrastructure/shipping/zoho-shipping.repository";
import type { ShippingRepository } from "@/core/application/ports/shipping-repository";

// Low-level services
const clock = lazy<Clock>(() => new SystemClock());
const cacheInvalidator = lazy<CacheInvalidator>(() => new NextCacheInvalidator());

// R2 Infrastructure
const imageStorage = lazy<ImageStorage>(() => new R2ImageStorage());

// Zoho Infrastructure
const zohoTokenProvider = lazy(() => new ZohoTokenProvider());
const zohoHttp = lazy(() => new ZohoHttpClient(zohoTokenProvider()));
const rawProductRepository = lazy<ProductRepository>(() => new ZohoProductRepository(zohoHttp()));
const cachedProductRepository = lazy<ProductRepository>(() => new CachedProductRepository(rawProductRepository()));
const productRepository = lazy<ProductRepository>(
  () => new CampaignEnrichedProductRepository(cachedProductRepository(), offerCampaignRepository),
);
const salesRepository = lazy<SalesRepository>(() => new ZohoSalesRepository(zohoHttp()));
const reviewRepository = lazy<ReviewRepository>(() => new ZohoReviewRepository(zohoHttp()));
const shippingRepository = lazy<ShippingRepository>(() => new ZohoShippingRepository(zohoHttp()));

// Payment & Notification Infrastructure
const paymentGateway = lazy<PaymentGateway>(() => new RazorpayPaymentGateway());
const mailer = lazy<Mailer>(() => {
  const config = env();
  if (config.MAIL_SERVER || config.MAIL_USERNAME) {
    return new SmtpMailer();
  }
  return new ResendMailer();
});
const tokenSigner = lazy<TokenSigner>(() => new JoseTokenSigner());

// Use Cases — Products & Catalog
const createUploadUrl = lazy(() => new CreateUploadUrl(imageStorage()));
const listProducts = lazy(() => new ListProducts(productRepository()));
const getProduct = lazy(() => new GetProduct(productRepository()));
const getProductById = lazy(() => new GetProductById(productRepository()));
const listByTag = lazy(() => new ListByTag(productRepository()));
const listOffers = lazy(() => new ListOffers(productRepository(), clock()));
const createProduct = lazy(() => new CreateProduct(productRepository(), cacheInvalidator()));
const updateProduct = lazy(() => new UpdateProduct(productRepository(), cacheInvalidator()));
const expireOffers = lazy(() => new ExpireOffers(productRepository(), clock(), cacheInvalidator()));
const refreshCatalog = lazy(() => {
  (rawProductRepository() as any).clearMemoryCache?.();
  return new RefreshCatalog(rawProductRepository(), cacheInvalidator());
});
const listAdminProducts = lazy(() => new ListProducts(cachedProductRepository()));
const getAdminProductById = lazy(() => new GetProductById(cachedProductRepository()));

// Use Cases — Checkout & Orders
const quoteCart = lazy(() => new QuoteCart(productRepository(), clock(), { taxInclusive: true }, shippingRepository()));
const createPaymentOrder = lazy(() => new CreatePaymentOrder(quoteCart(), paymentGateway()));
const confirmPayment = lazy(
  () =>
    new ConfirmPayment(
      paymentGateway(),
      salesRepository(),
      mailer(),
      tokenSigner(),
      cacheInvalidator(),
    ),
);

// Use Cases — Reviews
const submitReview = lazy(
  () =>
    new SubmitReview(
      tokenSigner(),
      reviewRepository(),
      salesRepository(),
      cacheInvalidator(),
    ),
);
const listReviews = lazy(() => new ListReviews(reviewRepository()));
const issueReviewLink = lazy(() => new IssueReviewLink(tokenSigner()));

export const container = {
  // Ports / Repositories
  clock,
  cacheInvalidator,
  imageStorage,
  productRepository,
  salesRepository,
  reviewRepository,
  shippingRepository,
  paymentGateway,
  mailer,
  tokenSigner,

  // Shipping
  getShippingOptions: () => shippingRepository().getShippingOptions(),
  getShippingOptionByType: (type: "standard" | "express") => shippingRepository().getOptionByType(type),
  updateShippingRates: (rates: { standardRate?: number; expressRate?: number }) =>
    shippingRepository().updateRates(rates),

  // Use-cases
  createUploadUrl,
  listProducts,
  getProduct,
  getProductById,
  listByTag,
  listOffers,
  createProduct,
  updateProduct,
  listAdminProducts,
  getAdminProductById,
  expireOffers,
  refreshCatalog,
  quoteCart,
  createPaymentOrder,
  confirmPayment,
  submitReview,
  listReviews,
  issueReviewLink,

  // Admin & System
  adminAuth: AdminAuthService,
  getZohoOrgId: () => env().ZOHO_ORG_ID,
  getCronSecret: () => env().CRON_SECRET,
  getRazorpayKeyId: () => env().RAZORPAY_KEY_ID,
  getRazorpayWebhookSecret: () => env().RAZORPAY_WEBHOOK_SECRET,
  getZohoItemImage: (itemId: string) => productRepository().getItemImage?.(itemId) ?? Promise.resolve(null),
  uploadProductImage: async (itemId: string, imageBlob: Blob | Uint8Array, filename: string) => {
    if (!productRepository().uploadPrimaryImage) throw new Error("Image upload not supported");
    const url = await productRepository().uploadPrimaryImage!(itemId, imageBlob, filename);
    await cacheInvalidator().revalidateTag("products");
    return url;
  },
  deleteProductImage: async (itemId: string) => {
    if (productRepository().deletePrimaryImage) {
      await productRepository().deletePrimaryImage!(itemId);
      await cacheInvalidator().revalidateTag("products");
    }
  },
  createCategoryUploadUrl: async (slug: string, contentType: "image/jpeg" | "image/png" | "image/webp") => {
    const storage = imageStorage();
    if (!storage.createCategoryUploadUrl) {
      throw new Error("Category upload not supported by image storage provider");
    }
    return storage.createCategoryUploadUrl(slug, contentType);
  },
  uploadCategoryCover: async (slug: string, buffer: Uint8Array, contentType: "image/jpeg" | "image/png" | "image/webp") => {
    const storage = imageStorage() as R2ImageStorage;
    return storage.uploadCategoryDirect(slug, buffer, contentType);
  },
  uploadProductGallery: async (sku: string, index: number, buffer: Uint8Array, contentType: "image/jpeg" | "image/png" | "image/webp") => {
    const storage = imageStorage() as R2ImageStorage;
    return storage.uploadGalleryDirect(sku as any, index, buffer, contentType);
  },
  uploadCampaignBanner: async (campaignId: string, buffer: Uint8Array, contentType: "image/jpeg" | "image/png" | "image/webp") => {
    const storage = imageStorage() as R2ImageStorage;
    return storage.uploadBannerDirect(campaignId, buffer, contentType);
  },
  getVendors: async () => {
    return productRepository().getVendors?.() || [];
  },
  getZohoHttp: () => zohoHttp(),
} as const;


