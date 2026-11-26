import assert from "node:assert/strict";
import test from "node:test";
import type { PortfolioMedia, PortfolioProject } from "../app/lib/commercial/portfolio";
import { portfolioDetailMedia, toPublicPortfolioCard } from "../app/lib/commercial/portfolio-public-card";

const photo: PortfolioMedia = { id: "photo", kind: "image", url: "https://example.com/photo.webp", posterUrl: null, alt: "Foto", orientation: "landscape", sortOrder: 0, mimeType: "image/webp", width: 640, height: 480 };
const video: PortfolioMedia = { ...photo, id: "video", kind: "video", url: "https://youtu.be/abcdefghi", width: null, height: null };
const project: PortfolioProject = {
  id: "test", slug: "prueba", title: "Evento de prueba", categoryId: "test", categorySlug: "bodas", categoryName: "Bodas",
  clientName: "not-for-card", clientDisplayAuthorized: true, serviceType: "Fotografía y video", year: null, featured: true,
  media: [photo, video], coverAssetId: "video", description: "Descripción de prueba", objective: "", status: "published",
  publishedAt: null, consentStatus: "verified", consentScope: "private-metadata", consentEvidenceReference: "private-reference",
  consentAuthorizedAt: null, createdAt: "", updatedAt: "",
};

test("public cards only pass fields actually rendered or filtered", () => {
  const card = toPublicPortfolioCard(project);
  assert.equal(card.image, null, "a video without a poster has no unrelated photo");
  assert.equal(card.hasPhoto, true);
  assert.equal(card.hasVideo, true);
  assert.doesNotMatch(JSON.stringify(card), /private-reference|private-metadata|not-for-card|youtu/);
});

test("keeps the video cover playable and never repeats a hero photo", () => {
  assert.deepEqual(portfolioDetailMedia(project).map((item) => item.id), ["video", "photo"]);
  assert.deepEqual(portfolioDetailMedia({ ...project, coverAssetId: "photo" }).map((item) => item.id), ["video"]);
});

test("keeps a standalone social video in the gallery", () => {
  assert.deepEqual(portfolioDetailMedia({ ...project, media: [video] }).map((item) => item.id), ["video"]);
});
