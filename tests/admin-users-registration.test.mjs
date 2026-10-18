import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const NOW = new Date("2026-10-18T04:30:00.000Z");
const EXPECTED_WINDOWS = {
  monthStart: new Date("2026-09-30T16:00:00.000Z"),
  yesterdayStart: new Date("2026-10-16T16:00:00.000Z"),
  todayStart: new Date("2026-10-17T16:00:00.000Z"),
  now: NOW,
};

// Compile the real page and pure helpers while explicitly replacing every
// framework/auth/persistence boundary. No configured database is ever imported.
function loadModule(filename, overrides = {}) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name === "react/jsx-runtime") return require(name);
    throw new Error(`Unexpected import in isolated registration test: ${name}`);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
}

function makeUser(overrides = {}) {
  return {
    id: "user-1",
    wiseUserId: "WISE-000001",
    email: "target@example.com",
    name: "测试用户",
    wechatId: null,
    wechatCity: null,
    membershipTier: "VIP",
    role: "USER",
    createdAt: new Date("2026-10-17T16:05:06.000Z"),
    accounts: [{ provider: "google" }],
    _count: { partnerAccounts: 2, entitlements: 1 },
    ...overrides,
  };
}

function loadUsersPage({
  role = "ADMIN",
  deny = false,
  preview = false,
  databaseConfigured = true,
  users = [makeUser()],
  previewUsers = [],
  monthCount = 1234,
  yesterdayCount = 19,
  deferReads = false,
} = {}) {
  const calls = [];
  const pendingReads = [];
  let authorized = false;
  let countIndex = 0;
  const recordRead = (method, args, result) => {
    assert.equal(authorized, true, "authorization must precede every data read");
    calls.push({ method, args });
    return deferReads
      ? new Promise((resolve) => pendingReads.push(() => resolve(result)))
      : Promise.resolve(result);
  };
  const database = {
    user: {
      findMany: (args) => recordRead("findMany", args, users),
      groupBy: (args) => recordRead("groupBy", args, [
        { membershipTier: "MEMBER", _count: { membershipTier: 40 } },
        { membershipTier: "VIP", _count: { membershipTier: 30 } },
        { membershipTier: "VIP_PLUS", _count: { membershipTier: 20 } },
      ]),
      count: (args) => recordRead("count", args, countIndex++ === 0 ? monthCount : yesterdayCount),
    },
  };
  const registrationHelpers = loadModule("lib/identity/registration-stats.ts");
  const { default: AdminUsersPage } = loadModule("app/admin/users/page.tsx", {
    "next/link": { default: "a" },
    "lucide-react": { Search: (props) => createElement("svg", props) },
    "@/app/admin/admin-shell": {
      AdminShell: ({ children }) => createElement("main", null, children),
    },
    "@/app/admin/vip/copy-button": { CopyButton: () => null },
    "@/lib/auth/admin-roles": loadModule("lib/auth/admin-roles.ts"),
    "@/lib/auth/provider-display": loadModule("lib/auth/provider-display.ts"),
    "@/lib/identity/current-user": {
      async requireAdminStaffUser() {
        calls.push({ method: "authorize" });
        if (deny) throw new Error("ADMIN_STAFF_REQUIRED");
        authorized = true;
        return { role };
      },
    },
    "@/lib/identity/dev-preview-data": { devPreviewUsers: previewUsers },
    "@/lib/identity/dev-preview-server": {
      async isDevPreviewAdminSession() {
        assert.equal(authorized, true);
        calls.push({ method: "previewSession" });
        return preview;
      },
    },
    "@/lib/identity/registration-stats": {
      ...registrationHelpers,
      getRegistrationWindows: () => registrationHelpers.getRegistrationWindows(NOW),
    },
    "@/lib/prisma": {
      isDatabaseConfigured: () => databaseConfigured,
      getPrisma() {
        assert.equal(authorized, true, "authorization must precede database initialization");
        assert.equal(databaseConfigured, true, "database-free preview must not initialize Prisma");
        calls.push({ method: "getPrisma" });
        return database;
      },
    },
    "@/lib/vip/status": loadModule("lib/vip/status.ts"),
  });
  return {
    calls,
    releaseReads: () => {
      deferReads = false;
      pendingReads.splice(0).forEach((release) => release());
    },
    render: async (searchParams = {}) => renderToStaticMarkup(
      await AdminUsersPage({ searchParams: Promise.resolve(searchParams) }),
    ),
  };
}

function getReads(calls, method) {
  return calls.filter((call) => call.method === method);
}

function getRegistrationStats(html) {
  const stats = html.match(/<dl\b[^>]*aria-label="注册统计"[^>]*>([\s\S]*?)<\/dl>/g);
  assert.equal(stats?.length, 1, "full admins see one registration statistics group");
  return Object.fromEntries(
    [...stats[0].matchAll(/<dt\b[^>]*>([^<]+)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g)]
      .map(([, label, body]) => [label, body.replace(/<[^>]*>/g, "").trim()]),
  );
}

