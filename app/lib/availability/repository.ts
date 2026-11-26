import "server-only";
import { getSupabaseAdmin } from "../supabase-admin";
import type { PublicInquiryInput, } from "./inquiry";
import { monthShift, type VerifiedDate } from "./public-calendar";

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
  const { data, error } = await getSupabaseAdmin().from("crisdal_public_availability_days")
    .select("day,status,verified_until")
    .eq("service_key", "events").gte("day", first).lt("day", next).limit(31);
  if (error) throw error;
  return (data || []).map((item) => ({ day: item.day, status: item.status, verifiedUntil: item.verified_until }));
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
