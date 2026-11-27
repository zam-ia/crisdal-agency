import { peruToday, validDay } from "../availability/public-calendar";
import type { AgendaItem } from "./agenda";

export function agendaDay(value: string | undefined, fallback: string) {
  return value && validDay(value) ? value : fallback;
}

export function offsetMonth(month: string, offset: number) {
  const [year, index] = month.split("-").map(Number);
  return new Date(Date.UTC(year, index - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function monthCells(month: string) {
  const first = new Date(month + "-01T12:00:00Z");
  const blanks = (first.getUTCDay() + 6) % 7;
  const next = new Date(offsetMonth(month, 1) + "-01T12:00:00Z");
  next.setUTCDate(0);
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: next.getUTCDate() }, (_, index) => month + "-" + String(index + 1).padStart(2, "0")),
  ];
}

export function itemsForDay(items: readonly AgendaItem[], day: string) {
  const from = Date.parse(day + "T00:00:00-05:00");
  const until = from + 86_400_000;
  return items.filter((item) => Date.parse(item.startsAt) < until && Date.parse(item.endsAt) > from);
}

export function monthBounds(month: string) {
  return { from: month + "-01T00:00:00-05:00", to: offsetMonth(month, 1) + "-01T00:00:00-05:00" };
}

export const agendaCategoryLabels: Record<AgendaItem["category"], string> = {
  consulta: "Consulta",
  reunion: "Reunión",
  produccion: "Producción",
  entrega: "Entrega",
  otro: "Otra actividad",
};

export const agendaStatusLabels: Record<AgendaItem["status"], string> = {
  inquiry: "Consulta",
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const agendaTime = (value: string) => formatter.format(new Date(value));
export const dayOfItem = (value: string) => peruToday(new Date(value));
