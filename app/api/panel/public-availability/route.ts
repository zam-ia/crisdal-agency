import { readBoundedJson } from "../../../lib/os/bounded-json";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { peruToday, validDay, withinPublicHorizon } from "../../../lib/availability/public-calendar";
import { verifiedPublicDays } from "../../../lib/availability/repository";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";
export const runtime = "nodejs";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const auth = await authorizePanelApi(request, "calendar.read");
  if ("response" in auth) return auth.response;
  const month = new URL(request.url).searchParams.get("month") || peruToday().slice(0,7);
  if (!withinPublicHorizon(month, peruToday())) return Response.json({ error: "Mes inválido." }, { status: 400, headers: NO_CACHE });
  try {
    const days = await verifiedPublicDays(month);
    return Response.json({ month, days: days.map((item) => ({ day: item.day, status: item.status, verified_until: item.verifiedUntil, source: item.status === "unavailable" ? "agenda" : "verified" })) }, { headers: NO_CACHE });
  } catch { return Response.json({ error: "Calendario administrativo sin activar." }, { status: 503, headers: NO_CACHE }); }
}

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "calendar.write", true);
  if ("response" in auth) return auth.response;
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "Formato inválido." }, { status: 415 });
  const parsed = z.object({ day: z.string().refine(validDay), status: z.enum(["available", "clear"]), acknowledged: z.literal(true) }).safeParse(await readBoundedJson(request, 120000).catch(() => null));
  const today = peruToday();
  if (!parsed.success || parsed.data.day < today || !withinPublicHorizon(parsed.data.day.slice(0, 7), today)) {
    return Response.json({ error: "Fecha, estado o confirmación de revisión inválidos." }, { status: 422, headers: NO_CACHE });
  }
  const secret = process.env.OS_AUDIT_PEPPER;
  if (!secret || secret.length < 32) return Response.json({ error: "Configuración incompleta." }, { status: 503 });
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  try {
    const { data, error } = await getSupabaseAdmin().rpc("crisdal_set_public_availability_day", {
      p_day: parsed.data.day, p_status: parsed.data.status, p_actor_id: auth.session.userId, p_ip_hash: ipHash,
    });
    if (error || data !== true) throw error || new Error("No confirmado.");
    return Response.json({ ok: true, notice: "Estado verificado publicado con una caducidad máxima de 12 horas." }, { headers: NO_CACHE });
  } catch { return Response.json({ error: "No se pudo actualizar el calendario público." }, { status: 503, headers: NO_CACHE }); }
}
