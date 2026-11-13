import { DEFAULT_HERO_BANNER, type HeroBannerConfig } from "../../core/domain/entities/hero-banner";

class HeroBannerRepository {
  private config: HeroBannerConfig = { ...DEFAULT_HERO_BANNER };

  async get(): Promise<HeroBannerConfig> {
    return { ...this.config };
  }

  async save(newConfig: Partial<HeroBannerConfig>): Promise<HeroBannerConfig> {
    this.config = { ...this.config, ...newConfig, updatedAt: new Date().toISOString() };
    return { ...this.config };
  }
}

export const heroBannerRepository = new HeroBannerRepository();

