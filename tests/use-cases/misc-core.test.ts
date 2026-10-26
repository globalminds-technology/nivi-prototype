import { describe, expect, it } from "vitest";
import { CreateUploadUrl } from "../../core/application/use-cases/media/create-upload-url";
import { ListByTag } from "../../core/application/use-cases/products/list-by-tag";
import { ListProducts } from "../../core/application/use-cases/products/list-products";
import { IssueReviewLink } from "../../core/application/use-cases/reviews/issue-review-link";
import { RefreshCatalog } from "../../core/application/use-cases/sync/refresh-catalog";
import { normalizeIndianMobile } from "../../core/domain/entities/customer";
import { isPurchasable, productImages, productSlug } from "../../core/domain/entities/product";
import { ValidationError } from "../../core/domain/errors/domain-errors";
import { createGallery, galleryImageKey, isImageContentType, type ImageContentType } from "../../core/domain/value-objects/gallery";
import { hasTag, normalizeTags } from "../../core/domain/value-objects/display-tag";
import { toSku, type Sku } from "../../core/domain/value-objects/sku";
import type { ImageStorage } from "../../core/application/ports/image-storage";
import { matchRecommendation } from "../../core/application/use-cases/quiz/match-recommendation";
import { FakeCacheInvalidator, FakeTokenSigner, InMemoryProductRepository } from "../fakes/in-memory-repositories";

describe("Domain & Miscellaneous Use Cases", () => {
  it("validates and formats gallery URLs and image keys", () => {
    expect(isImageContentType("image/jpeg")).toBe(true);
    expect(isImageContentType("image/gif")).toBe(false);

    const gallery = createGallery(["https://cdn.example.com/02.jpg", "https://cdn.example.com/03.jpg"]);
    expect(gallery.length).toBe(2);

    expect(() => createGallery(["http://insecure.com/02.jpg"])).toThrow(ValidationError);

    const sku = toSku("SKU-100");
    const key = galleryImageKey(sku, 2, "image/jpeg");
    expect(key).toBe("SKU-100/02.jpg");

    expect(() => galleryImageKey(sku, 1, "image/jpeg")).toThrow(ValidationError); // Index 1 is reserved for Zoho native
    expect(() => galleryImageKey(sku, 15, "image/jpeg")).toThrow(ValidationError);
  });

  it("handles customer Indian mobile normalization", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("09876543210")).toBe("9876543210");
    expect(normalizeIndianMobile("9876543210")).toBe("9876543210");
    expect(normalizeIndianMobile("12345")).toBeNull();
  });

  it("creates upload URLs with valid inputs and enforces validation", async () => {
    const calledWith: { sku?: Sku; index?: number; contentType?: ImageContentType } = {};
    const fakeStorage: ImageStorage = {
      async createUploadUrl(sku: Sku, index: number, contentType: ImageContentType) {
        calledWith.sku = sku;
        calledWith.index = index;
        calledWith.contentType = contentType;
        return { uploadUrl: "https://upload.url", publicUrl: "https://pub.url", key: "k" };
      },
    };

    const useCase = new CreateUploadUrl(fakeStorage);

    const res = await useCase.execute({
      sku: "TEST-SKU",
      index: 3,
      contentType: "image/png",
    });

    expect(res.uploadUrl).toBe("https://upload.url");
    expect(calledWith.index).toBe(3);

    await expect(useCase.execute({ sku: "TEST-SKU", index: 1, contentType: "image/png" })).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ sku: "TEST-SKU", index: 3, contentType: "image/bmp" })).rejects.toThrow(ValidationError);
  });

  it("lists products, filters by tag and refreshes catalog", async () => {
    const productRepo = new InMemoryProductRepository();
    const cacheInvalidator = new FakeCacheInvalidator();

    await productRepo.create({
      id: "1",
      sku: toSku("TAG-1"),
      name: "Featured Item",
      description: "",
      price: { minor: 1000, currency: "INR" },
      stock: 5,
      taxId: null,
      taxPercentage: 0,
      primaryImageUrl: "https://cdn.example.com/01.jpg",
      gallery: ["https://cdn.example.com/02.jpg"],
      tags: ["Featured"],
      offer: null,
      status: "active",
    });

    const listProducts = new ListProducts(productRepo);
    const listByTag = new ListByTag(productRepo);
    const refreshCatalog = new RefreshCatalog(productRepo, cacheInvalidator);

    const all = await listProducts.execute();
    expect(all.length).toBe(1);

    const tagged = await listByTag.execute("Featured");
    expect(tagged.length).toBe(1);

    const empty = await listByTag.execute("New Arrivals");
    expect(empty.length).toBe(0);

    const refresh = await refreshCatalog.execute();
    expect(refresh.count).toBe(1);
    expect(cacheInvalidator.invalidatedTags).toContain("products");

    // Product helper functions
    const prod = all[0];
    expect(isPurchasable(prod, 2)).toBe(true);
    expect(isPurchasable(prod, 10)).toBe(false);
    expect(productImages(prod).length).toBe(2);
    expect(productSlug(prod)).toBe("featured-item-tag-1");

    // Tag helpers
    expect(hasTag(prod.tags, "featured")).toBe(true);
    expect(normalizeTags(["tag1 ", "TAG1", "Tag2"])).toEqual(["tag1", "Tag2"]);
  });

  it("issues review link with expiry in days", async () => {
    const tokenSigner = new FakeTokenSigner();
    const issueReviewLink = new IssueReviewLink(tokenSigner);

    const token = await issueReviewLink.execute("inv_123", "SKU_456", 14);
    expect(typeof token).toBe("string");
  });

  it("scores and cycles through multiple matching recommendations without re-filling the form", () => {
    const answers = {
      occasion: "Wedding or grand occasion" as const,
      comfort: "Rich texture and luxurious feel" as const,
      style: "Rich and royal" as const,
      border: "Grand zari border" as const,
      colourPalette: "Rich and vibrant — red, green, royal blue" as const,
    };

    const match1 = matchRecommendation(answers, 0);
    expect(match1.recommendation).toBeDefined();
    expect(match1.matchIndex).toBe(0);
    expect(match1.totalMatches).toBeGreaterThan(1);

    const match2 = matchRecommendation(answers, 1);
    expect(match2.recommendation).toBeDefined();
    expect(match2.matchIndex).toBe(1);
    expect(match2.totalMatches).toBe(match1.totalMatches);
    // Verified that match 2 is an alternative matching profile
    expect(match2.recommendation.id).not.toBe(match1.recommendation.id);
  });
});

