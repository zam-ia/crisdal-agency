import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { authorizePanelApi } from "../../../../lib/commercial/api-auth";
import { DELIVERY_BUCKET, MAX_DELIVERY_IMAGE_BYTES, detectedDeliveryImageMime } from "../../../../lib/deliveries/domain";
import { findAdminGallery, listAdminGalleryAssets } from "../../../../lib/deliveries/repository";
import { getSupabaseAdmin, getSupabaseUploadConfig } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
const NEVER_CACHE = { "Cache-Control": "no-store" };
const id = z.string().uuid();
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sign"), galleryId: id, fileName: z.string().min(1).max(255),
    mimeType: z.enum(["image/jpeg","image/png","image/webp","image/avif"]),
    sizeBytes: z.number().int().positive().max(MAX_DELIVERY_IMAGE_BYTES),
  }),
  z.object({ action: z.literal("confirm"), galleryId: id, intentId: id, alt: z.string().max(240) }),
]);
export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "projects.write", true);
  if ("response" in auth) return auth.response;
  if (Number(request.headers.get("content-length") || 0) > 4000) return Response.json({ error: "Datos demasiado grandes." }, { status: 413 });
  const parse = schema.safeParse(await request.json().catch(() => null));
  if (!parse.success) return Response.json({ error: "Carga inválida." }, { status: 422, headers: NEVER_CACHE });
  const input = parse.data;
  try {
    const gallery = await findAdminGallery(input.galleryId);
    if (!gallery || gallery.status === "archived") return Response.json({ error: "Galería no disponible." }, { status: 404 });
    const db = getSupabaseAdmin();
    if (input.action === "sign") {
      const intentId = randomUUID();
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType === "image/png" ? "png" : input.mimeType === "image/avif" ? "avif" : "webp";
      const path = `client-deliveries/${gallery.id}/original/${intentId}.${extension}`;
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const { error: intentError } = await db.from("crisdal_client_gallery_upload_intents").insert({
        id: intentId, gallery_id: gallery.id, storage_path: path, mime_type: input.mimeType,
        size_bytes: input.sizeBytes, file_name: input.fileName, created_by: auth.session.userId, expires_at: expiresAt,
      });
      if (intentError) throw intentError;
      const { data, error } = await db.storage.from(DELIVERY_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw error || new Error("Firma no disponible.");
      const publicConfig = getSupabaseUploadConfig();
      return Response.json({ intentId, storagePath: path, token: data.token, uploadConfig: publicConfig, expiresAt }, { headers: NEVER_CACHE });
    }

    const { data: intent, error: intentError } = await db.from("crisdal_client_gallery_upload_intents")
      .select("id,gallery_id,storage_path,file_name,mime_type,size_bytes,status,created_by,expires_at")
      .eq("id", input.intentId).eq("gallery_id", gallery.id).eq("created_by", auth.session.userId).maybeSingle();
    if (intentError || !intent || intent.status !== "signed" || Date.parse(intent.expires_at) <= Date.now())
      return Response.json({ error: "La autorización de carga venció; vuelve a subir la imagen." }, { status: 409, headers: NEVER_CACHE });
    const { data: file, error: downloadError } = await db.storage.from(DELIVERY_BUCKET).download(intent.storage_path);
    if (downloadError || !file) return Response.json({ error: "El archivo todavía no está disponible." }, { status: 409, headers: NEVER_CACHE });
    const raw = new Uint8Array(await file.arrayBuffer());
    if (raw.byteLength !== intent.size_bytes || detectedDeliveryImageMime(raw) !== intent.mime_type) {
      await db.from("crisdal_client_gallery_upload_intents").update({ status: "failed" }).eq("id", intent.id);
      await db.storage.from(DELIVERY_BUCKET).remove([intent.storage_path]);
      return Response.json({ error: "El archivo no coincide con el formato y tamaño autorizados." }, { status: 415, headers: NEVER_CACHE });
    }
    try {
      const metadata = await sharp(raw, { limitInputPixels: 80_000_000 }).metadata();
      if (!metadata.width || !metadata.height || metadata.width * metadata.height > 80_000_000)
        throw new Error("Dimensiones de imagen excesivas.");
      const assetId = randomUUID();
      const base = `client-deliveries/${gallery.id}/derived/${assetId}`;
      const previewPath = `${base}-web.webp`, thumbnailPath = `${base}-thumb.webp`;
      const [preview, thumbnail] = await Promise.all([
        sharp(raw).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toBuffer(),
        sharp(raw).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 3 }).toBuffer(),
      ]);
      const [{ error: previewError }, { error: thumbError }] = await Promise.all([
        db.storage.from(DELIVERY_BUCKET).upload(previewPath, preview, { contentType: "image/webp", upsert: false }),
        db.storage.from(DELIVERY_BUCKET).upload(thumbnailPath, thumbnail, { contentType: "image/webp", upsert: false }),
      ]);
      if (previewError || thumbError) throw previewError || thumbError;
      const previous = await listAdminGalleryAssets(gallery.id);
      const { data, error: insertError } = await db.from("crisdal_client_gallery_assets").insert({
        id: assetId, gallery_id: gallery.id, kind: "image", title: intent.file_name, alt_text: input.alt || intent.file_name,
        original_name: intent.file_name, original_path: intent.storage_path, preview_path: previewPath, thumbnail_path: thumbnailPath,
        mime_type: intent.mime_type, size_bytes: raw.byteLength, sort_order: previous.length,
      }).select("id").single();
      if (insertError) throw insertError;
      await db.from("crisdal_client_gallery_upload_intents").update({ status: "confirmed" }).eq("id", intent.id);
      return Response.json({ ok: true, assetId: data.id }, { headers: NEVER_CACHE });
    } catch {
      await db.from("crisdal_client_gallery_upload_intents").update({ status: "failed" }).eq("id", intent.id);
      return Response.json({ error: "No se pudo optimizar y registrar la fotografía. Revisa el archivo." }, { status: 503, headers: NEVER_CACHE });
    }
  } catch {
    return Response.json({ error: "No se pudo preparar o confirmar la carga. Comprueba Supabase." }, { status: 503, headers: NEVER_CACHE });
  }
}
