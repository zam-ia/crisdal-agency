import "server-only";

import { getSupabaseAdmin } from "../supabase-admin";
import { osSessionRowSchema, osUserRowSchema } from "./domain-schemas";
import type {
  AuditInput,
  LoginAttemptContext,
  LoginContext,
  OsAuthRepository,
  OsSessionRecord,
  OsUserRecord,
} from "./auth-types";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

function mapUser(row: unknown): OsUserRecord {
  const parsed = osUserRowSchema.parse(row);
  return {
    id: parsed.id,
    authUserId: parsed.auth_user_id,
    email: parsed.email,
    displayName: parsed.display_name,
    role: parsed.role_code,
    active: parsed.active,
  };
}

export class SupabaseOsAuthRepository implements OsAuthRepository {
  private readonly db = getSupabaseAdmin();

  async isLoginBlocked(emailHash: string, ipHash: string, now: Date) {
    const since = new Date(now.getTime() - LOGIN_WINDOW_MS).toISOString();
    const { count, error } = await this.db
      .from("crisdal_os_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("attempted_at", since)
      .or(`email_hash.eq.${emailHash},ip_hash.eq.${ipHash}`);
    if (error) throw error;
    return (count || 0) >= MAX_FAILED_ATTEMPTS;
  }

  async recordLoginAttempt(
    context: LoginAttemptContext,
    success: boolean,
    now: Date,
  ) {
    const { error } = await this.db.from("crisdal_os_login_attempts").insert({
      email_hash: context.emailHash,
      ip_hash: context.ipHash,
      success,
      request_id: context.requestId,
      user_agent: context.userAgent.slice(0, 500),
      attempted_at: now.toISOString(),
    });
    if (error) throw error;
  }

  async findActiveUserByAuthId(authUserId: string) {
    const { data, error } = await this.db
      .from("crisdal_os_users")
      .select("id,auth_user_id,email,display_name,role_code,active")
      .eq("auth_user_id", authUserId)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  }

  private async findUserById(userId: string) {
    const { data, error } = await this.db
      .from("crisdal_os_users")
      .select("id,auth_user_id,email,display_name,role_code,active")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  }

  async createSession(
    userId: string,
    providerSessionId: string,
    expiresAt: Date,
    context: LoginContext,
  ) {
    const { error } = await this.db.from("crisdal_os_sessions").upsert(
      {
        user_id: userId,
        provider_session_id: providerSessionId,
        expires_at: expiresAt.toISOString(),
        revoked_at: null,
        ip_hash: context.ipHash,
        user_agent: context.userAgent.slice(0, 500),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "provider_session_id" },
    );
    if (error) throw error;
    const session = await this.findSession(providerSessionId);
    if (!session) throw new Error("No se pudo confirmar la sesión creada.");
    return session;
  }

  async findSession(providerSessionId: string): Promise<OsSessionRecord | null> {
    const { data, error } = await this.db
      .from("crisdal_os_sessions")
      .select("id,provider_session_id,user_id,expires_at,revoked_at")
      .eq("provider_session_id", providerSessionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const parsed = osSessionRowSchema.parse(data);
    const user = await this.findUserById(parsed.user_id);
    if (!user) return null;
    return {
      id: parsed.id,
      providerSessionId: parsed.provider_session_id,
      user,
      expiresAt: new Date(parsed.expires_at),
      revokedAt: parsed.revoked_at ? new Date(parsed.revoked_at) : null,
    };
  }

  async revokeSession(providerSessionId: string, revokedAt: Date) {
    const { error } = await this.db
      .from("crisdal_os_sessions")
      .update({ revoked_at: revokedAt.toISOString() })
      .eq("provider_session_id", providerSessionId)
      .is("revoked_at", null);
    if (error) throw error;
  }

  async writeAudit(input: AuditInput) {
    const { error } = await this.db.from("crisdal_os_audit_events").insert({
      actor_user_id: input.actorUserId || null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      request_id: input.requestId,
      ip_hash: input.ipHash,
      metadata: input.metadata || {},
    });
    if (error) throw error;
  }

  async listUsers() {
    const { data, error } = await this.db
      .from("crisdal_os_users")
      .select("id,auth_user_id,email,display_name,role_code,active")
      .order("display_name");
    if (error) throw error;
    return (data || []).map(mapUser);
  }
}

export function createOsAuthRepository() {
  return new SupabaseOsAuthRepository();
}
