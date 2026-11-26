import assert from "node:assert/strict";
import test from "node:test";
import {
  canOpenPrivateGallery, detectedDeliveryImageMime, expiryForPublication,
  isApprovedPrivateVideoLink, newGalleryToken, safeDownloadFilename,
  tokenDigest, validateGalleryInput,
} from "../app/lib/deliveries/domain";

test("private delivery tokens are unique, unguessable-looking and hashed, never plaintext in DB", () => {
  const one = newGalleryToken(), two = newGalleryToken();
  assert.match(one, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(one, two);
  assert.equal(tokenDigest(one).length, 64);
  assert.notEqual(tokenDigest(one), one);
  assert.throws(() => tokenDigest("../../secret"), /inválido/i);
});
test("gallery status and expiration fail closed", () => {
  const now = new Date("2026-11-26T11:00:00Z");
  assert.equal(canOpenPrivateGallery({status:"draft",expiresAt:"2027-01-01T00:00:00Z"},now),false);
  assert.equal(canOpenPrivateGallery({status:"archived",expiresAt:"2027-01-01T00:00:00Z"},now),false);
  assert.equal(canOpenPrivateGallery({status:"published",expiresAt:"2026-11-26T10:59:59Z"},now),false);
  assert.equal(canOpenPrivateGallery({status:"published",expiresAt:"not-date"},now),false);
  assert.equal(canOpenPrivateGallery({status:"published",expiresAt:"2026-11-26T11:00:01Z"},now),true);
});
test("expiry grants bounded access and disallows endless accidental publication", () => {
  const now = new Date("2026-11-26T00:00:00Z");
  assert.equal(expiryForPublication(now,30),"2026-12-26T00:00:00.000Z");
  assert.throws(()=>expiryForPublication(now,366),/vigencia/i);
  assert.throws(()=>expiryForPublication(now,0),/vigencia/i);
});
test("metadata validates event type, consent for downloads and bounds", () => {
  const good=validateGalleryInput({title:"  Boda editorial  ",eventType:"Boda",description:" Sesión ",allowDownloads:false});
  assert.equal(good.title,"Boda editorial");
  assert.equal(good.description,"Sesión");
  assert.throws(()=>validateGalleryInput({...good,eventType:"Ficticio" as "Boda"}),/evento/i);
  assert.throws(()=>validateGalleryInput({...good,title:" "}),/título/i);
  assert.throws(()=>validateGalleryInput({...good,allowDownloads:null as unknown as boolean}),/descarga/i);
});
test("private video links require HTTPS and exact approved hosts",()=>{
  assert.equal(isApprovedPrivateVideoLink("https://vimeo.com/12345"),true);
  assert.equal(isApprovedPrivateVideoLink("https://youtu.be/123"),true);
  assert.equal(isApprovedPrivateVideoLink("https://www.youtube.com/watch?v=abc"),true);
  assert.equal(isApprovedPrivateVideoLink("https://vimeo.com.evil.test/123"),false);
  assert.equal(isApprovedPrivateVideoLink("javascript:alert(1)"),false);
  assert.equal(isApprovedPrivateVideoLink("http://vimeo.com/123"),false);
});
test("file download names are sanitized",()=>{
  assert.equal(safeDownloadFilename("../../../../private\\user.jpg","abc"),"user.jpg");
  assert.match(safeDownloadFilename(null,"abc"),/^crisdal-abc/);
});
test("image content is distinguished from spoofed metadata",()=>{
  const jpg=new Uint8Array([0xff,0xd8,0xff,0,0,0,0,0,0,0,0,0]);
  const png=new Uint8Array([0x89,0x50,0x4e,0x47,0,0,0,0,0,0,0,0]);
  assert.equal(detectedDeliveryImageMime(jpg),"image/jpeg");
  assert.equal(detectedDeliveryImageMime(png),"image/png");
  assert.equal(detectedDeliveryImageMime(new Uint8Array(12)),null);
});
