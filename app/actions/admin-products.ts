"use server";

import { revalidatePath } from "next/cache";
import { isDomainError } from "@/core/domain/errors/domain-errors";
import { ProductInputDto } from "@/core/application/dto/product.dto";
import { container } from "@/infrastructure/di/container";

export type AdminActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createProductAction(
  rawInput: unknown,
): Promise<AdminActionResult<{ id: string; sku: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const parsed = ProductInputDto.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const useCase = container.createProduct();
    const created = await useCase.execute(parsed.data);

    revalidatePath("/admin/products/new");
    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      data: { id: created.id, sku: created.sku },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error creating product:", err);
    return { success: false, error: "An unexpected error occurred while creating the product in Zoho Books." };
  }
}

export async function updateProductAction(
  id: string,
  rawInput: unknown,
): Promise<AdminActionResult<{ id: string; sku: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    console.log("[admin-products:update] Incoming input for product:", id, rawInput);

    const parsed = ProductInputDto.partial().safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const useCase = container.updateProduct();
    const updated = await useCase.execute(id, parsed.data);

    console.log("[admin-products:update] Update complete. Domain product stock is now:", updated.stock);

    revalidatePath("/admin", "layout");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { id: updated.id, sku: updated.sku },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error updating product:", err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "An unexpected error occurred while updating the product in Zoho Books." };
  }
}

export async function syncCatalogAction(): Promise<AdminActionResult<{ message: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const useCase = container.refreshCatalog();
    await useCase.execute();

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      data: { message: "Catalog cache successfully purged and synchronized with Zoho Books." },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error synchronizing catalog:", err);
    return { success: false, error: "Failed to synchronize catalog with Zoho Books." };
  }
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData,
): Promise<AdminActionResult<{ imageUrl: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Only JPG, PNG and WebP images are supported." };
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE_BYTES) {
      return { success: false, error: "Image file exceeds maximum 5MB size limit." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await container.uploadProductImage(productId, buffer, file.name);

    revalidatePath("/admin", "layout");
    revalidatePath(`/admin/products/${productId}`, "layout");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { imageUrl },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error uploading product image to Zoho Books:", err);
    return { success: false, error: "Failed to upload image to Zoho Books." };
  }
}

export async function deleteProductImageAction(
  productId: string,
): Promise<AdminActionResult<{ message: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    await container.deleteProductImage(productId);

    revalidatePath("/admin", "layout");
    revalidatePath(`/admin/products/${productId}`, "layout");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { message: "Image removed from Zoho Books successfully." },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error deleting product image from Zoho Books:", err);
    return { success: false, error: "Failed to remove image from Zoho Books." };
  }
}

export async function toggleProductStatusAction(
  id: string,
  newStatus: "active" | "inactive",
): Promise<AdminActionResult<{ id: string; status: "active" | "inactive" }>> {
  try {
    await container.adminAuth.requireAdmin();

    const useCase = container.updateProduct();
    const updated = await useCase.execute(id, { status: newStatus });

    revalidatePath("/admin", "layout");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { id: updated.id, status: updated.status },
    };
  } catch (err: unknown) {
    if (isDomainError(err)) {
      return { success: false, error: err.message };
    }
    console.error("Error toggling product status:", err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to update product status in Zoho Books." };
  }
}

export async function getVendorsAction(): Promise<AdminActionResult<Array<{ id: string; name: string }>>> {
  try {
    await container.adminAuth.requireAdmin();
    const vendors = await container.getVendors();
    return { success: true, data: vendors };
  } catch (err: unknown) {
    console.error("Error fetching vendors from Zoho Books:", err);
    return { success: false, error: "Failed to fetch vendors from Zoho Books." };
  }
}
