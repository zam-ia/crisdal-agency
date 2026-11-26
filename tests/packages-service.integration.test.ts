import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { PackageRepository, PackageShare } from "../app/lib/commercial/package-repository";
import { changePackageStatus, createPackageShare, reorderPackages, savePackage } from "../app/lib/commercial/package-service";
import { hashShareToken, newShareToken, toPublicPackage, type CommercialPackage, type CommercialPackageInput, type PublicPackage } from "../app/lib/commercial/packages";

const actor = "90000000-0000-4000-8000-000000000001";
const draft = (name = "Paquete sintético"): CommercialPackageInput => ({ slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), line: "content", category: "Contenido", name, description: "Descripción sintética suficientemente extensa.", imageUrl: null, priceMinor: 89900, currency: "PEN", priceVisibility: "public", deliverables: [], deliverablesApproved: false, recommended: false, status: "draft", sortOrder: 0, internalNotes: "Privado" });

class MemoryPackages implements PackageRepository {
  items: CommercialPackage[] = [];
  links = new Map<string, PackageShare>();
  async listAdmin() { return [...this.items].sort((a,b) => a.sortOrder - b.sortOrder); }
  async listPublished(): Promise<PublicPackage[]> { return (await this.listAdmin()).filter((item) => item.status === "published").map(toPublicPackage); }
  async findAdmin(id: string) { return this.items.find((item) => item.id === id) || null; }
  async save(input: CommercialPackageInput) { const previous = input.id ? await this.findAdmin(input.id) : null; const now = "2026-11-25T12:00:00.000Z"; const item: CommercialPackage = { ...input, id: input.id || randomUUID(), status: previous?.status || "draft", createdAt: previous?.createdAt || now, updatedAt: now }; this.items = this.items.filter((entry) => entry.id !== item.id).concat(item); return item; }
  async setStatus(id: string, status: CommercialPackage["status"]) { const item = await this.findAdmin(id); if (!item) throw new Error("missing"); item.status = status; return item; }
  async reorder(ids: string[]) { ids.forEach((id,index) => { const item = this.items.find((entry) => entry.id === id); if (item) item.sortOrder = index; }); }
  async createShare(packageIds: string[], message: string) { const token = newShareToken(); const packages = (await this.listPublished()).filter((item) => packageIds.includes(item.id)); const share = { token, campaignId: randomUUID(), message, packages, createdAt: "2026-11-25T12:00:00.000Z" }; this.links.set(hashShareToken(token), share); return share; }
  async findShare(token: string) { return this.links.get(hashShareToken(token)) || null; }
}

test("package lifecycle creates, edits, publishes, deactivates and reorders", async () => {
  const repo = new MemoryPackages();
  const first = await savePackage(repo, draft("Uno"), actor);
  const second = await savePackage(repo, { ...draft("Dos"), sortOrder: 10 }, actor);
  assert.equal((await repo.listPublished()).length, 0);
  await changePackageStatus(repo, first.id, "published", actor);
  assert.equal((await repo.listPublished()).length, 1);
  const edited = await savePackage(repo, { ...first, name: "Uno editado" }, actor);
  assert.equal(edited.name, "Uno editado");
  await reorderPackages(repo, [second.id, first.id], actor);
  assert.deepEqual((await repo.listAdmin()).map((item) => item.id), [second.id, first.id]);
  await changePackageStatus(repo, first.id, "draft", actor);
  assert.equal((await repo.listPublished()).length, 0);
  await assert.rejects(() => reorderPackages(repo, [first.id, first.id], actor), /duplicados/i);
});

test("share links support one or multiple published packages without leaking private fields", async () => {
  const repo = new MemoryPackages();
  const one = await savePackage(repo, draft("Uno"), actor);
  const two = await savePackage(repo, { ...draft("Dos"), sortOrder: 10 }, actor);
  await changePackageStatus(repo, one.id, "published", actor);
  await changePackageStatus(repo, two.id, "published", actor);
  const message = "Hola, comparto estas opciones comerciales para revisar juntos.";
  const single = await createPackageShare(repo, [one.id], message, actor);
  assert.equal(single.packages.length, 1);
  const multiple = await createPackageShare(repo, [one.id, two.id], message, actor);
  assert.equal(multiple.packages.length, 2);
  assert.equal("internalNotes" in multiple.packages[0], false);
  assert.equal((await repo.findShare(multiple.token))?.campaignId, multiple.campaignId);
  assert.equal(await repo.findShare("token-invalido"), null);
  await changePackageStatus(repo, two.id, "draft", actor);
  await assert.rejects(() => createPackageShare(repo, [two.id], message, actor), /publicados/i);
});

test("sharing rejects empty selection and weak messages", async () => {
  const repo = new MemoryPackages();
  await assert.rejects(() => createPackageShare(repo, [], "Mensaje suficientemente largo para la prueba.", actor), /publicados/i);
  const item = await savePackage(repo, draft(), actor); await changePackageStatus(repo, item.id, "published", actor);
  await assert.rejects(() => createPackageShare(repo, [item.id], "corto", actor), /mensaje/i);
});
