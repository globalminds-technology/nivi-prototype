export type DisplayTag = string;

export function normalizeTags(tags: readonly string[]): readonly DisplayTag[] {
  return tags.map((t) => t.trim()).filter(Boolean);
}

