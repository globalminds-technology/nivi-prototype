"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Category } from "@/core/domain/entities/category";
import { container } from "@/infrastructure/di/container";
import { categoryRepository } from "@/infrastructure/categories/category-repository";

export type AdminActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CategoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9_-]+$/, "Slug can only contain lowercase letters, numbers, hyphens and underscores"),
  description: z.string().default(""),
  imageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
});

export async function getCategoriesAction(): Promise<AdminActionResult<Category[]>> {
  try {
    const list = await categoryRepository.list();
    return { success: true, data: list };
  } catch (err: unknown) {
    console.error("Failed fetching categories:", err);
    return { success: false, error: "Failed to load categories." };
  }
}

export async function upsertCategoryAction(
  input: unknown,
): Promise<AdminActionResult<Category>> {
  try {
    await container.adminAuth.requireAdmin();

    const parsed = CategoryInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const saved = await categoryRepository.upsert({
      id: parsed.data.id || parsed.data.slug,
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.trim().toLowerCase(),
      description: parsed.data.description.trim(),
      imageUrl: parsed.data.imageUrl || null,
      displayOrder: parsed.data.displayOrder ?? 99,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, data: saved };
  } catch (err: unknown) {
    console.error("Failed saving category:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to save category." };
  }
}

export async function deleteCategoryAction(
  slug: string,
): Promise<AdminActionResult<{ message: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    await categoryRepository.delete(slug);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, data: { message: "Category deleted successfully." } };
  } catch (err: unknown) {
    console.error("Failed deleting category:", err);
    return { success: false, error: "Failed to delete category." };
  }
}

export async function getCategoryUploadUrlAction(
  slug: string,
  contentType: "image/jpeg" | "image/png" | "image/webp",
): Promise<AdminActionResult<{ uploadUrl: string; publicUrl: string; key: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const result = await container.createCategoryUploadUrl(slug, contentType);
    return { success: true, data: result };
  } catch (err: unknown) {
    console.error("Failed generating category upload URL:", err);
    return { success: false, error: "Failed to generate upload URL for category image." };
  }
}

export async function uploadCategoryCoverAction(
  formData: FormData,
): Promise<AdminActionResult<{ publicUrl: string }>> {
  try {
    await container.adminAuth.requireAdmin();

    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const file = formData.get("file") as File;

    if (!slug || !file) {
      return { success: false, error: "Slug and image file are required." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    const publicUrl = await container.uploadCategoryCover(slug, buffer, contentType);
    return { success: true, data: { publicUrl } };
  } catch (err: unknown) {
    console.error("Failed uploading category cover:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to upload image." };
  }
}
