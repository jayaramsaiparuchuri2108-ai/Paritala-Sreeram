import type { GalleryCategory, GalleryPhoto } from "@/types";

/**
 * Picks an authorised photograph for a page slot from the gallery by category, so slots fill themselves as soon
 * as photographs are uploaded and categorised. `skip` selects the n-th photograph of the category.
 */
export function photoFor(photos: GalleryPhoto[], categories: GalleryCategory[], skip = 0): GalleryPhoto | undefined {
  const pool = photos.filter((p) => categories.includes(p.category));
  // Featured photographs first, then the admin's order.
  pool.sort((a, b) => Number(b.featured) - Number(a.featured));
  return pool[skip];
}

/** Photograph's own proportions, clamped so extreme panoramas / tall strips still make a tidy tile. */
export function ratioOf(p: Pick<GalleryPhoto, "width" | "height">): number {
  if (!p.width || !p.height) return 4 / 5;
  return Math.min(1.8, Math.max(0.66, p.width / p.height));
}
