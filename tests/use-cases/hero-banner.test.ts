import { describe, expect, it } from "vitest";
import {
  DEFAULT_HERO_BANNER,
  type HeroBannerConfig,
} from "@/core/domain/entities/hero-banner";
import { HeroBannerRepository } from "@/infrastructure/hero-banner/hero-banner-repository";

describe("HeroBannerRepository", () => {
  it("returns valid hero banner config", async () => {
    const repo = new HeroBannerRepository();
    const banner = await repo.get();

    expect(banner).toBeDefined();
    expect(banner.imageUrl).toBeDefined();
    expect(typeof banner.active).toBe("boolean");
    expect(typeof banner.imagePositionX).toBe("number");
    expect(typeof banner.imagePositionY).toBe("number");
  });

  it("updates hero banner and automatically computes objectPosition", async () => {
    const repo = new HeroBannerRepository();
    const updated = await repo.save({
      imagePositionX: 50,
      imagePositionY: 50,
      title: "Festive Grandeur",
    });

    expect(updated.imagePositionX).toBe(50);
    expect(updated.imagePositionY).toBe(50);
    expect(updated.objectPosition).toBe("50% 50%");
    expect(updated.title).toBe("Festive Grandeur");

    // Clean up by resetting to default
    await repo.reset();
  });

  it("resets back to DEFAULT_HERO_BANNER", async () => {
    const repo = new HeroBannerRepository();
    await repo.save({
      title: "Temporary Headline",
      imagePositionX: 10,
      imagePositionY: 90,
    });

    const resetBanner = await repo.reset();
    expect(resetBanner.title).toBe(DEFAULT_HERO_BANNER.title);
    expect(resetBanner.imagePositionX).toBe(DEFAULT_HERO_BANNER.imagePositionX);
    expect(resetBanner.imagePositionY).toBe(DEFAULT_HERO_BANNER.imagePositionY);
    expect(resetBanner.imageUrl).toBe(DEFAULT_HERO_BANNER.imageUrl);
  });
});
