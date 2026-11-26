import { EVENT_TYPES, type EventType, validDay } from "./public-calendar";

export type PublicInquiryInput = {
  eventType: EventType;
  preferredDay: string;
  contactName: string;
  contactPhone: string;
  city: string;
  message: string;
  consent: boolean;
  website?: string; // honeypot
};
export type InquiryValidation = { ok: true; value: PublicInquiryInput } | { ok: false; errors: Record<string,string> };

export function validateInquiry(value: unknown, today: string): InquiryValidation {
  const errors: Record<string,string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: { form: "Solicitud inválida." } };
  const v = value as Record<string,unknown>;
  const read = (key: string, max: number) => typeof v[key] === "string" ? (v[key] as string).trim().slice(0, max + 1) : "";
  const eventType = read("eventType", 80);
  const preferredDay = read("preferredDay", 20);
  const contactName = read("contactName", 121);
  const contactPhone = read("contactPhone", 33);
  const city = read("city", 121);
  const message = read("message", 1001);
  const website = read("website", 121);
  if (website) errors.website = "Solicitud no admitida.";
  if (!(EVENT_TYPES as readonly string[]).includes(eventType)) errors.eventType = "Selecciona el tipo de evento.";
  if (!validDay(preferredDay) || preferredDay < today || preferredDay > `${Number(today.slice(0,4))+2}-12-31`) errors.preferredDay = "Elige una fecha futura válida.";
  if (contactName.length < 2 || contactName.length > 120) errors.contactName = "Ingresa tu nombre (2–120 caracteres).";
  if (!/^\+?[0-9 ()-]{7,32}$/.test(contactPhone) || contactPhone.replace(/\D/g, "").length < 7) errors.contactPhone = "Ingresa un teléfono válido.";
  if (city.length < 2 || city.length > 120) errors.city = "Indica la ciudad o el lugar del evento.";
  if (message.length > 1000) errors.message = "El comentario no puede superar 1000 caracteres.";
  if (v.consent !== true) errors.consent = "Debes aceptar el uso de estos datos para responder tu consulta.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { eventType: eventType as EventType, preferredDay, contactName, contactPhone, city, message, consent: true, website: "" } };
}

export function inquiryWhatsAppUrl(input: Omit<PublicInquiryInput, "consent" | "website">, phone = "51992566725"): string {
  const details = [
    "Hola, quiero consultar una fecha para fotografía y video con Crisdal Agency.",
    `Tipo de evento: ${input.eventType}`,
    `Fecha solicitada: ${input.preferredDay}`,
    `Ciudad o lugar: ${input.city.trim()}`,
    `Nombre: ${input.contactName.trim()}`,
    `Teléfono: ${input.contactPhone.trim()}`,
    input.message.trim() ? `Detalles: ${input.message.trim()}` : "",
    "Sé que esta consulta todavía no confirma una reserva.",
  ].filter(Boolean).join("\n");
  if (!/^\d{10,15}$/.test(phone)) throw new Error("WhatsApp no configurado.");
  return `https://wa.me/${phone}?text=${encodeURIComponent(details)}`;
}
