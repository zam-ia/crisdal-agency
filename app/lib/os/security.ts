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
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const requestHost = (forwardedHost || host || "").split(",")[0].trim();
  if (originHost === requestHost) return true;
  return process.env.NODE_ENV !== "production" &&
    LOCAL_HOSTS.has(originHost) &&
    LOCAL_HOSTS.has(requestHost);
}
