import assert from "node:assert/strict";
import test from "node:test";
import { loginWithCredentials, logoutSession, resolveSession } from "../app/lib/os/auth-service";
import type {
  AuditInput,
  LoginAttemptContext,
  LoginContext,
  OsAuthProvider,
  OsAuthRepository,
  OsSessionRecord,
  OsUserRecord,
} from "../app/lib/os/auth-types";
import { fingerprint } from "../app/lib/os/security";

const now = new Date("2026-11-25T12:00:00.000Z");
const context: LoginContext = { ipHash: fingerprint("127.0.0.1", "test"), userAgent: "test", requestId: "00000000-0000-4000-8000-000000000001" };

class FakeProvider implements OsAuthProvider {
  signedOut = false;
  constructor(private valid = true, private authUserId = "10000000-0000-4000-8000-000000000001") {}
  async signIn() {
    return this.valid ? { authUserId: this.authUserId, providerSessionId: "20000000-0000-4000-8000-000000000001", expiresAt: new Date(now.getTime() + 60_000) } : null;
  }
  async signOut() { this.signedOut = true; }
}

class FakeRepository implements OsAuthRepository {
  blocked = false;
  attempts: boolean[] = [];
  audits: AuditInput[] = [];
  session: OsSessionRecord | null = null;
  user: OsUserRecord | null = { id: "30000000-0000-4000-8000-000000000001", authUserId: "10000000-0000-4000-8000-000000000001", email: "owner@example.test", displayName: "Owner Test", role: "owner", active: true };
  async isLoginBlocked() { return this.blocked; }
  async recordLoginAttempt(context: LoginAttemptContext, success: boolean) { void context; this.attempts.push(success); }
  async findActiveUserByAuthId(authUserId: string) { return this.user?.authUserId === authUserId && this.user.active ? this.user : null; }
  async createSession(userId: string, providerSessionId: string, expiresAt: Date, context: LoginContext) {
    void userId; void context;
    this.session = { id: "40000000-0000-4000-8000-000000000001", providerSessionId, user: this.user!, expiresAt, revokedAt: null };
    return this.session;
  }
  async findSession() { return this.session; }
  async revokeSession(providerSessionId: string, revokedAt: Date) { void providerSessionId; if (this.session) this.session.revokedAt = revokedAt; }
  async writeAudit(input: AuditInput) { this.audits.push(input); }
  async listUsers() { return this.user ? [this.user] : []; }
}

test("valid nominal login creates a revocable server session", async () => {
  const repository = new FakeRepository();
  const result = await loginWithCredentials({ email: " OWNER@example.test ", password: "valid", provider: new FakeProvider(), repository, context, now });
  assert.equal(result.ok, true);
  assert.deepEqual(repository.attempts, [true]);
  assert.equal(repository.audits.at(-1)?.action, "auth.login.succeeded");
});

test("invalid login is generic and audited", async () => {
  const repository = new FakeRepository();
  const result = await loginWithCredentials({ email: "owner@example.test", password: "wrong", provider: new FakeProvider(false), repository, context, now });
  assert.deepEqual(result, { ok: false, reason: "invalid" });
  assert.deepEqual(repository.attempts, [false]);
});

test("rate-limited and unauthorized accounts do not create sessions", async () => {
  const blocked = new FakeRepository(); blocked.blocked = true;
  assert.deepEqual(await loginWithCredentials({ email: "owner@example.test", password: "x", provider: new FakeProvider(), repository: blocked, context, now }), { ok: false, reason: "blocked" });
  const denied = new FakeRepository(); denied.user = null;
  const provider = new FakeProvider();
  assert.deepEqual(await loginWithCredentials({ email: "unknown@example.test", password: "x", provider, repository: denied, context, now }), { ok: false, reason: "not_authorized" });
  assert.equal(provider.signedOut, true);
});

test("expired and revoked sessions are rejected", async () => {
  const repository = new FakeRepository();
  repository.session = { id: "40000000-0000-4000-8000-000000000001", providerSessionId: "20000000-0000-4000-8000-000000000001", user: repository.user!, expiresAt: new Date(now.getTime() - 1), revokedAt: null };
  assert.equal(await resolveSession({ providerSessionId: repository.session.providerSessionId, repository, now }), null);
  repository.session.expiresAt = new Date(now.getTime() + 60_000);
  repository.session.revokedAt = now;
  assert.equal(await resolveSession({ providerSessionId: repository.session.providerSessionId, repository, now }), null);
});

test("logout revokes the server session immediately", async () => {
  const repository = new FakeRepository();
  repository.session = { id: "40000000-0000-4000-8000-000000000001", providerSessionId: "20000000-0000-4000-8000-000000000001", user: repository.user!, expiresAt: new Date(now.getTime() + 60_000), revokedAt: null };
  await logoutSession({ providerSessionId: repository.session.providerSessionId, repository, now });
  assert.equal(await resolveSession({ providerSessionId: repository.session.providerSessionId, repository, now }), null);
});
