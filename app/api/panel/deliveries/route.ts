import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { EVENT_TYPES } from "../../../lib/deliveries/domain";
import {
  findAdminGallery, insertGalleryVideo, listAdminGalleries, listAdminGalleryAssets,
  publishAdminGallery, removeGalleryAsset, reorderGalleryAssets, saveAdminGallery,
  unpublishAdminGallery,
} from "../../../lib/deliveries/repository";
import { createOsAuthRepository } from "../../../lib/os/auth-repository";
import { fingerprint, newRequestId } from "../../../lib/os/security";

export const runtime = "nodejs";
const NO_CACHE = { "Cache-Control": "no-store" };
const uuid = z.string().uuid();
const galleryInput = z.object({
  id: uuid.optional(), title: z.string().min(1).max(150),
  eventType: z.enum(EVENT_TYPES), description: z.string().max(1800),
  allowDownloads: z.boolean(),
});
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), gallery: galleryInput }),
  z.object({ action: z.literal("publish"), id: uuid }),
  z.object({ action: z.literal("unpublish"), id: uuid }),
  z.object({ action: z.literal("video"), galleryId: uuid, title: z.string().min(2).max(180), url: z.string().url().max(1500) }),
  z.object({ action: z.literal("removeAsset"), galleryId: uuid, assetId: uuid }),
  z.object({ action: z.literal("reorder"), galleryId: uuid, assetIds: z.array(uuid).max(500) }),
]);
async function audit(actorUserId: string, action: string, entityId: string) {
  await createOsAuthRepository().writeAudit({
    actorUserId, action, entityType: "client_delivery_gallery", entityId,
    requestId: newRequestId(), ipHash: fingerprint("admin:delivery-api"),
  });
}
export async function GET(request: Request) {
  const auth = await authorizePanelApi(request, "projects.write");
  if ("response" in auth) return auth.response;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (id) {
      if (!uuid.safeParse(id).success) return Response.json({ error: "Identificador inválido." }, { status: 400, headers: NO_CACHE });
      const gallery = await findAdminGallery(id);
      if (!gallery) return Response.json({ error: "Galería no encontrada." }, { status: 404, headers: NO_CACHE });
      const assets = await listAdminGalleryAssets(id);
      const { getSupabaseAdmin } = await import("../../../lib/supabase-admin");
      const { DELIVERY_BUCKET } = await import("../../../lib/deliveries/domain");
      const thumbnailPaths = assets.filter((asset) => asset.kind === "image")
        .map((asset) => asset.thumbPath).filter((path): path is string => Boolean(path));
      const thumbnails = new Map<string, string>();
      if (thumbnailPaths.length) {
        const { data: signed, error: signError } = await getSupabaseAdmin().storage
          .from(DELIVERY_BUCKET).createSignedUrls(thumbnailPaths, 300);
        if (signError || !signed) throw signError || new Error("No se pudo firmar la vista previa.");
        for (const item of signed) if (item.path && item.signedUrl) thumbnails.set(item.path, item.signedUrl);
      }
      return Response.json({ gallery, assets: assets.map((asset) => ({
        ...asset, thumbnailUrl: asset.thumbPath ? thumbnails.get(asset.thumbPath) || null : null,
      })) }, { headers: NO_CACHE });
    }
    return Response.json({ galleries: await listAdminGalleries() }, { headers: NO_CACHE });
  } catch {
    return Response.json({ error: "No se pudo acceder a las galerías. Verifica la activación de la base." }, { status: 503, headers: NO_CACHE });
  }
}
export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "projects.write", true);
  if ("response" in auth) return auth.response;
  if (Number(request.headers.get("content-length") || 0) > 16000) return Response.json({ error: "Petición demasiado grande." }, { status: 413 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisa los datos enviados." }, { status: 422, headers: NO_CACHE });
  const input = parsed.data;
  try {
    if (input.action === "save") {
      const gallery = await saveAdminGallery(input.gallery, auth.session.userId);
      if (!gallery) throw new Error("No se confirmó la operación.");
      await audit(auth.session.userId, "deliveries.gallery.saved", gallery.id);
      return Response.json({ gallery }, { headers: NO_CACHE });
    }
    if (input.action === "publish") {
      const result = await publishAdminGallery(input.id, auth.session.userId);
      await audit(auth.session.userId, "deliveries.gallery.published_or_rotated", input.id);
      // Token deliberately returned one time, never persisted in plaintext.
      return Response.json(result, { headers: NO_CACHE });
    }
    if (input.action === "unpublish") {
      await unpublishAdminGallery(input.id, auth.session.userId);
      await audit(auth.session.userId, "deliveries.gallery.unpublished", input.id);
      return Response.json({ ok: true }, { headers: NO_CACHE });
    }
    if (input.action === "video") {
      const asset = await insertGalleryVideo(input.galleryId, input, auth.session.userId);
      await audit(auth.session.userId, "deliveries.video.linked", input.galleryId);
      return Response.json({ asset }, { headers: NO_CACHE });
    }
    if (input.action === "removeAsset") {
      await removeGalleryAsset(input.galleryId, input.assetId);
      await audit(auth.session.userId, "deliveries.asset.removed", input.galleryId);
      return Response.json({ ok: true }, { headers: NO_CACHE });
    }
    await reorderGalleryAssets(input.galleryId, input.assetIds);
    await audit(auth.session.userId, "deliveries.assets.reordered", input.galleryId);
    return Response.json({ ok: true }, { headers: NO_CACHE });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo guardar." }, { status: 409, headers: NO_CACHE });
  }
}
