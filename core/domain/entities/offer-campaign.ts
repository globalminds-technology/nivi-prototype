export interface OfferCampaign {
  id: string;
  name: string;
  type: "percent" | "flat";
  value: number;
  label: string;
  expiry?: string | null;
  active: boolean;
  productIds: string[];
  bannerImageUrl?: string | null;
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
  bannerCtaText?: string | null;
  displayOrder?: number;
  imagePosition?: string | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  createdAt: string;
  updatedAt: string;
}
