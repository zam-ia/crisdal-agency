import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMinorUnits,
  assertReceiptAllowed,
  assertRefundAllowed,
  monthInLima,
  summarizeCashFlow,
  summarizeReceivable,
  type CashMovement,
  type ReceivableMovement,
} from "../app/lib/os/finance/ledger";

const receivable = { id: "wedding-1", currency: "PEN" as const, totalMinor: 119_000 };
const payment = (id: string, amountMinor: number, kind: "receipt" | "refund" = "receipt", status: "posted" | "voided" = "posted"): ReceivableMovement => ({
  id, receivableId: receivable.id, currency: "PEN", kind, amountMinor, status,
});

test("unpaid receivable does not count quotation value as collected cash", () => {
  assert.deepEqual(summarizeReceivable(receivable, []), {
    totalMinor: 119_000, grossReceivedMinor: 0, refundedMinor: 0,
    netReceivedMinor: 0, pendingMinor: 119_000, status: "unpaid",
  });
});

test("partial wedding deposit S/300 on S/1190 leaves S/890 pending", () => {
  const balance = summarizeReceivable(receivable, [payment("p1", 30_000)]);
  assert.equal(balance.pendingMinor, 89_000);
  assert.equal(balance.status, "partial");
  assert.doesNotThrow(() => assertReceiptAllowed(balance, 89_000));
  assert.throws(() => assertReceiptAllowed(balance, 89_001), /saldo pendiente/i);
});

test("multiple payments and voided duplicates are distinct ledger IDs", () => {
  const balance = summarizeReceivable(receivable, [
    payment("p1", 30_000), payment("p2", 89_000), payment("v1", 20_000, "receipt", "voided"),
  ]);
  assert.equal(balance.pendingMinor, 0);
  assert.equal(balance.status, "paid");
  assert.throws(() => summarizeReceivable(receivable, [payment("p1", 30_000), payment("p1", 30_000)]), /duplicado/i);
});

test("refund reopens debt without treating refund as new expense", () => {
  const balance = summarizeReceivable(receivable, [payment("p1", 119_000), payment("r1", 20_000, "refund")]);
  assert.equal(balance.grossReceivedMinor, 119_000);
  assert.equal(balance.refundedMinor, 20_000);
  assert.equal(balance.pendingMinor, 20_000);
  assert.equal(balance.status, "partial");
  assert.throws(() => assertRefundAllowed(balance, 100_000), /cobro neto/i);
});

test("no accidental overpayments, foreign movements, negative or fractional minor units", () => {
  assert.throws(() => summarizeReceivable(receivable, [payment("p1", 120_000)]), /superiores a la deuda/i);
  assert.throws(() => summarizeReceivable(receivable, [{ ...payment("p1", 1), currency: "USD" }]), /Monedas distintas/i);
  assert.throws(() => summarizeReceivable(receivable, [{ ...payment("p1", 1), receivableId: "other" }]), /otra cuenta/i);
  assert.throws(() => summarizeReceivable(receivable, [payment("r1", 1, "refund")]), /devoluciones superan/i);
  assert.throws(() => assertMinorUnits(-1), RangeError);
  assert.throws(() => assertMinorUnits(1.5), RangeError);
  assert.throws(() => assertMinorUnits(Number.MAX_SAFE_INTEGER + 1), RangeError);
});

test("zero-value receivable is settled, but no zero-value receipt is posted", () => {
  const balance = summarizeReceivable({ ...receivable, totalMinor: 0 }, []);
  assert.equal(balance.status, "paid");
  assert.throws(() => assertReceiptAllowed(balance, 0), RangeError);
});

test("UTC boundaries are reported in America/Lima rather than UTC month", () => {
  assert.equal(monthInLima("2026-12-01T01:30:00Z"), "2026-11");
  assert.equal(monthInLima("2026-11-30T23:30:00-05:00"), "2026-11");
  assert.equal(monthInLima("2026-12-01T05:30:00Z"), "2026-12");
  assert.throws(() => monthInLima("2026-11-25"), /zona horaria/i);
});

test("cash flow separates receipts, refunds, expenses, currencies and voids", () => {
  const at = "2026-11-25T12:00:00-05:00";
  const movements: CashMovement[] = [
    { id: "a", at, kind: "receipt", amountMinor: 119_000, status: "posted", currency: "PEN" },
    { id: "b", at, kind: "refund", amountMinor: 20_000, status: "posted", currency: "PEN" },
    { id: "c", at, kind: "expense", amountMinor: 30_000, status: "posted", currency: "PEN" },
    { id: "d", at, kind: "expense", amountMinor: 10_000, status: "voided", currency: "PEN" },
    { id: "e", at, kind: "receipt", amountMinor: 12_000, status: "posted", currency: "USD" },
    { id: "f", at: "2026-12-01T10:00:00Z", kind: "receipt", amountMinor: 1_000, status: "posted", currency: "PEN" },
  ];
  assert.deepEqual(summarizeCashFlow(movements, "PEN", "2026-11"), {
    currency: "PEN", month: "2026-11", receivedMinor: 119_000, refundedMinor: 20_000,
    expensesMinor: 30_000, operatingCashMinor: 69_000,
  });
  assert.equal(summarizeCashFlow(movements, "USD", "2026-11").receivedMinor, 12_000);
  assert.throws(() => summarizeCashFlow(movements, "PEN", "2026-13"), /Periodo inválido/i);
});

test("negative operating cash is allowed; it is not revenue or tax profit", () => {
  const result = summarizeCashFlow([{ id: "x", at: "2026-11-25T00:00:00Z", currency: "PEN", kind: "expense", amountMinor: 5_000, status: "posted" }], "PEN", "2026-11");
  assert.equal(result.operatingCashMinor, -5_000);
});
