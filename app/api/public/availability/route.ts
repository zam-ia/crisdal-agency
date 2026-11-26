import { makePublicMonth, peruToday, withinPublicHorizon } from "../../../lib/availability/public-calendar";
import { verifiedPublicDays } from "../../../lib/availability/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const now = new Date(), today = peruToday(now);
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || today.slice(0,7);
  if (!withinPublicHorizon(month, today)) return Response.json({ error: "Mes fuera del calendario público." }, { status: 400, headers: NO_CACHE });
  try {
    const rows = await verifiedPublicDays(month);
    return Response.json(makePublicMonth({ month, today, now, verifiedDates: rows, sourceAvailable: true }), { headers: NO_CACHE });
  } catch {
    // Never manufacture a green "Disponible" state if the DB or migration is down.
    return Response.json(makePublicMonth({ month, today, now, verifiedDates: [], sourceAvailable: false }), { headers: NO_CACHE });
  }
}
