import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));

// Execute the real auth callbacks and point guard together. Only the Auth.js
// transport, providers, cookies and DB are mocked; no authority rules are copied.
function harness({ configured = true } = {}) {
  const state = {
    reads: 0,
    failure: false,
    signedIn: true,
    token: { sub: "user-a", role: "ADMIN", membershipTier: "VIP_PLUS" },
    user: { id: "user-a", role: "USER", membershipTier: "MEMBER", wiseUserId: "WISE-A" },
  };
  const modules = new Map();
  const prisma = { user: { async findUnique({ where }) {
    state.reads++;
    if (state.failure) throw new Error("database unavailable");
    return state.user?.id === where.id ? state.user : null;
  } } };
  const mocks = {
    "next-auth": {
      __esModule: true,
      customFetch: Symbol("fetch"),
      default(config) {
        state.callbacks = config.callbacks;
        return { async auth() {
          if (!state.signedIn) return null;
          const token = await config.callbacks.jwt({ token: { ...state.token } });
          if (!token) return null;
          return config.callbacks.session({ session: { user: {} }, token });
        } };
      },
    },
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    "@/lib/prisma": { isDatabaseConfigured: () => configured, getPrisma: () => prisma },
    "@/lib/auth/oauth-proxy-fetch": { createOAuthProxyFetch: () => undefined },
    "@/lib/auth/password": { verifyPassword: () => false },
    "@/lib/auth/wise-prisma-adapter": { WisePrismaAdapter: () => ({}) },
    "@/lib/identity/users": { findPasswordUser: () => null },
  };
  for (const provider of ["credentials", "github", "google"])
    mocks[`next-auth/providers/${provider}`] = { __esModule: true, default: (options) => options };
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function("require", "module", "exports", compiled)((name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      const resolved = name.startsWith("@/")
        ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load(resolved + ".ts");
    }, module, module.exports);
    return module.exports;
  }
  const guard = load("lib/point/auth.ts");
  return { state, guard };
}

test("point auth refreshes actual JWT authority once per request, not twice", async () => {
  const { state, guard } = harness();
  const member = await guard.getPointViewer();
  assert.equal(member.access, "preview", "stale VIP_PLUS token must not grant access");
  assert.equal(member.isAdmin, false, "stale ADMIN token must not grant admin");
  assert.equal(state.reads, 1);
  state.user = { ...state.user, membershipTier: "VIP" };
  assert.equal((await guard.getPointViewer()).access, "vip");
  assert.equal(state.reads, 2);
  state.user = { ...state.user, membershipTier: "MEMBER" };
  assert.equal((await guard.getPointViewer()).access, "preview");
  assert.equal(state.reads, 3, "no user cache across requests");
});

test("admin revocation, deletion and DB failures never reuse old token permissions", async () => {
  const { state, guard } = harness();
  state.user.role = "ADMIN";
  assert.equal((await guard.requirePointAdmin()).isAdmin, true);
  state.user.role = "USER";
  await assert.rejects(guard.requirePointAdmin(), /仅管理员/);
  state.user = null;
  assert.equal(await state.callbacks.jwt({ token: { ...state.token } }), null);
  assert.equal((await guard.getPointViewer()).userId, null);
  await assert.rejects(guard.requirePointAdmin(), /仅管理员/);
  state.failure = true;
  assert.equal((await guard.getPointViewer()).access, "preview");
  await assert.rejects(guard.requirePointAdmin(), /仅管理员/);
});

test("separate users cannot share the preceding user's refreshed authority", async () => {
  const { state, guard } = harness();
  state.user.membershipTier = "VIP";
  assert.equal((await guard.getPointViewer()).access, "vip");
  state.token.sub = "user-b";
  state.user = { id: "user-b", role: "USER", membershipTier: "MEMBER" };
  const viewer = await guard.getPointViewer();
  assert.equal(viewer.userId, "user-b");
  assert.equal(viewer.access, "preview");
  assert.equal(state.reads, 2);
});

test("anonymous or database-free execution does not query or accept privileged JWTs", async () => {
  const { state, guard } = harness();
  state.signedIn = false;
  assert.equal((await guard.getPointViewer()).userId, null);
  assert.equal(state.reads, 0);
  const missing = harness({ configured: false });
  assert.equal((await missing.guard.getPointViewer()).access, "preview");
  assert.equal(await missing.state.callbacks.jwt({ token: { ...missing.state.token } }), null);
  assert.equal(missing.state.reads, 0);
});
