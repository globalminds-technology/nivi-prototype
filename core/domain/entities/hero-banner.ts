export interface HeroBannerConfig {
  imageUrl: string;
  active: boolean;
  displayOrder: number;
  tagline?: string | null;
  title?: string | null;
  subtitle?: string | null;
  primaryCtaText?: string | null;
  primaryCtaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  showOverlay: boolean;
  textPosition: "left" | "center" | "right";
  imagePositionX: number; // 0 - 100 percentage
  imagePositionY: number; // 0 - 100 percentage
  objectPosition: string; // e.g. "85% 15%"
  updatedAt?: string;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  imageUrl: "https://pub-603a291ba647417fbd757fbd40d1b708.r2.dev/banners/hero_flagship_1791797443698.png",
  active: true,
  displayOrder: 0,
  tagline: "TIMELESS TRADITIONS",
  title: "Sarees for Every Story",
  subtitle:
    "Explore our curated collection of exquisite sarees that blend tradition, elegance and modern grace.",
  primaryCtaText: "Shop Collection",
  primaryCtaLink: "/collections",
  secondaryCtaText: null,
  secondaryCtaLink: null,
  showOverlay: true,
  textPosition: "left",
  imagePositionX: 85,
  imagePositionY: 15,
  objectPosition: "85% 15%",
  updatedAt: "2026-10-12T15:35:00.000Z",
};
