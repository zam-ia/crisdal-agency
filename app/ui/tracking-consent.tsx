"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { GoogleTagManager } from "./google-tag-manager";
import { MetaPixel } from "./meta-pixel";

import { MARKETING_CONSENT_EVENT, MARKETING_CONSENT_KEY, readMarketingConsent, writeMarketingCookie, type MarketingConsent } from "../lib/marketing-consent";

function subscribe(callback: () => void) {
  const listener = () => callback();
  window.addEventListener("storage", listener);
  window.addEventListener(MARKETING_CONSENT_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(MARKETING_CONSENT_EVENT, listener);
  };
}

export function TrackingConsent() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, readMarketingConsent, () => null);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  function choose(value: Exclude<MarketingConsent, null>) {
    try { localStorage.setItem(MARKETING_CONSENT_KEY, value); } catch { /* Fail closed if preference cannot be stored. */ }
    writeMarketingCookie(value);
    window.dispatchEvent(new Event(MARKETING_CONSENT_EVENT));
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/panel") || pathname.startsWith("/entregas")) return null;

  return (
    <>
      {consent === "accepted" ? (
        <>
          <MetaPixel />
          <GoogleTagManager />
        </>
      ) : null}
      {ready && consent === null ? (
        <aside className="consent-banner" aria-label="Preferencias de medición">
          <p>
            Usamos medición de Meta y, si está configurado, Google Tag Manager
            para entender visitas, reproducción de video y clics a WhatsApp.
          </p>
          <div>
            <button type="button" className="consent-secondary" onClick={() => choose("rejected")}>Solo necesarias</button>
            <button type="button" className="consent-primary" onClick={() => choose("accepted")}>Aceptar medición</button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
