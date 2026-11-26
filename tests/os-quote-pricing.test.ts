import assert from "node:assert/strict";
import test from "node:test";
import { priceQuote, type QuotePricingInput } from "../app/lib/os/quotes/pricing";

const line = (id: string, unitPriceMinor: number, quantity = 1, discountBps = 0, taxBps = 0) => ({ id, unitPriceMinor, quantity, discountBps, taxBps });
const quote = (lines: QuotePricingInput["lines"], globalDiscount?: QuotePricingInput["globalDiscount"]): QuotePricingInput => ({ currency: "PEN", lines, globalDiscount });

test("event package S/1190 remains S/1190 without implicit tax", () => {
  const priced = priceQuote(quote([line("historia", 119_000)]));
  assert.equal(priced.subtotalMinor, 119_000);
  assert.equal(priced.taxMinor, 0);
  assert.equal(priced.totalMinor, 119_000);
});

test("quantity and item discount calculate in integer céntimos", () => {
  const priced = priceQuote(quote([line("session", 7550, 2, 1000)]));
  assert.equal(priced.subtotalMinor, 15_100);
  assert.equal(priced.lineDiscountsMinor, 1_510);
  assert.equal(priced.totalMinor, 13_590);
});

test("explicit 18 percent tax on taxable amount is not silently applied", () => {
  const priced = priceQuote(quote([line("shoot", 10_000, 1, 0, 1800)]));
  assert.equal(priced.taxMinor, 1800);
  assert.equal(priced.totalMinor, 11_800);
});

test("global fixed discount distributes proportionally across mixed-tax lines", () => {
  const priced = priceQuote(quote([line("a", 30_000, 1, 0, 1800), line("b", 90_000, 1, 0, 0)], { kind: "fixed", amountMinor: 10_000 }));
  assert.equal(priced.globalDiscountMinor, 10_000);
  assert.deepEqual(priced.lines.map((x) => x.globalDiscountMinor), [2500, 7500]);
  assert.deepEqual(priced.lines.map((x) => x.taxableBaseMinor), [27_500, 82_500]);
  assert.equal(priced.taxMinor, 4950);
  assert.equal(priced.totalMinor, 114_950);
});

test("sequential line and global rate discounts do not apply twice to original gross", () => {
  const priced = priceQuote(quote([line("a", 10_000, 1, 1000)], { kind: "percent", rateBps: 1000 }));
  assert.equal(priced.lineDiscountsMinor, 1000);
  assert.equal(priced.globalDiscountMinor, 900);
  assert.equal(priced.totalMinor, 8100);
});

test("100 percent discount is allowed and never produces a negative amount", () => {
  const priced = priceQuote(quote([line("gift", 10_000, 1, 10_000, 1800)]));
  assert.equal(priced.totalMinor, 0);
  assert.equal(priced.taxMinor, 0);
});

test("round-half-up at a fractional cent and largest remainder tie break are deterministic", () => {
  assert.equal(priceQuote(quote([line("a", 5, 1, 1000)])).lineDiscountsMinor, 1);
  const priced = priceQuote(quote([line("a", 1), line("b", 1), line("c", 1)], { kind: "fixed", amountMinor: 1 }));
  assert.deepEqual(priced.lines.map((x) => x.globalDiscountMinor), [1, 0, 0]);
  assert.equal(priced.lines.reduce((sum, x) => sum + x.totalMinor, 0), priced.totalMinor);
});

test("rounding taxes after global discount keeps sum of line totals equal quote total", () => {
  const priced = priceQuote(quote([line("a", 5, 1, 0, 1800), line("b", 5, 1, 0, 1800)], { kind: "fixed", amountMinor: 1 }));
  assert.equal(priced.netBeforeTaxMinor, 9);
  assert.equal(priced.taxMinor, 2);
  assert.equal(priced.totalMinor, 11);
  assert.equal(priced.lines.reduce((sum, x) => sum + x.totalMinor, 0), 11);
});

test("fixed discount cannot exceed net quoted value", () => {
  assert.throws(() => priceQuote(quote([line("a", 100)], { kind: "fixed", amountMinor: 101 })), /supera la base/i);
});

test("invalid quantities, monetary values, and bps are rejected", () => {
  assert.throws(() => priceQuote(quote([line("a", 10, 0)])), RangeError);
  assert.throws(() => priceQuote(quote([line("a", 1.25)])), RangeError);
  assert.throws(() => priceQuote(quote([line("a", -1)])), RangeError);
  assert.throws(() => priceQuote(quote([line("a", 10, 1, 10_001)])), RangeError);
  assert.throws(() => priceQuote(quote([line("a", 10, 1, 0, -1)])), RangeError);
  assert.throws(() => priceQuote(quote([line("a", 10)], { kind: "percent", rateBps: 10_001 })), RangeError);
});

test("duplicate IDs or zero lines cannot create a quote", () => {
  assert.throws(() => priceQuote(quote([])), /entre 1 y 200/i);
  assert.throws(() => priceQuote(quote([line("a", 10), line("a", 20)])), /duplicado/i);
});

test("overflow in line or aggregate price is rejected", () => {
  assert.throws(() => priceQuote(quote([line("a", Number.MAX_SAFE_INTEGER, 2)])), /rango/i);
  assert.throws(() => priceQuote(quote([line("a", Number.MAX_SAFE_INTEGER), line("b", 1)])), /rango/i);
});

test("USD does not mix with PEN or trigger implicit conversion", () => {
  const priced = priceQuote({ currency: "USD", lines: [line("a", 1234)] });
  assert.equal(priced.currency, "USD");
  assert.equal(priced.totalMinor, 1234);
  assert.throws(() => priceQuote({ currency: "EUR" as "PEN", lines: [line("a", 1234)] }), /no soportada/i);
});

test("no mutation of input objects; numeric result can be snapshotted", () => {
  const items = [line("a", 100), line("b", 200)];
  const frozen = Object.freeze({ currency: "PEN" as const, lines: Object.freeze(items.map((x) => Object.freeze(x))) });
  const result = priceQuote(frozen);
  assert.equal(result.totalMinor, 300);
  assert.equal(result.lines.length, 2);
});