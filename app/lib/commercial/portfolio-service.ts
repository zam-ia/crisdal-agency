import { isApprovedExternalVideoUrl, portfolioDraftInputSchema, publicationIssues, type PortfolioDraftInput, type PortfolioMedia, type PortfolioStatus } from "./portfolio";
import type { PortfolioRepository } from "./portfolio-repository";

export async function savePortfolioProject(repository: PortfolioRepository, input: PortfolioDraftInput, actorUserId: string) {
  return repository.saveDraft(portfolioDraftInputSchema.parse(input), actorUserId);
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

export async function addPortfolioVideo(repository: PortfolioRepository, projectId: string, input: { url: string; posterUrl?: string | null; alt: string; orientation: PortfolioMedia["orientation"] }, actorUserId: string) {
  if (!isApprovedExternalVideoUrl(input.url)) throw new Error("Proveedor de video no aprobado.");
  return repository.addExternalVideo(projectId, input, actorUserId);
}

export async function reorderPortfolioMedia(repository: PortfolioRepository, projectId: string, mediaIds: string[], actorUserId: string) {
  if (new Set(mediaIds).size !== mediaIds.length) throw new Error("El orden contiene medios duplicados.");
  const project = await repository.findAdminById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  const actual = new Set(project.media.map((item) => item.id));
  if (mediaIds.length !== actual.size || mediaIds.some((id) => !actual.has(id))) throw new Error("El orden no coincide con los medios del proyecto.");
  await repository.reorderMedia(projectId, mediaIds, actorUserId);
}
