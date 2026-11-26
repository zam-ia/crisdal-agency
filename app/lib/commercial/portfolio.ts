import { z } from "zod";

export const PORTFOLIO_CATEGORY_SEEDS = [
  ["reels-contenido", "Reels y contenido"],
  ["fotografia-comercial", "Fotografía comercial"],
  ["producto-gastronomia", "Producto y gastronomía"],
  ["videos-empresariales", "Videos empresariales"],
  ["bodas", "Bodas"],
  ["quinceanos", "Quinceaños"],
  ["eventos-sociales", "Eventos sociales"],
  ["eventos-corporativos", "Eventos corporativos"],
  ["behind-the-scenes", "Behind the scenes"],
] as const;

export const portfolioStatusSchema = z.enum(["draft", "published", "archived"]);
export const mediaKindSchema = z.enum(["image", "video"]);
export const mediaOrientationSchema = z.enum(["portrait", "landscape", "square"]);
export const externalVideoProviderSchema = z.enum(["youtube","vimeo","tiktok","facebook"]);
export const externalVideoModeSchema = z.enum(["embed","external"]);
export const consentStatusSchema = z.enum(["missing", "pending", "verified", "revoked"]);

export const portfolioMediaSchema = z.object({
  id: z.string().uuid(),
  kind: mediaKindSchema,
  url: z.string().url(),
  posterUrl: z.string().url().nullable(),
  alt: z.string().max(240),
  orientation: mediaOrientationSchema,
  sortOrder: z.number().int().nonnegative(),
  mimeType: z.string().max(120),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  provider: externalVideoProviderSchema.optional(),
  embedMode: externalVideoModeSchema.optional(),
  title: z.string().max(180).optional(),
});

export const portfolioProjectSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().min(3).max(180),
  categoryId: z.string().uuid(),
  categorySlug: z.string(),
  categoryName: z.string(),
  clientName: z.string().max(180).nullable(),
  clientDisplayAuthorized: z.boolean(),
  year: z.number().int().min(2000).max(2100).nullable(),
  description: z.string().min(20).max(4000),
  objective: z.string().max(1600),
  serviceType: z.string().min(2).max(180),
  status: portfolioStatusSchema,
  featured: z.boolean(),
  coverAssetId: z.string().uuid().nullable(),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  consentStatus: consentStatusSchema,
  consentScope: z.string().max(1000),
  consentEvidenceReference: z.string().max(500),
  consentAuthorizedAt: z.string().datetime({ offset: true }).nullable(),
  media: z.array(portfolioMediaSchema),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const portfolioDraftInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: z.string().min(3).max(180),
  categoryId: z.string().uuid(),
  clientName: z.string().max(180).nullable().default(null),
  clientDisplayAuthorized: z.boolean().default(false),
  year: z.number().int().min(2000).max(2100).nullable().default(null),
  description: z.string().min(20).max(4000),
  objective: z.string().max(1600).default(""),
  serviceType: z.string().min(2).max(180),
  featured: z.boolean().default(false),
  coverAssetId: z.string().uuid().nullable().default(null),
  consentStatus: consentStatusSchema.default("missing"),
  consentScope: z.string().max(1000).default(""),
  consentEvidenceReference: z.string().max(500).default(""),
  consentAuthorizedAt: z.string().datetime({ offset: true }).nullable().default(null),
});

export type PortfolioMedia = z.infer<typeof portfolioMediaSchema>;
export type PortfolioProject = z.infer<typeof portfolioProjectSchema>;
export type PortfolioDraftInput = z.infer<typeof portfolioDraftInputSchema>;
export type PortfolioStatus = z.infer<typeof portfolioStatusSchema>;

export function publicationIssues(project: PortfolioProject) {
  const issues: string[] = [];
  if (project.consentStatus !== "verified") issues.push("La autorización debe estar verificada.");
  if (!project.consentEvidenceReference.trim()) issues.push("Falta una referencia de respaldo de autorización.");
  if (!project.consentScope.trim()) issues.push("Falta documentar el alcance autorizado.");
  if (!project.consentAuthorizedAt) issues.push("Falta la fecha de autorización.");
  if (!project.coverAssetId) issues.push("Falta seleccionar una portada.");
  if (!project.media.length) issues.push("El proyecto necesita al menos un medio.");
  if (project.clientName && !project.clientDisplayAuthorized) {
    issues.push("El cliente no puede mostrarse sin autorización específica.");
  }
  return issues;
}

export function canPublishPortfolioProject(project: PortfolioProject) {
  return publicationIssues(project).length === 0;
}

export function slugifyPortfolioTitle(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

export type ExternalVideoProvider=z.infer<typeof externalVideoProviderSchema>;
export type ExternalVideoInfo={provider:ExternalVideoProvider;canonicalUrl:string;embedUrl:string|null;postId:string|null};
export function parseExternalVideoUrl(value:string):ExternalVideoInfo|null{try{const url=new URL(value);if(url.protocol!=="https:")return null;const host=url.hostname.toLowerCase().replace(/^www\./,"");
  if(host==="youtu.be"||host==="youtube.com"||host==="m.youtube.com"){const id=host==="youtu.be"?url.pathname.split("/").filter(Boolean)[0]:url.searchParams.get("v")||url.pathname.match(/^\/shorts\/([\w-]{6,})/)?.[1]||url.pathname.match(/^\/embed\/([\w-]{6,})/)?.[1];if(!id||!/^[\w-]{6,20}$/.test(id))return null;return{provider:"youtube",canonicalUrl:`https://www.youtube.com/watch?v=${id}`,embedUrl:`https://www.youtube-nocookie.com/embed/${id}?rel=0`,postId:id};}
  if(host==="vimeo.com"||host==="player.vimeo.com"){const id=url.pathname.split("/").filter(Boolean).find((part)=>/^\d{6,12}$/.test(part));if(!id)return null;return{provider:"vimeo",canonicalUrl:`https://vimeo.com/${id}`,embedUrl:`https://player.vimeo.com/video/${id}`,postId:id};}
  if(host==="tiktok.com"||host==="m.tiktok.com"){const id=url.pathname.match(/\/video\/(\d{10,24})/)?.[1]||url.pathname.match(/\/player\/v1\/(\d{10,24})/)?.[1];if(!id)return null;return{provider:"tiktok",canonicalUrl:value,embedUrl:`https://www.tiktok.com/player/v1/${id}?controls=1&autoplay=0&rel=0`,postId:id};}
  if(host==="facebook.com"||host==="m.facebook.com"||host==="fb.watch"){if(!url.pathname||url.pathname==="/")return null;return{provider:"facebook",canonicalUrl:value,embedUrl:null,postId:null};}
  return null;}catch{return null;}}
export function isApprovedExternalVideoUrl(value: string) { return Boolean(parseExternalVideoUrl(value)); }

export function detectedImageMime(bytes: Uint8Array) {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const text = new TextDecoder("ascii").decode(bytes.slice(0, 12));
  if (text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP") return "image/webp";
  if (text.slice(4, 12).includes("ftypavif")) return "image/avif";
  return null;
}
