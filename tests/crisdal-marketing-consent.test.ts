import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/lead/route";
import { canMeasureMarketing, isLeadTrackingPath, MARKETING_CONSENT_COOKIE } from "../app/lib/marketing-consent";

test("only explicit acceptance enables measurement", () => {
  for (const value of [null, undefined, "rejected", true, "yes"]) assert.equal(canMeasureMarketing(value), false);
  assert.equal(canMeasureMarketing("accepted"), true);
});

test("portfolios, packages and calendar are allowed without widening to admin routes", () => {
  for (const path of ["/portafolio", "/portafolio/boda-en-huancayo", "/paquetes", "/consultar-fecha"]) assert.equal(isLeadTrackingPath(path), true);
  for (const path of ["/admin", "/panel", "/portafolio/boda/privado", "/portafolio/boda?debug=1", "https://other.example/portafolio", "/portafolio/" + "a".repeat(121)]) assert.equal(isLeadTrackingPath(path), false);
});

test("lead handler refuses missing and rejected choices before provider dispatch", async () => {
  for (const choice of [null, "rejected"]) {
    const headers = new Headers({ origin: "https://crisdal-agency.vercel.app", "content-type": "application/json" });
    if (choice) headers.set("cookie", `${MARKETING_CONSENT_COOKIE}=${choice}`);
    const request = new NextRequest("https://crisdal-agency.vercel.app/api/lead", {
      method: "POST", headers,
      body: JSON.stringify({ eventId: "11111111-1111-4111-8111-111111111111", placement: "public_date_fallback", path: "/consultar-fecha" }),
    });
    const response = await POST(request);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).status, "consent_required");
  }
});

test("consented portfolio click preserves event ID and attribution with provider mocked", async (t) => {
  const oldToken = process.env.META_CAPI_ACCESS_TOKEN;
  const oldVersion = process.env.META_GRAPH_API_VERSION;
  t.after(() => {
    if (oldToken === undefined) delete process.env.META_CAPI_ACCESS_TOKEN; else process.env.META_CAPI_ACCESS_TOKEN = oldToken;
    if (oldVersion === undefined) delete process.env.META_GRAPH_API_VERSION; else process.env.META_GRAPH_API_VERSION = oldVersion;
  });
  process.env.META_CAPI_ACCESS_TOKEN = "fixture-only";
  process.env.META_GRAPH_API_VERSION = "v23.0";
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response("{}", { status: 200 }));
  const eventId = "11111111-1111-4111-8111-111111111111";
  const request = new NextRequest("https://crisdal-agency.vercel.app/api/lead", {
    method: "POST",
    headers: { origin: "https://crisdal-agency.vercel.app", "content-type": "application/json", cookie: `${MARKETING_CONSENT_COOKIE}=accepted` },
    body: JSON.stringify({ eventId, placement: "public_header", path: "/portafolio/boda-en-huancayo", attribution: { utm_source: "meta" } }),
  });
  assert.equal((await POST(request)).status, 200);
  assert.equal(fetchMock.mock.callCount(), 1);
  const [, init] = fetchMock.mock.calls[0].arguments as unknown as Parameters<typeof fetch>;
  const [event] = JSON.parse(String(init?.body)).data;
  assert.equal(event.event_id, eventId);
  assert.equal(event.custom_data.utm_source, "meta");
  assert.equal(event.custom_data.content_category, "whatsapp_click");
});
