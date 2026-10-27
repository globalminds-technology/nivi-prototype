"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OfferCampaign } from "@/core/domain/entities/offer-campaign";
import { Money } from "@/core/domain/value-objects/money";
import { container } from "@/infrastructure/di/container";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";

export type AdminActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CreateCampaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name must be at least 2 characters"),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number().positive("Discount value must be greater than 0"),
  label: z.string().trim().optional(),
  expiry: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
  productIds: z.array(z.string()).default([]),
  bannerImageUrl: z.string().trim().nullable().optional(),
  bannerTitle: z.string().trim().nullable().optional(),
  bannerSubtitle: z.string().trim().nullable().optional(),
  bannerCtaText: z.string().trim().nullable().optional(),
  displayOrder: z.number().int().optional(),
  imagePosition: z.string().trim().nullable().optional(),
  imagePositionX: z.number().min(0).max(100).nullable().optional(),
  imagePositionY: z.number().min(0).max(100).nullable().optional(),
  showOverlay: z.boolean().optional(),
});

const UpdateCampaignSchema = z.object({
  id: z.string().min(1, "Campaign ID is required"),
  name: z.string().trim().min(2, "Campaign name must be at least 2 characters").optional(),
  type: z.enum(["percent", "flat"]).optional(),
  value: z.coerce.number().positive("Discount value must be greater than 0").optional(),
  label: z.string().trim().optional(),
  expiry: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
  active: z.boolean().optional(),
  bannerImageUrl: z.string().trim().nullable().optional(),
  bannerTitle: z.string().trim().nullable().optional(),
  bannerSubtitle: z.string().trim().nullable().optional(),
  bannerCtaText: z.string().trim().nullable().optional(),
  displayOrder: z.number().int().optional(),
  imagePosition: z.string().trim().nullable().optional(),
  imagePositionX: z.number().min(0).max(100).nullable().optional(),
  imagePositionY: z.number().min(0).max(100).nullable().optional(),
  showOverlay: z.boolean().optional(),
});

function revalidateAllOfferPaths() {
  revalidatePath("/admin/offers");
  revalidatePath("/admin");
  revalidatePath("/offers");
  revalidatePath("/");
}

/**
 * Helper to sync a single product's offer custom fields in Zoho Books
 */
async function syncProductOfferInZoho(
  productId: string,
  offer: {
    active: boolean;
    type: "percent" | "flat";
    value: number;
    label: string;
    expiry?: string | null;
  } | null,
) {
  try {
    const getProductUseCase = container.getAdminProductById();
    const updateProductUseCase = container.updateProduct();

    const product = await getProductUseCase.execute(productId);
    if (!product) return false;

    await updateProductUseCase.execute(productId, {
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: Money.toMajor(product.price),
      costPrice: product.costPrice ? Money.toMajor(product.costPrice) : null,
      stock: product.stock,
      category: product.category ?? null,
      primaryImageUrl: product.primaryImageUrl ?? null,
      gallery: [...product.gallery],
      tags: [...product.tags],
      status: product.status,
      offer: offer
        ? {
            active: offer.active,
            type: offer.type,
            value: offer.value,
            label: offer.label,
            expiry: offer.expiry || null,
          }
        : null,
    });
    return true;
  } catch (err) {
    console.error(`[AdminOffers] Failed syncing product ${productId} in Zoho:`, err);
    return false;
  }
}

/**
 * 1. Create a new Offer Campaign (can have 0 products or initial products)
 */
export async function createOfferCampaignAction(
  input: unknown,
): Promise<AdminActionResult<{ campaign: OfferCampaign }>> {
  try {
    await container.adminAuth.requireAdmin();

    const parsed = CreateCampaignSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { name, type, value, label, expiry, productIds, bannerImageUrl, bannerTitle, bannerSubtitle, bannerCtaText, displayOrder } = parsed.data;
    const computedLabel =
      (label && label.trim()) || (type === "percent" ? `${value}% OFF` : `₹${value} OFF`);
    const cleanExpiry = expiry && expiry.trim().length > 0 ? expiry.trim() : null;

    // Check 5-banner limit if banner is provided
    if (bannerImageUrl && bannerImageUrl.trim()) {
      const allCampaigns = await offerCampaignRepository.list();
      const activeBannersCount = allCampaigns.filter(
        (c) => c.active && c.bannerImageUrl && c.bannerImageUrl.trim(),
      ).length;
      if (activeBannersCount >= 5) {
        return {
          success: false,
          error: "Maximum 5 active banners allowed on the homepage. Please pause or remove an existing banner first.",
        };
      }
    }

    const campaign = await offerCampaignRepository.create({
      name,
      type,
      value,
      label: computedLabel,
      expiry: cleanExpiry,
      active: true,
      productIds: productIds || [],
      bannerImageUrl: bannerImageUrl || null,
      bannerTitle: bannerTitle || null,
      bannerSubtitle: bannerSubtitle || null,
      bannerCtaText: bannerCtaText || null,
      displayOrder,
    });

    // If initial products were provided, sync them to Zoho
    if (productIds && productIds.length > 0) {
      for (const pid of productIds) {
        await syncProductOfferInZoho(pid, {
          active: true,
          type: campaign.type,
          value: campaign.value,
          label: campaign.label,
          expiry: campaign.expiry,
        });
      }
    }

    revalidateAllOfferPaths();
    return { success: true, data: { campaign } };
  } catch (err: unknown) {
    console.error("Failed creating offer campaign:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create offer campaign.",
    };
  }
}

