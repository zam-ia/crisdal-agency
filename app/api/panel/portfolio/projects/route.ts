import { z } from "zod";
import { authorizePanelApi } from "../../../../lib/commercial/api-auth";
import { portfolioDraftInputSchema, portfolioStatusSchema } from "../../../../lib/commercial/portfolio";
import { createPortfolioRepository } from "../../../../lib/commercial/portfolio-repository";
import { addPortfolioVideo, changePortfolioStatus, reorderPortfolioMedia, savePortfolioProject } from "../../../../lib/commercial/portfolio-service";
import { createOsAuthRepository } from "../../../../lib/os/auth-repository";
import { fingerprint, newRequestId } from "../../../../lib/os/security";

export const runtime = "nodejs";
const mutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), project: portfolioDraftInputSchema }),
  z.object({ action: z.literal("status"), id: z.string().uuid(), status: portfolioStatusSchema }),
  z.object({ action: z.literal("reorder"), id: z.string().uuid(), mediaIds: z.array(z.string().uuid()).max(100) }),
  z.object({ action: z.literal("video"), id: z.string().uuid(), url: z.string().url(), posterUrl: z.string().url().nullable().optional(), alt: z.string().min(3).max(240), orientation: z.enum(["portrait", "landscape", "square"]) }),
]);

async function audit(request: Request, session: { userId: string }, action: string, entityId?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  await createOsAuthRepository().writeAudit({ actorUserId: session.userId, action, entityType: "portfolio_project", entityId, requestId: newRequestId(), ipHash: fingerprint(forwarded) });
}

export async function GET(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage");
  if ("response" in auth) return auth.response;
  try {
    const repository = createPortfolioRepository();
    const [projects, categories] = await Promise.all([repository.listAdmin(), repository.listCategories()]);
    return Response.json({ projects, categories });
  } catch { return Response.json({ error: "El módulo requiere las migraciones comerciales pendientes." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const auth = await authorizePanelApi(request, "portfolio.manage", true);
  if ("response" in auth) return auth.response;
  const result = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return Response.json({ error: "Datos inválidos." }, { status: 400 });
  const input = result.data;
  const repository = createPortfolioRepository();
  try {
    if (input.action === "save") {
      const project = await savePortfolioProject(repository, input.project, auth.session.userId);
      await audit(request, auth.session, "portfolio.project.saved", project.id);
      return Response.json({ project });
    }
    if (input.action === "status") {
      const project = await changePortfolioStatus(repository, input.id, input.status, auth.session.userId);
      await audit(request, auth.session, `portfolio.project.${input.status}`, project.id);
      return Response.json({ project });
    }
    if (input.action === "reorder") {
      await reorderPortfolioMedia(repository, input.id, input.mediaIds, auth.session.userId);
      await audit(request, auth.session, "portfolio.media.reordered", input.id);
      return Response.json({ ok: true });
    }
    const media = await addPortfolioVideo(repository, input.id, input, auth.session.userId);
    await audit(request, auth.session, "portfolio.video.added", input.id);
    return Response.json({ media });
  } catch { return Response.json({ error: "No se pudo completar la operación." }, { status: 503 }); }
}
