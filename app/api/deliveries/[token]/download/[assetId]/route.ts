import { createPrivateGalleryDownload } from "../../../../../lib/deliveries/repository";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ token: string; assetId: string }> }) {
  if (process.env.CRISDAL_PRIVATE_DELIVERIES_ENABLED !== "true") return Response.json({ error: "No disponible." }, { status: 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const { token, assetId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(assetId))
    return new Response("Archivo no disponible.", { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    const signedUrl = await createPrivateGalleryDownload(token, assetId);
    if (!signedUrl) return new Response("Archivo no disponible.", { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(null, { status: 302, headers: { Location: signedUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return new Response("No se pudo preparar la descarga.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