/**
 * 2. Update an existing Offer Campaign details
 */
export async function updateOfferCampaignAction(
  input: unknown,
): Promise<AdminActionResult<{ campaign: OfferCampaign }>> {
  try {
    await container.adminAuth.requireAdmin();

    const parsed = UpdateCampaignSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { id, expiry, ...rest } = parsed.data;
    const existing = await offerCampaignRepository.getById(id);
    if (!existing) {
      return { success: false, error: "Offer campaign not found." };
    }

    // Check 5-banner limit if banner is being activated/added
    const willHaveBanner =
      rest.bannerImageUrl !== undefined
        ? Boolean(rest.bannerImageUrl && rest.bannerImageUrl.trim())
        : Boolean(existing.bannerImageUrl && existing.bannerImageUrl.trim());
    const willBeActive = rest.active !== undefined ? rest.active : existing.active;

    if (willHaveBanner && willBeActive) {
      const allCampaigns = await offerCampaignRepository.list();
      const otherActiveBanners = allCampaigns.filter(
        (c) => c.id !== id && c.active && c.bannerImageUrl && c.bannerImageUrl.trim(),
      ).length;
      if (otherActiveBanners >= 5) {
        return {
          success: false,
          error: "Maximum 5 active banners allowed on the homepage. Please pause or remove an existing banner first.",
        };
      }
    }

    const cleanExpiry =
      expiry !== undefined
        ? expiry && expiry.trim().length > 0
          ? expiry.trim()
          : null
        : existing.expiry;

    const updated = await offerCampaignRepository.update(id, {
      ...rest,
      expiry: cleanExpiry,
    });

    if (!updated) {
      return { success: false, error: "Failed to update offer campaign." };
    }

    // Re-sync all products currently linked to this campaign in Zoho
    for (const pid of updated.productIds) {
      await syncProductOfferInZoho(
        pid,
        updated.active
          ? {
              active: true,
              type: updated.type,
              value: updated.value,
              label: updated.label,
              expiry: updated.expiry,
            }
          : null,
      );
    }

    revalidateAllOfferPaths();
    return { success: true, data: { campaign: updated } };
  } catch (err: unknown) {
    console.error("Failed updating offer campaign:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update offer campaign.",
    };
  }
}

/**
 * 3. Link or unlink products for an existing Offer Campaign (with strict cross-campaign exclusivity)
 */
export async function setCampaignProductsAction(
  campaignId: string,
  newProductIds: string[],
): Promise<AdminActionResult<{ campaign: OfferCampaign; attachedCount: number }>> {
  try {
    await container.adminAuth.requireAdmin();

    const campaign = await offerCampaignRepository.getById(campaignId);
    if (!campaign) {
      return { success: false, error: "Offer campaign not found." };
    }

    // STRICT EXCLUSIVITY CHECK: A saree cannot belong to multiple active campaigns!
    const exclusivityMap = await offerCampaignRepository.getProductsExclusivityMap(campaignId);
    const conflicting = newProductIds.filter((id) => exclusivityMap[id]);
    if (conflicting.length > 0) {
      const firstConflict = exclusivityMap[conflicting[0]];
      return {
        success: false,
        error: `Cannot assign saree: already enrolled in active campaign "${firstConflict.campaignName}". Each saree can belong to only one active campaign.`,
      };
    }

    const prevProductIds = new Set(campaign.productIds);
    const targetProductIds = new Set(newProductIds);

    // Products to add
    const toAdd = newProductIds.filter((id) => !prevProductIds.has(id));
    // Products to remove
    const toRemove = campaign.productIds.filter((id) => !targetProductIds.has(id));

    // Sync toAdd into Zoho
    for (const pid of toAdd) {
      await syncProductOfferInZoho(pid, {
        active: campaign.active,
        type: campaign.type,
        value: campaign.value,
        label: campaign.label,
        expiry: campaign.expiry,
      });
    }

    // Remove offer from toRemove in Zoho
    for (const pid of toRemove) {
      await syncProductOfferInZoho(pid, null);
    }

    const updated = await offerCampaignRepository.setProducts(campaignId, newProductIds);
    if (!updated) {
      return { success: false, error: "Failed saving campaign products." };
    }

    revalidateAllOfferPaths();
    return { success: true, data: { campaign: updated, attachedCount: newProductIds.length } };
  } catch (err: unknown) {
    console.error("Failed updating products for campaign:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to link products.",
    };
  }
}