test("admin registration counts are global createdAt queries, independent of list filters and limit", async () => {
  const { render, calls } = loadUsersPage();
  const html = await render({ q: "  target@example.com  ", tier: "VIP" });
  const [list] = getReads(calls, "findMany");
  assert.equal(list.args.take, 50);
  assert.deepEqual(list.args.orderBy, { createdAt: "desc" });
  assert.equal(list.args.select.createdAt, true);
  assert.equal(list.args.where.membershipTier, "VIP");
  assert.deepEqual(list.args.where.OR, ["email", "name", "wiseUserId", "wechatId", "wechatCity"].map(
    (field) => ({ [field]: { contains: "target@example.com", mode: "insensitive" } }),
  ));
  assert.deepEqual(getReads(calls, "count").map(({ args }) => args), [
    { where: { createdAt: { gte: EXPECTED_WINDOWS.monthStart, lte: EXPECTED_WINDOWS.now } } },
    { where: { createdAt: { gte: EXPECTED_WINDOWS.yesterdayStart, lt: EXPECTED_WINDOWS.todayStart } } },
  ], "global counts must not contain q, membershipTier, take, or other list constraints");
  assert.deepEqual(getReads(calls, "groupBy")[0].args, {
    by: ["membershipTier"], _count: { membershipTier: true },
  });
  const stats = getRegistrationStats(html);
  assert.deepEqual(Object.keys(stats), ["本月注册", "昨日注册"]);
  assert.match(stats["本月注册"], /^1,234人2026-10-01 至今$/);
  assert.match(stats["昨日注册"], /^19人2026-10-17$/);
  assert.match(html, /不受搜索和会员筛选影响/);
  assert.equal(calls[0].method, "authorize");
});

test("admin user rows render registration date and time in Asia/Shanghai with the original ISO instant", async () => {
  const { render } = loadUsersPage();
  const html = await render();
  assert.match(html, /注册时间/);
  assert.match(html, /北京时间/);
  const time = html.match(/<time\b[^>]*dateTime="2026-10-17T16:05:06\.000Z"[^>]*>([\s\S]*?)<\/time>/i);
  assert.ok(time, "registration time should retain a machine-readable ISO datetime");
  assert.match(time[1], />2026-10-18<\/span>/);
  assert.match(time[1], />00:05:06<\/span>/);
});

test("all independent admin data reads start before the first query settles", async () => {
  const { render, calls, releaseReads } = loadUsersPage({ deferReads: true });
  const rendering = render();
  try {
    await new Promise(setImmediate);
    assert.deepEqual(calls.filter(({ method }) => ["findMany", "groupBy", "count"].includes(method))
      .map(({ method }) => method), ["findMany", "groupBy", "count", "count"]);
  } finally {
    releaseReads();
  }
  await rendering;
});

test("authorization failure stops before session or database reads", async () => {
  const { render, calls } = loadUsersPage({ deny: true });
  await assert.rejects(render(), /ADMIN_STAFF_REQUIRED/);
  assert.deepEqual(calls, [{ method: "authorize" }]);
});

test("admin assistants retain email-only search and take 10 without global statistics or registration output", async () => {
  const { render, calls } = loadUsersPage({ role: "ADMIN_ASSISTANT" });
  const html = await render({ q: "  target@example.com  ", tier: "VIP_PLUS" });
  const [list] = getReads(calls, "findMany");
  assert.equal(list.args.take, 10);
  assert.deepEqual(list.args.where, {
    OR: [{ email: { contains: "target@example.com", mode: "insensitive" } }],
  });
  assert.equal(getReads(calls, "count").length, 0);
  assert.equal(getReads(calls, "groupBy").length, 0);
  assert.doesNotMatch(html, /本月注册|昨日注册|aria-label="注册统计"|注册时间|<time\b/);
  assert.match(html, /target@example.com/);
  assert.match(html, /用户查询/);
});

test("admin assistants without an email query do not read users or global counts", async () => {
  const { render, calls } = loadUsersPage({ role: "ADMIN_ASSISTANT" });
  const html = await render({ q: "   ", tier: "VIP" });
  for (const method of ["findMany", "groupBy", "count"]) {
    assert.equal(getReads(calls, method).length, 0);
  }
  assert.match(html, /请输入用户邮箱后查询。/);
  assert.doesNotMatch(html, /本月注册|昨日注册|注册时间|<time\b/);
});

test("empty development preview safely displays zero registrations without accessing Prisma", async () => {
  const { render, calls } = loadUsersPage({ preview: true, databaseConfigured: false });
  const html = await render();
  assert.deepEqual(getRegistrationStats(html), {
    本月注册: "0人2026-10-01 至今",
    昨日注册: "0人2026-10-17",
  });
  assert.match(html, /没有找到匹配用户。/);
  assert.deepEqual(calls.map(({ method }) => method), ["authorize", "previewSession"]);
});

test("preview statistics count all fixture users with the same boundaries, not only matching rows", async () => {
  const dates = [
    EXPECTED_WINDOWS.monthStart,
    EXPECTED_WINDOWS.yesterdayStart,
    EXPECTED_WINDOWS.todayStart,
    EXPECTED_WINDOWS.now,
    new Date(EXPECTED_WINDOWS.monthStart.getTime() - 1),
    new Date(EXPECTED_WINDOWS.now.getTime() + 1),
  ];
  const previewUsers = dates.map((createdAt, index) => makeUser({
    id: `preview-${index}`,
    email: index === 2 ? "target@example.com" : `other-${index}@example.com`,
    membershipTier: index === 2 ? "VIP" : "MEMBER",
    createdAt,
  }));
  const { render, calls } = loadUsersPage({ preview: true, databaseConfigured: false, previewUsers });
  const html = await render({ q: "target@example.com", tier: "VIP" });
  assert.deepEqual(getRegistrationStats(html), {
    本月注册: "4人2026-10-01 至今",
    昨日注册: "1人2026-10-17",
  });
  assert.equal((html.match(/<time\b/g) || []).length, 1);
  assert.match(html, /target@example.com/);
  assert.doesNotMatch(html, /other-\d@example.com/);
  assert.deepEqual(calls.map(({ method }) => method), ["authorize", "previewSession"]);
});
