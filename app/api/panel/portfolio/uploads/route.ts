import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { authorizePanelApi } from "../../../../lib/commercial/api-auth";
import { detectedImageMime, type PortfolioMedia } from "../../../../lib/commercial/portfolio";
import { readBoundedJson, JsonBodyError } from "../../../../lib/os/bounded-json";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const maxBytes = 12 * 1024 * 1024;
const maxPixels = 80_000_000;
const bucket = "crisdal-private-media";
const signSchema = z.object({
  action: z.literal("sign"), projectId: z.uuid(), fileName: z.string().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]), sizeBytes: z.number().int().positive().max(maxBytes),
});
const confirmSchema = z.object({
  action: z.literal("confirm"), projectId: z.uuid(), intentId: z.uuid(),
  alt: z.string().trim().min(3).max(240), orientation: z.enum(["portrait", "landscape", "square"]),
});

type Database = ReturnType<typeof getSupabaseAdmin>;
function failure(error: string, status: number) {
  return Response.json({ error }, { status, headers });
}

async function linkedMedia(db: Database, projectId: string, assetId: string): Promise<PortfolioMedia | null> {
  const { data: link, error } = await db.from("portfolio_media")
    .select("sort_order,media_assets(id,kind,public_url,poster_url,alt_text,orientation,mime_type,width,height,private_storage_path,thumbnail_storage_path)")
    .eq("project_id", projectId).eq("media_asset_id", assetId).maybeSingle();
  if (error) throw error;
  const asset = Array.isArray(link?.media_assets) ? link.media_assets[0] : link?.media_assets;
  if (!asset || asset.kind !== "image") return null;
  const storage = db.storage.from(bucket);
  const [image, thumb] = await Promise.all([
    asset.private_storage_path ? storage.createSignedUrl(asset.private_storage_path, 900) : null,
    asset.thumbnail_storage_path ? storage.createSignedUrl(asset.thumbnail_storage_path, 900) : null,
  ]);
  const url = image?.data?.signedUrl ?? asset.public_url;
  if (!url || url.startsWith("private:")) throw new Error("No se pudo preparar la vista privada.");
  return {
    id: asset.id, kind: "image", url, alt: asset.alt_text, orientation: asset.orientation as PortfolioMedia["orientation"],
    posterUrl: thumb?.data?.signedUrl ?? (asset.poster_url && !asset.poster_url.startsWith("private:") ? asset.poster_url : null),
    sortOrder: link?.sort_order ?? 0, mimeType: asset.mime_type, width: asset.width, height: asset.height,
  };
}

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage", true);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try {
    body = await readBoundedJson(request, 4096);
  } catch (error) {
    return failure(error instanceof JsonBodyError ? error.message : "Datos de carga inválidos.", error instanceof JsonBodyError ? error.status : 400);
  }
  const sign = signSchema.safeParse(body);
  const confirm = confirmSchema.safeParse(body);
  if (!sign.success && !confirm.success) return failure("Datos de carga inválidos.", 400);
  try {
    const db = getSupabaseAdmin();
    const storage = db.storage.from(bucket);
    if (sign.success) {
      const input = sign.data;
      const { data: project, error: projectError } = await db.from("portfolio_projects").select("id").eq("id", input.projectId).maybeSingle();
      if (projectError) throw projectError;
      if (!project) return failure("Guarda el proyecto antes de subir imágenes.", 404);
      const intentId = randomUUID();
      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
      const storagePath = "drafts/" + input.projectId + "/" + intentId + "." + extension;
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const { data: upload, error: storageError } = await storage.createSignedUploadUrl(storagePath);
      if (storageError || !upload) throw storageError ?? new Error("No se pudo firmar la carga.");
      const { error: intentError } = await db.from("portfolio_upload_intents").insert({
        id: intentId, project_id: input.projectId, storage_path: storagePath, mime_type: input.mimeType,
        size_bytes: input.sizeBytes, created_by: auth.session.userId, expires_at: expiresAt,
      });
      if (intentError) throw intentError;
      return Response.json({ intentId, signedUrl: upload.signedUrl, expiresAt }, { headers });
    }
    if (!confirm.success) return failure("Confirmación inválida.", 400);
    const input = confirm.data;
    const { data: intent, error: intentError } = await db.from("portfolio_upload_intents")
      .select("id,storage_path,mime_type,size_bytes,status,expires_at")
      .eq("id", input.intentId).eq("project_id", input.projectId).eq("created_by", auth.session.userId).maybeSingle();
    if (intentError) throw intentError;
    if (!intent) return failure("No se encontró la autorización de carga.", 404);
    const assetId = intent.id as string;
    const recovered = await linkedMedia(db, input.projectId, assetId);
    if (recovered) {
      if (intent.status !== "confirmed") await db.from("portfolio_upload_intents").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", intent.id);
      await storage.remove([intent.storage_path]);
      return Response.json({ media: recovered }, { headers });
    }
    if (intent.status === "confirmed") return failure("Esta carga ya se confirmó. Actualiza la galería antes de repetir.", 409);
    if (intent.status !== "signed" || Date.parse(intent.expires_at) < Date.now()) return failure("La autorización de carga expiró. Reintenta el archivo.", 409);

    const { data: object, error: downloadError } = await storage.download(intent.storage_path);
    if (downloadError || !object) return failure("La carga aún no está disponible para verificar.", 409);
    if (object.size !== intent.size_bytes || object.size > maxBytes) {
      await db.from("portfolio_upload_intents").update({ status: "failed" }).eq("id", intent.id);
      await storage.remove([intent.storage_path]);
      return failure("El tamaño recibido no coincide con la autorización.", 415);
    }
    const original = new Uint8Array(await object.arrayBuffer());
    if (original.byteLength !== intent.size_bytes || detectedImageMime(original) !== intent.mime_type) {
      await db.from("portfolio_upload_intents").update({ status: "failed" }).eq("id", intent.id);
      await storage.remove([intent.storage_path]);
      return failure("El archivo recibido no coincide con la imagen autorizada.", 415);
    }

    let optimized: Buffer;
    let thumbnail: Buffer;
    let width: number;
    let height: number;
    try {
      const image = sharp(original, { limitInputPixels: maxPixels }).autoOrient();
      const [visible, small] = await Promise.all([
        image.clone().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toBuffer({ resolveWithObject: true }),
        image.clone().resize({ width: 560, height: 560, fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 3 }).toBuffer(),
      ]);
      optimized = visible.data;
      width = visible.info.width;
      height = visible.info.height;
      thumbnail = small;
    } catch {
      await db.from("portfolio_upload_intents").update({ status: "failed" }).eq("id", intent.id);
      await storage.remove([intent.storage_path]);
      return failure("No se pudo decodificar la fotografía. Expórtala como JPG o WebP y reintenta.", 415);
    }
    const sha256 = createHash("sha256").update(optimized).digest("hex");
    const { data: existing, error: lookupError } = await db.from("media_assets").select("id").eq("sha256", sha256).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.id && existing.id !== assetId) {
      const duplicate = await linkedMedia(db, input.projectId, existing.id);
      if (!duplicate) return failure("La misma fotografía ya está registrada en otro proyecto.", 409);
      await storage.remove([intent.storage_path]);
      await db.from("portfolio_upload_intents").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", intent.id);
      return Response.json({ media: duplicate }, { headers });
    }
    if (!existing) {
      const privatePath = "optimized/" + input.projectId + "/" + assetId + ".webp";
      const thumbnailPath = "thumbnails/" + input.projectId + "/" + assetId + ".webp";
      const written = await Promise.all([
        storage.upload(privatePath, optimized, { contentType: "image/webp", upsert: true }),
        storage.upload(thumbnailPath, thumbnail, { contentType: "image/webp", upsert: true }),
      ]);
      if (written.some((item) => item.error)) return failure("No se pudieron guardar las versiones de la foto. Reintenta la confirmación.", 503);
      const { error: assetError } = await db.from("media_assets").insert({
        id: assetId, kind: "image", provider: "supabase", storage_bucket: bucket, storage_path: privatePath,
        private_storage_path: privatePath, thumbnail_storage_path: thumbnailPath, public_url: "private:" + assetId,
        poster_url: "private:" + assetId + ":thumbnail", alt_text: input.alt, orientation: input.orientation,
        mime_type: "image/webp", size_bytes: optimized.byteLength, width, height, sha256,
        created_by: auth.session.userId, publication_authorized: false,
      });
      if (assetError) {
        const { data: concurrent } = await db.from("media_assets").select("id").eq("id", assetId).maybeSingle();
        if (!concurrent) return failure("No se pudo registrar la fotografía. Reintenta la confirmación.", 503);
      }
    }
    const { count, error: countError } = await db.from("portfolio_media").select("id", { count: "exact", head: true }).eq("project_id", input.projectId);
    if (countError) throw countError;
    const { error: linkError } = await db.from("portfolio_media").upsert({
      project_id: input.projectId, media_asset_id: assetId, sort_order: count ?? 0,
    }, { onConflict: "project_id,media_asset_id", ignoreDuplicates: true });
    if (linkError) throw linkError;
    const media = await linkedMedia(db, input.projectId, assetId);
    if (!media) throw new Error("No se confirmó el vínculo de la foto.");
    await db.from("portfolio_upload_intents").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", intent.id);
    await storage.remove([intent.storage_path]);
    return Response.json({ media }, { headers });
  } catch {
    return failure("No se pudo verificar y optimizar la imagen. Conserva la cola y reintenta.", 503);
  }
}
