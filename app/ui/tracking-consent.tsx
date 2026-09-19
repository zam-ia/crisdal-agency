"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { GoogleTagManager } from "./google-tag-manager";
import { MetaPixel } from "./meta-pixel";

const CONSENT_KEY = "crisdal:marketing-consent";
const CONSENT_EVENT = "crisdal-marketing-consent";
type Consent = "accepted" | "rejected" | null;

function readConsent(): Consent {
  const stored = localStorage.getItem(CONSENT_KEY);
  return stored === "accepted" || stored === "rejected" ? stored : null;
}

function subscribe(callback: () => void) {
  const listener = () => callback();
  window.addEventListener("storage", listener);
  window.addEventListener(CONSENT_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CONSENT_EVENT, listener);
  };
}

export function TrackingConsent() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, readConsent, () => null);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  function choose(value: Exclude<Consent, null>) {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (pathname.startsWith("/admin")) return null;

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
