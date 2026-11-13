"use server";

export async function uploadCampaignBannerAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  return { success: true, url: "/hero-flagship-exact.png" };
}

export async function uploadGalleryImageAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  return { success: true, url: "/categories/kanchipuram.png" };
}

