import { NextRequest } from "next/server";
import { PIXEL_ID, PLACEMENTS, SITE_URL, UTM_KEYS } from "../../lib/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = new Set([SITE_URL]);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL)
    allowed.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.NODE_ENV !== "production")
    allowed.add("http://localhost:3000");
  if (!origin || !allowed.has(origin))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Invalid content type" }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 4096)
    return Response.json({ error: "Payload too large" }, { status: 413 });
  let data;
  try {
    const text = await request.text();
    if (text.length > 4096)
      return Response.json({ error: "Payload too large" }, { status: 413 });
    data = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    !data ||
    typeof data !== "object" ||
    !/^[a-f0-9-]{36}$/i.test(data.eventId || "") ||
    !PLACEMENTS.includes(data.placement) ||
    !["/", "/gracias"].includes(data.path)
  )
    return Response.json({ error: "Invalid event" }, { status: 400 });
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  // The browser pixel works independently. No pretend success for an unconfigured CAPI.
  if (!token)
    return Response.json({ status: "not_configured" }, { status: 202 });
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version || !/^v\d+\.\d+$/.test(version))
    return Response.json({ status: "not_configured" }, { status: 202 });
  const attribution: Record<string, string> = {};
  for (const key of UTM_KEYS)
    if (typeof data.attribution?.[key] === "string")
      attribution[key] = data.attribution[key].slice(0, 120);
  const userData: Record<string, string> = {
    client_user_agent: request.headers.get("user-agent") || "",
  };
  const ip = request.headers.get("x-real-ip");
  if (ip) userData.client_ip_address = ip;
  for (const key of ["fbp", "fbc"])
    if (
      typeof data[key] === "string" &&
      /^fb\.\d+\.\d+\.[A-Za-z0-9_.-]{1,500}$/.test(data[key])
    )
      userData[key] = data[key];
  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        action_source: "website",
        event_source_url: `${SITE_URL}${data.path}`,
        user_data: userData,
        custom_data: {
          content_name: "Impulso Local",
          content_category: "whatsapp_click",
          placement: data.placement,
          ...attribution,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };
  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) {
      console.error("Meta CAPI rejected the event", response.status);
      return Response.json({ status: "delivery_failed" }, { status: 502 });
    }
    return Response.json({ status: "sent" });
  } catch {
    return Response.json({ status: "delivery_failed" }, { status: 502 });
  }
}
