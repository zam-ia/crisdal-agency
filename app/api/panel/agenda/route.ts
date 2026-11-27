import { z } from "zod";
import { readBoundedJson, JsonBodyError } from "../../../lib/os/bounded-json";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { agendaInputSchema, conflictsWith } from "../../../lib/os/agenda";
import { AgendaRepository } from "../../../lib/os/agenda-repository";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const rangeSchema = z.object({ from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional() });

export async function GET(request: Request) {
  const auth = await authorizePanelApi(request, "calendar.read");
  if ("response" in auth) return auth.response;
  const query = new URL(request.url).searchParams;
  const parsed = rangeSchema.safeParse({ from: query.get("from") ?? undefined, to: query.get("to") ?? undefined });
  if (!parsed.success || (parsed.data.from && parsed.data.to && Date.parse(parsed.data.from) >= Date.parse(parsed.data.to))) {
    return Response.json({ error: "Rango inválido." }, { status: 400, headers });
  }
  try {
    const items = await new AgendaRepository().list(parsed.data.from, parsed.data.to);
    return Response.json({ items }, { headers });
  } catch {
    return Response.json({ error: "No se pudo leer la agenda." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "calendar.write", true);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try {
    body = await readBoundedJson(request, 8_000);
  } catch (error) {
    return Response.json({ error: error instanceof JsonBodyError ? error.message : "Datos inválidos." }, { status: error instanceof JsonBodyError ? error.status : 400, headers });
  }
  const parsed = agendaInputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Datos inválidos." }, { status: 400, headers });
  try {
    const repository = new AgendaRepository();
    const overlapping = await repository.list(parsed.data.startsAt, parsed.data.endsAt);
    if (conflictsWith(overlapping, parsed.data).length) return Response.json({ error: "El horario se superpone con otra actividad." }, { status: 409, headers });
    return Response.json({ item: await repository.save(parsed.data, auth.session.userId) }, { headers });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23P01") {
      return Response.json({ error: "El horario se superpone con otra actividad." }, { status: 409, headers });
    }
    return Response.json({ error: "No se pudo guardar la actividad." }, { status: 503, headers });
  }
}
