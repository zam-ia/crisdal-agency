import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin";
import { publicationIssues, type PortfolioDraftInput, type PortfolioMedia, type PortfolioProject, type PortfolioStatus } from "./portfolio";

export type PortfolioCategory = { id: string; slug: string; name: string; active: boolean; visible?: boolean; sortOrder: number };

type ProjectRow = {
  id: string; slug: string; title: string; category_id: string; client_name: string | null;
  client_display_authorized: boolean; production_year: number | null; description: string;
  objective: string; service_type: string; status: PortfolioStatus; featured: boolean;
  cover_asset_id: string | null; published_at: string | null; created_at: string; updated_at: string;
  portfolio_categories: { slug: string; name: string; visible?: boolean } | { slug: string; name: string; visible?: boolean }[] | null;
};

export interface PortfolioRepository {
  listCategories(): Promise<PortfolioCategory[]>;
  listAdmin(): Promise<PortfolioProject[]>;
  listPublished(categorySlug?: string): Promise<PortfolioProject[]>;
  findPublishedBySlug(slug: string): Promise<PortfolioProject | null>;
  findAdminById(id: string): Promise<PortfolioProject | null>;
  saveDraft(input: PortfolioDraftInput, actorUserId: string): Promise<PortfolioProject>;
  setStatus(id: string, status: PortfolioStatus, actorUserId: string): Promise<PortfolioProject>;
  addExternalVideo(projectId: string, input: { url: string; posterUrl?: string | null; alt: string; orientation: PortfolioMedia["orientation"]; provider?: PortfolioMedia["provider"]; embedMode?: PortfolioMedia["embedMode"]; contentType?: PortfolioMedia["contentType"]; kind?: "video"|"social"; title?: string }, actorUserId: string): Promise<PortfolioMedia>;
  addUploadedImage(projectId: string, input: { bytes: Uint8Array; mimeType: string; extension: string; alt: string; orientation: PortfolioMedia["orientation"] }, actorUserId: string): Promise<PortfolioMedia>;
  reorderMedia(projectId: string, mediaIds: string[], actorUserId: string): Promise<void>;
  unlinkMedia(projectId: string, mediaId: string, actorUserId: string): Promise<void>;
  updateCategoryLayout(updates: { id: string; visible: boolean; sortOrder: number }[]): Promise<void>;
}

function relation(value: ProjectRow["portfolio_categories"]) {
  return Array.isArray(value) ? value[0] : value;
}

export class SupabasePortfolioRepository implements PortfolioRepository {
  private readonly db = getSupabaseAdmin();

