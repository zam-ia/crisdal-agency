import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin";
import {
  DELIVERY_BUCKET, canOpenPrivateGallery, expiryForPublication, isApprovedPrivateVideoLink,
  newGalleryToken, safeDownloadFilename, tokenDigest, validateGalleryInput,
  type GalleryAsset, type GalleryInput, type GalleryRecord, type PrivateGalleryView,
} from "./domain";

type GalleryRow = {
  id: string; project_id: string | null; title: string; event_type: GalleryRecord["eventType"]; description: string;
  status: GalleryRecord["status"]; allow_downloads: boolean;
  expires_at: string | null; published_at: string | null; created_at: string; updated_at: string;
};
type AssetRow = {
  id: string; gallery_id: string; kind: "image" | "video"; title: string; alt_text: string;
  original_name: string | null; original_path: string | null; preview_path: string | null;
  thumbnail_path: string | null; external_url: string | null; favorite: boolean; sort_order: number;
};
const galleryCols = "id,project_id,title,event_type,description,status,allow_downloads,expires_at,published_at,created_at,updated_at";
const assetCols = "id,gallery_id,kind,title,alt_text,original_name,original_path,preview_path,thumbnail_path,external_url,favorite,sort_order";
const db = () => getSupabaseAdmin();
function mapGallery(row: GalleryRow): GalleryRecord {
  return {
    id: row.id, projectId: row.project_id, title: row.title, eventType: row.event_type, description: row.description,
    status: row.status, allowDownloads: row.allow_downloads,
    expiresAt: row.expires_at, publishedAt: row.published_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function mapAsset(row: AssetRow): GalleryAsset {
  return {
    id: row.id, galleryId: row.gallery_id, kind: row.kind, title: row.title, alt: row.alt_text,
    originalName: row.original_name, originalPath: row.original_path,
    previewPath: row.preview_path, thumbPath: row.thumbnail_path,
    externalUrl: row.external_url, favorite: row.favorite, sortOrder: row.sort_order,
  };
}
export async function listAdminGalleries() {
  const { data, error } = await db().from("crisdal_client_galleries").select(galleryCols).order("created_at", { ascending: false }).limit(150);
  if (error) throw error;
  return (data || []).map((x) => mapGallery(x as GalleryRow));
}
export async function findAdminGallery(id: string) {
  const { data, error } = await db().from("crisdal_client_galleries").select(galleryCols).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapGallery(data as GalleryRow) : null;
}
export async function listAdminGalleryAssets(id: string) {
  const { data, error } = await db().from("crisdal_client_gallery_assets").select(assetCols).eq("gallery_id", id).order("sort_order").order("created_at");
  if (error) throw error;
  return (data || []).map((x) => mapAsset(x as AssetRow));
}
export async function saveAdminGallery(input: GalleryInput, actorId: string) {
  const validated = validateGalleryInput(input);
  if (validated.id) {
    const current = await findAdminGallery(validated.id);
    if (!current) throw new Error("Galería no encontrada.");
    if (current.status==="published" && (validated.projectId===undefined?current.projectId??null:validated.projectId)!==(current.projectId??null)) throw new Error("Revoca el enlace antes de cambiar de proyecto.");
    const { error } = await db().from("crisdal_client_galleries").update({
      project_id: validated.projectId === undefined ? current.projectId ?? null : validated.projectId, title: validated.title, event_type: validated.eventType, description: validated.description,
      allow_downloads: validated.allowDownloads, updated_by: actorId, updated_at: new Date().toISOString(),
    }).eq("id", current.id);
    if (error) throw error;
    return findAdminGallery(current.id);
  }
  const id = randomUUID();
  const { error } = await db().from("crisdal_client_galleries").insert({
    id, project_id: validated.projectId??null, title: validated.title, event_type: validated.eventType, description: validated.description,
    allow_downloads: validated.allowDownloads, created_by: actorId, updated_by: actorId,
  });
  if (error) throw error;
  return findAdminGallery(id);
}
/** Token is returned only once; database stores only a digest. Rotating invalidates the prior link. */
export async function publishAdminGallery(id: string, actorId: string) {
  const current = await findAdminGallery(id);
  if (!current) throw new Error("Galería no encontrada.");
  const assets = await listAdminGalleryAssets(id);
  if (!assets.length) throw new Error("Añade fotografías o videos antes de publicar.");
  const token = newGalleryToken();
  const now = new Date();
  const { error } = await db().from("crisdal_client_galleries").update({
    status: "published", token_hash: tokenDigest(token), expires_at: expiryForPublication(now, 30),
    published_at: now.toISOString(), updated_by: actorId, updated_at: now.toISOString(),
  }).eq("id", id);
  if (error) throw error;
  return { gallery: await findAdminGallery(id), token };
}
export async function unpublishAdminGallery(id: string, actorId: string) {
  const { data, error } = await db().from("crisdal_client_galleries").update({
    status: "draft", token_hash: null, expires_at: null, published_at: null,
    updated_by: actorId, updated_at: new Date().toISOString(),
  }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Galería no encontrada.");
  return { ok: true };
}
export async function insertGalleryVideo(galleryId: string, input: { title: string; url: string }, actorId: string) {
  if (!isApprovedPrivateVideoLink(input.url)) throw new Error("Utiliza un enlace HTTPS oficial de YouTube o Vimeo.");
  if (input.title.trim().length < 2 || input.title.length > 180) throw new Error("Título de video inválido.");
  const gallery = await findAdminGallery(galleryId);
  if (!gallery) throw new Error("Galería no encontrada.");
  const items = await listAdminGalleryAssets(galleryId);
  const { data, error } = await db().from("crisdal_client_gallery_assets").insert({
    id: randomUUID(), gallery_id: galleryId, kind: "video", title: input.title.trim(),
    alt_text: input.title.trim(), external_url: input.url, sort_order: items.length,
  }).select(assetCols).single();
  if (error) throw error;
  void actorId; // permission and audit belong to API; row has no editor field
  return mapAsset(data as AssetRow);
}
export async function removeGalleryAsset(galleryId: string, assetId: string) {
  const items = await listAdminGalleryAssets(galleryId);
  const match = items.find((x) => x.id === assetId);
  if (!match) throw new Error("Archivo no encontrado en esta galería.");
  const { error } = await db().from("crisdal_client_gallery_assets").delete().eq("id", assetId).eq("gallery_id", galleryId);
  if (error) throw error;
  const paths = [match.originalPath, match.previewPath, match.thumbPath].filter((x): x is string => Boolean(x));
  if (paths.length) {
    const { error: storageError } = await db().storage.from(DELIVERY_BUCKET).remove(paths);
    if (storageError) throw storageError;
  }
  return { ok: true };
}
export async function reorderGalleryAssets(galleryId: string, assetIds: string[]) {
  const actual = await listAdminGalleryAssets(galleryId);
  if (actual.length !== assetIds.length || new Set(assetIds).size !== assetIds.length ||
    assetIds.some((id) => !actual.some((x) => x.id === id))) throw new Error("Orden de medios inválido.");
  for (const [index, id] of assetIds.entries()) {
    const { error } = await db().from("crisdal_client_gallery_assets").update({ sort_order: index }).eq("gallery_id", galleryId).eq("id", id);
    if (error) throw error;
  }
  return { ok: true };
}
async function findGalleryByToken(token: string) {
  let hash: string;
  try { hash = tokenDigest(token); } catch { return null; }
  const { data, error } = await db().from("crisdal_client_galleries").select(galleryCols).eq("token_hash", hash).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const gallery = mapGallery(data as GalleryRow);
  return canOpenPrivateGallery(gallery) ? gallery : null;
}
export async function getPrivateGalleryView(token: string): Promise<PrivateGalleryView | null> {
  const gallery = await findGalleryByToken(token);
  if (!gallery || !gallery.expiresAt) return null;
  const assets = await listAdminGalleryAssets(gallery.id);
  const paths = assets.filter((asset) => asset.kind === "image")
    .flatMap((asset) => [asset.previewPath, asset.thumbPath]).filter((x): x is string => Boolean(x));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data, error } = await db().storage.from(DELIVERY_BUCKET).createSignedUrls(paths, 300);
    if (error || !data) throw error || new Error("No se pudieron firmar las imágenes privadas.");
    for (const entry of data) if (entry.signedUrl && entry.path) signed.set(entry.path, entry.signedUrl);
    if (paths.some((path) => !signed.has(path))) throw new Error("Faltan imágenes privadas autorizadas.");
  }
  return {
    id: gallery.id, title: gallery.title, eventType: gallery.eventType, description: gallery.description,
    expiresAt: gallery.expiresAt, allowDownloads: gallery.allowDownloads,
    assets: assets.map((asset) => ({
      id: asset.id, kind: asset.kind, title: asset.title, alt: asset.alt,
      previewUrl: asset.previewPath ? signed.get(asset.previewPath) || null : null,
      thumbUrl: asset.thumbPath ? signed.get(asset.thumbPath) || null : null,
      externalUrl: asset.externalUrl, favorite: asset.favorite,
    })),
  };
}
export async function setPrivateGalleryFavorite(token: string, assetId: string, favorite: boolean) {
  const gallery = await findGalleryByToken(token);
  if (!gallery || !/^[0-9a-f-]{36}$/i.test(assetId)) return false;
  const { data, error } = await db().from("crisdal_client_gallery_assets")
    .update({ favorite }).eq("id", assetId).eq("gallery_id", gallery.id).eq("kind", "image").select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
export async function createPrivateGalleryDownload(token: string, assetId: string) {
  const gallery = await findGalleryByToken(token);
  if (!gallery || !gallery.allowDownloads) return null;
  const { data, error } = await db().from("crisdal_client_gallery_assets")
    .select("id,original_path,original_name,kind").eq("id", assetId).eq("gallery_id", gallery.id).eq("kind", "image").maybeSingle();
  if (error) throw error;
  if (!data?.original_path) return null;
  const { data: signed, error: signingError } = await db().storage.from(DELIVERY_BUCKET)
    .createSignedUrl(data.original_path, 60, { download: safeDownloadFilename(data.original_name, assetId) });
  if (signingError) throw signingError;
  return signed?.signedUrl || null;
}
