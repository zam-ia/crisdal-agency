import {JsonBodyError,readBoundedJson} from "../../lib/os/bounded-json";
import { NextRequest } from "next/server";
import { eventDataForPath, PIXEL_ID, PLACEMENTS, SITE_URL, UTM_KEYS } from "../../lib/config";

import { canMeasureMarketing, isLeadTrackingPath, MARKETING_CONSENT_COOKIE } from "../../lib/marketing-consent";

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
  let data;
  try {
    data = await readBoundedJson(request,4096) as Record<string,unknown> | null;
  } catch(error) {
    return Response.json({error:error instanceof JsonBodyError?error.message:"Invalid JSON"},{status:error instanceof JsonBodyError?error.status:400});
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof data.eventId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.eventId) ||
    typeof data.placement !== "string" || !PLACEMENTS.some(p=>p===data.placement) ||
    typeof data.path !== "string" || !isLeadTrackingPath(data.path)
  )
    return Response.json({ error: "Invalid event" }, { status: 400 });
  if (!canMeasureMarketing(request.cookies.get(MARKETING_CONSENT_COOKIE)?.value))
    return Response.json({ status: "consent_required" }, { status: 403 });
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  // The browser pixel works independently. No pretend success for an unconfigured CAPI.
  if (!token)
    return Response.json({ status: "not_configured" }, { status: 202 });
  const version = process.env.META_GRAPH_API_VERSION;
  if (!version || !/^v\d+\.\d+$/.test(version))
    return Response.json({ status: "not_configured" }, { status: 202 });
  const attribution: Record<string, string> = {};
  const source = data.attribution && typeof data.attribution === "object" ? data.attribution as Record<string,unknown> : {};
  for (const key of UTM_KEYS)
    if (typeof source[key] === "string")
      attribution[key] = (source[key] as string).slice(0, 120);
  const userData: Record<string, string> = {
    client_user_agent: request.headers.get("user-agent") || "",
  };
  const ip = request.headers.get("x-real-ip");
  if (ip) userData.client_ip_address = ip;
  for (const key of ["fbp", "fbc"])
    if (
      typeof data[key] === "string" &&
      /^fb\.\d+\.\d+\.[A-Za-z0-9_.-]{1,500}$/.test(data[key] as string)
    )
      userData[key] = data[key] as string;
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
          ...eventDataForPath(data.path),
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
