import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { conflictsWith, type AgendaItem } from "../app/lib/os/agenda";
import { parseExternalVideoUrl } from "../app/lib/commercial/portfolio";
import { isPromotionActive, type Promotion } from "../app/lib/commercial/promotions";

test("external video allowlist supports official players and rejects injection", () => {
  assert.equal(parseExternalVideoUrl("https://www.tiktok.com/@crisdal/video/7345678901234567890")?.embedUrl, "https://www.tiktok.com/player/v1/7345678901234567890?controls=1&autoplay=0&rel=0");
  assert.equal(parseExternalVideoUrl("https://facebook.com/watch/?v=123")?.embedUrl, null);
  assert.equal(parseExternalVideoUrl("javascript:alert(1)"), null);
  assert.equal(parseExternalVideoUrl("https://youtube.com.evil.test/watch?v=abc1234"), null);
});

test("promotions honor page, state and UTC boundaries", () => {
  const item: Promotion = { id:"10000000-0000-4000-8000-000000000001",internalName:"Evento real",title:"Consulta tu fecha",description:"Disponibilidad real para tu próximo evento.",imageUrl:null,ctaLabel:"Consultar",destination:"https://example.test",pages:["events"],startsAt:"2026-11-25T10:00:00.000Z",endsAt:"2026-11-26T10:00:00.000Z",status:"active",priority:1,placement:"banner",showMobile:true,showDesktop:true,createdAt:"2026-11-25T00:00:00.000Z",updatedAt:"2026-11-25T00:00:00.000Z" };
  assert.equal(isPromotionActive(item,"events",new Date("2026-11-25T12:00:00Z")),true);
  assert.equal(isPromotionActive(item,"packages",new Date("2026-11-25T12:00:00Z")),false);
  assert.equal(isPromotionActive(item,"events",new Date("2026-11-26T10:00:00Z")),false);
});

test("agenda detects active overlaps but ignores cancelled activities", () => {
  const base: AgendaItem = { id:"20000000-0000-4000-8000-000000000001",title:"Boda",category:"produccion",startsAt:"2026-12-01T20:00:00Z",endsAt:"2026-12-02T02:00:00Z",status:"confirmed",notes:"",projectId:null,createdAt:"2026-11-25T00:00:00Z",updatedAt:"2026-11-25T00:00:00Z" };
  assert.equal(conflictsWith([base],{ title:"Consulta",category:"consulta",startsAt:"2026-12-01T21:00:00Z",endsAt:"2026-12-01T22:00:00Z",status:"pending",notes:"",projectId:null }).length,1);
  assert.equal(conflictsWith([{...base,status:"cancelled"}],{ title:"Consulta",category:"consulta",startsAt:"2026-12-01T21:00:00Z",endsAt:"2026-12-01T22:00:00Z",status:"pending",notes:"",projectId:null }).length,0);
});

test("media and agenda migrations keep private data behind service role", () => {
  const media = readFileSync("supabase/migrations/20261125200000_crisdal_events_media_promotions.sql","utf8");
  const agenda = readFileSync("supabase/migrations/20261125210000_crisdal_agenda_base.sql","utf8");
  assert.match(media,/crisdal-private-media','crisdal-private-media',false/);
  assert.match(media,/revoke all on public\.portfolio_upload_intents,public\.commercial_promotions from anon,authenticated/);
  assert.match(agenda,/revoke all on public\.calendar_activities from anon, authenticated/);
});
