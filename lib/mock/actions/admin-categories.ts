"use server";

export async function createCategoryAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function updateCategoryAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

// Alias: some components call upsertCategoryAction
export const upsertCategoryAction = updateCategoryAction;

export async function deleteCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function updateCategoryOrderAction(ids: string[]): Promise<{ success: boolean }> {
  return { success: true };
}

// Mock image upload — returns a fake signed URL
export async function getCategoryUploadUrlAction(filename: string): Promise<{
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  error?: string;
}> {
  return {
    success: true,
    uploadUrl: "/api/mock-upload",
    publicUrl: `/uploads/categories/${filename}`,
  };
}

// Mock upload category cover
export async function uploadCategoryCoverAction(id: string, imageUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return { success: true };
}

