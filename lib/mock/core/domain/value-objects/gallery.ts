export type Gallery = readonly string[];

export function createGallery(urls: readonly string[]): Gallery {
  return Object.freeze(urls.filter(Boolean));
}

