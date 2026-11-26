import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = (name: string) => readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8");

test("commercial migrations enable RLS and deny direct browser access", () => {
  const sql = `${migration("20261125150000_crisdal_commercial_portfolio.sql")}\n${migration("20261125160000_crisdal_commercial_packages.sql")}`.toLowerCase();
  for (const table of ["portfolio_projects", "media_assets", "publication_consents", "commercial_packages", "package_share_links"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /revoke all on[\s\S]*from anon,authenticated/);
  assert.match(sql, /grant all on[\s\S]*to service_role/);
});

test("commercial migrations preserve approved prices and hash-only share tokens", () => {
  const sql = migration("20261125160000_crisdal_commercial_packages.sql").toLowerCase();
  assert.match(sql, /'impulso'[\s\S]*89900/);
  assert.match(sql, /'crecimiento'[\s\S]*119900/);
  assert.match(sql, /'dominio-digital'[\s\S]*159900/);
  assert.match(sql, /token_hash text not null unique/);
  assert.doesNotMatch(sql, /create table[^;]*\btoken\s+text/);
});

test("portfolio storage is image-only and publication evidence is separate", () => {
  const sql = migration("20261125150000_crisdal_commercial_portfolio.sql").toLowerCase();
  assert.match(sql, /allowed_mime_types[\s\S]*image\/jpeg[\s\S]*image\/webp/);
  assert.match(sql, /create table if not exists public\.publication_consents/);
  assert.match(sql, /evidence_reference text not null/);
});
