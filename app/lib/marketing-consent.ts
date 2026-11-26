export const MARKETING_CONSENT_KEY = "crisdal:marketing-consent";
export const MARKETING_CONSENT_EVENT = "crisdal-marketing-consent";
export const MARKETING_CONSENT_COOKIE = "crisdal_marketing_consent";
export type MarketingConsent = "accepted" | "rejected" | null;

export function canMeasureMarketing(value: unknown): boolean {
  return value === "accepted";
}

export function readMarketingConsent(): MarketingConsent {
  try {
    const value = localStorage.getItem(MARKETING_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch { return null; }
}

export function writeMarketingCookie(value: Exclude<MarketingConsent, null>) {
  document.cookie = `${MARKETING_CONSENT_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

const leadPaths = new Set(["/", "/contenido", "/eventos", "/portafolio", "/planes", "/contacto", "/ruta-crisdal", "/gracias", "/consultar-fecha", "/paquetes"]);
export function isLeadTrackingPath(path: unknown): path is string {
  return typeof path === "string" && (leadPaths.has(path) || /^\/portafolio\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) && path.length <= 132);
}
