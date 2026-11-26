import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedOrigin } from "../app/lib/os/security";
import { eventDataForPath } from "../app/lib/config";

test("CSRF origin validation accepts the request host and rejects outsiders", () => {
  assert.equal(isTrustedOrigin({ origin: "https://crisdal.example", host: "crisdal.example" }), true);
  assert.equal(isTrustedOrigin({ origin: "https://evil.example", host: "crisdal.example" }), false);
  assert.equal(isTrustedOrigin({ origin: "not-a-url", host: "crisdal.example" }), false);
});

test("Pixel and CAPI resolve the same preserved content identifiers", () => {
  assert.equal(eventDataForPath("/").content_name, "Crisdal Agency | Producción audiovisual");
  assert.equal(eventDataForPath("/ruta-crisdal").content_name, "Sistema de Captación Directa");
  assert.deepEqual(eventDataForPath("/ruta-crisdal?utm_source=test"), eventDataForPath("/ruta-crisdal"));
});

test("CSRF rejects non-web schemes, credentials and paths in Origin", () => {
 for(const origin of ["ftp://crisdal.example","https://u:p@crisdal.example","https://crisdal.example/path","https://crisdal.example?x=1","https://crisdal.example/#x","http://crisdal.example"])assert.equal(isTrustedOrigin({origin,host:"crisdal.example"}),false);
});
