import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20261126180000_crisdal_client_delivery_galleries.sql", "utf8");

test("delivery galleries, assets and intents all have RLS enabled", () => {
  for (const table of ["crisdal_client_galleries","crisdal_client_gallery_assets","crisdal_client_gallery_upload_intents"]) {
    assert.ok(sql.includes(`alter table public.${table} enable row level security`));
  }
});
test("no direct anonymous or authenticated read/write privileges", () => {
  assert.match(sql, /revoke all on public\.crisdal_client_galleries[\s\S]*from anon, authenticated;/);
  assert.match(sql, /grant all on public\.crisdal_client_galleries[\s\S]*to service_role;/);
});
test("gallery requires secure link and expiration before publication", () => {
  assert.match(sql, /status <> 'published' or \(token_hash is not null and expires_at is not null and published_at is not null\)/);
  assert.match(sql, /token_hash text unique/);
});
test("private gallery migration never provisions a publicly readable bucket", () => {
  assert.equal(/insert into storage\.buckets/i.test(sql), false);
  assert.match(sql, /crisdal-private-media/);
});
test("gallery assets maintain referential integrity and private storage paths", () => {
  assert.match(sql, /references public\.crisdal_client_galleries\(id\) on delete cascade/);
  assert.match(sql, /original_path text unique/);
  assert.match(sql, /thumbnail_path text unique/);
});
