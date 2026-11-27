import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { createPackageRepository } from "../../../lib/commercial/package-repository";
import { createPackageShare } from "../../../lib/commercial/package-service";
import { createOsAuthRepository } from "../../../lib/os/auth-repository";
import { readBoundedJson, JsonBodyError } from "../../../lib/os/bounded-json";
import { fingerprint, newRequestId } from "../../../lib/os/security";

const headers = { "Cache-Control": "no-store" };
const createSchema = z.object({ packageIds: z.array(z.uuid()).min(1).max(24), message: z.string().min(20).max(1200) });
const revokeSchema = z.object({ action: z.literal("revoke"), campaignId: z.uuid() });

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "packages.read", true);
  if ("response" in auth) return auth.response;
  let body: unknown;
  try {
    body = await readBoundedJson(request, 16_000);
  } catch (error) {
    return Response.json({ error: error instanceof JsonBodyError ? error.message : "Solicitud inválida." }, { status: error instanceof JsonBodyError ? error.status : 400, headers });
  }
  const revoke = revokeSchema.safeParse(body);
  const create = createSchema.safeParse(body);
  if (!revoke.success && !create.success) return Response.json({ error: "Selección o mensaje inválido." }, { status: 400, headers });
  const actor = auth.session.userId;
  const audit = {
    actorUserId: actor, entityType: "package_share_link", requestId: newRequestId(),
    ipHash: fingerprint(request.headers.get("x-real-ip") ?? "packages:unknown"),
  };
  try {
    const repo = createPackageRepository();
    if (revoke.success) {
      const campaignId = revoke.data.campaignId;
      if (!(await repo.revokeShare(campaignId, actor))) {
        return Response.json({ error: "No se encontró el enlace." }, { status: 404, headers });
      }
      await createOsAuthRepository().writeAudit({ ...audit, action: "package.share.revoked", entityId: campaignId, metadata: {} });
      return Response.json({ ok: true }, { headers });
    }
    if (create.success) {
      const share = await createPackageShare(repo, [...new Set(create.data.packageIds)], create.data.message, actor);
      await createOsAuthRepository().writeAudit({ ...audit, action: "package.share.created", entityId: share.campaignId, metadata: { packageCount: share.packages.length } });
      return Response.json({ share }, { headers });
    }
    return Response.json({ error: "Operación inválida." }, { status: 400, headers });
  } catch (error) {
    const message = error instanceof Error && ["Selecciona paquetes publicados válidos.", "Revisa el mensaje para compartir."].includes(error.message)
      ? error.message : "No se pudo completar la operación con el enlace.";
    return Response.json({ error: message }, { status: message.startsWith("No se pudo") ? 503 : 422, headers });
  }
}
