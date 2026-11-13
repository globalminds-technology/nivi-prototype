"use server";

export async function createProductAction(data: any): Promise<{ success: boolean; error?: string; product?: any }> {
  return { success: true };
}

export async function updateProductAction(id: string, data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function toggleProductStatusAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function syncCatalogAction(): Promise<{ success: boolean; message?: string }> {
  return { success: true, message: "Catalog is up to date (Prototype Mock Mode)" };
}

// Upload a product image — returns a mock URL
export async function uploadProductImageAction(productId: string, formData: FormData): Promise<{
  success: boolean;
  imageUrl?: string;
  error?: string;
}> {
  return {
    success: true,
    imageUrl: "/hero-flagship-exact.png",
  };
}

// Delete a product image
export async function deleteProductImageAction(productId: string, imageUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return { success: true };
}

