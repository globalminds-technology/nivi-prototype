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
  createdAt: string;
  updatedAt: string;
}
