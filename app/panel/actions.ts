"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createOsAuthRepository } from "../lib/os/auth-repository";
import { loginWithCredentials, logoutSession } from "../lib/os/auth-service";
import { getPanelSession } from "../lib/os/dal";
import {
  fingerprint,
  isTrustedOrigin,
  newRequestId,
} from "../lib/os/security";
import { createSupabaseAuthProvider, isOsAuthConfigured } from "../lib/os/supabase-auth";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export type PanelLoginState = { error: string | null };

async function requestContext() {
  const values = await headers();
  const forwardedFor = values.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  return {
    trusted: isTrustedOrigin({
      origin: values.get("origin"),
      host: values.get("host"),
      forwardedHost: values.get("x-forwarded-host"),
    }),
    context: {
      ipHash: fingerprint(forwardedFor),
      userAgent: values.get("user-agent") || "unknown",
      requestId: values.get("x-request-id") || newRequestId(),
    },
  };
}

export async function panelLoginAction(
  _previous: PanelLoginState,
  formData: FormData,
): Promise<PanelLoginState> {
  if (!isOsAuthConfigured()) {
    return { error: "El acceso no está disponible. Revisa la configuración segura." };
  }
  const request = await requestContext();
  if (!request.trusted) return { error: "Solicitud no válida. Recarga la página." };
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Revisa el correo y la contraseña." };

  try {
    const result = await loginWithCredentials({
      ...parsed.data,
      provider: await createSupabaseAuthProvider(),
      repository: createOsAuthRepository(),
      context: request.context,
    });
    if (!result.ok) {
      return {
        error:
          result.reason === "blocked"
            ? "Demasiados intentos. Espera 15 minutos antes de volver a intentar."
            : "Credenciales inválidas o acceso no habilitado.",
      };
    }
  } catch {
    return { error: "El acceso no está disponible. Revisa la configuración segura." };
  }

  redirect("/panel");
}

export async function panelLogoutAction() {
  const request = await requestContext();
  if (!request.trusted) redirect("/panel");
  const session = await getPanelSession();
  const repository = createOsAuthRepository();
  if (session) {
    try {
      await logoutSession({ providerSessionId: session.providerSessionId, repository });
      await repository.writeAudit({
        actorUserId: session.userId,
        action: "auth.logout",
        entityType: "session",
        entityId: session.sessionId,
        requestId: request.context.requestId,
        ipHash: request.context.ipHash,
      });
    } catch {
      // Provider logout below remains mandatory even if audit storage is unavailable.
    }
  }
  try {
    await (await createSupabaseAuthProvider()).signOut();
  } catch {
    // The server registry still revokes a valid session when storage is available.
  }
  redirect("/panel/login");
}
