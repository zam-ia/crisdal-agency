import assert from "node:assert/strict";
import test from "node:test";
import { estimateBreakEven, limaDate, normalizeVoucher, parseMoney } from "../app/lib/os/finance/operations";

test("monetary input is exact in cents, accepts decimal comma, rejects ambiguous formats",()=>{
 assert.equal(parseMoney("1190.10"),119010);
 assert.equal(parseMoney("0,29"),29);
 assert.equal(parseMoney("12.5"),1250);
 assert.equal(parseMoney("0"),0);
 for(const v of ["-10","1.001","1,000.00","1e3","NaN","", "99999999999.99"])assert.throws(()=>parseMoney(v));
});
test("SUNAT series and number are normalized for duplicate detection",()=>{
 assert.deepEqual(normalizeVoucher(" eb01 ","00000023"),{series:"EB01",number:"23"});
 assert.throws(()=>normalizeVoucher("B01","23"));
 assert.throws(()=>normalizeVoucher("EB01","0"));
 assert.throws(()=>normalizeVoucher("EB01","123456789"));
});
test("Lima dates respect the local business day at UTC midnight",()=>{
 assert.equal(limaDate(new Date("2026-12-01T02:00:00Z")),"2026-11-30");
 assert.equal(limaDate(new Date("2026-12-01T05:00:00Z")),"2026-12-01");
});
test("break-even rounds up to whole events and reports target revenue",()=>{
 const r=estimateBreakEven({fixedMinor:150000,averageSaleMinor:120000,variableMinor:40000});
 assert.equal(r.events,2);assert.equal(r.revenueMinor,240000);assert.equal(r.contributionMinor,80000);
});
test("unprofitable or zero-price scenarios have no finite break-even",()=>{
 assert.equal(estimateBreakEven({fixedMinor:150000,averageSaleMinor:40000,variableMinor:40000}).events,null);
 assert.equal(estimateBreakEven({fixedMinor:150000,averageSaleMinor:0,variableMinor:0}).events,null);
 assert.equal(estimateBreakEven({fixedMinor:0,averageSaleMinor:100,variableMinor:0}).events,0);
 assert.throws(()=>estimateBreakEven({fixedMinor:-1,averageSaleMinor:100,variableMinor:0}));
});
