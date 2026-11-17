import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadModule(filename, overrides = {}) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    throw new Error(`Unexpected import in isolated acquisition source test: ${name}`);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}

const {
  ACQUISITION_CONTENT_COOKIE,
  ACQUISITION_CONTENT_MAX_LENGTH,
  ACQUISITION_SITE_COOKIE,
  ACQUISITION_SOURCE_COOKIE,
  ACQUISITION_SOURCE_MAX_AGE_SECONDS,
  SHARE_SITE_ORIGIN,
  acquisitionAttributionCreateData,
  acquisitionSourceCreateData,
  applyFirstTouchAcquisitionCookie,
  buildShareUrl,
  buildSiteAttributionUrl,
  formatAcquisitionAttribution,
  formatAcquisitionSource,
  getAcquisitionAttributionFromCookieHeader,
  getAcquisitionSourceFromCookieHeader,
  parseAcquisitionSite,
  parseAcquisitionSource,
  sanitizeAcquisitionContent,
} = loadModule("lib/auth/acquisition-source.ts");

function makeRequest(url, cookie) {
  const nextUrl = new URL(url);
  const jar = typeof cookie === "string" ? { [ACQUISITION_SOURCE_COOKIE]: cookie } : (cookie ?? {});
  return {
    nextUrl,
    cookies: {
      get: (name) => (jar[name] ? { value: jar[name] } : undefined),
    },
  };
}

function productionCookieOptions(secure = true) {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: ACQUISITION_SOURCE_MAX_AGE_SECONDS,
    domain: ".wise-invest.org",
  };
}

function makeResponse() {
  const calls = [];
  return {
    calls,
    cookies: {
      set(...args) {
        calls.push(args);
      },
    },
  };
}

test("only the allowed short codes are accepted, including trimmed case-insensitive values", () => {
  assert.equal(parseAcquisitionSource("wx"), "wx");
  assert.equal(parseAcquisitionSource("  YT  "), "yt");
  assert.equal(parseAcquisitionSource("rednode"), "rednode");
  assert.equal(parseAcquisitionSource("wechat"), null);
  assert.equal(parseAcquisitionSource("xiaohongshu"), null);
  assert.equal(parseAcquisitionSource("google"), null);
  assert.equal(parseAcquisitionSource(""), null);
  assert.equal(parseAcquisitionSource(null), null);
  assert.deepEqual(acquisitionSourceCreateData("wx"), { acquisitionSource: "wx" });
  assert.deepEqual(acquisitionSourceCreateData("WeChat"), {});
  assert.equal(formatAcquisitionSource("wx"), "微信（wx）");
  assert.equal(formatAcquisitionSource(null), "未记录");
});

test("share URLs append or replace utm_source and keep existing query parameters", () => {
  assert.deepEqual(buildShareUrl("/articles/crypto/u8bcPdDs", "wx"), {
    ok: true,
    url: "https://www.wise-invest.org/articles/crypto/u8bcPdDs?utm_source=wx",
    path: "/articles/crypto/u8bcPdDs?utm_source=wx",
  });
  assert.equal(
    buildShareUrl("/", "rednode").url,
    "https://www.wise-invest.org/?utm_source=rednode",
  );
  assert.equal(
    buildShareUrl("/articles/crypto/u8bcPdDs?ref=guide", "tg").url,
    "https://www.wise-invest.org/articles/crypto/u8bcPdDs?ref=guide&utm_source=tg",
  );
  assert.equal(
    buildShareUrl("https://www.wise-invest.org/articles/crypto/u8bcPdDs?utm_source=tg&ref=1", "wx").url,
    "https://www.wise-invest.org/articles/crypto/u8bcPdDs?utm_source=wx&ref=1",
  );
  assert.equal(
    buildShareUrl("https://wise-invest.org/start", "bili").url,
    "https://www.wise-invest.org/start?utm_source=bili",
  );
  assert.equal(
    buildShareUrl("http://127.0.0.1:3002/register?from=nav", "x").url,
    "https://www.wise-invest.org/register?from=nav&utm_source=x",
  );
  assert.equal(buildShareUrl("https://example.com/foo", "wx").ok, false);
  assert.equal(buildShareUrl("/articles/crypto/u8bcPdDs", "wechat").ok, false);
  assert.equal(SHARE_SITE_ORIGIN, "https://www.wise-invest.org");
});

