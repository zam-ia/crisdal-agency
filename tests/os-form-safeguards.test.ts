import assert from "node:assert/strict";
import test from "node:test";
import {canReuseFinanceWrite,markFinanceWriteUncertain,limaDateTimeInput,limaDateTimeToIso} from "../app/lib/os/form-safeguards";
test("uncertain finance write may only be retried with the original payload",()=>{const p=markFinanceWriteUncertain({body:"original",id:"example",uncertain:false});assert.equal(p?.id,"example");assert.equal(canReuseFinanceWrite(p,"original"),true);assert.equal(canReuseFinanceWrite(p,"changed"),false);assert.equal(canReuseFinanceWrite(null,"changed"),true);});
test("Lima consent timestamp round trips without shifting five hours",()=>{const utc="2026-11-27T02:30:00.000Z";assert.equal(limaDateTimeInput(utc),"2026-11-26T21:30");assert.equal(limaDateTimeToIso("2026-11-26T21:30"),utc);});
test("invalid local dates fail rather than silently rolling forward",()=>{assert.equal(limaDateTimeToIso("2026-02-30T10:00"),null);assert.equal(limaDateTimeToIso(""),null);assert.equal(limaDateTimeInput("invalid"),"");});