/**
 * 4. Toggle campaign Active/Paused
 */
export async function toggleCampaignStatusAction(
  campaignId: string,
): Promise<AdminActionResult<{ campaign: OfferCampaign }>> {
  try {
    await container.adminAuth.requireAdmin();

    const campaign = await offerCampaignRepository.getById(campaignId);
    if (!campaign) {
      return { success: false, error: "Campaign not found." };
    }

    const newActive = !campaign.active;
    const updated = await offerCampaignRepository.update(campaignId, { active: newActive });
    if (!updated) {
      return { success: false, error: "Failed to update campaign status." };
    }

    // Update in Zoho for all linked products
    for (const pid of updated.productIds) {
      await syncProductOfferInZoho(
        pid,
        newActive
          ? {
              active: true,
              type: updated.type,
              value: updated.value,
              label: updated.label,
              expiry: updated.expiry,
            }
          : null,
      );
    }

    revalidateAllOfferPaths();
    return { success: true, data: { campaign: updated } };
  } catch (err: unknown) {
    console.error("Failed toggling campaign status:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle status.",
    };
  }
}

/**
 * 5. Delete an Offer Campaign entirely
 */
export async function deleteOfferCampaignAction(
  campaignId: string,
): Promise<AdminActionResult<{ deleted: boolean }>> {
  try {
    await container.adminAuth.requireAdmin();

    const campaign = await offerCampaignRepository.getById(campaignId);
    if (campaign) {
      // Clear offer from all attached products in Zoho
      for (const pid of campaign.productIds) {
        await syncProductOfferInZoho(pid, null);
      }
    }

    await offerCampaignRepository.delete(campaignId);

    revalidateAllOfferPaths();
    return { success: true, data: { deleted: true } };
  } catch (err: unknown) {
    console.error("Failed deleting offer campaign:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete offer campaign.",
    };
  }
}

/**
 * 6. Quick remove single product from offer
 */
export async function removeOfferFromProductAction(
  productId: string,
): Promise<AdminActionResult<{ success: boolean }>> {
  try {
    await container.adminAuth.requireAdmin();

    await syncProductOfferInZoho(productId, null);
    await offerCampaignRepository.removeProductFromAll(productId);

    revalidateAllOfferPaths();
    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    console.error("Failed removing product from offer:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove offer.",
    };
  }
}

/**
 * Backward compatibility aliases for hot module reload / legacy calls
 */
export async function applyOfferToProductsAction(input: unknown) {
  return createOfferCampaignAction(input);
}

export async function removeOfferFromProductsAction(productIds: string[]) {
  for (const pid of productIds) {
    await removeOfferFromProductAction(pid);
  }
  return { success: true, data: { removedCount: productIds.length } };
}

/**
 * 7. Reorder active hero banners
 */
export async function reorderBannersAction(
  orderedCampaignIds: string[],
): Promise<AdminActionResult<{ campaigns: OfferCampaign[] }>> {
  try {
    await container.adminAuth.requireAdmin();
    const updated = await offerCampaignRepository.reorderBanners(orderedCampaignIds);
    revalidateAllOfferPaths();
    return { success: true, data: { campaigns: updated } };
  } catch (err: unknown) {
    console.error("Failed reordering banners:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder banners.",
    };
  }
}

/**
 * 8. Fetch cross-campaign exclusivity map for product picker
 */
export async function getProductsExclusivityAction(
  excludeCampaignId?: string,
): Promise<AdminActionResult<{ exclusivityMap: Record<string, { campaignId: string; campaignName: string }> }>> {
  try {
    await container.adminAuth.requireAdmin();
    const exclusivityMap = await offerCampaignRepository.getProductsExclusivityMap(excludeCampaignId);
    return { success: true, data: { exclusivityMap } };
  } catch (err: unknown) {
    console.error("Failed getting exclusivity map:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed getting exclusivity map.",
    };
  }
}

