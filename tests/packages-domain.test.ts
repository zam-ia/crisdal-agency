import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_PUBLIC_PACKAGES, contextualQuoteMessage, formatPackagePrice, hashShareToken, newShareToken, packagePublicationIssues, toPublicPackage, type CommercialPackage } from "../app/lib/commercial/packages";

const item: CommercialPackage = { ...FALLBACK_PUBLIC_PACKAGES[0], internalNotes: "Nunca público" };

test("public package projection removes internal notes", () => {
  const safe = toPublicPackage(item);
  assert.equal("internalNotes" in safe, false);
});

test("approved prices and consult visibility stay exact", () => {
  assert.equal(formatPackagePrice(FALLBACK_PUBLIC_PACKAGES.find((item) => item.slug === "impulso")!), "S/ 899");
  assert.equal(formatPackagePrice(FALLBACK_PUBLIC_PACKAGES.find((item) => item.slug === "crecimiento")!), "S/ 1,199");
  assert.equal(formatPackagePrice(FALLBACK_PUBLIC_PACKAGES.find((item) => item.slug === "dominio-digital")!), "S/ 1,599");
  assert.equal(formatPackagePrice(FALLBACK_PUBLIC_PACKAGES.find((item) => item.slug === "momento")!), "Consultar precio");
  assert.equal(formatPackagePrice({ ...FALLBACK_PUBLIC_PACKAGES[0], priceVisibility: "hidden" }), null);
});

test("publication validates prices and unapproved deliverables", () => {
  assert.match(packagePublicationIssues({ ...item, priceVisibility: "public", priceMinor: null }).join(" "), /importe/i);
  assert.match(packagePublicationIssues({ ...item, deliverables: ["Entregable sintético"], deliverablesApproved: false }).join(" "), /aprobados/i);
});

test("share tokens are non-guessable and quote copy remains contextual", () => {
  const first = newShareToken();
  const second = newShareToken();
  assert.match(first, /^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(first, second);
  assert.equal(hashShareToken(first).length, 64);
  assert.match(contextualQuoteMessage("Impulso"), /paquete Impulso/);
});
