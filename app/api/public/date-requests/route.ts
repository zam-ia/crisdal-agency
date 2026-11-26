import { createHmac } from "node:crypto";
import { validateInquiry } from "../../../lib/availability/inquiry";
import { peruToday } from "../../../lib/availability/public-calendar";
import { savePublicInquiry } from "../../../lib/availability/repository";
import { isTrustedOrigin } from "../../../lib/os/security";

export const runtime = "nodejs";
const NO_CACHE = { "Cache-Control": "no-store" };

async function readBodyBounded(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let output = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error("BODY_TOO_LARGE");
      output += decoder.decode(value, { stream: true });
    }
    return output + decoder.decode();
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  if (!isTrustedOrigin({ origin: request.headers.get("origin"), host: request.headers.get("host"), forwardedHost: request.headers.get("x-forwarded-host") })) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403, headers: NO_CACHE });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Formato no admitido." }, { status: 415, headers: NO_CACHE });
  }
  if (Number(request.headers.get("content-length") || 0) > 4500) {
    return Response.json({ error: "Solicitud demasiado larga." }, { status: 413, headers: NO_CACHE });
  }
  let text: string;
  try { text = await readBodyBounded(request, 4500); }
  catch { return Response.json({ error: "Solicitud demasiado larga." }, { status: 413, headers: NO_CACHE }); }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return Response.json({ error: "Formulario inválido." }, { status: 400, headers: NO_CACHE }); }
  const validated = validateInquiry(parsed, peruToday());
  if (!validated.ok) return Response.json({ error: "Revisa los campos.", errors: validated.errors }, { status: 422, headers: NO_CACHE });
  const secret = process.env.OS_AUDIT_PEPPER;
  if (!secret || secret.length < 32) return Response.json({ error: "El formulario aún no está activado. Utiliza WhatsApp." }, { status: 503, headers: NO_CACHE });
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  try {
    const id = await savePublicInquiry(validated.value, ipHash);
    return Response.json({ ok: true, reference: id, message: "Recibimos tu solicitud. La fecha aún no está reservada." }, { status: 201, headers: NO_CACHE });
  } catch (error) {
    if (error instanceof Error && error.message === "CRISDAL_RATE_LIMIT") {
      return Response.json({ error: "Demasiadas solicitudes. Intenta más tarde o consulta por WhatsApp." }, { status: 429, headers: NO_CACHE });
    }
    return Response.json({ error: "No pudimos registrar la solicitud. Puedes continuar por WhatsApp." }, { status: 503, headers: NO_CACHE });
  }
}
