import {
  capabilitiesForRole,
  hasCapability,
  type Capability,
} from "./capabilities";
import type {
  LoginContext,
  OsAuthProvider,
  OsAuthRepository,
  OsSession,
} from "./auth-types";
import { fingerprint, normalizeEmail } from "./security";

export type LoginResult =
  | { ok: true; session: OsSession }
  | { ok: false; reason: "invalid" | "blocked" | "not_authorized" };

function toSession(record: Awaited<ReturnType<OsAuthRepository["findSession"]>>) {
  if (!record) return null;
  return {
    sessionId: record.id,
    providerSessionId: record.providerSessionId,
    userId: record.user.id,
    authUserId: record.user.authUserId,
    email: record.user.email,
    displayName: record.user.displayName,
    role: record.user.role,
    capabilities: capabilitiesForRole(record.user.role),
    expiresAt: record.expiresAt,
  } satisfies OsSession;
}

export async function loginWithCredentials({
  email,
  password,
  provider,
  repository,
  context,
  now = new Date(),
}: {
  email: string;
  password: string;
  provider: OsAuthProvider;
  repository: OsAuthRepository;
  context: LoginContext;
  now?: Date;
}): Promise<LoginResult> {
  const normalizedEmail = normalizeEmail(email);
  const emailHash = fingerprint(normalizedEmail);
  const attemptContext = { ...context, emailHash };

  if (await repository.isLoginBlocked(emailHash, context.ipHash, now)) {
    await repository.writeAudit({
      action: "auth.login.blocked",
      entityType: "session",
      requestId: context.requestId,
      ipHash: context.ipHash,
      metadata: { emailHash },
    });
    return { ok: false, reason: "blocked" };
  }

  const providerSession = await provider.signIn(normalizedEmail, password);
  if (!providerSession) {
    await repository.recordLoginAttempt(attemptContext, false, now);
    await repository.writeAudit({
      action: "auth.login.failed",
      entityType: "session",
      requestId: context.requestId,
      ipHash: context.ipHash,
      metadata: { emailHash },
    });
    return { ok: false, reason: "invalid" };
  }

  const user = await repository.findActiveUserByAuthId(providerSession.authUserId);
  if (!user) {
    await provider.signOut();
    await repository.recordLoginAttempt(attemptContext, false, now);
    await repository.writeAudit({
      action: "auth.login.profile_denied",
      entityType: "session",
      requestId: context.requestId,
      ipHash: context.ipHash,
      metadata: { authUserId: providerSession.authUserId },
    });
    return { ok: false, reason: "not_authorized" };
  }

  await repository.recordLoginAttempt(attemptContext, true, now);
  const record = await repository.createSession(
    user.id,
    providerSession.providerSessionId,
    providerSession.expiresAt,
    context,
  );
  await repository.writeAudit({
    actorUserId: user.id,
    action: "auth.login.succeeded",
    entityType: "session",
    entityId: record.id,
    requestId: context.requestId,
    ipHash: context.ipHash,
  });

  return { ok: true, session: toSession(record)! };
}

export async function resolveSession({
  providerSessionId,
  repository,
  now = new Date(),
}: {
  providerSessionId: string;
  repository: OsAuthRepository;
  now?: Date;
}) {
  const record = await repository.findSession(providerSessionId);
  if (
    !record ||
    record.revokedAt ||
    !record.user.active ||
    record.expiresAt.getTime() <= now.getTime()
  ) {
    return null;
  }
  return toSession(record);
}

export function sessionCan(session: OsSession, capability: Capability) {
  return hasCapability(session.capabilities, capability);
}

export async function logoutSession({
  providerSessionId,
  repository,
  now = new Date(),
}: {
  providerSessionId: string;
  repository: OsAuthRepository;
  now?: Date;
}) {
  await repository.revokeSession(providerSessionId, now);
}
