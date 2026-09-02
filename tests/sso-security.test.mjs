import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  getRegisteredRedirectUri,
  parseRedirectUriAllowlist,
} = require("../lib/sso/redirect-uri.ts");
const { buildContentSecurityPolicy } = require("../lib/security/content-security-policy.ts");

const localhostCallback = "http://localhost:3000/api/auth/callback/wise";
const wiseSimCallback = "https://www.wise-sim.org/api/auth/callback/wise";
const client = {
  allowedRedirectUris: [localhostCallback, wiseSimCallback],
};

test("registered localhost callback produces a scoped CSP origin", () => {
  const redirect = getRegisteredRedirectUri(client, localhostCallback);
  assert.deepEqual(redirect, {
    value: localhostCallback,
    origin: "http://localhost:3000",
  });

  const csp = buildContentSecurityPolicy([redirect.origin]);
  assert.match(csp, /form-action 'self' http:\/\/localhost:3000(?:;|$)/);
  assert.doesNotMatch(csp, /wise-sim\.org/);
});

test("registered Wise SIM callback produces only its HTTPS origin", () => {
  const redirect = getRegisteredRedirectUri(client, wiseSimCallback);
  assert.equal(redirect?.origin, "https://www.wise-sim.org");

  const csp = buildContentSecurityPolicy([redirect.origin]);
  assert.match(csp, /form-action 'self' https:\/\/www\.wise-sim\.org(?:;|$)/);
  assert.doesNotMatch(csp, /localhost:3000/);
});

test("unregistered and tampered redirect URIs are rejected by exact match", () => {
  assert.equal(getRegisteredRedirectUri(client, "https://evil.example/callback"), null);
  assert.equal(getRegisteredRedirectUri(client, `${wiseSimCallback}/`), null);
  assert.equal(getRegisteredRedirectUri(client, `${wiseSimCallback}?next=https://evil.example`), null);
  assert.equal(getRegisteredRedirectUri(client, wiseSimCallback.replace("www.", "")), null);
});

test("admin allowlist rejects wildcards and unsafe callback URLs", () => {
  assert.throws(() => parseRedirectUriAllowlist("https://*.wise-sim.org/callback"), /通配符/);
  assert.throws(() => parseRedirectUriAllowlist("http://wise-sim.org/callback"), /必须使用 https/);
  assert.throws(() => parseRedirectUriAllowlist("https://user:pass@wise-sim.org/callback"), /用户名或密码/);
  assert.throws(() => parseRedirectUriAllowlist("https://wise-sim.org/callback#token"), /hash/);
});

test("CSP builder rejects non-origin values instead of reflecting request text", () => {
  assert.throws(
    () => buildContentSecurityPolicy(["https://www.wise-sim.org/callback"]),
    /HTTP\(S\) origin/
  );
  assert.throws(
    () => buildContentSecurityPolicy(["https://www.wise-sim.org; form-action https://evil.example"]),
    /Invalid URL|HTTP\(S\) origin/
  );
});
