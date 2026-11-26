import { parseExternalVideoUrl, portfolioDraftInputSchema, publicationIssues, type PortfolioDraftInput, type PortfolioMedia, type PortfolioStatus } from "./portfolio";
import type { PortfolioRepository } from "./portfolio-repository";

export async function savePortfolioProject(repository: PortfolioRepository, input: PortfolioDraftInput, actorUserId: string) {
  const parsed = portfolioDraftInputSchema.parse(input);
  const saved = await repository.saveDraft(parsed, actorUserId);
  if ((parsed.consentStatus === "revoked" || parsed.consentStatus === "missing") && saved.status === "published") {
    return repository.setStatus(saved.id, "draft", actorUserId);
  }
  return saved;
}

export async function changePortfolioStatus(repository: PortfolioRepository, id: string, status: PortfolioStatus, actorUserId: string) {
  const current = await repository.findAdminById(id);
  if (!current) throw new Error("Proyecto no encontrado.");
  if (status === "published") {
    const issues = publicationIssues(current);
    if (issues.length) throw new Error(issues.join(" "));
  }
  return repository.setStatus(id, status, actorUserId);
}

export async function addPortfolioVideo(repository: PortfolioRepository, projectId: string, input: { url: string; posterUrl?: string | null; alt: string; orientation: PortfolioMedia["orientation"]; provider?: PortfolioMedia["provider"]; embedMode?: PortfolioMedia["embedMode"]; title?: string }, actorUserId: string) {
  const parsed=parseExternalVideoUrl(input.url);if(!parsed)throw new Error("Proveedor o ruta no aprobado.");if(input.provider&&input.provider!==parsed.provider)throw new Error("La URL no corresponde al proveedor seleccionado.");
  return repository.addExternalVideo(projectId,{...input,url:parsed.canonicalUrl,provider:parsed.provider,embedMode:parsed.embedUrl&&input.embedMode!=="external"?"embed":"external",kind:parsed.kind,contentType:parsed.contentType},actorUserId);
}

export async function reorderPortfolioMedia(repository: PortfolioRepository, projectId: string, mediaIds: string[], actorUserId: string) {
  if (new Set(mediaIds).size !== mediaIds.length) throw new Error("El orden contiene medios duplicados.");
  const project = await repository.findAdminById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  const actual = new Set(project.media.map((item) => item.id));
  if (mediaIds.length !== actual.size || mediaIds.some((id) => !actual.has(id))) throw new Error("El orden no coincide con los medios del proyecto.");
  await repository.reorderMedia(projectId, mediaIds, actorUserId);
}
