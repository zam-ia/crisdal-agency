import { priceQuote } from "./pricing";
import type { GlobalDiscount, QuoteCurrency } from "./pricing";

export type DraftLine = { id: string; description: string; quantity: string; unit: string; discount: string };
export type DraftDiscount = { kind: "none" | "fixed" | "percent"; value: string };

export function decimalToHundredths(value: string): number | null {
  const match = /^(\d{1,14})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const minor = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

function positiveQuantity(value: string): number | null {
  const raw = value.trim();
  if (!/^\d{1,15}$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function calculateDraft(currency: QuoteCurrency, lines: DraftLine[], discount: DraftDiscount) {
  const errors: Record<string, string> = {};
  const parsed = lines.map((line) => {
    const quantity = positiveQuantity(line.quantity);
    const unitPriceMinor = decimalToHundredths(line.unit);
    const discountBps = decimalToHundredths(line.discount || "0");
    if (!line.description.trim()) errors[line.id + "-description"] = "Escribe el nombre del concepto.";
    if (quantity === null) errors[line.id + "-quantity"] = "Usa un entero mayor que cero.";
    if (unitPriceMinor === null) errors[line.id + "-unit"] = "Ingresa un importe con hasta dos decimales.";
    if (discountBps === null || discountBps > 10000) errors[line.id + "-discount"] = "Usa un porcentaje entre 0 y 100.";
    return { id: line.id, quantity: quantity ?? 0, unitPriceMinor: unitPriceMinor ?? 0, discountBps: discountBps ?? 0, taxBps: 0 };
  });
  let globalDiscount: GlobalDiscount | undefined;
  if (discount.kind !== "none") {
    const value = decimalToHundredths(discount.value);
    if (value === null || (discount.kind === "percent" && value > 10000)) {
      errors.general = discount.kind === "percent" ? "Usa un porcentaje entre 0 y 100." : "Ingresa un importe con hasta dos decimales.";
    } else {
      globalDiscount = discount.kind === "fixed" ? { kind: "fixed", amountMinor: value } : { kind: "percent", rateBps: value };
    }
  }
  if (!lines.length || Object.keys(errors).length) return { prices: null, errors, summaryError: "" };
  try {
    return { prices: priceQuote({ currency, lines: parsed, globalDiscount }), errors, summaryError: "" };
  } catch (error) {
    return { prices: null, errors, summaryError: error instanceof RangeError ? error.message : "No se pudo calcular el borrador." };
  }
}
