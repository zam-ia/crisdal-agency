import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin";
import type { AgendaInput, AgendaItem } from "./agenda";

function map(row: Record<string, unknown>): AgendaItem { return { id: String(row.id), title: String(row.title), category: row.category as AgendaItem["category"], startsAt: String(row.starts_at), endsAt: String(row.ends_at), status: row.status as AgendaItem["status"], notes: String(row.notes || ""), projectId: row.project_id ? String(row.project_id) : null, createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
export class AgendaRepository {
  private readonly db = getSupabaseAdmin();
  async list(from?: string, to?: string) { let query = this.db.from("calendar_activities").select("id,title,category,starts_at,ends_at,status,notes,project_id,created_at,updated_at").order("starts_at"); if (from) query = query.gte("ends_at", from); if (to) query = query.lte("starts_at", to); const { data, error } = await query; if (error) throw error; return (data || []).map((row) => map(row)); }
  async save(input: AgendaInput, actor: string) { const id = input.id || randomUUID(); const { data, error } = await this.db.from("calendar_activities").upsert({ id, title: input.title, category: input.category, starts_at: input.startsAt, ends_at: input.endsAt, status: input.status, notes: input.notes, project_id: input.projectId, created_by: actor, updated_by: actor, updated_at: new Date().toISOString() }, { onConflict: "id" }).select("id,title,category,starts_at,ends_at,status,notes,project_id,created_at,updated_at").single(); if (error) throw error; return map(data); }
}
export async function safeAgendaSummary() { if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) return { status: "unconfigured" as const, items: [] as AgendaItem[] }; try { const now = new Date(); const to = new Date(now.getTime() + 30 * 86400000); const items = await new AgendaRepository().list(now.toISOString(), to.toISOString()); return { status: "ready" as const, items }; } catch { return { status: "unavailable" as const, items: [] as AgendaItem[] }; } }
