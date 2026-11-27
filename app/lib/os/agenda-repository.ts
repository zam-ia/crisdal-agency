import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin";
import type { AgendaInput, AgendaItem } from "./agenda";

const columns = "id,title,category,starts_at,ends_at,status,notes,project_id,created_at,updated_at";

function map(row: Record<string, unknown>): AgendaItem {
  return {
    id: String(row.id), title: String(row.title), category: row.category as AgendaItem["category"],
    startsAt: String(row.starts_at), endsAt: String(row.ends_at), status: row.status as AgendaItem["status"],
    notes: String(row.notes || ""), projectId: row.project_id ? String(row.project_id) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export class AgendaRepository {
  private readonly db = getSupabaseAdmin();

  async list(from?: string, to?: string) {
    const items: AgendaItem[] = [];
    const pageSize = 250;
    for (;;) {
      let query = this.db.from("calendar_activities").select(columns).order("starts_at").order("id");
      if (from) query = query.gt("ends_at", from);
      if (to) query = query.lt("starts_at", to);
      const { data, error } = await query.range(items.length, items.length + pageSize - 1);
      if (error) throw error;
      if (!data?.length) return items;
      items.push(...data.map(map));
      if (data.length < pageSize) return items;
    }
  }

  async save(input: AgendaInput, actor: string) {
    const fields = {
      title: input.title, category: input.category, starts_at: input.startsAt, ends_at: input.endsAt,
      status: input.status, notes: input.notes, project_id: input.projectId, updated_by: actor, updated_at: new Date().toISOString(),
    };
    const table = this.db.from("calendar_activities");
    const operation = input.id ? table.update(fields).eq("id", input.id) : table.insert({ ...fields, id: randomUUID(), created_by: actor });
    const { data, error } = await operation.select(columns).single();
    if (error) throw error;
    return map(data);
  }
}
