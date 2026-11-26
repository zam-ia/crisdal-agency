import assert from "node:assert/strict";
import test from "node:test";
import {selectMobileNavigation} from "../app/ui/os/mobile-navigation";
const items=["/panel","/panel/agenda","/panel/solicitudes-fecha","/panel/disponibilidad-publica","/panel/portafolio","/panel/finanzas","/panel/produccion"].map(href=>({href,label:href}));
test("mobile priority preserves finance after the first five entries",()=>assert.deepEqual(selectMobileNavigation(items).map(x=>x.href),["/panel","/panel/agenda","/panel/finanzas"]));
test("only authorized navigation entries are returned",()=>{const scoped=items.filter(x=>["/panel","/panel/produccion"].includes(x.href));assert.deepEqual(selectMobileNavigation(scoped),scoped);});
test("empty navigation is handled",()=>assert.deepEqual(selectMobileNavigation([]),[]));
