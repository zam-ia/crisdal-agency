import { createHash, randomBytes } from "node:crypto";

export const DELIVERY_BUCKET = "crisdal-private-media";
export const MAX_DELIVERY_IMAGE_BYTES = 12 * 1024 * 1024;
export const EVENT_TYPES = ["Boda", "Quinceaños", "Evento corporativo", "Celebración", "Bautizo", "Pedida de mano", "Sesión fotográfica", "Otro"] as const;
export type GalleryStatus = "draft" | "published" | "archived";
export type GalleryEventType = (typeof EVENT_TYPES)[number];
export type GalleryInput = {
  id?: string;
  projectId?: string | null;
  title: string;
  eventType: GalleryEventType;
  description: string;
  allowDownloads: boolean;
};
export type GalleryRecord = {
  id: string;
  projectId?: string | null;
  title: string;
  eventType: GalleryEventType;
  description: string;
  status: GalleryStatus;
  allowDownloads: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type GalleryAsset = {
  id: string;
  galleryId: string;
  kind: "image" | "video";
  title: string;
  alt: string;
  originalName: string | null;
  originalPath: string | null;
  previewPath: string | null;
  thumbPath: string | null;
  externalUrl: string | null;
  favorite: boolean;
  sortOrder: number;
};
export type PrivateGalleryAsset = {
  id: string;
  kind: "image" | "video";
  title: string;
  alt: string;
  previewUrl: string | null;
  thumbUrl: string | null;
  externalUrl: string | null;
  favorite: boolean;
};
export type PrivateGalleryView = {
  id: string;
  title: string;
  eventType: GalleryEventType;
  description: string;
  expiresAt: string;
  allowDownloads: boolean;
  assets: PrivateGalleryAsset[];
};

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export function newGalleryToken() {
  return randomBytes(32).toString("base64url");
}
export function tokenDigest(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Enlace privado inválido.");
  return createHash("sha256").update(token).digest("hex");
}
export function validateGalleryInput(input: GalleryInput) {
  if (input.id && !/^[0-9a-f-]{36}$/i.test(input.id)) throw new Error("Identificador de galería inválido.");
  if (input.projectId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.projectId)) throw new Error("Proyecto inválido.");
  if (!input.title.trim() || input.title.length > 150) throw new Error("Título inválido (máximo 150 caracteres).");
  if (!EVENT_TYPES.includes(input.eventType)) throw new Error("Tipo de evento inválido.");
  if (input.description.length > 1800) throw new Error("Descripción demasiado larga.");
  if (typeof input.allowDownloads !== "boolean") throw new Error("Permiso de descarga inválido.");
  return { ...input, title: input.title.trim(), description: input.description.trim() };
}
export function canOpenPrivateGallery(value: Pick<GalleryRecord, "status" | "expiresAt">, now = new Date()) {
  return value.status === "published" && Boolean(value.expiresAt) &&
    Number.isFinite(Date.parse(value.expiresAt || "")) && Date.parse(value.expiresAt || "") > now.getTime();
}
export function expiryForPublication(now = new Date(), days = 30): string {
  if (!Number.isInteger(days) || days < 1 || days > 365 || !Number.isFinite(now.getTime())) throw new Error("Vigencia inválida.");
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
export function safeDownloadFilename(name: string | null, fallbackId: string) {
  const fileName = (name || `crisdal-${fallbackId}.jpg`).split(/[\\/]/).filter(Boolean).at(-1) || `crisdal-${fallbackId}.jpg`;
  const asciiName = Array.from(fileName.normalize("NFKD"), (char) =>
    char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? "-" : char,
  ).join("");
  const base = asciiName.replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"|?*]/g, "-").replace(/^\.+/, "").trim().slice(0, 100);
  return base || `crisdal-${fallbackId}.jpg`;
}
export function isApprovedPrivateVideoLink(link: string) {
  try {
    const url = new URL(link);
    return url.protocol === "https:" && !url.username && !url.password &&
      ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname.toLowerCase());
  } catch { return false; }
}
export function detectedDeliveryImageMime(bytes: Uint8Array) {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const chars = new TextDecoder("ascii").decode(bytes.subarray(0, 12));
  if (chars.startsWith("RIFF") && chars.slice(8, 12) === "WEBP") return "image/webp";
  if (chars.slice(4, 12).includes("ftypavif")) return "image/avif";
  return null;
}
