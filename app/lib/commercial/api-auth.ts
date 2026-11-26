import { getPanelSession } from "../os/dal";
import { sessionCan } from "../os/auth-service";
import type { Capability } from "../os/capabilities";
import { isTrustedOrigin } from "../os/security";

export async function authorizePanelApi(request: Request, capability: Capability, mutating = false) {
  if (mutating && !isTrustedOrigin({
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
  })) return { response: Response.json({ error: "Origen no válido." }, { status: 403 }) } as const;
  const session = await getPanelSession();
  if (!session) return { response: Response.json({ error: "Sesión requerida." }, { status: 401 }) } as const;
  if (!sessionCan(session, capability)) return { response: Response.json({ error: "Permiso insuficiente." }, { status: 403 }) } as const;
  return { session } as const;
}
