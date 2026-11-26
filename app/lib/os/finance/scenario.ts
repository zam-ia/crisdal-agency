import { summarizeReceivable } from "./ledger";
import type { FinanceCurrency, ReceivableMovement } from "./ledger";

export const scenarioFields = ["due", "collected", "refunded", "expenses"] as const;
export type ScenarioField = (typeof scenarioFields)[number];
export type ScenarioInput = Record<ScenarioField, string>;
export const emptyScenario: ScenarioInput = { due: "", collected: "", refunded: "", expenses: "" };

function parseMinor(raw: string): number | null {
  const match = /^(\d{1,14})(?:[.,](\d{1,2}))?$/.exec(raw.trim());
  if (!match) return null;
  const minor = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

export function simulateFinance(currency: FinanceCurrency, input: ScenarioInput) {
  const errors: Partial<Record<ScenarioField, string>> = {};
  const clean = {} as Record<ScenarioField, number>;
  for (const name of scenarioFields) {
    const raw = input[name].trim();
    const amount = parseMinor(raw || "0");
    if (amount === null) errors[name] = "Usa un importe sin separador de miles y con hasta dos decimales.";
    else clean[name] = amount;
  }
  if (Object.keys(errors).length || !input.due.trim()) return { result: null, errors };
  if (clean.refunded > clean.collected) {
    errors.refunded = "La devolución no puede superar lo cobrado.";
    return { result: null, errors };
  }
  if (clean.collected - clean.refunded > clean.due) {
    errors.collected = "Lo cobrado menos las devoluciones no puede superar la cuenta por cobrar.";
    return { result: null, errors };
  }
  const movements: ReceivableMovement[] = [];
  if (clean.collected) movements.push({ id: "collection", receivableId: "scenario", currency, kind: "receipt", amountMinor: clean.collected, status: "posted" });
  if (clean.refunded) movements.push({ id: "refund", receivableId: "scenario", currency, kind: "refund", amountMinor: clean.refunded, status: "posted" });
  const balance = summarizeReceivable({ id: "scenario", currency, totalMinor: clean.due }, movements);
  return { result: { ...balance, cashEffectMinor: balance.netReceivedMinor - clean.expenses }, errors };
}

export function formatScenarioMoney(minor: number, currency: FinanceCurrency): string {
  const whole = Math.trunc(Math.abs(minor) / 100);
  const cents = String(Math.abs(minor % 100)).padStart(2, "0");
  return [minor < 0 ? "−" : "", currency === "PEN" ? "S/" : "US$", " ", new Intl.NumberFormat("es-PE").format(whole), ".", cents].join("");
}
