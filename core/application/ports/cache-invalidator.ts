export interface CacheInvalidator {
  revalidateTag(tag: string, profile?: string | { expire?: number }): Promise<void>;
  revalidatePath(path: string): Promise<void>;
}
