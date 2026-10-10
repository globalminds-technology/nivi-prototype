import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import type { CacheInvalidator } from "@/core/application/ports/cache-invalidator";

export class NextCacheInvalidator implements CacheInvalidator {
  async revalidateTag(tag: string, profile: string | { expire?: number } = "max"): Promise<void> {
    try {
      revalidateTag(tag, profile);
    } catch (err) {
      console.warn(`revalidateTag failed for tag "${tag}":`, err);
    }
  }

  async revalidatePath(path: string): Promise<void> {
    try {
      revalidatePath(path);
    } catch (err) {
      console.warn(`revalidatePath failed for path "${path}":`, err);
    }
  }
}
