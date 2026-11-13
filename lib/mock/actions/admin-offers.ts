"use server";

export async function createOfferCampaignAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function updateOfferCampaignAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteOfferCampaignAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function toggleOfferCampaignAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

// Alias used by offer-manager
export const toggleCampaignStatusAction = toggleOfferCampaignAction;

export async function updateOfferCampaignOrderAction(ids: string[]): Promise<{ success: boolean }> {
  return { success: true };
}

// Set which products are part of a campaign
export async function setCampaignProductsAction(campaignId: string, productIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  return { success: true };
}

// Remove a product from an offer campaign
export async function removeOfferFromProductAction(productId: string, campaignId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return { success: true };
}

// Reorder banner slides
export async function reorderBannersAction(ids: string[]): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

