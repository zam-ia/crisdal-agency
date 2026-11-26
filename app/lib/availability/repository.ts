import "server-only";
import { getSupabaseAdmin } from "../supabase-admin";
import type { PublicInquiryInput, } from "./inquiry";
import { agendaBlockedDays, monthShift, type VerifiedDate } from "./public-calendar";

export type DateInquiryAdmin = {
  id: string;
  requested_day: string;
  event_type: string;
  contact_name: string;
  contact_phone: string;
  city: string;
  message: string;
  state: "new" | "contacted" | "closed" | "spam";
  created_at: string;
};

export async function verifiedPublicDays(month: string): Promise<VerifiedDate[]> {
  const first = `${month}-01`;
  const next = `${monthShift(month, 1)}-01`;
  const db = getSupabaseAdmin();
  const [projection, agenda] = await Promise.all([
    db.from("crisdal_public_availability_days")
      .select("day,status,verified_until")
      .eq("service_key", "events").gte("day", first).lt("day", next).limit(31),
    db.from("calendar_activities")
      .select("starts_at,ends_at")
      .eq("status", "confirmed")
      .lt("starts_at", `${next}T00:00:00-05:00`)
      .gt("ends_at", `${first}T00:00:00-05:00`)
      .limit(100),
  ]);
  if (projection.error) throw projection.error;
  if (agenda.error) throw agenda.error;
  const blocked = new Set(agendaBlockedDays((agenda.data || []).map((item) => ({ startsAt: item.starts_at, endsAt: item.ends_at })), month));
  const verifiedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
  const projected = (projection.data || [])
    .filter((item) => !blocked.has(item.day))
    .map((item) => ({ day: item.day, status: item.status, verifiedUntil: item.verified_until } as VerifiedDate));
  return [...projected, ...[...blocked].map((day) => ({ day, status: "unavailable" as const, verifiedUntil }))];
}

export async function savePublicInquiry(input: PublicInquiryInput, ipHash: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().rpc("crisdal_submit_public_date_inquiry", {
    p_event_type: input.eventType,
    p_requested_day: input.preferredDay,
    p_contact_name: input.contactName,
    p_contact_phone: input.contactPhone,
    p_city: input.city,
    p_message: input.message,
    p_ip_hash: ipHash,
  });
  if (error) {
    if (error.message?.includes("CRISDAL_RATE_LIMIT")) throw new Error("CRISDAL_RATE_LIMIT");
    throw error;
  }
  if (typeof data !== "string") throw new Error("No se confirmó el registro de la solicitud.");
  return data;
}

export async function listPrivateDateInquiries(): Promise<DateInquiryAdmin[]> {
  const { data, error } = await getSupabaseAdmin().from("crisdal_public_date_inquiries")
    .select("id,requested_day,event_type,contact_name,contact_phone,city,message,state,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []) as DateInquiryAdmin[];
}

export async function updatePrivateDateInquiry(id: string, state: DateInquiryAdmin["state"], actorId: string, ipHash: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin().rpc("crisdal_set_public_date_inquiry_state", {
    p_inquiry_id: id, p_state: state, p_actor_id: actorId, p_ip_hash: ipHash,
  });
  if (error) throw error;
  if (data !== true) throw new Error("Solicitud no encontrada o actualización rechazada.");
}
