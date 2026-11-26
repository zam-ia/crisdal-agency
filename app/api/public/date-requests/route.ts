import { createHmac } from "node:crypto";
import {JsonBodyError,readBoundedJson} from "../../../lib/os/bounded-json";
import { validateInquiry } from "../../../lib/availability/inquiry";
import { peruToday } from "../../../lib/availability/public-calendar";
import { savePublicInquiry } from "../../../lib/availability/repository";
import { isTrustedOrigin } from "../../../lib/os/security";

export const runtime = "nodejs";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isTrustedOrigin({ origin: request.headers.get("origin"), host: request.headers.get("host"), forwardedHost: request.headers.get("x-forwarded-host") })) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403, headers: NO_CACHE });
  }
  let parsed:unknown;
  try { parsed=await readBoundedJson(request,4500); }
  catch(error){return Response.json({error:error instanceof JsonBodyError?error.message:"Formulario inválido."},{status:error instanceof JsonBodyError?error.status:400,headers:NO_CACHE});}
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
