/** Pure operational finance helpers. Amounts are integer minor units. */
import { assertMinorUnits } from "./ledger";

export const FINANCE_LIMIT = 1_000_000_000_000;
export const PAYMENT_METHODS = ["cash", "transfer", "yape", "plin", "card", "other"] as const;
export const EXPENSE_CLASSES = ["direct", "fixed", "other"] as const;
export const CURRENCIES = ["PEN", "USD"] as const;

/** Exact decimal parsing: never use floating-point multiplication for money. */
export function parseMoney(text: string): number {
  const value = text.trim().replace(",", ".");
  if (!/^\d{1,11}(?:\.\d{1,2})?$/.test(value)) throw new Error("Escribe un importe válido con hasta dos decimales.");
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  assertMinorUnits(minor);
  if (minor > FINANCE_LIMIT) throw new RangeError("Importe fuera del límite permitido.");
  return minor;
}
export function formatMoney(minor: number, currency: "PEN" | "USD") {
  if (!Number.isSafeInteger(minor)) throw new RangeError("Importe acumulado inválido.");
  return new Intl.NumberFormat("es-PE", { style: "currency", currency, currencyDisplay: "symbol", minimumFractionDigits: 2 }).format(minor / 100);
}
export function limaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year:"numeric", month:"2-digit",day:"2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((x) => x.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function normalizeVoucher(series: string, number: string) {
  const normalizedSeries = series.trim().toUpperCase();
  const normalizedNumber = number.trim().replace(/^0+(?=\d)/, "");
  if (!/^[A-Z0-9]{4}$/.test(normalizedSeries) || !/^\d{1,8}$/.test(normalizedNumber) || normalizedNumber === "0") {
    throw new Error("Serie de cuatro caracteres y correlativo numérico de hasta ocho dígitos.");
  }
  return { series: normalizedSeries, number: normalizedNumber };
}
export function receiptReference(reference: string | null, method: string, requestId: string) {
  return reference || (method === "cash" ? "EF-" + requestId.replaceAll("-", "").toUpperCase() : null);
}

export function parseVoucherNumber(value: string) {
  const match = /^([A-Z0-9]{4})\s*-\s*(\d{1,8})$/i.exec(value.trim());
  if (!match || Number(match[2]) === 0) return null;
  const { series } = normalizeVoucher(match[1], match[2]);
  return { series, number: match[2] };
}

export type BreakEvenInput = { fixedMinor: number; averageSaleMinor: number; variableMinor: number };
export type BreakEvenResult = { contributionMinor: number; events: number | null; revenueMinor: number | null; contributionRate: number };
/** Planning estimate only. Use a consistent tax basis and comparable events. */
export function estimateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedMinor, averageSaleMinor, variableMinor } = input;
  for (const x of [fixedMinor, averageSaleMinor, variableMinor]) assertMinorUnits(x);
  const contributionMinor = averageSaleMinor - variableMinor;
  if (averageSaleMinor === 0 || contributionMinor <= 0) return { contributionMinor, events:null, revenueMinor:null, contributionRate:0 };
  const events = Number((BigInt(fixedMinor) + BigInt(contributionMinor) - 1n) / BigInt(contributionMinor));
  const revenue = BigInt(events) * BigInt(averageSaleMinor);
  if (revenue > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Estimación fuera de rango.");
  return { contributionMinor, events, revenueMinor:Number(revenue), contributionRate: contributionMinor / averageSaleMinor };
}
export type FinanceAccount = {
  id:string; title:string; customer:string; event_date:string|null; currency:"PEN"|"USD";
  quote_id?:string|null;
  total_minor:number; contracted_on:string; reference:string|null;
  received_minor:number; refunded_minor:number; pending_minor:number; direct_cost_minor:number;
};
export type FinanceMovement = {
  id:string; account_id:string|null; kind:"receipt"|"refund"|"expense";
  currency:"PEN"|"USD"; amount_minor:number; occurred_on:string; method:string;
  expense_class:string|null; description:string; reference:string|null; status:"posted"|"voided"; void_reason:string|null;
};

export const VOUCHER_SOURCES = ["sunat_original", "commercial_summary", "manual_reference"] as const;
export type VoucherSource = (typeof VOUCHER_SOURCES)[number];
export type VoucherItem = { quantity: number; description: string; unitMinor: number; lineMinor: number };
/** Transcribe the document, not a tax computation. Never infer a tax rate or proof of payment. */
export function validateVoucherDetail(items: readonly VoucherItem[], discountMinor: number | null) {
  if (!Array.isArray(items) || items.length > 20) throw new Error("Máximo 20 conceptos por comprobante.");
  if (discountMinor !== null) {
    assertMinorUnits(discountMinor);
    if (discountMinor > FINANCE_LIMIT) throw new Error("Descuento fuera de rango.");
  }
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000 ||
        !item.description.trim() || item.description.length > 240) throw new Error("Revisa la cantidad y descripción del servicio.");
    for (const amount of [item.unitMinor, item.lineMinor]) {
      assertMinorUnits(amount);
      if (amount > FINANCE_LIMIT) throw new Error("Importe fuera de rango.");
    }
  }
  return items.map(item => ({ ...item, description: item.description.trim() }));
}

export type FinanceVoucher = {
  id:string; account_id:string|null; receipt_id:string|null; issuer_ruc:string; series:string; number:string;
  issued_on:string; currency:"PEN"|"USD"; total_minor:number; igv_minor:number|null; customer:string;
  document_type:string|null; document_number:string|null; description:string; status:"recorded"|"corrected"|"external_void";
  correction_reason:string|null;
  source_kind:VoucherSource; discount_minor:number|null; items:VoucherItem[];
};
export type FinancePeriod = { month:string; received_minor:number; refunded_minor:number; expenses_minor:number; fixed_minor:number; direct_minor:number; other_minor:number; documented_minor:number; voucher_count:number };
export type FinanceSnapshot = {
  currency:"PEN"|"USD"; month:string; totals:FinancePeriod; trend:FinancePeriod[];
  open_balance_minor:number; accounts_count:number; movements_count:number; vouchers_count:number;
  accounts:FinanceAccount[]; movements:FinanceMovement[]; vouchers:FinanceVoucher[];
};
