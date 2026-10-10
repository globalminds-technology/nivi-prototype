/** Merchandising tags stored in Zoho's `display_tags` field. Free-form; these are the known ones. */
export const DISPLAY_TAGS = {
  FEATURED: "Featured",
  NEW_ARRIVALS: "New Arrivals",
} as const;

export type DisplayTag = string;

/** Trim, drop empties, de-duplicate case-insensitively (first spelling wins). */
export function normalizeTags(raw: readonly string[]): readonly DisplayTag[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const t = tag.trim();
    const key = t.toLowerCase();
    if (t && !seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return Object.freeze(out);
}

export function hasTag(tags: readonly DisplayTag[], tag: DisplayTag): boolean {
  const key = tag.trim().toLowerCase();
  return tags.some((t) => t.toLowerCase() === key);
}
