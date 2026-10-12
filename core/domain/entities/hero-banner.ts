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
  imageUrl: "/nivi-hero-banner-v2.jpg",
  active: true,
  displayOrder: 0,
  tagline: "Handcrafted Heritage",
  title: "Woven with Tradition, Styled for Today.",
  subtitle:
    "Discover heirloom Kanchipuram, Banarasi, and pure zari silk sarees handcrafted by generational master artisans.",
  primaryCtaText: "Explore Sarees",
  primaryCtaLink: "/collections",
  secondaryCtaText: "Heritage Edit",
  secondaryCtaLink: "/collections?tag=featured",
  showOverlay: true,
  textPosition: "left",
  imagePositionX: 85,
  imagePositionY: 20,
  objectPosition: "85% 20%",
  updatedAt: "2026-10-12T09:05:00.000Z",
};