test("first-touch cookie is persisted once and invalid sources are ignored", () => {
  const first = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/articles/crypto/u8bcPdDs?utm_source=wx"), first),
    true,
  );
  assert.deepEqual(first.calls, [[
    ACQUISITION_SOURCE_COOKIE,
    "wx",
    productionCookieOptions(true),
  ]]);

  const ignored = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("http://127.0.0.1:3002/?utm_source=wechat"), ignored),
    false,
  );
  assert.deepEqual(ignored.calls, []);

  const retained = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/?utm_source=tg", "wx"), retained),
    false,
  );
  assert.deepEqual(retained.calls, []);

  const local = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("http://127.0.0.1:3002/start?utm_source=RedNode"), local),
    true,
  );
  assert.equal(local.calls[0][1], "rednode");
  assert.equal(local.calls[0][2].secure, false);
});

test("cookie header parsing only returns allowed first-touch values", () => {
  assert.equal(
    getAcquisitionSourceFromCookieHeader("theme=dark; wi_src=wx; other=1"),
    "wx",
  );
  assert.equal(
    getAcquisitionSourceFromCookieHeader("wi_src=wechat"),
    null,
  );
});

test("email password registration writes source only when creating a new user", async () => {
  const creates = [];
  const updates = [];
  let existingUser = null;
  const { registerEmailPasswordUser } = loadModule("lib/identity/users.ts", {
    "@/lib/prisma": {
      getPrisma: () => ({
        user: {
          findUnique: async () => existingUser,
          create: async (args) => {
            creates.push(args);
            return { id: "new-user", email: args.data.email };
          },
          update: async (args) => {
            updates.push(args);
            return { id: args.where.id, email: "old@example.com" };
          },
        },
        account: { upsert: async () => ({}) },
        auditLog: { create: async () => ({}) },
      }),
    },
    "@/lib/auth/password": { hashPassword: async () => "hashed-password" },
    "@/lib/auth/acquisition-source": loadModule("lib/auth/acquisition-source.ts"),
    "@/lib/identity/user-id": {
      generateWiseUserId: () => "WISE-000001",
      isInitialAdminEmail: () => false,
    },
  });

  await registerEmailPasswordUser("New@example.com", "Password123", { acquisitionSource: "wx" });
  assert.equal(creates.length, 1);
  assert.equal(creates[0].data.email, "new@example.com");
  assert.equal(creates[0].data.acquisitionSource, "wx");
  assert.equal(updates.length, 0);

  existingUser = { id: "existing-user", passwordHash: "old", emailVerified: null };
  await registerEmailPasswordUser("old@example.com", "Password123", { acquisitionSource: "tg" });
  assert.equal(creates.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].where.id, "existing-user");
  assert.equal(updates[0].data.acquisitionSource, undefined);
});

test("invalid registration sources are omitted from the create payload", async () => {
  const creates = [];
  const { registerEmailPasswordUser } = loadModule("lib/identity/users.ts", {
    "@/lib/prisma": {
      getPrisma: () => ({
        user: {
          findUnique: async () => null,
          create: async (args) => {
            creates.push(args);
            return { id: "new-user", email: args.data.email };
          },
        },
        account: { upsert: async () => ({}) },
        auditLog: { create: async () => ({}) },
      }),
    },
    "@/lib/auth/password": { hashPassword: async () => "hashed-password" },
    "@/lib/auth/acquisition-source": loadModule("lib/auth/acquisition-source.ts"),
    "@/lib/identity/user-id": {
      generateWiseUserId: () => "WISE-000001",
      isInitialAdminEmail: () => false,
    },
  });

  await registerEmailPasswordUser("new@example.com", "Password123", { acquisitionSource: "wechat" });
  assert.equal("acquisitionSource" in creates[0].data, false);
});

