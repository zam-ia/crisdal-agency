/**
 * Crisdal OS — pure finance domain (Phase 7 foundation).
 * No database calls, currency conversion, rounding of decimal amounts or side effects.
 * All monetary amounts are non-negative integer minor units (céntimos).
 */
export type FinanceCurrency = "PEN" | "USD";
export type LedgerStatus = "posted" | "voided";

export type Receivable = {
  id: string;
  currency: FinanceCurrency;
  totalMinor: number;
};

export type ReceivableMovement = {
  id: string;
  receivableId: string;
  currency: FinanceCurrency;
  kind: "receipt" | "refund";
  amountMinor: number;
  status: LedgerStatus;
};

export type ReceivableBalance = {
  totalMinor: number;
  grossReceivedMinor: number;
  refundedMinor: number;
  netReceivedMinor: number;
  pendingMinor: number;
  status: "unpaid" | "partial" | "paid";
};

export type CashMovement = {
  id: string;
  at: string; // ISO timestamp with explicit timezone offset
  currency: FinanceCurrency;
  kind: "receipt" | "refund" | "expense";
  amountMinor: number;
  status: LedgerStatus;
};

export type CashFlowSummary = {
  currency: FinanceCurrency;
  month: string; // YYYY-MM evaluated in America/Lima
  receivedMinor: number;
  refundedMinor: number;
  expensesMinor: number;
  operatingCashMinor: number;
};

export function assertMinorUnits(amount: number, allowZero = true): number {
  if (!Number.isSafeInteger(amount) || amount < 0 || (!allowZero && amount === 0)) {
    throw new RangeError("El importe debe ser un entero seguro de céntimos válido.");
  }
  return amount;
}

function safeAdd(a: number, b: number): number {
  const result = a + b;
  if (!Number.isSafeInteger(result)) throw new RangeError("Importe acumulado fuera del rango seguro.");
  return result;
}

function nonempty(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} es obligatorio.`);
}

/** Never treat a quotation, invoice or receivable as money already received. */
export function summarizeReceivable(
  receivable: Receivable,
  movements: readonly ReceivableMovement[],
): ReceivableBalance {
  nonempty(receivable.id, "ID de cuenta por cobrar");
  assertMinorUnits(receivable.totalMinor);
  let grossReceivedMinor = 0;
  let refundedMinor = 0;
  const seen = new Set<string>();
  for (const movement of movements) {
    nonempty(movement.id, "ID de movimiento");
    if (seen.has(movement.id)) throw new Error("Movimiento financiero duplicado.");
    seen.add(movement.id);
    if (movement.receivableId !== receivable.id) throw new Error("Movimiento de otra cuenta por cobrar.");
    if (movement.currency !== receivable.currency) throw new Error("Monedas distintas; no se convierten automáticamente.");
    assertMinorUnits(movement.amountMinor, false);
    if (movement.status !== "posted" && movement.status !== "voided") throw new Error("Estado financiero inválido.");
    if (movement.kind !== "receipt" && movement.kind !== "refund") throw new Error("Tipo financiero inválido.");
    if (movement.status === "voided") continue;
    if (movement.kind === "receipt") grossReceivedMinor = safeAdd(grossReceivedMinor, movement.amountMinor);
    else refundedMinor = safeAdd(refundedMinor, movement.amountMinor);
  }
  if (refundedMinor > grossReceivedMinor) throw new Error("Las devoluciones superan los cobros registrados.");
  const netReceivedMinor = grossReceivedMinor - refundedMinor;
  if (netReceivedMinor > receivable.totalMinor) throw new Error("Cobros netos superiores a la deuda: revisar el excedente.");
  const pendingMinor = receivable.totalMinor - netReceivedMinor;
  const status = pendingMinor === 0 ? "paid" : netReceivedMinor === 0 ? "unpaid" : "partial";
  return { totalMinor: receivable.totalMinor, grossReceivedMinor, refundedMinor, netReceivedMinor, pendingMinor, status };
}

/** Domain validation before creating a NEW posted collection/refund; DB transactions must still enforce concurrency. */
export function assertReceiptAllowed(balance: ReceivableBalance, newAmountMinor: number): void {
  assertMinorUnits(newAmountMinor, false);
  if (newAmountMinor > balance.pendingMinor) throw new Error("Cobro superior al saldo pendiente.");
}

export function assertRefundAllowed(balance: ReceivableBalance, newAmountMinor: number): void {
  assertMinorUnits(newAmountMinor, false);
  if (newAmountMinor > balance.netReceivedMinor) throw new Error("Devolución superior al cobro neto.");
}

/** A UTC timestamp may belong to the prior calendar day/month in Peru. */
export function monthInLima(isoTimestamp: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(isoTimestamp)) {
    throw new Error("Fecha ISO con zona horaria obligatoria.");
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("No se pudo resolver el mes en Lima.");
  return `${year}-${month}`;
}

/** Cash-basis operating summary, NOT accounting profit, invoiced revenue or an exchange-rate conversion. */
export function summarizeCashFlow(
  movements: readonly CashMovement[],
  currency: FinanceCurrency,
  month: string,
): CashFlowSummary {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error("Periodo inválido, usa AAAA-MM.");
  let receivedMinor = 0;
  let refundedMinor = 0;
  let expensesMinor = 0;
  const seen = new Set<string>();
  for (const movement of movements) {
    nonempty(movement.id, "ID de movimiento");
    if (seen.has(movement.id)) throw new Error("Movimiento financiero duplicado.");
    seen.add(movement.id);
    assertMinorUnits(movement.amountMinor, false);
    if (!["PEN", "USD"].includes(movement.currency)) throw new Error("Moneda no soportada.");
    if (!["receipt", "refund", "expense"].includes(movement.kind)) throw new Error("Tipo financiero inválido.");
    if (movement.status !== "posted" && movement.status !== "voided") throw new Error("Estado financiero inválido.");
    const movementMonth = monthInLima(movement.at);
    if (movement.status === "voided" || movement.currency !== currency || movementMonth !== month) continue;
    if (movement.kind === "receipt") receivedMinor = safeAdd(receivedMinor, movement.amountMinor);
    if (movement.kind === "refund") refundedMinor = safeAdd(refundedMinor, movement.amountMinor);
    if (movement.kind === "expense") expensesMinor = safeAdd(expensesMinor, movement.amountMinor);
  }
  const operatingCashMinor = receivedMinor - refundedMinor - expensesMinor;
  if (!Number.isSafeInteger(operatingCashMinor)) throw new RangeError("Resultado fuera del rango seguro.");
  return { currency, month, receivedMinor, refundedMinor, expensesMinor, operatingCashMinor };
}
