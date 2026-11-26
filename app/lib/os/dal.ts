import "server-only";

import { redirect } from "next/navigation";
import { createOsAuthRepository } from "./auth-repository";
import { resolveSession, sessionCan } from "./auth-service";
import { createOsSupabaseAuthClient } from "./supabase-auth";
import type { Capability } from "./capabilities";

export async function getPanelSession() {
  try {
    const client = await createOsSupabaseAuthClient();
    const { data, error } = await client.auth.getClaims();
    if (error) return null;
    const providerSessionId = data?.claims?.session_id;
    const authUserId = data?.claims?.sub;
    if (typeof providerSessionId !== "string" || typeof authUserId !== "string") {
      return null;
    }

    const session = await resolveSession({
      providerSessionId,
      repository: createOsAuthRepository(),
    });
    return session?.authUserId === authUserId ? session : null;
  } catch {
    return null;
  }
}

export async function requirePanelSession(required?: Capability) {
  const session = await getPanelSession();
  if (!session) redirect("/panel/login");
  if (required && !sessionCan(session, required)) {
    redirect("/panel?error=sin-permiso");
  }
  return session;
}

export async function listPanelUsers() {
  await requirePanelSession("users.manage");
  return createOsAuthRepository().listUsers();
}
