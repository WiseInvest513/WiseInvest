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
  ACQUISITION_SOURCE_COOKIE,
  ACQUISITION_SOURCE_MAX_AGE_SECONDS,
  SHARE_SITE_ORIGIN,
  acquisitionSourceCreateData,
  applyFirstTouchAcquisitionCookie,
  buildShareUrl,
  formatAcquisitionSource,
  getAcquisitionSourceFromCookieHeader,
  parseAcquisitionSource,
} = loadModule("lib/auth/acquisition-source.ts");

function makeRequest(url, cookie) {
  const nextUrl = new URL(url);
  return {
    nextUrl,
    cookies: {
      get: (name) => (cookie && name === ACQUISITION_SOURCE_COOKIE ? { value: cookie } : undefined),
    },
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
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: ACQUISITION_SOURCE_MAX_AGE_SECONDS,
    },
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
