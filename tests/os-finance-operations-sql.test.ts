import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const sql=readFileSync("supabase/migrations/20261126200000_crisdal_operational_finance.sql","utf8");
test("all financial tables have RLS and no client role grants",()=>{
 for(const name of ["accounts","movements","vouchers","requests"])assert.match(sql,new RegExp("alter table public.crisdal_finance_"+name+" enable row level security"));
 assert.match(sql,/revoke all on public\.crisdal_finance_accounts[\s\S]+?from anon,authenticated;/);
});
test("RPCs require capability and use invoker rights, not definer bypass",()=>{
 assert.match(sql,/rc\.capability_code='finance\.write'/);
 assert.match(sql,/rc\.capability_code='finance\.read'/);
 assert.match(sql,/revoke all on function public\.crisdal_finance_write[^;]+from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.crisdal_finance_snapshot[^;]+from public,anon,authenticated/);
 assert.doesNotMatch(sql,/security definer/i);
});
test("SQL declares document uniqueness and account balance checks",()=>{
 assert.match(sql,/unique\(issuer_ruc,series,number\)/);
 assert.match(sql,/net_value<0 or net_value>a\.total_minor/);
 assert.match(sql,/where id=account_id_value for update/);
});
test("cash aggregation comes exclusively from movements, documents from vouchers",()=>{
 const cash=sql.slice(sql.indexOf("), cash as ("),sql.indexOf("), docs as ("));
 const docs=sql.slice(sql.indexOf("), docs as ("),sql.indexOf("), trend as ("));
 assert.match(cash,/from public\.crisdal_finance_movements/);
 assert.doesNotMatch(cash,/finance_vouchers/);
 assert.match(docs,/from public\.crisdal_finance_vouchers/);
 assert.match(docs,/status<>'external_void'/);
});
test("idempotency uses payload digest and transaction includes audit event",()=>{
 assert.match(sql,/payload_hash text not null/);
 assert.match(sql,/sha256\(convert_to\(p_payload::text,'UTF8'\)\)/);
 assert.match(sql,/insert into public\.crisdal_os_audit_events/);
 assert.match(sql,/update public\.crisdal_finance_requests set result_id=result_value/);
});

test("migration contains a single transaction and single RPC definitions",()=>{
 assert.equal((sql.match(/commit;/g)||[]).length,1);
 assert.equal((sql.match(/create function public\.crisdal_finance_write/g)||[]).length,1);
 assert.equal((sql.match(/create function public\.crisdal_finance_snapshot/g)||[]).length,1);
 assert.ok(sql.includes("payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$')"));
 assert.ok(sql.includes("result_id uuid"));
});
test("voucher provenance and detail are stored independently from cash",()=>{
 assert.match(sql,/source_kind in \('sunat_original','commercial_summary','manual_reference'\)/);
 assert.match(sql,/jsonb_array_length\(voucher_items\)>20/);
 assert.match(sql,/discount_minor bigint/);
 assert.match(sql,/items=voucher_items/);
});
