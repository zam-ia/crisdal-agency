import assert from "node:assert/strict";
import test from "node:test";
import { buildSnapshotMigrationPlan, stableMigrationId, toMinorUnits } from "../app/lib/os/snapshot-migration";

test("synthetic migration planning is deterministic and idempotent", () => {
  const snapshot = { clients: [{ id: "client-1", name: "Synthetic" }], finance_entries: [{ id: 7, amount: 12.5 }] };
  const first = buildSnapshotMigrationPlan(snapshot);
  const second = buildSnapshotMigrationPlan(snapshot);
  assert.deepEqual(first, second);
  assert.equal(first.inventory.clients, 1);
  assert.equal(first.inventory.finance_entries, 1);
  assert.equal(first.issues.length, 0);
});

test("legacy identifiers and money use stable safe representations", () => {
  assert.equal(stableMigrationId("source", "clients", "1"), stableMigrationId("source", "clients", "1"));
  assert.equal(toMinorUnits("125.90"), 12590);
  assert.throws(() => toMinorUnits(-1));
});

test("invalid collections are inventoried without importing data", () => {
  const plan = buildSnapshotMigrationPlan({ users: "not-an-array", clients: [{}] });
  assert.equal(plan.mappings.length, 0);
  assert.equal(plan.issues.length, 2);
});
