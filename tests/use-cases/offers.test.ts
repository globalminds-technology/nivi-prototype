import { describe, expect, it } from "vitest";
import { ExpireOffers } from "../../core/application/use-cases/offers/expire-offers";
import { CreateProduct } from "../../core/application/use-cases/products/create-product";
import { FakeCacheInvalidator, FixedClock, InMemoryProductRepository } from "../fakes/in-memory-repositories";

describe("ExpireOffers Use Case", () => {
  it("deactivates expired offers and revalidates products cache", async () => {
    const productRepo = new InMemoryProductRepository();
    const cacheInvalidator = new FakeCacheInvalidator();
    const clock = new FixedClock(new Date("2026-10-03T10:00:00.000Z")); // Today is 2026-10-03

    const createProductUseCase = new CreateProduct(productRepo, cacheInvalidator);

    // Offer 1: expired yesterday (2026-10-02)
    const p1 = await createProductUseCase.execute({
      sku: "EXP-1",
      name: "Expired Item 1",
      description: "",
      price: 1000,
      stock: 5,
      taxPercentage: 0,
      gallery: [],
      tags: [],
      offer: {
        active: true,
        type: "percent",
        value: 10,
        label: "Expired Yesterday",
        expiry: "2026-10-02",
      },
      status: "active",
    });

    // Offer 2: expires tomorrow (2026-10-04) - still active!
    const p2 = await createProductUseCase.execute({
      sku: "STILL-VALID",
      name: "Valid Item",
      description: "",
      price: 2000,
      stock: 5,
      taxPercentage: 0,
      gallery: [],
      tags: [],
      offer: {
        active: true,
        type: "flat",
        value: 200,
        label: "Valid Tomorrow",
        expiry: "2026-10-04",
      },
      status: "active",
    });

    cacheInvalidator.invalidatedTags = []; // Reset after creations

    const expireOffersUseCase = new ExpireOffers(productRepo, clock, cacheInvalidator);
    const result = await expireOffersUseCase.execute();

    expect(result.expiredCount).toBe(1);
    expect(result.deactivatedSkus).toContain("EXP-1");
    expect(cacheInvalidator.invalidatedTags).toContain("products");

    // Verify p1 in repository has active=false now
    const updatedP1 = await productRepo.getById(p1.id);
    expect(updatedP1?.offer?.active).toBe(false);

    // Verify p2 in repository is still active=true
    const updatedP2 = await productRepo.getById(p2.id);
    expect(updatedP2?.offer?.active).toBe(true);
  });
});
