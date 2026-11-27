import assert from "node:assert/strict";
import test from "node:test";
import { inferDocumentType, readInlineVoucher } from "../app/lib/os/finance/inline-voucher";

function sample() {
  const data = new FormData();
  for (const [field, value] of Object.entries({
    inlineNumber:"EB01-27", inlineDate:"2025-01-01", inlineCustomer:"Cliente de ensayo",
    inlineDocument:"00000001", inlineDocumentType:"DNI", inlineAmount:"500.00",
    inlineDescription:"Cobertura de ensayo",
  })) data.set(field, value);
  return data;
}

test("document inference uses digits and does not supply an identity", () => {
  assert.equal(inferDocumentType("00000001"), "DNI");
  assert.equal(inferDocumentType("10000000001"), "RUC");
  assert.equal(inferDocumentType("123"), "");
});

test("configured issuer stays off the client payload; manual mode validates its field", () => {
  const data = sample();
  assert.throws(() => readInlineVoucher(data, false), /RUC de Crisdal/);
  data.set("inlineIssuer", "10000000001");
  assert.equal(readInlineVoucher(data, false).issuerRuc, "10000000001");
  assert.equal(JSON.stringify(readInlineVoucher(data, true)).includes("issuerRuc"), false);
});

test("voucher amount is independent and omitted taxes differ from explicit zero", () => {
  const data = sample();
  const voucher = readInlineVoucher(data, true);
  assert.equal(voucher.amountMinor, 50000);
  assert.equal(voucher.igvMinor, null);
  assert.equal(voucher.discountMinor, null);
  assert.equal(voucher.documentNumber, "00000001");
  data.set("inlineIgv", "0");
  assert.equal(readInlineVoucher(data, true).igvMinor, 0);
});

test("invalid document, missing number and impossible date are rejected", () => {
  const data = sample();
  data.set("inlineNumber", "");
  assert.throws(() => readInlineVoucher(data, true));
  data.set("inlineNumber", "EB01-27");
  data.set("inlineDocument", "123");
  assert.throws(() => readInlineVoucher(data, true));
  data.set("inlineDocument", "00000001");
  data.set("inlineDate", "2025-02-30");
  assert.throws(() => readInlineVoucher(data, true));
});
