"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { HeroBannerConfig } from "@/core/domain/entities/hero-banner";
import { container } from "@/infrastructure/di/container";
import { heroBannerRepository } from "@/infrastructure/hero-banner/hero-banner-repository";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";

export type AdminActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const UpdateHeroBannerSchema = z.object({
  imageUrl: z.string().trim().min(1, "Image URL is required").optional(),
  active: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  tagline: z.string().trim().nullable().optional(),
  title: z.string().trim().nullable().optional(),
  subtitle: z.string().trim().nullable().optional(),
  primaryCtaText: z.string().trim().nullable().optional(),
  primaryCtaLink: z.string().trim().nullable().optional(),
  secondaryCtaText: z.string().trim().nullable().optional(),
  secondaryCtaLink: z.string().trim().nullable().optional(),
  showOverlay: z.boolean().optional(),
  textPosition: z.enum(["left", "center", "right"]).optional(),
  imagePositionX: z.number().min(0).max(100).optional(),
  imagePositionY: z.number().min(0).max(100).optional(),
  objectPosition: z.string().optional(),
});

export type UpdateHeroBannerInput = z.infer<typeof UpdateHeroBannerSchema>;

function revalidateHeroPaths() {
  revalidatePath("/");
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
}

export async function getHeroBannerAction(): Promise<
  AdminActionResult<{ heroBanner: HeroBannerConfig }>
> {
  try {
    const config = await heroBannerRepository.get();
    return { success: true, data: { heroBanner: config } };
  } catch (err: unknown) {
    console.error("Failed getting hero banner:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed getting hero banner.",
    };
  }
}

export async function updateHeroBannerAction(
  input: UpdateHeroBannerInput,
): Promise<AdminActionResult<{ heroBanner: HeroBannerConfig }>> {
  try {
    await container.adminAuth.requireAdmin();

    const parsed = UpdateHeroBannerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const updated = await heroBannerRepository.save(parsed.data);
    revalidateHeroPaths();

    return { success: true, data: { heroBanner: updated } };
  } catch (err: unknown) {
    console.error("Failed updating hero banner:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed updating hero banner.",
    };
  }
}

export async function uploadHeroBannerAction(
  formData: FormData,
): Promise<AdminActionResult<{ publicUrl: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Banner image file is required." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = (file.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp";

    const publicUrl = await container.uploadCampaignBanner(
      "hero_flagship",
      buffer,
      contentType,
    );

    return { success: true, data: { publicUrl } };
  } catch (err: unknown) {
    console.error("Failed uploading hero banner to R2:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload hero banner.",
    };
  }
}

export async function resetHeroBannerAction(): Promise<
  AdminActionResult<{ heroBanner: HeroBannerConfig }>
> {
  try {
    await container.adminAuth.requireAdmin();
    const resetConfig = await heroBannerRepository.reset();
    revalidateHeroPaths();
    return { success: true, data: { heroBanner: resetConfig } };
  } catch (err: unknown) {
    console.error("Failed resetting hero banner:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed resetting hero banner.",
    };
  }
}

/**
 * Reorders carousel slides (supports both initial hero banner and offer campaign banners)
 */
export async function reorderAllCarouselSlidesAction(
  orderedItems: Array<{ id: string; type: "hero" | "campaign" }>,
): Promise<
  AdminActionResult<{
    heroBanner: HeroBannerConfig;
    campaigns: Array<import("@/core/domain/entities/offer-campaign").OfferCampaign>;
  }>
> {
  try {
    await container.adminAuth.requireAdmin();

    console.log(
      "[reorderAllCarouselSlidesAction] Received orderedItems:",
      orderedItems.map((item, idx) => `#${idx}: id=${item.id} type=${item.type}`),
    );

    let updatedHero: HeroBannerConfig | null = null;
    const campaignOrderMap: Record<string, number> = {};

    let heroIndex = -1;

    orderedItems.forEach((item, index) => {
      if (item.type === "hero") {
        heroIndex = index;
      } else {
        campaignOrderMap[item.id] = index;
      }
    });

    console.log(
      "[reorderAllCarouselSlidesAction] Computed positions => Hero Index:",
      heroIndex,
      "Campaign Order Map:",
      campaignOrderMap,
    );

    if (heroIndex !== -1) {
      updatedHero = await heroBannerRepository.save({ displayOrder: heroIndex });
    } else {
      updatedHero = await heroBannerRepository.get();
    }

    let updatedCampaigns: Array<import("@/core/domain/entities/offer-campaign").OfferCampaign> = [];
    if (Object.keys(campaignOrderMap).length > 0) {
      updatedCampaigns = await offerCampaignRepository.updateDisplayOrders(campaignOrderMap);
    } else {
      updatedCampaigns = await offerCampaignRepository.list();
    }

    console.log(
      "[reorderAllCarouselSlidesAction] Success! Saved heroBanner.displayOrder =",
      updatedHero.displayOrder,
      "Saved campaigns:",
      updatedCampaigns
        .filter((c) => Boolean(c.bannerImageUrl))
        .map((c) => ({ id: c.id, name: c.name, displayOrder: c.displayOrder })),
    );

    revalidateHeroPaths();

    return {
      success: true,
      data: {
        heroBanner: updatedHero,
        campaigns: updatedCampaigns,
      },
    };
  } catch (err: unknown) {
    console.error("[reorderAllCarouselSlidesAction] Error reordering carousel slides:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder carousel slides.",
    };
  }
}
