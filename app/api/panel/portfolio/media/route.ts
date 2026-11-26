import sharp from "sharp";
import { authorizePanelApi } from "../../../../lib/commercial/api-auth";
import { detectedImageMime } from "../../../../lib/commercial/portfolio";
import { createPortfolioRepository } from "../../../../lib/commercial/portfolio-repository";
import { createOsAuthRepository } from "../../../../lib/os/auth-repository";
import { fingerprint, newRequestId } from "../../../../lib/os/security";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage", true);
  if ("response" in auth) return auth.response;
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_IMAGE_BYTES + 1024 * 128) return Response.json({ error: "La imagen supera 12 MB." }, { status: 413 });
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Carga inválida." }, { status: 400 });
  const file = form.get("file");
  const projectId = String(form.get("projectId") || "");
  const alt = String(form.get("alt") || "").trim();
  const orientation = String(form.get("orientation") || "landscape") as "portrait" | "landscape" | "square";
  if (!(file instanceof File) || !/^[a-f0-9-]{36}$/i.test(projectId) || alt.length < 3 || !["portrait", "landscape", "square"].includes(orientation)) return Response.json({ error: "Archivo o metadatos inválidos." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "La imagen supera 12 MB." }, { status: 413 });
  const original = new Uint8Array(await file.arrayBuffer());
  const detected = detectedImageMime(original);
  if (!detected || detected !== file.type) return Response.json({ error: "El contenido no coincide con un formato de imagen permitido." }, { status: 415 });
  try {
    const optimized = new Uint8Array(await sharp(original).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, effort: 4 }).toBuffer());
    const media = await createPortfolioRepository().addUploadedImage(projectId, { bytes: optimized, mimeType: "image/webp", extension: "webp", alt, orientation }, auth.session.userId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    await createOsAuthRepository().writeAudit({ actorUserId: auth.session.userId, action: "portfolio.image.uploaded", entityType: "portfolio_project", entityId: projectId, requestId: newRequestId(), ipHash: fingerprint(forwarded), metadata: { mediaId: media.id, sizeBytes: optimized.byteLength } });
    return Response.json({ media });
  } catch { return Response.json({ error: "No se pudo procesar o almacenar la imagen." }, { status: 503 }); }
}
