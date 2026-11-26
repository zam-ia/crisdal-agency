import { createHash } from "node:crypto";
import { z } from "zod";

const legacyEntitySchema = z.object({ id: z.union([z.string(), z.number()]) }).passthrough();
const supportedCollections = [
  "users",
  "clients",
  "calendar_events",
  "project_tasks",
  "finance_entries",
  "quote_plans",
  "quotes",
  "portfolio_items",
] as const;

export type MigrationInventory = Record<(typeof supportedCollections)[number], number>;

export function stableMigrationId(sourceSystem: string, entity: string, legacyId: string) {
  const hash = createHash("sha256").update(`${sourceSystem}:${entity}:${legacyId}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export function toMinorUnits(value: unknown) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Importe legado inválido.");
  }
  const minor = Math.round(amount * 100);
  if (!Number.isSafeInteger(minor)) throw new Error("Importe fuera del rango seguro.");
  return minor;
}

export function buildSnapshotMigrationPlan(
  input: unknown,
  sourceSystem = "crisdal-admin-json-v1",
) {
  const snapshot = z.record(z.string(), z.unknown()).parse(input);
  const inventory = Object.fromEntries(supportedCollections.map((name) => [name, 0])) as MigrationInventory;
  const mappings: Array<{ entity: string; legacyId: string; targetId: string }> = [];
  const issues: string[] = [];

  for (const collection of supportedCollections) {
    const raw = snapshot[collection];
    if (raw === undefined) continue;
    if (!Array.isArray(raw)) {
      issues.push(`${collection}: debe ser un arreglo`);
      continue;
    }
    for (const [index, item] of raw.entries()) {
      const parsed = legacyEntitySchema.safeParse(item);
      if (!parsed.success) {
        issues.push(`${collection}[${index}]: falta un id válido`);
        continue;
      }
      const legacyId = String(parsed.data.id);
      mappings.push({
        entity: collection,
        legacyId,
        targetId: stableMigrationId(sourceSystem, collection, legacyId),
      });
      inventory[collection] += 1;
    }
  }

  mappings.sort((a, b) => `${a.entity}:${a.legacyId}`.localeCompare(`${b.entity}:${b.legacyId}`));
  const sourceHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  return { sourceSystem, sourceHash, inventory, mappings, issues };
}
