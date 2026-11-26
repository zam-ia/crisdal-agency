import { z } from "zod";

export const agendaStatusSchema = z.enum(["inquiry", "pending", "confirmed", "cancelled"]);
export const agendaCategorySchema = z.enum(["consulta", "reunion", "produccion", "entrega", "otro"]);
export const agendaInputSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().min(3).max(180), category: agendaCategorySchema,
  startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), status: agendaStatusSchema,
  notes: z.string().max(2000).default(""), projectId: z.string().uuid().nullable().default(null),
}).superRefine((value, context) => { if (new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "La hora final debe ser posterior al inicio." }); });
export const agendaItemSchema = agendaInputSchema.safeExtend({ id: z.string().uuid(), createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }) });
export type AgendaInput = z.infer<typeof agendaInputSchema>; export type AgendaItem = z.infer<typeof agendaItemSchema>;
export function conflictsWith(items: AgendaItem[], candidate: AgendaInput) { if (candidate.status === "cancelled") return []; const start = Date.parse(candidate.startsAt), end = Date.parse(candidate.endsAt); return items.filter((item) => item.id !== candidate.id && item.status !== "cancelled" && Date.parse(item.startsAt) < end && Date.parse(item.endsAt) > start); }