  async listCategories() {
    const { data, error } = await this.db.from("portfolio_categories").select("id,slug,name,active,visible,sort_order").eq("active", true).order("sort_order");
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, slug: row.slug, name: row.name, active: row.active, visible: row.visible, sortOrder: row.sort_order }));
  }

  private async hydrate(rows: ProjectRow[], publicOnly = false) {
    if (!rows.length) return [];
    const ids = rows.map((row) => row.id);
    const [{ data: links, error: linksError }, { data: consents, error: consentError }] = await Promise.all([
      this.db.from("portfolio_media").select("project_id,sort_order,media_assets(id,kind,public_url,poster_url,alt_text,orientation,mime_type,width,height,external_provider,external_content_type,embed_mode,title,private_storage_path,thumbnail_storage_path,publication_authorized)").in("project_id", ids).order("sort_order"),
      this.db.from("publication_consents").select("project_id,status,scope,evidence_reference,authorized_at").in("project_id", ids),
    ]);
    if (linksError) throw linksError;
    if (consentError) throw consentError;
    return Promise.all(rows.map(async (row) => {
      const category = relation(row.portfolio_categories);
      const consent = (consents || []).find((item) => item.project_id === row.id);
      const media = await Promise.all((links || []).filter((item) => item.project_id === row.id).map(async (item) => {
        const raw = Array.isArray(item.media_assets) ? item.media_assets[0] : item.media_assets;
        if (!raw || (publicOnly && (!raw.publication_authorized || !raw.public_url || raw.public_url.startsWith("private:")))) return null;
        let url = raw.public_url;
        let posterUrl = raw.poster_url;
        if (!publicOnly && raw.private_storage_path && (!url || url.startsWith("private:"))) {
          const { data } = await this.db.storage.from("crisdal-private-media").createSignedUrl(raw.private_storage_path, 900);
          if (data?.signedUrl) url = data.signedUrl;
        }
        if (publicOnly && posterUrl?.startsWith("private:")) posterUrl = null;
        if (!publicOnly && raw.thumbnail_storage_path && (!posterUrl || posterUrl.startsWith("private:"))) {
          const { data } = await this.db.storage.from("crisdal-private-media").createSignedUrl(raw.thumbnail_storage_path, 900);
          if (data?.signedUrl) posterUrl = data.signedUrl;
        }
        return { id: raw.id, kind: raw.kind, url, posterUrl, alt: raw.alt_text, orientation: raw.orientation, sortOrder: item.sort_order, mimeType: raw.mime_type, width: raw.width, height: raw.height, provider: raw.external_provider||undefined, embedMode: raw.embed_mode||undefined, contentType: raw.external_content_type||undefined, title: raw.title||undefined } as PortfolioMedia;
      }));
      return {
        id: row.id, slug: row.slug, title: row.title, categoryId: row.category_id,
        categorySlug: category?.slug || "", categoryName: category?.name || "Sin categoría",
        clientName: row.client_display_authorized ? row.client_name : null,
        clientDisplayAuthorized: row.client_display_authorized, year: row.production_year,
        description: row.description, objective: row.objective, serviceType: row.service_type,
        status: row.status, featured: row.featured, coverAssetId: row.cover_asset_id,
        publishedAt: row.published_at, consentStatus: consent?.status || "missing",
        consentScope: consent?.scope || "", consentEvidenceReference: consent?.evidence_reference || "",
        consentAuthorizedAt: consent?.authorized_at || null, media: media.filter((item): item is PortfolioMedia => Boolean(item)), createdAt: row.created_at, updatedAt: row.updated_at,
      } satisfies PortfolioProject;
    }));
  }

  private baseSelect(publicOnly = false) {
    return `id,slug,title,category_id,client_name,client_display_authorized,production_year,description,objective,service_type,status,featured,cover_asset_id,published_at,created_at,updated_at,portfolio_categories${publicOnly ? "!inner" : ""}(slug,name,visible)`;
  }

  async listAdmin() {
    const { data, error } = await this.db.from("portfolio_projects").select(this.baseSelect()).order("updated_at", { ascending: false });
    if (error) throw error;
    return this.hydrate((data || []) as unknown as ProjectRow[]);
  }

  async listPublished(categorySlug?: string) {
    let query = this.db.from("portfolio_projects").select(this.baseSelect(true)).eq("status", "published").eq("portfolio_categories.visible", true).order("featured", { ascending: false }).order("published_at", { ascending: false });
    if (categorySlug) query = query.eq("portfolio_categories.slug", categorySlug);
    const { data, error } = await query;
    if (error) throw error;
    const projects = await this.hydrate((data || []) as unknown as ProjectRow[], true);
    return projects.filter((project) => publicationIssues(project).length === 0);
  }

  async findPublishedBySlug(slug: string) {
    const { data, error } = await this.db.from("portfolio_projects").select(this.baseSelect(true)).eq("slug", slug).eq("status", "published").eq("portfolio_categories.visible", true).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const project = (await this.hydrate([data as unknown as ProjectRow], true))[0];
    return project && publicationIssues(project).length === 0 ? project : null;
  }

  async findAdminById(id: string) {
    const { data, error } = await this.db.from("portfolio_projects").select(this.baseSelect()).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? (await this.hydrate([data as unknown as ProjectRow]))[0] : null;
  }

  async saveDraft(input: PortfolioDraftInput, actorUserId: string) {
    const id = input.id || randomUUID();
    const { error } = await this.db.from("portfolio_projects").upsert({
      id, slug: input.slug, title: input.title, category_id: input.categoryId,
      client_name: input.clientName || null, client_display_authorized: input.clientDisplayAuthorized,
      production_year: input.year, description: input.description, objective: input.objective,
      service_type: input.serviceType, featured: input.featured, cover_asset_id: input.coverAssetId,
      updated_by: actorUserId,
    }, { onConflict: "id" });
    if (error) throw error;
    const { error: consentError } = await this.db.from("publication_consents").upsert({
      project_id: id, status: input.consentStatus, scope: input.consentScope,
      evidence_reference: input.consentEvidenceReference, authorized_at: input.consentAuthorizedAt,
      verified_by: input.consentStatus === "verified" ? actorUserId : null,
    }, { onConflict: "project_id" });
    if (consentError) throw consentError;
    const result = await this.findAdminById(id);
    if (!result) throw new Error("No se pudo confirmar el proyecto guardado.");
    return result;
  }

  async setStatus(id: string, status: PortfolioStatus, actorUserId: string) {
    const { error } = await this.db.from("portfolio_projects").update({ status, published_at: status === "published" ? new Date().toISOString() : null, updated_by: actorUserId }).eq("id", id);
    if (error) throw error;
    {
      const { data: links, error: linksError } = await this.db.from("portfolio_media").select("media_asset_id,media_assets(id,private_storage_path,storage_bucket,storage_path,mime_type)").eq("project_id", id);
      if (linksError) throw linksError;
      const assetIds = (links || []).map((item) => item.media_asset_id);
      if (status === "published") {
        for (const link of links || []) {
          const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
          if (!asset?.private_storage_path || asset.storage_bucket === "crisdal-public-media") continue;
          const { data: file, error: downloadError } = await this.db.storage.from("crisdal-private-media").download(asset.private_storage_path);
          if (downloadError || !file) throw downloadError || new Error("No se pudo preparar el medio público.");
          const publicPath = `portfolio/${id}/${asset.id}.webp`;
          const { error: uploadError } = await this.db.storage.from("crisdal-public-media").upload(publicPath, file, { contentType: asset.mime_type, cacheControl: "60", upsert: true });
          if (uploadError) throw uploadError;
          const publicUrl = this.db.storage.from("crisdal-public-media").getPublicUrl(publicPath).data.publicUrl;
          const { error: updateError } = await this.db.from("media_assets").update({ storage_bucket: "crisdal-public-media", storage_path: publicPath, public_url: publicUrl, publication_authorized: true }).eq("id", asset.id);
          if (updateError) throw updateError;
        }
        if (assetIds.length) {
          const { error: assetError } = await this.db.from("media_assets").update({ publication_authorized: true }).in("id", assetIds);
          if (assetError) throw assetError;
        }
      } else if (assetIds.length) {
        for (const link of links || []) {
          const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
          if (!asset?.private_storage_path || asset.storage_bucket !== "crisdal-public-media" || !asset.storage_path) continue;
          const {error:removeError} = await this.db.storage.from("crisdal-public-media").remove([asset.storage_path]);
          if(removeError) throw removeError;
          const {error:resetError} = await this.db.from("media_assets").update({ storage_bucket: "crisdal-private-media", storage_path: asset.private_storage_path, public_url: `private:${asset.id}`, publication_authorized: false }).eq("id", asset.id);
          if(resetError) throw resetError;
        }
        const { error: assetError } = await this.db.from("media_assets").update({ publication_authorized: false }).in("id", assetIds);
        if (assetError) throw assetError;
      }
    }
    const project = await this.findAdminById(id);
    if (!project) throw new Error("Proyecto no encontrado.");
    return project;
  }

  async addExternalVideo(projectId: string, input: { url: string; posterUrl?: string | null; alt: string; orientation: PortfolioMedia["orientation"]; provider?: PortfolioMedia["provider"]; embedMode?: PortfolioMedia["embedMode"]; contentType?: PortfolioMedia["contentType"]; kind?: "video"|"social"; title?: string }, actorUserId: string): Promise<PortfolioMedia> {
    const id = randomUUID();
    const { data: countRows, error: countError } = await this.db.from("portfolio_media").select("id").eq("project_id", projectId);
    if (countError) throw countError;
    const { error } = await this.db.from("media_assets").insert({ id, kind: input.kind||"video", provider: "external", external_provider: input.provider, external_content_type: input.contentType||"video", embed_mode: input.embedMode||"embed", title: input.title||input.alt, public_url: input.url, poster_url: input.posterUrl || null, alt_text: input.alt, orientation: input.orientation, mime_type: "text/uri-list", created_by: actorUserId, publication_authorized: false });
    if (error) throw error;
    const sortOrder = countRows?.length || 0;
    const { error: linkError } = await this.db.from("portfolio_media").insert({ project_id: projectId, media_asset_id: id, sort_order: sortOrder });
    if (linkError) throw linkError;
    return { id, kind: input.kind||"video", url: input.url, posterUrl: input.posterUrl || null, alt: input.alt, orientation: input.orientation, sortOrder, mimeType: "text/uri-list", width: null, height: null, provider: input.provider, embedMode: input.embedMode||"embed", contentType: input.contentType||"video", title: input.title||input.alt };
  }

  async addUploadedImage(_projectId: string, _input: { bytes: Uint8Array; mimeType: string; extension: string; alt: string; orientation: PortfolioMedia["orientation"] }, _actorUserId: string): Promise<PortfolioMedia> {
    // Retained only for repository contract compatibility: private signed upload is the only supported path.
    void _projectId; void _input; void _actorUserId;
    throw new Error("Utiliza el flujo privado de carga firmada.");
  }

  async reorderMedia(projectId: string, mediaIds: string[], actorUserId: string) {
    await Promise.all(mediaIds.map(async (mediaAssetId, sortOrder) => {
      const { error } = await this.db.from("portfolio_media").update({ sort_order: sortOrder }).eq("project_id", projectId).eq("media_asset_id", mediaAssetId);
      if (error) throw error;
    }));
    const { error } = await this.db.from("portfolio_projects").update({ updated_by: actorUserId }).eq("id", projectId);
    if (error) throw error;
  }

  async unlinkMedia(projectId: string, mediaId: string, actorUserId: string) {
    const { error } = await this.db.from("portfolio_media").delete().eq("project_id", projectId).eq("media_asset_id", mediaId);
    if (error) throw error;
    await this.db.from("portfolio_projects").update({ cover_asset_id: null, updated_by: actorUserId }).eq("id", projectId).eq("cover_asset_id", mediaId);
  }

  async updateCategoryLayout(updates: { id: string; visible: boolean; sortOrder: number }[]) {
    await Promise.all(updates.map(async (item) => { const { error } = await this.db.from("portfolio_categories").update({ visible: item.visible, sort_order: item.sortOrder, updated_at: new Date().toISOString() }).eq("id", item.id); if (error) throw error; }));
  }
}

export function createPortfolioRepository(): PortfolioRepository { return new SupabasePortfolioRepository(); }

export async function safePublicPortfolio() {
  try { return await createPortfolioRepository().listPublished(); } catch { return []; }
}

export async function safePublicPortfolioProject(slug: string) {
  try { return await createPortfolioRepository().findPublishedBySlug(slug); } catch { return null; }
}
