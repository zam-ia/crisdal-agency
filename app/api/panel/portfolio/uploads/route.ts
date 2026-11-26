import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { authorizePanelApi } from "../../../../lib/commercial/api-auth";
import { detectedImageMime } from "../../../../lib/commercial/portfolio";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;
const signSchema = z.object({ action: z.literal("sign"), projectId: z.string().uuid(), fileName: z.string().min(1).max(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]), sizeBytes: z.number().int().positive().max(MAX_BYTES) });
const confirmSchema = z.object({ action: z.literal("confirm"), projectId: z.string().uuid(), intentId: z.string().uuid(), alt: z.string().min(3).max(240), orientation: z.enum(["portrait", "landscape", "square"]) });

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage", true);
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const sign = signSchema.safeParse(body);
  const confirm = confirmSchema.safeParse(body);
  if (!sign.success && !confirm.success) return Response.json({ error: "Datos de carga inválidos." }, { status: 400 });
  const db = getSupabaseAdmin();

  if (sign.success) {
    const input = sign.data;
    const { data: project } = await db.from("portfolio_projects").select("id").eq("id", input.projectId).maybeSingle();
    if (!project) return Response.json({ error: "Guarda el proyecto antes de subir imágenes." }, { status: 404 });
    const intentId = randomUUID();
    const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
    const storagePath = `drafts/${input.projectId}/${intentId}.${extension}`;
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const { error: intentError } = await db.from("portfolio_upload_intents").insert({ id: intentId, project_id: input.projectId, storage_path: storagePath, mime_type: input.mimeType, size_bytes: input.sizeBytes, created_by: auth.session.userId, expires_at: expiresAt });
    if (intentError) return Response.json({ error: "No se pudo preparar la carga privada." }, { status: 503 });
    const { data, error } = await db.storage.from("crisdal-private-media").createSignedUploadUrl(storagePath);
    if (error || !data) return Response.json({ error: "No se pudo firmar la carga privada." }, { status: 503 });
    return Response.json({ intentId, storagePath, signedUrl: data.signedUrl, token: data.token, expiresAt });
  }

  if (!confirm.success) return Response.json({ error: "Confirmación inválida." }, { status: 400 });
  const input = confirm.data;
  const { data: intent, error: intentError } = await db.from("portfolio_upload_intents").select("id,project_id,storage_path,mime_type,size_bytes,status,expires_at,created_by").eq("id", input.intentId).eq("project_id", input.projectId).eq("created_by", auth.session.userId).maybeSingle();
  if (intentError || !intent || intent.status !== "signed" || Date.parse(intent.expires_at) < Date.now()) return Response.json({ error: "La autorización de carga expiró. Reintenta el archivo." }, { status: 409 });
  const { data: object, error: downloadError } = await db.storage.from("crisdal-private-media").download(intent.storage_path);
  if (downloadError || !object) return Response.json({ error: "La carga aún no está disponible para verificar." }, { status: 409 });
  const original = new Uint8Array(await object.arrayBuffer());
  if (original.byteLength !== intent.size_bytes || detectedImageMime(original) !== intent.mime_type) {
    await db.from("portfolio_upload_intents").update({ status: "failed" }).eq("id", intent.id);
    await db.storage.from("crisdal-private-media").remove([intent.storage_path]);
    return Response.json({ error: "El archivo recibido no coincide con la imagen autorizada." }, { status: 415 });
  }
  try {
    const pipeline = sharp(original).rotate();
    const metadata = await pipeline.metadata();
    if (!metadata.width || !metadata.height) throw new Error("Imagen sin dimensiones verificables.");
    const assetId = randomUUID();
    const optimized = await sharp(original).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toBuffer();
    const thumbnail = await sharp(original).rotate().resize({ width: 560, height: 560, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 3 }).toBuffer();
    const privatePath = `optimized/${input.projectId}/${assetId}.webp`;
    const thumbnailPath = `thumbnails/${input.projectId}/${assetId}.webp`;
    const [{ error: optimizedError }, { error: thumbnailError }] = await Promise.all([
      db.storage.from("crisdal-private-media").upload(privatePath, optimized, { contentType: "image/webp", upsert: false }),
      db.storage.from("crisdal-private-media").upload(thumbnailPath, thumbnail, { contentType: "image/webp", upsert: false }),
    ]);
    if (optimizedError || thumbnailError) throw optimizedError || thumbnailError;
    const { data: links } = await db.from("portfolio_media").select("id").eq("project_id", input.projectId);
    const { error: assetError } = await db.from("media_assets").insert({ id: assetId, kind: "image", provider: "supabase", storage_bucket: "crisdal-private-media", storage_path: privatePath, private_storage_path: privatePath, thumbnail_storage_path: thumbnailPath, public_url: `private:${assetId}`, poster_url: `private:${assetId}:thumbnail`, alt_text: input.alt, orientation: input.orientation, mime_type: "image/webp", size_bytes: optimized.byteLength, width: metadata.width, height: metadata.height, sha256: createHash("sha256").update(optimized).digest("hex"), created_by: auth.session.userId, publication_authorized: false });
    if (assetError) throw assetError;
    const { error: linkError } = await db.from("portfolio_media").insert({ project_id: input.projectId, media_asset_id: assetId, sort_order: links?.length || 0 });
    if (linkError) throw linkError;
    await db.from("portfolio_upload_intents").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", intent.id);
    await db.storage.from("crisdal-private-media").remove([intent.storage_path]);
    const [{ data: signed }, { data: poster }] = await Promise.all([
      db.storage.from("crisdal-private-media").createSignedUrl(privatePath, 900),
      db.storage.from("crisdal-private-media").createSignedUrl(thumbnailPath, 900),
    ]);
    return Response.json({ media: { id: assetId, kind: "image", url: signed?.signedUrl, posterUrl: poster?.signedUrl || null, alt: input.alt, orientation: input.orientation, sortOrder: links?.length || 0, mimeType: "image/webp", width: metadata.width, height: metadata.height } });
  } catch {
    await db.from("portfolio_upload_intents").update({ status: "failed" }).eq("id", intent.id);
    return Response.json({ error: "No se pudo verificar y optimizar la imagen." }, { status: 503 });
  }
}
