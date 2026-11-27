import type { PortfolioProject } from "./portfolio";

export function portfolioCover(project: PortfolioProject) {
  return project.media.find((item) => item.id === project.coverAssetId) ?? project.media[0];
}

export function toPublicPortfolioCard(project: PortfolioProject) {
  const asset = portfolioCover(project);
  return {
    slug: project.slug, title: project.title, categorySlug: project.categorySlug,
    categoryName: project.categoryName, serviceType: project.serviceType,
    year: project.year, featured: project.featured,
    image: asset ? asset.kind === "image" ? asset.url : asset.posterUrl : null,
    hasPhoto: project.media.some((item) => item.kind === "image" || (item.kind === "social" && (item.contentType === "photo" || item.contentType === "carousel"))),
    hasVideo: project.media.some((item) => item.kind === "video" || (item.kind === "social" && (item.contentType === "reel" || item.contentType === "video"))),
    hasSocial: project.media.some((item) => item.kind === "social"),
  };
}

export type PublicPortfolioCard = ReturnType<typeof toPublicPortfolioCard>;

export function portfolioDetailMedia(project: PortfolioProject) {
  const cover = portfolioCover(project);
  if (!cover) return [];
  const remaining = project.media.filter((item) => item.id !== cover.id);
  return cover.kind === "image" ? remaining : [cover, ...remaining];
}
