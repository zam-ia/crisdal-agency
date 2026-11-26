import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const sql=readFileSync("docs/sql/CRISDAL_OPERATIONS_CANDIDATE.sql","utf8");
const api=readFileSync("app/api/panel/operations/route.ts","utf8");
test("canonical contract acceptance creates one receivable and one project",()=>{
 assert.match(sql,/quote_id uuid unique references public\.crisdal_quotes/);
 assert.match(sql,/quote_id uuid not null unique references public\.crisdal_quotes/);
 assert.match(sql,/insert into public\.crisdal_finance_accounts\(quote_id/);
 assert.match(sql,/insert into public\.crisdal_production_projects\(quote_id/);
 assert.doesNotMatch(sql,/insert into public\.crisdal_finance_movements/);
 assert.doesNotMatch(sql,/insert into public\.calendar_activities/);
});
test("operational mutations use role checks, idempotency and audit",()=>{
 assert.match(sql,/public\.crisdal_ops_can\(p_actor,'finance.write'\)/);
 assert.match(sql,/from public\.crisdal_finance_requests where request_id=p_request for update/);
 assert.match(sql,/prior\.payload_hash<>v_hash/);
 assert.match(sql,/insert into public\.crisdal_os_audit_events/);
 assert.doesNotMatch(sql,/security definer/i);
 for(const table of ["clients","client_inquiries","quotes","production_projects","production_tasks"])assert.ok(sql.includes("alter table public.crisdal_"+table+" enable row level security"));
});
test("pricing and write authorization are checked on server",()=>{
 assert.match(api,/authorizePanelApi\(request,actionCaps\[parsed.data.action\],true\)/);
 assert.match(api,/priceQuote\(\{currency:x.currency,lines:x.lines/);
 assert.match(api,/auth.session.capabilities.includes\("finance.write"\)/);
});
test("private delivery routes fail closed",()=>{
 for(const path of ["app/api/panel/deliveries/route.ts","app/api/panel/deliveries/uploads/route.ts","app/api/deliveries/[token]/favorites/route.ts","app/api/deliveries/[token]/download/[assetId]/route.ts","app/entregas/[token]/page.tsx"])assert.ok(readFileSync(path,"utf8").includes('process.env.CRISDAL_PRIVATE_DELIVERIES_ENABLED !== "true"'));
 assert.match(sql,/new.project_id is distinct from old.project_id/);
});
