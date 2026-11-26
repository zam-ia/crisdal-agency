import { z } from "zod";
import { ROLE_CODES } from "./capabilities";

export const LIMA_TIME_ZONE = "America/Lima";
export const DEFAULT_CURRENCY = "PEN" as const;

export const roleCodeSchema = z.enum(ROLE_CODES);
export const uuidSchema = z.string().uuid();
export const currencySchema = z.string().length(3).default(DEFAULT_CURRENCY);
export const moneyMinorSchema = z.number().int().safe().nonnegative();
export const timestampSchema = z.string().datetime({ offset: true });

export const osUserRowSchema = z.object({
  id: uuidSchema,
  auth_user_id: uuidSchema,
  email: z.string().email(),
  display_name: z.string().min(1).max(120),
  role_code: roleCodeSchema,
  active: z.boolean(),
});

export const osSessionRowSchema = z.object({
  id: uuidSchema,
  provider_session_id: uuidSchema,
  user_id: uuidSchema,
  expires_at: timestampSchema,
  revoked_at: timestampSchema.nullable(),
});

const baseEntitySchema = z.object({
  id: z.string().min(1).max(160),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export const clientContractSchema = baseEntitySchema.extend({
  company_name: z.string().min(1).max(180),
  contact_name: z.string().max(180).default(""),
  email: z.string().email().or(z.literal("")),
  whatsapp: z.string().max(32).default(""),
  status: z.enum(["lead", "active", "paused", "completed"]),
});

export const projectContractSchema = baseEntitySchema.extend({
  client_id: z.string().min(1).max(160),
  title: z.string().min(1).max(220),
  status: z.string().min(1).max(80),
});

export const calendarContractSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(220),
  start_at: timestampSchema,
  end_at: timestampSchema,
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
});

export const financeContractSchema = baseEntitySchema.extend({
  type: z.enum(["income", "expense"]),
  amount_minor: moneyMinorSchema,
  currency: currencySchema,
  description: z.string().max(500),
});

export const packageContractSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(180),
  active: z.boolean(),
});

export const quoteContractSchema = baseEntitySchema.extend({
  quote_number: z.string().min(1).max(80),
  client_id: z.string().min(1).max(160).nullable(),
  total_minor: moneyMinorSchema,
  currency: currencySchema,
  status: z.enum(["draft", "sent", "accepted", "approved", "won", "lost", "rejected", "expired"]),
});

export const portfolioContractSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(220),
  authorized_for_publication: z.boolean(),
});

export type ClientContract = z.infer<typeof clientContractSchema>;
export type ProjectContract = z.infer<typeof projectContractSchema>;
export type CalendarContract = z.infer<typeof calendarContractSchema>;
export type FinanceContract = z.infer<typeof financeContractSchema>;
export type PackageContract = z.infer<typeof packageContractSchema>;
export type QuoteContract = z.infer<typeof quoteContractSchema>;
export type PortfolioContract = z.infer<typeof portfolioContractSchema>;
