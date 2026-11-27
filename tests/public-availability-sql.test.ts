import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261126120000_crisdal_public_availability_inquiries.sql"), "utf8");

test("availability projection has no customer identifying fields", () => {
  const createBlock = sql.match(/create table if not exists public\.crisdal_public_availability_days[\s\S]*?\);/i)?.[0] ?? "";
  assert.match(createBlock, /day date not null/i);
  assert.match(createBlock, /verified_until/i);
  assert.doesNotMatch(createBlock, /client_name|client_id|location|contact_phone|event_description/i);
});

test("both public-looking relations have RLS and no anon grants", () => {
  assert.match(sql, /alter table public\.crisdal_public_availability_days enable row level security/i);
  assert.match(sql, /alter table public\.crisdal_public_date_inquiries enable row level security/i);
  assert.match(sql, /revoke all on public\.crisdal_public_availability_days,public\.crisdal_public_date_inquiries from anon,authenticated/i);
  assert.doesNotMatch(sql, /grant (select|insert|update|delete) on public\.crisdal_public_date_inquiries to anon/i);
});

test("anonymous form throttling is transactional and functions are service-role only", () => {
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /CRISDAL_RATE_LIMIT/);
  assert.match(sql, /grant execute on function public\.crisdal_submit_public_date_inquiry.*to service_role/i);
});

test("public states expire, no demo availability is seeded, audited writes", () => {
  assert.match(sql, /verified_fresh_window/i);
  assert.match(sql, /interval '12 hours'/);
  assert.match(sql, /availability\.public\.status\.changed/);
  assert.match(sql, /-- No seed, no fabricated availability/);
});

test("blocked dates are computed over all confirmed agenda rows and only exposed to the server", () => {
  const fn = sql.match(/create or replace function public\.crisdal_public_agenda_blocked_days[\s\S]*?\$\$;/i)?.[0] ?? "";
  assert.match(fn, /returns table \(day date\)/i);
  assert.match(fn, /security invoker/i);
  assert.match(fn, /exists\s*\(/i);
  assert.match(fn, /status = 'confirmed'/i);
  assert.doesNotMatch(fn, /\blimit\b/i);
  assert.match(sql, /revoke all on function public\.crisdal_public_agenda_blocked_days\(date\) from public, anon, authenticated/i);
});
