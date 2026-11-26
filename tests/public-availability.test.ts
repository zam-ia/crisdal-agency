import assert from "node:assert/strict";
import test from "node:test";
import { agendaBlockedDays, makePublicMonth, monthDates, monthShift, peruToday, validDay, withinPublicHorizon } from "../app/lib/availability/public-calendar";
import { inquiryWhatsAppUrl, validateInquiry } from "../app/lib/availability/inquiry";
const now = new Date("2026-11-26T21:00:00.000Z");
const today = "2026-11-26";
const valid = { eventType: "Boda" as const, preferredDay: "2027-01-10", contactName: "Ana", contactPhone: "987 088 359", city: "Huancayo", message: "Cobertura de 6 horas", consent: true };

test("Leap year, month boundaries and timezone Peru", () => {
  assert.equal(monthDates("2028-02").length, 29);
  assert.equal(monthDates("2027-02").length, 28);
  assert.equal(monthShift("2026-12", 1), "2027-01");
  assert.equal(peruToday(new Date("2026-12-01T02:00:00Z")), "2026-11-30");
  assert.equal(validDay("2026-02-30"), false);
  assert.equal(validDay("2028-02-29"), true);
});

test("No verified source: never imply availability from absence of data", () => {
  const month = makePublicMonth({ month: "2026-11", today, now, sourceAvailable: false, verifiedDates: [ { day: "2026-11-28", status: "available", verifiedUntil: "2026-11-27T00:00:00Z" } ] });
  assert.equal(month.days.find((d) => d.day === "2026-11-28")?.status, "inquiry");
  assert.equal(month.days.find((d) => d.day === "2026-11-25")?.status, "past");
  assert.equal(month.days.length, 30);
});

test("Verified future and blocked dates only: never disclose event names or clients", () => {
  const month = makePublicMonth({ month: "2026-11", today, now, sourceAvailable: true, verifiedDates: [
    { day: "2026-11-28", status: "available", verifiedUntil: "2026-11-27T00:00:00Z" },
    { day: "2026-11-29", status: "unavailable", verifiedUntil: "2026-11-27T00:00:00Z" },
    { day: "2026-11-30", status: "available", verifiedUntil: "2026-11-26T00:00:00Z" },
  ] });
  assert.equal(month.days.find((d) => d.day === "2026-11-28")?.status, "available");
  assert.equal(month.days.find((d) => d.day === "2026-11-29")?.status, "unavailable");
  assert.equal(month.days.find((d) => d.day === "2026-11-30")?.status, "inquiry");
  assert.equal(JSON.stringify(month).includes("clientName"), false);
});

test("Contradictory entries fail closed", () => {
  const month = makePublicMonth({ month: "2026-11", today, now, sourceAvailable: true, verifiedDates: [
    { day: "2026-11-28", status: "available", verifiedUntil: "2026-11-27T00:00:00Z" },
    { day: "2026-11-28", status: "unavailable", verifiedUntil: "2026-11-27T00:00:00Z" },
  ] });
  assert.equal(month.days.find((d) => d.day === "2026-11-28")?.status, "inquiry");
});

test("Confirmed agenda ranges block every touched Peru day without exposing private data", () => {
  const blocked = agendaBlockedDays([
    { startsAt: "2026-11-28T23:00:00-05:00", endsAt: "2026-11-29T01:00:00-05:00" },
    { startsAt: "invalid", endsAt: "2026-11-30T10:00:00-05:00" },
  ], "2026-11");
  assert.deepEqual(blocked, ["2026-11-28", "2026-11-29"]);
  assert.equal(JSON.stringify(blocked).includes("cliente"), false);
});

test("Public horizon is limited to configured upcoming months", () => {
  assert.equal(withinPublicHorizon("2026-11", today), true);
  assert.equal(withinPublicHorizon("2027-10", today), true);
  assert.equal(withinPublicHorizon("2027-11", today), false);
  assert.equal(withinPublicHorizon("2026-10", today), false);
});

test("Inquiry form validates event type, contact and explicit consent", () => {
  const result = validateInquiry(valid, today);
  assert.equal(result.ok, true);
  assert.equal(validateInquiry({ ...valid, eventType: "Negocio VIP" }, today).ok, false);
  assert.equal(validateInquiry({ ...valid, consent: false }, today).ok, false);
  assert.equal(validateInquiry({ ...valid, preferredDay: "2026-11-25" }, today).ok, false);
  assert.equal(validateInquiry({ ...valid, contactPhone: "123" }, today).ok, false);
});

test("Honeypot and oversized inputs rejected without storing data", () => {
  assert.equal(validateInquiry({ ...valid, website: "spam" }, today).ok, false);
  assert.equal(validateInquiry({ ...valid, message: "x".repeat(1001) }, today).ok, false);
});

test("WhatsApp handoff includes selected date and does not confirm booking", () => {
  const url = inquiryWhatsAppUrl(valid);
  assert.match(url, /^https:\/\/wa\.me\/51992566725/);
  const message = decodeURIComponent(url.split("?text=")[1]);
  assert.match(message, /2027-01-10/);
  assert.match(message, /no confirma una reserva/);
});
