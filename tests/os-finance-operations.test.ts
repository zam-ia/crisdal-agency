import assert from "node:assert/strict";
import test from "node:test";
import { estimateBreakEven, limaDate, normalizeVoucher, parseMoney, receiptReference, parseVoucherNumber, validateVoucherDetail } from "../app/lib/os/finance/operations";

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

test("voucher service detail records amounts without recalculating tax or cash",()=>{
 const item={quantity:1,description:" Cobertura de prueba ",unitMinor:50000,lineMinor:50000};
 assert.deepEqual(validateVoucherDetail([item],0),[{...item,description:"Cobertura de prueba"}]);
 assert.deepEqual(validateVoucherDetail([],null),[]);
 assert.throws(()=>validateVoucherDetail([{...item,quantity:0}],0));
 assert.throws(()=>validateVoucherDetail([{...item,unitMinor:-1}],0));
 assert.throws(()=>validateVoucherDetail([item],-1));
 assert.throws(()=>validateVoucherDetail(Array.from({length:21},()=>item),0));
 // The source may show an explicit rounded or tax-inclusive line amount.
 assert.equal(validateVoucherDetail([{...item,quantity:2,lineMinor:99999}],null)[0].lineMinor,99999);
});

test("receipt keeps its SUNAT reference or generates a stable cash code from the request", () => {
 const requestId = "11111111-1111-4111-8111-111111111111";
 const cashCode = "EF-11111111111141118111111111111111";
 assert.equal(receiptReference("EB01-0027", "cash", requestId), "EB01-0027");
 assert.equal(receiptReference(null, "cash", requestId), cashCode);
 assert.equal(receiptReference(null, "cash", requestId), cashCode);
 assert.notEqual(receiptReference(null, "cash", "22222222-2222-4222-8222-222222222222"), cashCode);
 assert.equal(receiptReference(null, "transfer", requestId), null);
});

test("voucher prefill preserves the supplied correlativo and rejects invalid input", () => {
 assert.deepEqual(parseVoucherNumber(" eb01 - 0027 "), {series:"EB01",number:"0027"});
 assert.equal(parseVoucherNumber("EF-11111111111141118111111111111111"), null);
 assert.equal(parseVoucherNumber("EB01-0"), null);
 assert.equal(parseVoucherNumber("Refer. 33"), null);
 assert.equal(parseVoucherNumber(""), null);
});
