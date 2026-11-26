import test from "node:test";
import assert from "node:assert/strict";
import { allowedPublicImageSrc, curateCinematicGallery, safeGalleryItems, type CinematicGalleryItem } from "../app/lib/cinematic/gallery";
const item=(id:string,category:CinematicGalleryItem["category"],featured=false):CinematicGalleryItem=>({id,category,featured,src:`/test/${id}.webp`,alt:`Fotografía real ${id}`,href:`/portafolio/${id}`,title:`Proyecto ${id}`,aspect:"portrait"});
test("Events-first ranking preserves stable editorial order within each priority",()=>{
 const sorted=curateCinematicGallery([item("content","content"),item("event1","events"),item("corp","corporate"),item("event2","events",true),item("event3","events")]);
 assert.deepEqual(sorted.map((x)=>x.id),["event2","event1","event3","corp","content"]);
});
test("Unexpected or malformed assets are excluded from public gallery",()=>{
 const items=safeGalleryItems([item("wedding","events"),item("wedding","events"),{...item("bad","events"),href:"javascript:alert(1)"},{...item("no-alt","events"),alt:""}]);
 assert.deepEqual(items.map((x)=>x.id),["wedding"]);
});
test("Curation does not mutate input arrays",()=>{
 const arr=Object.freeze([Object.freeze(item("content","content")),Object.freeze(item("event","events"))]);
 assert.equal(curateCinematicGallery(arr)[0].id,"event");assert.equal(arr[0].id,"content");
});


test("Image sources reject javascript, protocol-relative URLs and embedded credentials",()=>{
  assert.equal(allowedPublicImageSrc("javascript:alert(1)"),false);
  assert.equal(allowedPublicImageSrc("//attacker.test/example.jpg"),false);
  assert.equal(allowedPublicImageSrc("https://admin:secret@site.test/file.jpg"),false);
  assert.equal(allowedPublicImageSrc("/portfolio/photo.webp"),true);
  assert.equal(allowedPublicImageSrc("https://media.example.com/portfolio/photo.webp"),true);
});
