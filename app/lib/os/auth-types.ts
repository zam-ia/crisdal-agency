import type { Capability, RoleCode } from "./capabilities";

export type OsUserRecord = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  role: RoleCode;
  active: boolean;
};

export type OsProviderSession = {
  authUserId: string;
  providerSessionId: string;
  expiresAt: Date;
};

export type OsSessionRecord = {
  id: string;
  providerSessionId: string;
  user: OsUserRecord;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type OsSession = {
  sessionId: string;
  providerSessionId: string;
  userId: string;
  authUserId: string;
  email: string;
  displayName: string;
  role: RoleCode;
  capabilities: readonly Capability[];
  expiresAt: Date;
};

export type LoginContext = {
  ipHash: string;
  userAgent: string;
  requestId: string;
};

export type LoginAttemptContext = LoginContext & {
  emailHash: string;
};

export type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestId: string;
  ipHash: string;
  metadata?: Record<string, unknown>;
};

export interface OsAuthProvider {
  signIn(email: string, password: string): Promise<OsProviderSession | null>;
  signOut(): Promise<void>;
}

export interface OsAuthRepository {
  isLoginBlocked(emailHash: string, ipHash: string, now: Date): Promise<boolean>;
  recordLoginAttempt(
    context: LoginAttemptContext,
    success: boolean,
    now: Date,
  ): Promise<void>;
  findActiveUserByAuthId(authUserId: string): Promise<OsUserRecord | null>;
  createSession(
    userId: string,
    providerSessionId: string,
    expiresAt: Date,
    context: LoginContext,
  ): Promise<OsSessionRecord>;
  findSession(providerSessionId: string): Promise<OsSessionRecord | null>;
  revokeSession(providerSessionId: string, revokedAt: Date): Promise<void>;
  writeAudit(input: AuditInput): Promise<void>;
  listUsers(): Promise<OsUserRecord[]>;
}
