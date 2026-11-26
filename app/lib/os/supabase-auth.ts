import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { OsAuthProvider, OsProviderSession } from "./auth-types";

function getAuthConfig() {
  return {
    url: process.env.SUPABASE_URL?.trim() || "",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || "",
    secretKey: process.env.SUPABASE_SECRET_KEY?.trim() || "",
    auditPepper: process.env.OS_AUDIT_PEPPER?.trim() || "",
  };
}

export function isOsAuthConfigured() {
  const config = getAuthConfig();
  return Boolean(
    config.url &&
      config.publishableKey &&
      config.secretKey &&
      config.auditPepper.length >= 32,
  );
}

export async function createOsSupabaseAuthClient() {
  const config = getAuthConfig();
  if (!config.url || !config.publishableKey) {
    throw new Error("Crisdal OS requiere SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY.");
  }

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            priority: "high",
          });
        }
      },
    },
  });
}

export async function createSupabaseAuthProvider(): Promise<OsAuthProvider> {
  const client = await createOsSupabaseAuthClient();

  return {
    async signIn(email, password): Promise<OsProviderSession | null> {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.status === 400 || error.status === 401) return null;
        throw error;
      }

      const providerSessionId = readJwtClaim(data.session?.access_token, "session_id");
      if (!data.user?.id || !data.session?.expires_at || !providerSessionId) {
        await client.auth.signOut({ scope: "local" });
        return null;
      }

      return {
        authUserId: data.user.id,
        providerSessionId,
        expiresAt: new Date(data.session.expires_at * 1000),
      };
    },
    async signOut() {
      await client.auth.signOut({ scope: "local" });
    },
  };
}

export function readJwtClaim(token: string | undefined, claim: string) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    const value = payload?.[claim];
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
