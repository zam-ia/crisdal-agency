import { createHmac } from "node:crypto";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { listPrivateDateInquiries, updatePrivateDateInquiry } from "../../../lib/availability/repository";
import { sessionCan } from "../../../lib/os/auth-service";

export const runtime = "nodejs";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await authorizePanelApi(request, "clients.read");
  if ("response" in auth) return auth.response;
  if (!sessionCan(auth.session, "calendar.read")) return Response.json({ error: "Permiso insuficiente." }, { status: 403, headers: NO_CACHE });
  try { return Response.json({ items: await listPrivateDateInquiries() }, { headers: NO_CACHE }); }
  catch { return Response.json({ error: "No se pudieron obtener las solicitudes." }, { status: 503, headers: NO_CACHE }); }
}

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "calendar.write", true);
  if ("response" in auth) return auth.response;
  if (!sessionCan(auth.session, "clients.read")) return Response.json({ error: "Permiso insuficiente." }, { status: 403, headers: NO_CACHE });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Formato inválido." }, { status: 415 });
  const body = await request.json().catch(() => null);
  if (!body || !/^[a-f0-9-]{36}$/i.test(body.id || "") || !["new", "contacted", "closed", "spam"].includes(body.state)) {
    return Response.json({ error: "Datos inválidos." }, { status: 400, headers: NO_CACHE });
  }
  const secret = process.env.OS_AUDIT_PEPPER;
  if (!secret || secret.length < 32) return Response.json({ error: "Configuración incompleta." }, { status: 503 });
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  try {
    await updatePrivateDateInquiry(body.id, body.state, auth.session.userId, ipHash);
    return Response.json({ ok: true }, { headers: NO_CACHE });
  } catch { return Response.json({ error: "No se pudo actualizar la solicitud." }, { status: 503, headers: NO_CACHE }); }
}
