import { authorizePanelApi } from "../../../../lib/commercial/api-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage", true);
  if ("response" in auth) return auth.response;
  return Response.json({ error: "Esta carga fue reemplazada por el flujo privado firmado. Actualiza el panel y reintenta." }, { status: 410 });
}
