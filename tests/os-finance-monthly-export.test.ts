import assert from "node:assert/strict";import test from "node:test";
import {monthlyVouchers,monthlyMovements} from "../app/lib/os/finance/monthly-export";
import type {FinanceVoucher,FinanceMovement} from "../app/lib/os/finance/operations";
test("monthly accounting report distinguishes zero tax and missing tax and protects spreadsheet text",()=>{
 const row:FinanceVoucher={id:"v1",account_id:"a1",receipt_id:"m1",issuer_ruc:"10000000001",series:"EB01",number:"1",issued_on:"2026-11-26",currency:"PEN",total_minor:50000,igv_minor:0,discount_minor:0,customer:"=EXAMPLE",document_type:"DNI",document_number:"00000001",description:"Example",status:"recorded",correction_reason:null,source_kind:"sunat_original",items:[]};
 const csv=monthlyVouchers([row,{...row,id:"v2",number:"2",igv_minor:null,status:"external_void",correction_reason:"Example"}]);assert.match(csv,/"EB01-1"/);assert.match(csv,/"'=EXAMPLE"/);assert.match(csv,/,500,0,0,/);assert.match(csv,/,500,"",0,/);assert.match(csv,/"external_void"/);
});
test("movement export preserves receipt reference and void state separately from boletas",()=>{const row:FinanceMovement={id:"m1",account_id:"a1",kind:"receipt",currency:"PEN",amount_minor:50000,occurred_on:"2026-11-26",method:"yape",expense_class:null,description:"Example",reference:"001",status:"voided",void_reason:"Example"};const csv=monthlyMovements([row]);assert.match(csv,/"receipt","PEN",500,"yape"/);assert.match(csv,/"001","voided","a1","m1"/);});