test("site and social sources are parsed separately and unknown values are ignored", () => {
  assert.equal(parseAcquisitionSite("chn"), "chn");
  assert.equal(parseAcquisitionSite("  ETF  "), "etf");
  assert.equal(parseAcquisitionSite("wx"), null);
  assert.equal(parseAcquisitionSite("wechat"), null);
  assert.equal(parseAcquisitionSource("chn"), null);
  assert.equal(parseAcquisitionSource("vip"), null);
  assert.deepEqual(acquisitionAttributionCreateData({ acquisitionSource: "wx", acquisitionSite: "chn", acquisitionContent: "/learn/foo" }), {
    acquisitionSource: "wx",
  });
  assert.deepEqual(acquisitionAttributionCreateData({ acquisitionSite: "chn", acquisitionContent: "/learn/rwa" }), {
    acquisitionSite: "chn",
    acquisitionContent: "/learn/rwa",
  });
  assert.deepEqual(acquisitionAttributionCreateData({ acquisitionSite: "chn" }), {
    acquisitionSite: "chn",
    acquisitionContent: "/",
  });
  assert.deepEqual(acquisitionAttributionCreateData({ acquisitionSite: "chain" }), {});
  assert.equal(formatAcquisitionAttribution({ acquisitionSource: "wx" }), "微信（wx）");
  assert.equal(formatAcquisitionAttribution({ acquisitionSite: "chn", acquisitionContent: "/learn/rwa" }), "CHAIN（chn）· /learn/rwa");
  assert.equal(formatAcquisitionSource(null), "未记录");
});

test("campaign values are sanitized into path-like content identifiers", () => {
  assert.equal(sanitizeAcquisitionContent("/learn/rwa"), "/learn/rwa");
  assert.equal(sanitizeAcquisitionContent("  /account?tab=profile  "), "/account?tab=profile");
  assert.equal(sanitizeAcquisitionContent("https://chain.wise-invest.org/learn/foo?x=1#top"), "/learn/foo?x=1");
  assert.equal(sanitizeAcquisitionContent("//evil.com/phish"), "/phish");
  assert.equal(sanitizeAcquisitionContent("javascript:alert(1)"), null);
  assert.equal(sanitizeAcquisitionContent("https://example.com/ok"), "/ok");
  assert.equal(sanitizeAcquisitionContent("/\\evil"), null);
  assert.equal(sanitizeAcquisitionContent("learn/foo"), null);
  assert.equal(sanitizeAcquisitionContent(""), null);
  assert.equal(sanitizeAcquisitionContent(`/${"a".repeat(ACQUISITION_CONTENT_MAX_LENGTH + 10)}`).length, ACQUISITION_CONTENT_MAX_LENGTH);
  assert.deepEqual(buildSiteAttributionUrl("/login", "chn", "/learn/rwa"), {
    ok: true,
    url: "https://www.wise-invest.org/login?utm_source=chn&utm_campaign=%2Flearn%2Frwa",
    path: "/login?utm_source=chn&utm_campaign=%2Flearn%2Frwa",
  });
  assert.equal(buildSiteAttributionUrl("/register", "wx", "/learn/rwa").ok, false);
  assert.equal(buildShareUrl("/articles/crypto/u8bcPdDs", "chn").ok, false);
});

test("first-touch site cookies stay separate from social cookies and are not overwritten", () => {
  const first = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/oauth/authorize?utm_source=chn&utm_campaign=/learn/rwa&client_id=wise_chain"), first),
    true,
  );
  assert.deepEqual(first.calls, [
    [ACQUISITION_SITE_COOKIE, "chn", productionCookieOptions(true)],
    [ACQUISITION_CONTENT_COOKIE, "/learn/rwa", productionCookieOptions(true)],
  ]);

  const apex = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://wise-invest.org/login?utm_source=etf&utm_campaign=/qdii"), apex),
    true,
  );
  assert.equal(apex.calls[0][1], "etf");
  assert.equal(apex.calls[0][2].domain, ".wise-invest.org");
  assert.equal(apex.calls[1][1], "/qdii");

  const local = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("http://127.0.0.1:3002/register?utm_source=VIP&utm_campaign=/join"), local),
    true,
  );
  assert.equal(local.calls[0][1], "vip");
  assert.equal(local.calls[0][2].domain, undefined);
  assert.equal(local.calls[0][2].secure, false);
  assert.equal(local.calls[1][1], "/join");

  const ignored = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/?utm_source=wechat&utm_campaign=/x"), ignored),
    false,
  );
  assert.deepEqual(ignored.calls, []);

  const socialFirst = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/?utm_source=chn&utm_campaign=/learn", { [ACQUISITION_SOURCE_COOKIE]: "wx" }), socialFirst),
    false,
  );
  assert.deepEqual(socialFirst.calls, []);

  const siteFirst = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/?utm_source=wx", { [ACQUISITION_SITE_COOKIE]: "chn" }), siteFirst),
    false,
  );
  assert.deepEqual(siteFirst.calls, []);

  const missingCampaign = makeResponse();
  assert.equal(
    applyFirstTouchAcquisitionCookie(makeRequest("https://www.wise-invest.org/login?utm_source=sim"), missingCampaign),
    true,
  );
  assert.equal(missingCampaign.calls[1][1], "/");
});

