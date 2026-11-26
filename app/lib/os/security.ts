import { createHash, randomUUID } from "node:crypto";

const LOCAL_HOSTS = new Set(["localhost:3000", "127.0.0.1:3000"]);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function fingerprint(value: string, secret = process.env.OS_AUDIT_PEPPER || "") {
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function newRequestId() {
  return randomUUID();
}

export function isTrustedOrigin({
  origin,
  host,
  forwardedHost,
}: {
  origin: string | null;
  host: string | null;
  forwardedHost?: string | null;
}) {
  if (!origin || (!host && !forwardedHost)) return false;
  let originHost = "";
  try {
    const url = new URL(origin);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return false;
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && LOCAL_HOSTS.has(url.host))) return false;
    originHost = url.host;
  } catch {
    return false;
  }

  const requestHost = (forwardedHost || host || "").split(",")[0].trim();
  if (originHost === requestHost) return true;
  return process.env.NODE_ENV !== "production" &&
    LOCAL_HOSTS.has(originHost) &&
    LOCAL_HOSTS.has(requestHost);
}
