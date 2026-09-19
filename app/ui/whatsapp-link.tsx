"use client";

import { useEffect, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
  UTM_KEYS,
  type Placement,
} from "../lib/config";
import { trackMarketingEvent } from "./site-events";

const ATTRIBUTION_KEY = "crisdal:attribution";
const LEAD_KEY = "crisdal:lead";
let sentInMemory = false;

function readAttribution(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const current: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value)
      current[key] = Array.from(value)
        .filter((char) => char.charCodeAt(0) >= 32)
        .join("")
        .slice(0, 120);
  }
  try {
    if (Object.keys(current).length)
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
    return Object.keys(current).length
      ? current
      : JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
  } catch {
    return current;
  }
}

function cookie(name: string) {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function trackLead(placement: Placement, eventName: string) {
  const attribution = readAttribution();
  trackMarketingEvent(eventName, { placement, ...attribution });
  if (sentInMemory) return;
  try {
    if (sessionStorage.getItem(LEAD_KEY)) return;
  } catch {
    /* Storage is optional. */
  }
  sentInMemory = true;
  const eventId = crypto.randomUUID();
  const details = {
    content_name: "Sistema de Captación Directa",
    content_category: "whatsapp_click",
    placement,
    ...attribution,
  };
  // The base snippet creates a queue before hydration; the remote script remains async.
  if (window.fbq) window.fbq("track", "Lead", details, { eventID: eventId });
  else {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.fbq) {
        window.fbq("track", "Lead", details, { eventID: eventId });
        window.clearInterval(timer);
      } else if (attempts >= 20) window.clearInterval(timer);
    }, 100);
  }
  const body = JSON.stringify({
    eventId,
    placement,
    attribution,
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc"),
    path: window.location.pathname,
  });
  void fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
  try {
    sessionStorage.setItem(LEAD_KEY, eventId);
  } catch {
    /* A blocked store must not block WhatsApp. */
  }
}

export function WhatsAppLink({
  children,
  placement,
  className = "",
  phone = WHATSAPP_NUMBER,
  message = WHATSAPP_MESSAGE,
  eventName = `click_whatsapp_${placement}`,
}: {
  children: ReactNode;
  placement: Placement;
  className?: string;
  phone?: string;
  message?: string;
  eventName?: string;
}) {
  const router = useRouter();
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  useEffect(() => {
    readAttribution();
  }, []);
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Keep native links: mobile app routing, new-tab gestures and no-JS fallback work.
    trackLead(placement, eventName);
    if (
      placement !== "thanks" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      window.setTimeout(() => router.push("/gracias"), 350);
    }
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
      data-placement={placement}
    >
      {children}
    </a>
  );
}
