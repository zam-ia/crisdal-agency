import assert from "node:assert/strict";
import test from "node:test";
import { emptyScenario, formatScenarioMoney, simulateFinance } from "../app/lib/os/finance/scenario";

test("empty inputs do not present a zero estimate as real activity", () => {
  assert.equal(simulateFinance("PEN", emptyScenario).result, null);
});
test("estimates a partial collection, refund and paid expenses in exact cents", () => {
  const { result } = simulateFinance("PEN", { due: "1190.00", collected: "300,50", refunded: "20.25", expenses: "80" });
  assert.equal(result?.status, "partial");
  assert.equal(result?.netReceivedMinor, 28025);
  assert.equal(result?.pendingMinor, 90975);
  assert.equal(result?.cashEffectMinor, 20025);
});
test("uncollected amounts do not count as cash; a negative cash effect is valid", () => {
  const { result } = simulateFinance("USD", { ...emptyScenario, due: "350", expenses: "25.10" });
  assert.equal(result?.pendingMinor, 35000);
  assert.equal(result?.cashEffectMinor, -2510);
  assert.equal(formatScenarioMoney(-2510, "USD"), "−US$ 25.10");
});
test("full collection in USD clears the pending balance", () => {
  const { result } = simulateFinance("USD", { ...emptyScenario, due: "12.05", collected: "12.05" });
  assert.equal(result?.status, "paid");
  assert.equal(result?.pendingMinor, 0);
  assert.equal(formatScenarioMoney(result.cashEffectMinor, "USD"), "US$ 12.05");
});
test("rejects refunds beyond receipts and collections beyond the net amount due", () => {
  const refund = simulateFinance("PEN", { ...emptyScenario, due: "100", collected: "10", refunded: "11" });
  assert.equal(refund.result, null);
  assert.ok(refund.errors.refunded);
  const collection = simulateFinance("PEN", { ...emptyScenario, due: "100", collected: "100.01" });
  assert.equal(collection.result, null);
  assert.ok(collection.errors.collected);
});
test("rejects negative, ambiguous, and unsafe inputs rather than guessing", () => {
  for (const due of ["-10", "1,000", "1e3", "0,125", "99999999999999.99"]) {
    const invalid = simulateFinance("PEN", { ...emptyScenario, due });
    assert.equal(invalid.result, null);
    assert.ok(invalid.errors.due);
  }
});
