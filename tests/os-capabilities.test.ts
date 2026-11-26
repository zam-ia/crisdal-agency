import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessUserRecord,
  capabilitiesForRole,
  hasCapability,
} from "../app/lib/os/capabilities";

test("owner has every protected capability", () => {
  const owner = capabilitiesForRole("owner");
  assert.equal(hasCapability(owner, "users.manage"), true);
  assert.equal(hasCapability(owner, "finance.write"), true);
});

test("roles enforce financial and user boundaries", () => {
  assert.equal(hasCapability(capabilitiesForRole("production"), "finance.read"), false);
  assert.equal(hasCapability(capabilitiesForRole("commercial"), "finance.write"), false);
  assert.equal(hasCapability(capabilitiesForRole("finance"), "finance.write"), true);
  assert.equal(hasCapability(capabilitiesForRole("administration"), "users.manage"), false);
});

test("user records prevent IDOR unless users.manage is present", () => {
  const production = capabilitiesForRole("production");
  assert.equal(canAccessUserRecord("user-a", "user-a", production), true);
  assert.equal(canAccessUserRecord("user-a", "user-b", production), false);
  assert.equal(canAccessUserRecord("owner", "user-b", capabilitiesForRole("owner")), true);
});
