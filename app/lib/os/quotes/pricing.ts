/**
 * Crisdal OS — deterministic quote-pricing core.
 * Pure and storage-agnostic: prices in integer minor units; rates in basis points.
 * The caller must explicitly supply tax rules. No implicit IGV or currency conversion.
 * Not a tax invoice generator.
 */
export type QuoteCurrency = "PEN" | "USD";

export type QuoteLine = {
  id: string;
  quantity: number; // positive whole units; fractional units need explicit future contract
  unitPriceMinor: number;
  discountBps: number; // 0–10000, applied to gross line amount
  taxBps: number; // 0–10000, applied AFTER all discounts
};

export type GlobalDiscount =
  | { kind: "fixed"; amountMinor: number }
  | { kind: "percent"; rateBps: number };

export type QuotePricingInput = {
  currency: QuoteCurrency;
  lines: readonly QuoteLine[];
  globalDiscount?: GlobalDiscount | null;
};

export type PricedLine = {
  id: string;
  grossMinor: number;
  lineDiscountMinor: number;
  netBeforeGlobalMinor: number;
  globalDiscountMinor: number;
  taxableBaseMinor: number;
  taxMinor: number;
  totalMinor: number;
};

export type QuotePricingResult = {
  currency: QuoteCurrency;
  subtotalMinor: number;
  lineDiscountsMinor: number;
  afterLineDiscountsMinor: number;
  globalDiscountMinor: number;
  netBeforeTaxMinor: number;
  taxMinor: number;
  totalMinor: number;
  lines: readonly PricedLine[];
};

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const BP = BigInt(10_000);

function integer(value: number, label: string, allowZero = true): bigint {
  if (!Number.isSafeInteger(value) || value < 0 || (!allowZero && value === 0)) {
    throw new RangeError(`${label}: se requiere un entero seguro y no negativo.`);
  }
  return BigInt(value);
}

function basisPoints(value: number, label: string): bigint {
  const n = integer(value, label);
  if (n > BP) throw new RangeError(`${label}: fuera de 0–10000 puntos básicos.`);
  return n;
}

function toMinor(value: bigint, label: string): number {
  if (value < ZERO || value > MAX_SAFE) throw new RangeError(`${label}: fuera del rango de céntimos seguro.`);
  return Number(value);
}

function roundDivHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= ZERO || numerator < ZERO) throw new RangeError("División monetaria inválida.");
  return (numerator + denominator / TWO) / denominator;
}

/** Largest-remainder distribution: exact total, stable tie break by input order. */
function apportionMinor(amount: bigint, weights: readonly bigint[]): bigint[] {
  const total = weights.reduce((sum, weight) => sum + weight, ZERO);
  if (amount === ZERO) return weights.map(() => ZERO);
  if (total <= ZERO || amount > total) throw new RangeError("El descuento supera la base disponible.");
  const quotients = weights.map((weight, index) => ({
    index,
    minor: (amount * weight) / total,
    remainder: (amount * weight) % total,
  }));
  let remaining = amount - quotients.reduce((sum, q) => sum + q.minor, ZERO);
  const ranked = [...quotients].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  for (const q of ranked) {
    if (remaining === ZERO) break;
    q.minor += ONE;
    remaining -= ONE;
  }
  return quotients.map((q) => q.minor);
}

/**
 * Returns a snapshot-ready breakdown for an approved quotation.
 * The caller must store prices/descriptions/rates at issue time; NEVER recalculate an issued quote
 * from editable package prices. Server/database authorization and transactionality are separate.
 */
export function priceQuote(input: QuotePricingInput): QuotePricingResult {
  if (input.currency !== "PEN" && input.currency !== "USD") {
    throw new Error("Moneda no soportada; no se realiza conversión automática.");
  }
  if (!input.lines.length || input.lines.length > 200) {
    throw new RangeError("La cotización necesita entre 1 y 200 conceptos.");
  }
  const seen = new Set<string>();
  const prepared = input.lines.map((line) => {
    if (!line.id.trim()) throw new Error("Cada concepto necesita identificador.");
    if (seen.has(line.id)) throw new Error("Identificador de concepto duplicado.");
    seen.add(line.id);
    const quantity = integer(line.quantity, "Cantidad", false);
    const unit = integer(line.unitPriceMinor, "Precio unitario");
    const discountBps = basisPoints(line.discountBps, "Descuento de línea");
    const taxBps = basisPoints(line.taxBps, "Tasa tributaria");
    const gross = quantity * unit;
    toMinor(gross, "Importe bruto de línea");
    const discount = roundDivHalfUp(gross * discountBps, BP);
    return { id: line.id, gross, discount, afterDiscount: gross - discount, taxBps };
  });

  const subtotal = prepared.reduce((sum, x) => sum + x.gross, ZERO);
  const lineDiscounts = prepared.reduce((sum, x) => sum + x.discount, ZERO);
  const afterLine = subtotal - lineDiscounts;
  toMinor(subtotal, "Subtotal de cotización");
  toMinor(afterLine, "Base antes de descuento general");

  let global = ZERO;
  if (input.globalDiscount?.kind === "fixed") {
    global = integer(input.globalDiscount.amountMinor, "Descuento general fijo");
  } else if (input.globalDiscount?.kind === "percent") {
    global = roundDivHalfUp(afterLine * basisPoints(input.globalDiscount.rateBps, "Descuento general porcentual"), BP);
  } else if (input.globalDiscount != null) {
    throw new Error("Tipo de descuento general desconocido.");
  }
  if (global > afterLine) throw new RangeError("El descuento general supera la base disponible.");

  const allocated = apportionMinor(global, prepared.map((x) => x.afterDiscount));
  const lines: PricedLine[] = prepared.map((x, i) => {
    const base = x.afterDiscount - allocated[i];
    const tax = roundDivHalfUp(base * x.taxBps, BP);
    const total = base + tax;
    return {
      id: x.id,
      grossMinor: toMinor(x.gross, "Subtotal de línea"),
      lineDiscountMinor: toMinor(x.discount, "Descuento de línea"),
      netBeforeGlobalMinor: toMinor(x.afterDiscount, "Base de línea"),
      globalDiscountMinor: toMinor(allocated[i], "Descuento general de línea"),
      taxableBaseMinor: toMinor(base, "Base imponible"),
      taxMinor: toMinor(tax, "Tributo de línea"),
      totalMinor: toMinor(total, "Total de línea"),
    };
  });
  const netBeforeTax = afterLine - global;
  const taxMinor = lines.reduce((sum, line) => sum + BigInt(line.taxMinor), ZERO);
  const total = netBeforeTax + taxMinor;
  // All advertised numbers are checked BEFORE returning to avoid precision loss.
  return {
    currency: input.currency,
    subtotalMinor: toMinor(subtotal, "Subtotal"),
    lineDiscountsMinor: toMinor(lineDiscounts, "Descuento de conceptos"),
    afterLineDiscountsMinor: toMinor(afterLine, "Base tras descuentos de línea"),
    globalDiscountMinor: toMinor(global, "Descuento global"),
    netBeforeTaxMinor: toMinor(netBeforeTax, "Base después de descuentos"),
    taxMinor: toMinor(taxMinor, "Tributos"),
    totalMinor: toMinor(total, "Total de cotización"),
    lines,
  };
}
