import { z } from "zod";
import { setPrivateGalleryFavorite } from "../../../../lib/deliveries/repository";
import { isTrustedOrigin } from "../../../../lib/os/security";
export const runtime = "nodejs";
const HEADERS = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const schema = z.object({ assetId: z.string().uuid(), favorite: z.boolean() });
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isTrustedOrigin({ origin: request.headers.get("origin"), host: request.headers.get("host"), forwardedHost: request.headers.get("x-forwarded-host") }))
    return Response.json({ error: "Origen inválido." }, { status: 403, headers: HEADERS });
  if (Number(request.headers.get("content-length") || 0) > 800)
    return Response.json({ error: "Solicitud inválida." }, { status: 413, headers: HEADERS });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Datos inválidos." }, { status: 422, headers: HEADERS });
  const { token } = await params;
  try {
    const ok = await setPrivateGalleryFavorite(token, parsed.data.assetId, parsed.data.favorite);
    return ok ? Response.json({ ok: true, favorite: parsed.data.favorite }, { headers: HEADERS }) :
      Response.json({ error: "Galería o fotografía no disponible." }, { status: 404, headers: HEADERS });
  } catch {
    return Response.json({ error: "No se pudo guardar la selección." }, { status: 503, headers: HEADERS });
  }
}
