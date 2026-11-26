/** Reusable gallery contract, not tied to the Crisdal database. */
export type GalleryCategory = "events" | "corporate" | "content";
export type GalleryAspect = "portrait" | "landscape" | "square";
export type CinematicGalleryItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  href: string;
  category: GalleryCategory;
  aspect: GalleryAspect;
  featured?: boolean;
};

/** Pure, stable curation. Events are prioritized; order within each tier is editorial, not random. */
export function curateCinematicGallery<T extends CinematicGalleryItem>(items: readonly T[]): T[] {
  const rank = (item: T) => item.featured ? (item.category === "events" ? 0 : 2) : item.category === "events" ? 1 : item.category === "corporate" ? 3 : 4;
  return items.map((item, index) => ({ item, index })).sort((a,b)=>rank(a.item)-rank(b.item)||a.index-b.index).map((row)=>row.item);
}

/** Public assets require a real alt and an intentional internal project URL; invalid assets are omitted. */
export function allowedPublicImageSrc(src: string): boolean {
  if (/^\/(?!\/)[a-zA-Z0-9/_~.%+-]+$/.test(src)) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

export function safeGalleryItems<T extends CinematicGalleryItem>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return curateCinematicGallery(items.filter((item) => {
    if (!item.id.trim() || seen.has(item.id) || !allowedPublicImageSrc(item.src) || !item.alt.trim() || !item.title.trim()) return false;
    if (!/^\/portafolio\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.href)) return false;
    if (!(["events","corporate","content"] as string[]).includes(item.category)) return false;
    if (!(["portrait","landscape","square"] as string[]).includes(item.aspect)) return false;
    seen.add(item.id);
    return true;
  }));
}
