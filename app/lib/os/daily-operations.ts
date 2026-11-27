import "server-only";

import { getSupabaseAdmin } from "../supabase-admin";
import { peruToday } from "../availability/public-calendar";
import type { OsSession } from "./auth-types";
import type { Capability } from "./capabilities";
import { formatMoney, type FinanceSnapshot } from "./finance/operations";

type Database = ReturnType<typeof getSupabaseAdmin>;
type CountResult = { count: number | null; error: unknown };
type Metric = { label: string; href: string; value: string };
type DailyEvent = { starts_at: string; title: string; category: string };
type RequiredMetric = {
  label: string;
  href: string;
  permissions: Capability[];
  query: (db: Database, today: string, now: Date) => PromiseLike<CountResult>;
};
const metrics: RequiredMetric[] = [
  { label: "Solicitudes nuevas", href: "/panel/solicitudes-fecha", permissions: ["calendar.read", "clients.read"], query: (db) => db.from("crisdal_public_date_inquiries").select("id", { count: "exact", head: true }).eq("state", "new") },
  { label: "Seguimientos para hoy", href: "/panel/clientes", permissions: ["clients.read"], query: (db, today) => db.from("crisdal_clients").select("id", { count: "exact", head: true }).neq("stage", "closed").lte("next_action_on", today) },
  { label: "Cotizaciones por responder", href: "/panel/cotizaciones", permissions: ["quotes.manage"], query: (db, today) => db.from("crisdal_quotes").select("id", { count: "exact", head: true }).eq("status", "sent").gte("expires_on", today) },
  { label: "Actividades confirmadas · 30 días", href: "/panel/agenda", permissions: ["calendar.read"], query: (db, _today, now) => db.from("calendar_activities").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("starts_at", now.toISOString()).lt("starts_at", new Date(now.getTime() + 30 * 86_400_000).toISOString()) },
  { label: "Proyectos en edición", href: "/panel/produccion", permissions: ["projects.read"], query: (db) => db.from("crisdal_production_projects").select("id", { count: "exact", head: true }).eq("stage", "editing") },
  { label: "Entregas de producción vencidas", href: "/panel/produccion", permissions: ["projects.read"], query: (db, today) => db.from("crisdal_production_projects").select("id", { count: "exact", head: true }).neq("stage", "delivered").lt("due_on", today) },
  { label: "Paquetes publicados", href: "/panel/paquetes", permissions: ["packages.read"], query: (db) => db.from("commercial_packages").select("id", { count: "exact", head: true }).eq("status", "published") },
  { label: "Portafolio en borrador", href: "/panel/portafolio", permissions: ["portfolio.manage"], query: (db) => db.from("portfolio_projects").select("id", { count: "exact", head: true }).eq("status", "draft") },
];

async function nextEvent(db: Database, now: Date): Promise<DailyEvent | null> {
  const { data, error } = await db.from("calendar_activities").select("starts_at,title,category").eq("status", "confirmed")
    .gte("starts_at", now.toISOString()).order("starts_at").order("id").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function readDailyOperations(session: OsSession): Promise<{ event?: DailyEvent | null; eventUnavailable: boolean; metrics: Metric[] }> {
  const now = new Date();
  const today = peruToday(now);
  const permitted = metrics.filter((metric) => metric.permissions.every((permission) => session.capabilities.includes(permission)));
  const canReadFinance = session.capabilities.includes("finance.read");
  const canReadCalendar = session.capabilities.includes("calendar.read");
  const db = (() => { try { return getSupabaseAdmin(); } catch { return null; } })();
  const drafts: Array<{ label: string; href: string; read: (database: Database) => Promise<string> }> = permitted.map((metric) => ({
    label: metric.label, href: metric.href,
    async read(database) {
      const result = await metric.query(database, today, now);
      if (result.error || result.count === null) throw new Error("Count unavailable");
      return result.count.toLocaleString("es-PE");
    },
  }));
  if (canReadFinance) {
    for (const currency of ["PEN", "USD"] as const) drafts.unshift({
      label: "Saldo por cobrar · " + currency,
      href: "/panel/finanzas",
      async read(database) {
        const { data, error } = await database.rpc("crisdal_finance_snapshot", {
          p_actor: session.userId, p_currency: currency, p_month: today.slice(0, 7) + "-01",
          p_account_offset: 0, p_movement_offset: 0, p_voucher_offset: 0,
        });
        const value = (data as FinanceSnapshot | null)?.open_balance_minor;
        if (error || typeof value !== "number" || !Number.isFinite(value)) throw new Error("Balance unavailable");
        return formatMoney(value, currency);
      },
    });
  }

  const [event, values] = await Promise.all([
    canReadCalendar && db ? nextEvent(db, now).catch(() => undefined) : undefined,
    Promise.all(drafts.map(async ({ label, href, read }) => ({
      label, href, value: db ? await read(db).catch(() => "No disponible") : "No disponible",
    }))),
  ]);
  return { event, eventUnavailable: canReadCalendar && event === undefined, metrics: values };
}
