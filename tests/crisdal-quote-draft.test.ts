import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateDraft, decimalToHundredths } from "../app/lib/os/quotes/draft";

const line = { id: "one", description: "Cobertura", quantity: "2", unit: "99,90", discount: "10" };
const none = { kind: "none", value: "" } as const;

test("converts comma or dot decimals without floating-point arithmetic", () => {
  assert.equal(decimalToHundredths("0.1"), 10);
  assert.equal(decimalToHundredths("99,90"), 9990);
  assert.equal(decimalToHundredths(" 1 "), 100);
});

test("rejects negative, ambiguous, excessive precision and unsafe amounts", () => {
  for (const raw of ["-1","1,000","2.124","1e2","1,009.02","99999999999999.99",""]) {
    assert.equal(decimalToHundredths(raw), null, raw);
  }
});

test("calculates line and global percentage discounts, without tax", () => {
  const result = calculateDraft("PEN", [line], { kind: "percent", value: "5" }).prices;
  assert.equal(result?.subtotalMinor, 19980);
  assert.equal(result?.lineDiscountsMinor, 1998);
  assert.equal(result?.globalDiscountMinor, 899);
  assert.equal(result?.totalMinor, 17083);
  assert.equal(result?.taxMinor, 0);
});

test("USD changes the denomination and does not convert the amount", () => {
  const result = calculateDraft("USD", [line], { kind: "fixed", value: "0,01" }).prices;
  assert.equal(result?.currency, "USD");
  assert.equal(result?.totalMinor, 17981);
});

test("no total for incomplete data or invalid rates", () => {
  const result = calculateDraft("PEN", [{ ...line, description: " ", quantity: "1.5", unit: "-1", discount: "100.01" }], none);
  assert.equal(result.prices, null);
  assert.equal(Object.keys(result.errors).length, 4);
});

test("fixed discount above the total stays out of the summary", () => {
  const result = calculateDraft("PEN", [line], { kind: "fixed", value: "180" });
  assert.equal(result.prices, null);
  assert.match(result.summaryError, /supera/);
});

test("empty drafts and unfinished global amounts show no invented total", () => {
  assert.equal(calculateDraft("PEN", [], none).prices, null);
  assert.ok(calculateDraft("PEN", [line], { kind: "percent", value: "" }).errors.general);
});
