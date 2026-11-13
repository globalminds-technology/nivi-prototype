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
  imagePositionX: number;
  imagePositionY: number;
  objectPosition: string;
  updatedAt?: string;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  imageUrl: "/hero-banner-sarees.jpg",
  active: true,
  displayOrder: 0,
  tagline: "TIMELESS TRADITIONS FOR THE JOY",
  title: "Sarees for Every Story",
  subtitle: "Explore our curated collection of exquisite handcrafted sarees blending heritage craft with modern grace.",
  primaryCtaText: "Shop Collection",
  primaryCtaLink: "/collections",
  secondaryCtaText: "Explore Offers",
  secondaryCtaLink: "/offers",
  showOverlay: false,
  textPosition: "left",
  imagePositionX: 50,
  imagePositionY: 50,
  objectPosition: "50% 50%",
  updatedAt: new Date().toISOString(),
};

