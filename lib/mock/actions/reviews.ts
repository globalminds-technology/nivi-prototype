"use server";

export async function submitReviewAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function toggleReviewVisibilityAction(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

