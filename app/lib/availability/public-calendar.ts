/**
 * Crisdal: public, privacy-preserving availability projection.
 * Availability is a suggestion to inquire, NEVER an automatic reservation.
 * Only an explicitly verified and unexpired aggregate may be shown as "Disponible".
 * Raw bookings, customer names, hours, and resource identities are NEVER accepted here.
 */
export type PublicDateStatus = "available" | "unavailable" | "inquiry" | "past";
export type VerifiedDate = { day: string; status: "available" | "unavailable"; verifiedUntil: string };
export type PublicDay = { day: string; status: PublicDateStatus };
export type PublicMonth = { month: string; days: PublicDay[]; asOf: string; source: "verified-projection" | "unavailable" };
export const EVENT_TYPES = ["Boda", "Quinceaños", "Evento corporativo", "Cumpleaños o celebración", "Bautizo", "Pedida de mano", "Sesión fotográfica", "Otro evento"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === day;
}

export function validMonth(month: string): boolean {
  return /^\d{4}-(?:0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0,4)) >= 2020 && Number(month.slice(0,4)) < 2200;
}

export function peruToday(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) throw new Error("Fecha actual inválida.");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (part: string) => parts.find((p) => p.type === part)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function monthShift(month: string, delta: number): string {
  if (!validMonth(month) || !Number.isSafeInteger(delta) || Math.abs(delta) > 24) throw new Error("Mes o desplazamiento inválido.");
  const y = Number(month.slice(0,4));
  const m = Number(month.slice(5,7)) - 1;
  return new Date(Date.UTC(y, m + delta, 1)).toISOString().slice(0, 7);
}

export function monthDates(month: string): string[] {
  if (!validMonth(month)) throw new Error("Mes inválido.");
  const year = Number(month.slice(0, 4)), index = Number(month.slice(5, 7)) - 1;
  const count = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, day) => `${month}-${String(day + 1).padStart(2, "0")}`);
}

export function makePublicMonth(input: { month: string; today: string; now: Date; verifiedDates: readonly VerifiedDate[]; sourceAvailable: boolean }): PublicMonth {
  const { month, today, now, verifiedDates, sourceAvailable } = input;
  if (!validDay(today) || Number.isNaN(now.getTime())) throw new Error("Referencia temporal inválida.");
  const verified = new Map<string, PublicDateStatus>();
  for (const record of verifiedDates) {
    if (!validDay(record.day) || !["available", "unavailable"].includes(record.status)) continue;
    const until = new Date(record.verifiedUntil);
    if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime()) continue;
    // Fail closed on contradictory data; duplicate records cannot fabricate availability.
    if (verified.has(record.day) && verified.get(record.day) !== record.status) verified.set(record.day, "inquiry");
    else if (!verified.has(record.day)) verified.set(record.day, record.status);
  }
  return {
    month,
    asOf: now.toISOString(),
    source: sourceAvailable ? "verified-projection" : "unavailable",
    days: monthDates(month).map((day) => ({
      day,
      status: day < today ? "past" : sourceAvailable ? verified.get(day) ?? "inquiry" : "inquiry",
    })),
  };
}

export function withinPublicHorizon(month: string, today: string, maxMonths = 12): boolean {
  if (!validMonth(month) || !validDay(today) || !Number.isSafeInteger(maxMonths) || maxMonths < 1 || maxMonths > 24) return false;
  const min = today.slice(0, 7);
  return month >= min && month <= monthShift(min, maxMonths - 1);
}

export function statusText(status: PublicDateStatus): string {
  return status === "available" ? "Disponible" : status === "unavailable" ? "Sin disponibilidad" : status === "past" ? "Fecha pasada" : "Consultar";
}
