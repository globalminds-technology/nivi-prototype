import { beforeEach, describe, expect, it } from "vitest";
import { CreateProduct } from "../../core/application/use-cases/products/create-product";
import { GetProduct } from "../../core/application/use-cases/products/get-product";
import { ListOffers } from "../../core/application/use-cases/products/list-offers";
import { UpdateProduct } from "../../core/application/use-cases/products/update-product";
import { ConflictError, NotFoundError } from "../../core/domain/errors/domain-errors";
import { FakeCacheInvalidator, FixedClock, InMemoryProductRepository } from "../fakes/in-memory-repositories";

describe("Product Use Cases", () => {
  let productRepo: InMemoryProductRepository;
  let cacheInvalidator: FakeCacheInvalidator;
  let clock: FixedClock;

  beforeEach(() => {
    productRepo = new InMemoryProductRepository();
    cacheInvalidator = new FakeCacheInvalidator();
    clock = new FixedClock(new Date("2026-10-03T10:00:00.000Z"));
  });

  it("creates a product and invalidates the catalog cache", async () => {
    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);

    const created = await createProductUseCase.execute({
      sku: "SAREE-001",
      name: "Chanderi Silk Saree",
      description: "Elegant silk saree",
      price: 4999,
      stock: 10,
      taxPercentage: 5,
      gallery: [],
      tags: ["Featured", "New Arrivals"],
      offer: {
        active: true,
        type: "percent",
        value: 10,
        label: "Launch Offer",
        expiry: "2026-10-15",
      },
      status: "active",
    });

    expect(created.sku).toBe("SAREE-001");
    expect(created.price.minor).toBe(499900);
    expect(cacheInvalidator.invalidatedTags).toContain("products");

    // Attempting to create duplicate SKU must throw ConflictError
    await expect(
      createProductUseCase.execute({
        sku: "SAREE-001",
        name: "Duplicate",
        description: "",
        price: 100,
        stock: 1,
        taxPercentage: 0,
        gallery: [],
        tags: [],
        status: "active",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("updates product and invalidates both catalog and SKU tags", async () => {
    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);
    const updateProductUseCase = new UpdateProduct(productRepo, cacheInvalidator);

    const product = await createProductUseCase.execute({
      sku: "SAREE-002",
      name: "Tussar Silk",
      description: "Natural tussar",
      price: 3000,
      stock: 5,
      taxPercentage: 5,
      gallery: [],
      tags: [],
      status: "active",
    });

    const updated = await updateProductUseCase.execute(product.id, {
      price: 3500,
      stock: 8,
    });

    expect(updated.price.minor).toBe(350000);
    expect(updated.stock).toBe(8);
    expect(cacheInvalidator.invalidatedTags).toContain("product:SAREE-002");
  });

  it("filters live offers ignoring expired ones", async () => {
    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);
    const listOffersUseCase = new ListOffers(productRepo, clock);

    // Active & valid
    await createProductUseCase.execute({
      sku: "OFFER-VALID",
      name: "Valid Offer Item",
      description: "",
      price: 1000,
      stock: 5,
      taxPercentage: 0,
      gallery: [],
      tags: [],
      offer: {
        active: true,
        type: "flat",
        value: 100,
        label: "Save 100",
        expiry: "2026-10-10",
      },
      status: "active",
    });

    // Active but expired (expiry 2026-10-01 < today 2026-10-03)
    await createProductUseCase.execute({
      sku: "OFFER-EXPIRED",
      name: "Expired Offer Item",
      description: "",
      price: 1000,
      stock: 5,
      taxPercentage: 0,
      gallery: [],
      tags: [],
      offer: {
        active: true,
        type: "flat",
        value: 100,
        label: "Expired",
        expiry: "2026-10-01",
      },
      status: "active",
    });

    const offers = await listOffersUseCase.execute();
    expect(offers.length).toBe(1);
    expect(offers[0].sku).toBe("OFFER-VALID");
  });

  it("gets product by SKU or compound slug", async () => {
    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);
    const getProductUseCase = new GetProduct(productRepo);

    await createProductUseCase.execute({
      sku: "KANJI-100",
      name: "Kanjivaram Saree",
      description: "",
      price: 12000,
      stock: 3,
      taxPercentage: 5,
      gallery: [],
      tags: [],
      status: "active",
    });

    // By exact SKU
    const bySku = await getProductUseCase.execute("KANJI-100");
    expect(bySku.name).toBe("Kanjivaram Saree");

    // By slug
    const bySlug = await getProductUseCase.execute("kanjivaram-saree-KANJI-100");
    expect(bySlug.name).toBe("Kanjivaram Saree");

    // Non-existent throws NotFoundError
    await expect(getProductUseCase.execute("NON-EXISTENT")).rejects.toThrow(NotFoundError);
  });
});