test("cookie header parsing returns site attribution without mixing in social sources", () => {
  assert.deepEqual(
    getAcquisitionAttributionFromCookieHeader("theme=dark; wi_site=chn; wi_cnt=%2Flearn%2Frwa; other=1"),
    { acquisitionSource: null, acquisitionSite: "chn", acquisitionContent: "/learn/rwa" },
  );
  assert.deepEqual(
    getAcquisitionAttributionFromCookieHeader("wi_src=wx; wi_site=chn; wi_cnt=/learn/rwa"),
    { acquisitionSource: "wx", acquisitionSite: "chn", acquisitionContent: "/learn/rwa" },
  );
  assert.equal(getAcquisitionSourceFromCookieHeader("wi_site=chn"), null);
  assert.equal(getAcquisitionAttributionFromCookieHeader("wi_site=chain; wi_cnt=/learn").acquisitionSite, null);
});

test("email password registration writes site and content only when creating a new user", async () => {
  const creates = [];
  const updates = [];
  let existingUser = null;
  const { registerEmailPasswordUser } = loadModule("lib/identity/users.ts", {
    "@/lib/prisma": {
      getPrisma: () => ({
        user: {
          findUnique: async () => existingUser,
          create: async (args) => {
            creates.push(args);
            return { id: "new-user", email: args.data.email };
          },
          update: async (args) => {
            updates.push(args);
            return { id: args.where.id, email: "old@example.com" };
          },
        },
        account: { upsert: async () => ({}) },
        auditLog: { create: async () => ({}) },
      }),
    },
    "@/lib/auth/password": { hashPassword: async () => "hashed-password" },
    "@/lib/auth/acquisition-source": loadModule("lib/auth/acquisition-source.ts"),
    "@/lib/identity/user-id": {
      generateWiseUserId: () => "WISE-000001",
      isInitialAdminEmail: () => false,
    },
  });

  await registerEmailPasswordUser("New@example.com", "Password123", { acquisitionSite: "chn", acquisitionContent: "/learn/rwa" });
  assert.equal(creates.length, 1);
  assert.equal(creates[0].data.acquisitionSite, "chn");
  assert.equal(creates[0].data.acquisitionContent, "/learn/rwa");
  assert.equal("acquisitionSource" in creates[0].data, false);

  existingUser = { id: "existing-user", passwordHash: "old", emailVerified: null };
  await registerEmailPasswordUser("old@example.com", "Password123", { acquisitionSite: "etf", acquisitionContent: "/qdii" });
  assert.equal(creates.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].data.acquisitionSite, undefined);
  assert.equal(updates[0].data.acquisitionContent, undefined);
});

test("findOrCreateEmailUser writes first-touch site attribution for new users only", async () => {
  const creates = [];
  let existingUser = null;
  const { findOrCreateEmailUser } = loadModule("lib/identity/users.ts", {
    "@/lib/prisma": {
      getPrisma: () => ({
        user: {
          findUnique: async () => existingUser,
          create: async (args) => {
            creates.push(args);
            return { id: "new-user", email: args.data.email };
          },
          update: async (args) => ({ ...existingUser, emailVerified: new Date() }),
        },
        account: { upsert: async () => ({}) },
        auditLog: { create: async () => ({}) },
      }),
    },
    "@/lib/auth/password": { hashPassword: async () => "hashed-password" },
    "@/lib/auth/acquisition-source": loadModule("lib/auth/acquisition-source.ts"),
    "@/lib/identity/user-id": {
      generateWiseUserId: () => "WISE-000002",
      isInitialAdminEmail: () => false,
    },
  });

  await findOrCreateEmailUser("fresh@example.com", { acquisitionSite: "cry", acquisitionContent: "/btc" });
  assert.equal(creates[0].data.acquisitionSite, "cry");
  assert.equal(creates[0].data.acquisitionContent, "/btc");

  existingUser = { id: "existing-user", emailVerified: null };
  await findOrCreateEmailUser("old@example.com", { acquisitionSite: "vip", acquisitionContent: "/join" });
  assert.equal(creates.length, 1);
});
