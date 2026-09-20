import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Transpile the actual application modules, only replacing explicit external I/O boundaries.
// Next's @ alias and extensionless imports are not supported by Node's strip-types resolver.
function modules(mocks = {}) {
  const cache = new Map();
  function load(file) {
    if (Object.hasOwn(mocks, file)) return mocks[file];
    if (cache.has(file)) return cache.get(file).exports;
    const result = { exports: {} };
    cache.set(file, result);
    const source = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    function importModule(specifier) {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith(".") || specifier.startsWith("@/")) {
        const resolved = specifier.startsWith("@/")
          ? path.join(root, specifier.slice(2))
          : path.resolve(path.dirname(file), specifier);
        return load(path.extname(resolved) ? resolved : `${resolved}.ts`);
      }
      return require(specifier);
    }
    new Function("require", "module", "exports", source)(
      importModule,
      result,
      result.exports,
    );
    return result.exports;
  }
  return (name) => load(path.join(root, `lib/point/${name}.ts`));
}

const load = modules();
const access = load("access");
const validation = load("validation");
const preview = load("preview-store");
const admin = access.pointViewerFromUser(
  { id: "admin", role: "ADMIN", membershipTier: "MEMBER" },
  true,
);
const vip = access.pointViewerFromUser(
  { id: "vip", role: "USER", membershipTier: "VIP" },
  true,
);
const member = access.pointViewerFromUser(
  { id: "member", role: "USER", membershipTier: "MEMBER" },
  true,
);
const now = Date.now();
const body = {
  action: "publish",
  confirmedSymbol: "BTCUSDT",
  symbol: "BTCUSDT",
  direction: "LONG",
  entryPrice: "100",
  entryLower: "99",
  entryUpper: "101",
  stopLoss: "90",
  takeProfit: "120",
  rationale: "SECRET_RATIONALE",
  entryCondition: "SECRET_ENTRY",
  invalidationCondition: "SECRET_INVALIDATION",
  publicSummary: "Public summary",
  validFrom: new Date(now - 3600000).toISOString(),
  validUntil: new Date(now + 86400000).toISOString(),
  changeReason: "Reviewed",
};
const noteOnlyBody = { ...body };
for (const field of [
  "entryCondition",
  "invalidationCondition",
  "publicSummary",
  "changeReason",
])
  delete noteOnlyBody[field];

test("access grants full plans only to VIP, VIP_PLUS, and current ADMIN", () => {
  assert.equal(access.pointViewerFromUser(null).access, "preview");
  for (const membershipTier of ["MEMBER", "UNKNOWN"])
    assert.equal(
      access.pointViewerFromUser({ id: "a", role: "USER", membershipTier })
        .access,
      "preview",
    );
  for (const membershipTier of ["VIP", "VIP_PLUS"])
    assert.equal(
      access.pointViewerFromUser({ id: "a", role: "USER", membershipTier })
        .access,
      "vip",
    );
  assert.equal(admin.access, "vip");
});

test("preview is exact fixed latest-three allowlist across every filter and page", () => {
  const plans = [...preview.createPointPreviewStore(now).plans.values()];
  const expected = access.selectPointList(plans, member);
  assert.equal(expected.items.length, 3);
  assert.deepEqual(
    Object.keys(expected.items[0]).sort(),
    [
      "id",
      "symbol",
      "name",
      "category",
      "publicSummary",
      "publishedAt",
      "updatedAt",
      "validUntil",
    ].sort(),
  );
  for (const options of [
    { scope: "all", page: 2 },
    { category: "EQUITY", q: "INTC", page: 100 },
    { scope: "active", q: "SECRET_RATIONALE", page: -3 },
    { direction: "LONG" },
    { direction: "SHORT", category: "EQUITY", q: "INTC", page: 2 },
  ]) {
    assert.deepEqual(access.selectPointList(plans, member, options), expected);
  }
  const serialized = JSON.stringify(expected);
  for (const forbidden of [
    "entryPrice",
    "entryLower",
    "entryUpper",
    "stopLoss",
    "takeProfit",
    "direction",
    "rationale",
    "entryCondition",
    "invalidationCondition",
    "publishedReferencePrice",
  ])
    assert.ok(!serialized.includes(forbidden), forbidden);
  assert.ok(!serialized.includes("demo-intc"));
});

test("public summary is independently capped and never derived from private rationale", () => {
  const plan = [...preview.createPointPreviewStore(now).plans.values()][0];
  const serialized = access.toPointPreview({
    ...plan,
    publicSummary: "🙂".repeat(100),
    rationale: "PRIVATE",
  });
  assert.equal(Array.from(serialized.publicSummary).length, 80);
  assert.ok(!JSON.stringify(serialized).includes("PRIVATE"));
});

test("VIP active feed excludes drafts, future, expired, withdrawn; all retains published history", () => {
  const base = [...preview.createPointPreviewStore(now).plans.values()][0];
  const plans = [
    base,
    { ...base, id: "draft", status: "DRAFT", publishedAt: null },
    { ...base, id: "expired", validUntil: new Date(now - 1).toISOString() },
    { ...base, id: "future", validFrom: new Date(now + 10000).toISOString() },
    { ...base, id: "withdrawn", status: "WITHDRAWN" },
    { ...base, id: "closed", status: "CLOSED" },
  ];
  assert.deepEqual(
    access
      .selectPointList(plans, vip, { scope: "active" }, now)
      .items.map((p) => p.id),
    [base.id],
  );
  assert.equal(
    access.selectPointList(plans, vip, { scope: "all" }, now).total,
    5,
  );
  assert.equal(
    access.selectPointList(plans, vip, { scope: "all", q: "SECRET" }, now)
      .total,
    0,
  );
});

test("VIP direction filtering composes with active scope, category and search before pagination", () => {
  const templates = [...preview.createPointPreviewStore(now).plans.values()];
  const plans = Array.from({ length: 64 }, (_, index) => ({
    ...templates[index % templates.length],
    id: `direction-${String(index).padStart(3, "0")}`,
    publishedAt: new Date(now - index * 60000).toISOString(),
  }));
  plans[3] = { ...plans[3], validUntil: new Date(now - 1).toISOString() };
  plans[7] = { ...plans[7], status: "CLOSED" };
  const options = {
    scope: "active",
    category: "EQUITY",
    direction: "SHORT",
    q: "intel",
    page: 2,
  };
  const result = access.selectPointList(plans, vip, options, now);
  assert.equal(result.total, 14);
  assert.equal(result.page, 2);
  assert.equal(result.items.length, 2);
  assert.deepEqual(
    result.items.map((plan) => plan.id),
    [plans[59].id, plans[63].id],
  );
  assert.ok(result.items.every((plan) => plan.direction === "SHORT"));
  assert.equal(
    access.selectPointList(plans, vip, { ...options, scope: "all" }, now).total,
    16,
  );
  const long = access.selectPointList(
    plans,
    vip,
    { ...options, direction: "LONG", q: "micron" },
    now,
  );
  assert.equal(long.total, 16);
  assert.ok(
    long.items.every(
      (plan) =>
        plan.direction === "LONG" && plan.instrument.symbol === "MUUSDT",
    ),
  );
  assert.equal(
    access.selectPointList(plans, vip, { direction: "ALL", scope: "all" }, now)
      .total,
    64,
  );
});

test("publish accepts a single private note and defaults legacy explanation fields safely", () => {
  const mutation = validation.parsePointMutation(noteOnlyBody, false, now);
  assert.equal(mutation.input.rationale, body.rationale);
  assert.equal(mutation.input.entryCondition, "");
  assert.equal(mutation.input.invalidationCondition, "");
  assert.equal(mutation.input.publicSummary, "点位计划详情仅向 VIP 会员开放。");
  assert.equal(mutation.reason, "创建计划");
  assert.equal(mutation.input.changeReason, mutation.reason);
  for (const empty of [undefined, null, "", " \t\n "]) {
    const parsed = validation.parsePointMutation({
      ...noteOnlyBody,
      entryCondition: empty,
      invalidationCondition: empty,
      publicSummary: empty,
      changeReason: empty,
    });
    assert.deepEqual(parsed, mutation);
  }
});

test("legacy explanation fields and an explicit audit reason remain independently preserved", () => {
  const mutation = validation.parsePointMutation(body);
  for (const field of [
    "rationale",
    "entryCondition",
    "invalidationCondition",
    "publicSummary",
    "changeReason",
  ])
    assert.equal(mutation.input[field], body[field]);
  assert.equal(mutation.reason, body.changeReason);
});

test("default public summaries are constant and cannot disclose private note, direction, or levels", () => {
  const base = [...preview.createPointPreviewStore(now).plans.values()][0];
  const variants = [
    noteOnlyBody,
    {
      ...noteOnlyBody,
      direction: "SHORT",
      entryPrice: "13579",
      entryLower: null,
      entryUpper: null,
      stopLoss: "24680",
      takeProfit: "12345",
      rationale: "PRIVATE_SHORT_PLAN_13579_24680_12345",
    },
  ];
  const summaries = [];
  for (const variant of variants) {
    const { input } = validation.parsePointMutation(variant);
    const publicPlan = access.toPointPreview({ ...base, ...input });
    summaries.push(publicPlan.publicSummary);
    const serialized = JSON.stringify(publicPlan);
    for (const secret of [
      variant.rationale,
      variant.direction,
      "entryPrice",
      "stopLoss",
      "takeProfit",
      "rationale",
      "13579",
      "24680",
      "12345",
    ])
      assert.ok(!serialized.includes(secret), secret);
  }
  assert.deepEqual(summaries, [
    "点位计划详情仅向 VIP 会员开放。",
    "点位计划详情仅向 VIP 会员开放。",
  ]);
});

test("publish rejects invalid decimal, infinite, oversized, exponent, and missing required fields", () => {
  for (const invalid of [
    "NaN",
    "Infinity",
    "1e3",
    "0",
    "-1",
    "1000000000000",
    "0.000000001",
    "001",
    100,
  ])
    assert.throws(
      () => validation.parsePointMutation({ ...body, entryPrice: invalid }),
      /入场价/,
    );
  for (const field of [
    "entryPrice",
    "stopLoss",
    "takeProfit",
    "rationale",
  ])
    assert.throws(() =>
      validation.parsePointMutation({ ...body, [field]: "" }),
    );
  assert.throws(
    () =>
      validation.parsePointMutation({
        ...body,
        publicSummary: "字".repeat(81),
      }),
    /80/,
  );
  assert.throws(
    () =>
      validation.parsePointMutation({ ...body, rationale: "a".repeat(3001) }),
    /3000/,
  );
  assert.throws(
    () => validation.parsePointMutation({ ...noteOnlyBody, rationale: "" }),
    /请填写备注/,
  );
  for (const field of ["entryCondition", "invalidationCondition"])
    assert.throws(
      () =>
        validation.parsePointMutation({
          ...noteOnlyBody,
          [field]: "a".repeat(1001),
        }),
      /1000/,
    );
  for (const field of [
    "entryCondition",
    "invalidationCondition",
    "publicSummary",
    "changeReason",
  ])
    assert.throws(
      () => validation.parsePointMutation({ ...noteOnlyBody, [field]: 123 }),
      /格式无效/,
    );
});

test("price geometry validates both directions and exact decimals without float rounding", () => {
  assert.equal(validation.parsePointMutation(body).input.entryPrice, "100");
  assert.throws(
    () => validation.parsePointMutation({ ...body, stopLoss: "99" }),
    /做多/,
  );
  assert.throws(
    () => validation.parsePointMutation({ ...body, takeProfit: "101" }),
    /做多/,
  );
  assert.throws(
    () => validation.parsePointMutation({ ...body, entryLower: "102" }),
    /下限/,
  );
  assert.throws(
    () => validation.parsePointMutation({ ...body, entryLower: null }),
    /同时/,
  );
  assert.throws(
    () => validation.parsePointMutation({ ...body, entryPrice: "102" }),
    /区间内/,
  );
  assert.equal(
    validation.parsePointMutation({
      ...body,
      direction: "SHORT",
      stopLoss: "110",
      takeProfit: "80",
    }).input.direction,
    "SHORT",
  );
  assert.throws(
    () =>
      validation.parsePointMutation({
        ...body,
        direction: "SHORT",
        stopLoss: "101",
        takeProfit: "80",
      }),
    /做空/,
  );
  validation.parsePointMutation({
    ...body,
    entryPrice: "999999999999.00000002",
    entryLower: null,
    entryUpper: null,
    stopLoss: "999999999999.00000001",
    takeProfit: "999999999999.00000003",
  });
});

test("dates need valid calendar, timezone, increasing range, and a future expiry to publish", () => {
  assert.throws(
    () =>
      validation.parsePointMutation({
        ...body,
        validFrom: "2026-02-31T12:00:00Z",
      }),
    /日历/,
  );
  assert.throws(
    () =>
      validation.parsePointMutation({ ...body, validFrom: "2026-01-01T12:00" }),
    /时区/,
  );
  assert.throws(
    () =>
      validation.parsePointMutation({ ...body, validUntil: body.validFrom }),
    /晚于/,
  );
  assert.throws(
    () =>
      validation.parsePointMutation({
        ...body,
        validUntil: new Date(now - 1).toISOString(),
      }),
    /过期/,
  );
  const draft = validation.parsePointMutation({
    ...body,
    action: "draft",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    rationale: "",
  });
  assert.equal(draft.input.entryPrice, "");
});

test("mutations still require exact instrument confirmation and update versions", () => {
  assert.throws(
    () =>
      validation.parsePointMutation({ ...body, confirmedSymbol: "ETHUSDT" }),
    /不一致/,
  );
  assert.throws(
    () => validation.parsePointMutation(body, true),
    /expectedVersion/,
  );
  assert.equal(
    validation.parsePointMutation(
      {
        action: "withdraw",
        expectedVersion: 1,
        changeReason: "Thesis changed",
      },
      true,
    ).input,
    null,
  );
});

test("missing audit reasons use truthful action labels while explicit reasons are preserved", () => {
  for (const [action, updating, expected] of [
    ["draft", false, "保存草稿"],
    ["publish", false, "创建计划"],
    ["draft", true, "保存草稿"],
    ["publish", true, "发布更新"],
    ["withdraw", true, "撤回计划"],
    ["close", true, "结束计划"],
  ]) {
    for (const changeReason of [
      undefined,
      null,
      "",
      " \t ",
      " Explicit reason ",
    ]) {
      const mutation = validation.parsePointMutation(
        { ...noteOnlyBody, action, expectedVersion: 1, changeReason },
        updating,
      );
      assert.equal(
        mutation.reason,
        changeReason === " Explicit reason " ? "Explicit reason" : expected,
      );
      if (mutation.input)
        assert.equal(mutation.input.changeReason, mutation.reason);
    }
  }
  assert.throws(
    () =>
      validation.parsePointMutation({
        ...noteOnlyBody,
        changeReason: "字".repeat(501),
      }),
    /500/,
  );
});

test("state machine keeps published product fixed and terminal history read-only", () => {
  const plan = [...preview.createPointPreviewStore(now).plans.values()][0];
  assert.throws(
    () =>
      validation.assertPointTransition(plan, {
        action: "publish",
        expectedVersion: 2,
      }),
    /其他人/,
  );
  assert.throws(
    () =>
      validation.assertPointTransition(plan, {
        action: "draft",
        expectedVersion: 1,
      }),
    /草稿/,
  );
  assert.throws(
    () =>
      validation.assertPointTransition(plan, {
        action: "publish",
        expectedVersion: 1,
        input: { symbol: "ETHUSDT" },
      }),
    /不可更换/,
  );
  for (const status of ["CLOSED", "WITHDRAWN"])
    assert.throws(
      () =>
        validation.assertPointTransition(
          { ...plan, status },
          { action: "publish", expectedVersion: 1 },
        ),
      /只读历史/,
    );
});

test("switching an existing draft product needs a fresh exact confirmation", () => {
  const plan = {
    ...[...preview.createPointPreviewStore(now).plans.values()][0],
    status: "DRAFT",
    publishedAt: null,
  };
  for (const confirmedSymbol of [undefined, "", "BTCUSDT", "ETH"]) {
    const mutation = validation.parsePointMutation(
      {
        ...body,
        action: "draft",
        symbol: "ETHUSDT",
        confirmedSymbol,
        expectedVersion: 1,
      },
      true,
    );
    assert.throws(
      () => validation.assertPointTransition(plan, mutation),
      /重新确认/,
    );
  }
  validation.assertPointTransition(
    plan,
    validation.parsePointMutation(
      {
        ...body,
        action: "draft",
        symbol: "ETHUSDT",
        confirmedSymbol: "ETHUSDT",
        expectedVersion: 1,
      },
      true,
    ),
  );
  // Merely editing a draft's text does not needlessly invalidate the original selection.
  validation.assertPointTransition(
    plan,
    validation.parsePointMutation(
      { ...body, action: "draft", confirmedSymbol: "", expectedVersion: 1 },
      true,
    ),
  );
});

test("active window includes its start and excludes the exact expiry", () => {
  const base = [...preview.createPointPreviewStore(now).plans.values()][0];
  const plan = {
    ...base,
    validFrom: new Date(now).toISOString(),
    validUntil: new Date(now + 1).toISOString(),
  };
  assert.equal(access.isActivePoint(plan, now - 1), false);
  assert.equal(access.isActivePoint(plan, now), true);
  assert.equal(access.isActivePoint(plan, now + 1), false);
  assert.equal(
    access.selectPointList([plan], vip, { scope: "all" }, now + 1).total,
    1,
  );
});

test("CSRF guard rejects missing, cross-site, deceptive origin and non-JSON bodies", () => {
  const request = (origin, contentType = "application/json", site) => ({
    url: "https://wise.example/api/admin/point",
    headers: new Headers({
      ...(origin ? { origin } : {}),
      "content-type": contentType,
      ...(site ? { "sec-fetch-site": site } : {}),
    }),
  });
  validation.assertPointSameOrigin(request("https://wise.example"));
  for (const origin of [
    undefined,
    "null",
    "https://evil.example",
    "https://wise.example.evil.example",
    "https://wise.example/path",
    "https://evil@wise.example",
  ])
    assert.throws(
      () => validation.assertPointSameOrigin(request(origin)),
      /本站/,
    );
  assert.throws(
    () =>
      validation.assertPointSameOrigin(
        request("https://wise.example", "application/json", "cross-site"),
      ),
    /本站/,
  );
  assert.throws(
    () =>
      validation.assertPointSameOrigin(
        request("https://wise.example", "text/plain"),
      ),
    /JSON/,
  );
  assert.throws(
    () =>
      validation.assertPointSameOrigin(
        request("https://wise.example", "application/jsonish"),
      ),
    /JSON/,
  );
});

test("request reader caps streamed bodies and rejects malformed JSON", async () => {
  assert.deepEqual(
    await validation.readPointMutationBody(
      new Request("https://wise.example", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    ),
    body,
  );
  await assert.rejects(
    validation.readPointMutationBody(
      new Request("https://wise.example", {
        method: "POST",
        body: "x".repeat(24001),
      }),
    ),
    /过长/,
  );
  await assert.rejects(
    validation.readPointMutationBody(
      new Request("https://wise.example", { method: "POST", body: "{invalid" }),
    ),
    /JSON/,
  );
});

test("preview CAS retains immutable earlier snapshots and rejects stale simultaneous writes", () => {
  const store = preview.createPointPreviewStore(now);
  const current = store.plans.get("demo-btc");
  const plan = { ...current, version: 2, rationale: "new private thesis" };
  const revision = {
    ...store.revisions.get(current.id)[0],
    id: "revision-2",
    version: 2,
    snapshot: plan,
  };
  preview.commitPointPreviewRevision(store, plan, revision, 1);
  assert.throws(
    () => preview.commitPointPreviewRevision(store, plan, revision, 1),
    /其他人/,
  );
  plan.rationale = "mutated outside store";
  assert.notEqual(store.plans.get(current.id).rationale, plan.rationale);
  assert.equal(store.revisions.get(current.id)[0].snapshot.version, 1);
  assert.equal(store.revisions.get(current.id)[1].snapshot.version, 2);
});

function repositoryHarness({ configured = true } = {}) {
  let databaseCalls = 0;
  let providerCalls = 0;
  let cookie = undefined;
  let persistedUser = {
    id: "signed-in",
    role: "USER",
    membershipTier: "MEMBER",
  };
  let quotePrice = null;
  let sessionFailure = false;
  let userFailure = false;
  const data = { plans: new Map(), revisions: new Map() };
  const queries = [];
  let queue = Promise.resolve();
  let failRevision = false;
  const scalar = (value) => (value instanceof Date ? value.getTime() : value);
  function matches(row, where) {
    if (!where) return true;
    return Object.entries(where).every(([field, condition]) => {
      if (field === "OR") return condition.some((part) => matches(row, part));
      if (field === "AND") return condition.every((part) => matches(row, part));
      const value = row[field];
      if (
        condition === null ||
        typeof condition !== "object" ||
        condition instanceof Date
      )
        return scalar(value) === scalar(condition);
      if (condition.path) {
        const nested = condition.path.reduce(
          (current, key) => current?.[key],
          value,
        );
        if (Object.hasOwn(condition, "equals"))
          return nested === condition.equals;
        return (
          typeof nested === "string" &&
          (condition.mode === "insensitive"
            ? nested
                .toLowerCase()
                .includes(condition.string_contains.toLowerCase())
            : nested.includes(condition.string_contains))
        );
      }
      if (
        Object.hasOwn(condition, "not") &&
        scalar(value) === scalar(condition.not)
      )
        return false;
      if (condition.in && !condition.in.includes(value)) return false;
      if (condition.lte !== undefined && scalar(value) > scalar(condition.lte))
        return false;
      if (condition.gt !== undefined && scalar(value) <= scalar(condition.gt))
        return false;
      if (
        condition.contains !== undefined &&
        !(condition.mode === "insensitive"
          ? value.toLowerCase().includes(condition.contains.toLowerCase())
          : value.includes(condition.contains))
      )
        return false;
      return true;
    });
  }
  function ordered(rows, orderBy) {
    const order = !orderBy ? [] : Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const item of order) {
        const [key, direction] = Object.entries(item)[0];
        const left = scalar(a[key]);
        const right = scalar(b[key]);
        const comparison = left < right ? -1 : left > right ? 1 : 0;
        if (comparison) return direction === "desc" ? -comparison : comparison;
      }
      return 0;
    });
  }
  const project = (row, select) =>
    structuredClone(
      select
        ? Object.fromEntries(
            Object.keys(select)
              .filter((key) => select[key])
              .map((key) => [key, row[key]]),
          )
        : row,
    );
  const prisma = {
    user: {
      findUnique: async () => {
        databaseCalls++;
        if (userFailure) throw new Error("PRIVATE_DATABASE_DETAILS");
        return persistedUser;
      },
    },
    pointPlan: {
      findMany: async (args = {}) => {
        databaseCalls++;
        queries.push({
          model: "pointPlan",
          method: "findMany",
          args: structuredClone(args),
        });
        const rows = ordered(
          [...data.plans.values()].filter((row) => matches(row, args.where)),
          args.orderBy,
        );
        return rows
          .slice(
            args.skip ?? 0,
            args.take === undefined ? undefined : (args.skip ?? 0) + args.take,
          )
          .map((row) => project(row, args.select));
      },
      count: async (args = {}) => {
        databaseCalls++;
        queries.push({
          model: "pointPlan",
          method: "count",
          args: structuredClone(args),
        });
        return [...data.plans.values()].filter((row) =>
          matches(row, args.where),
        ).length;
      },
      groupBy: async (args) => {
        databaseCalls++;
        queries.push({
          model: "pointPlan",
          method: "groupBy",
          args: structuredClone(args),
        });
        assert.deepEqual(args.by, ["symbol"]);
        return [
          ...new Set(
            [...data.plans.values()]
              .filter((row) => matches(row, args.where))
              .map((row) => row.symbol),
          ),
        ].map((symbol) => ({ symbol }));
      },
      findUnique: async (args) => {
        databaseCalls++;
        queries.push({
          model: "pointPlan",
          method: "findUnique",
          args: structuredClone(args),
        });
        return data.plans.has(args.where.id)
          ? project(data.plans.get(args.where.id), args.select)
          : null;
      },
      create: async ({ data: row }) => {
        databaseCalls++;
        data.plans.set(row.id, structuredClone(row));
        return row;
      },
      updateMany: async ({ where, data: row }) => {
        databaseCalls++;
        const current = data.plans.get(where.id);
        if (!current || current.version !== where.version) return { count: 0 };
        data.plans.set(where.id, { ...current, ...structuredClone(row) });
        return { count: 1 };
      },
    },
    pointRevision: {
      findMany: async (args) => {
        databaseCalls++;
        queries.push({
          model: "pointRevision",
          method: "findMany",
          args: structuredClone(args),
        });
        return ordered(
          (data.revisions.get(args.where.planId) ?? []).filter((row) =>
            matches(row, args.where),
          ),
          args.orderBy,
        ).map((row) => project(row, args.select));
      },
      create: async ({ data: row }) => {
        databaseCalls++;
        if (failRevision) throw new Error("Injected audit write failure");
        const previous = data.revisions.get(row.planId) ?? [];
        assert.ok(!previous.some((r) => r.version === row.version));
        data.revisions.set(row.planId, [...previous, structuredClone(row)]);
        return row;
      },
    },
    $transaction: async (callback) => {
      const previous = queue;
      let release;
      queue = new Promise((resolve) => {
        release = resolve;
      });
      await previous;
      const backup = structuredClone(data);
      try {
        return await callback(prisma);
      } catch (error) {
        data.plans = backup.plans;
        data.revisions = backup.revisions;
        throw error;
      } finally {
        release();
      }
    },
  };
  const provider = {
    getBinanceInstrument: async (symbol) => {
      providerCalls++;
      const item = preview
        .getPointPreviewInstruments()
        .find((i) => i.symbol === symbol);
      if (!item)
        throw Object.assign(new Error("unsupported"), {
          code: "UNSUPPORTED_INSTRUMENT",
        });
      return { ...item, contractType: "PERPETUAL", name: symbol };
    },
    getBinanceQuotes: async (symbols) =>
      symbols.map((symbol) => ({
        symbol,
        price: quotePrice,
        status: quotePrice === null ? "unavailable" : "fresh",
      })),
  };
  const mockLoad = modules({
    "@/lib/prisma": {
      isDatabaseConfigured: () => configured,
      getPrisma: () => prisma,
    },
    [path.join(root, "lib/point/binance.ts")]: provider,
    "@/auth": {
      auth: async () => {
        if (sessionFailure) throw new Error("PRIVATE_SESSION_DETAILS");
        return {
          user: { id: "signed-in", role: "ADMIN", membershipTier: "VIP_PLUS" },
        };
      },
    },
    "next/headers": {
      cookies: async () => ({
        get: () => (cookie ? { value: cookie } : undefined),
      }),
    },
    "@/lib/vip/api-guards": {
      checkAdminMutationLimit: async () => null,
    },
  });
  return {
    repository: mockLoad("repository"),
    auth: mockLoad("auth"),
    route: (route) => mockLoad(`../../app/api/${route}/route`),
    data,
    queries,
    counts: () => ({ databaseCalls, providerCalls }),
    setCookie: (value) => {
      cookie = value;
    },
    setUser: (value) => {
      persistedUser = value;
    },
    setQuotePrice: (value) => {
      quotePrice = value;
    },
    failSession: () => {
      sessionFailure = true;
    },
    failUserLookup: () => {
      userFailure = true;
    },
    failAudit: () => {
      failRevision = true;
    },
  };
}

test("preview with DATABASE_URL configured never calls production DB/provider; detail protects fourth item", async () => {
  const harness = repositoryHarness();
  const { repository } = harness;
  const list = await repository.getPointList(member, {
    page: 20,
    scope: "all",
    q: "INTC",
  });
  assert.equal(list.items.length, 3);
  assert.equal(await repository.getPointDetail(member, "demo-intc"), null);
  assert.deepEqual(
    Object.keys(await repository.getPointDetail(member, "demo-btc")).sort(),
    ["access", "plan", "previewMode"],
  );
  const created = await repository.createPointPlan(admin, body);
  await repository.updatePointPlan(admin, created.id, {
    ...body,
    expectedVersion: 1,
    takeProfit: "130",
  });
  await repository.listPointAdmin(admin);
  assert.deepEqual(harness.counts(), { databaseCalls: 0, providerCalls: 0 });
});

test("production auth ignores preview cookies and stale JWT admin/tier in favor of current DB", async () => {
  const environment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const harness = repositoryHarness();
    harness.setCookie("admin");
    const viewer = await harness.auth.getPointViewer();
    assert.equal(viewer.previewMode, false);
    assert.equal(viewer.access, "preview");
    await assert.rejects(harness.auth.requirePointAdmin(), /仅管理员/);
    harness.setUser({
      id: "signed-in",
      role: "ADMIN",
      membershipTier: "MEMBER",
    });
    assert.equal((await harness.auth.requirePointAdmin()).isAdmin, true);
    harness.setUser(null);
    assert.equal((await harness.auth.getPointViewer()).access, "preview");
    assert.throws(() => preview.getPointPreviewStore(admin), /生产环境/);
    await assert.rejects(
      harness.repository.createPointPlan(admin, body),
      /生产环境/,
    );
  } finally {
    if (environment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = environment;
  }
});

test("development admin cookie bypasses session/DB reads and selects isolated preview", async () => {
  const harness = repositoryHarness();
  harness.setCookie("admin");
  const viewer = await harness.auth.requirePointAdmin();
  assert.equal(viewer.previewMode, true);
  assert.equal(viewer.isAdmin, true);
  assert.deepEqual(harness.counts(), { databaseCalls: 0, providerCalls: 0 });
});

test("auth failures revoke access rather than trusting cached session privileges", async () => {
  for (const failure of ["failSession", "failUserLookup"]) {
    const harness = repositoryHarness();
    harness[failure]();
    const viewer = await harness.auth.getPointViewer();
    assert.equal(viewer.access, "preview");
    assert.equal(viewer.isAdmin, false);
    assert.equal(viewer.userId, null);
    await assert.rejects(harness.auth.requirePointAdmin(), /仅管理员/);
    assert.ok(!JSON.stringify(viewer).includes("PRIVATE_"));
  }
});

test("normal unconfigured database returns genuinely empty state, never seeded plans", async () => {
  const harness = repositoryHarness({ configured: false });
  const response = await harness.repository.getPointList({
    ...member,
    previewMode: false,
  });
  assert.deepEqual(response.items, []);
  assert.equal(response.unavailable, true);
  assert.deepEqual(harness.counts(), { databaseCalls: 0, providerCalls: 0 });
});

test("DB workflow atomically appends revisions, hides drafts, rejects races, rolls back failed audit", async () => {
  const { repository, data, failAudit } = repositoryHarness();
  const realAdmin = { ...admin, previewMode: false };
  const realVip = { ...vip, previewMode: false };
  const plan = await repository.createPointPlan(realAdmin, {
    ...body,
    action: "draft",
    rationale: "DRAFT_INTERNAL_SECRET",
  });
  assert.equal(
    (await repository.getPointList(realVip, { scope: "all" })).total,
    0,
  );
  assert.equal(await repository.getPointDetail(realVip, plan.id), null);
  await repository.updatePointPlan(realAdmin, plan.id, {
    ...body,
    expectedVersion: 1,
  });
  const detail = await repository.getPointDetail(realVip, plan.id);
  assert.equal(detail.plan.version, 2);
  assert.equal(detail.revisions.length, 1);
  assert.ok(!JSON.stringify(detail).includes("DRAFT_INTERNAL_SECRET"));
  assert.equal(detail.plan.publishedReferencePrice, null);
  const results = await Promise.allSettled([
    repository.updatePointPlan(realAdmin, plan.id, {
      ...body,
      expectedVersion: 2,
      takeProfit: "130",
    }),
    repository.updatePointPlan(realAdmin, plan.id, {
      ...body,
      expectedVersion: 2,
      takeProfit: "140",
    }),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal(
    results.find((result) => result.status === "rejected").reason.status,
    409,
  );
  assert.equal(data.revisions.get(plan.id).length, 3);
  failAudit();
  await assert.rejects(
    repository.updatePointPlan(realAdmin, plan.id, {
      action: "withdraw",
      expectedVersion: 3,
      changeReason: "Invalidated",
    }),
    /保存失败/,
  );
  assert.equal(data.plans.get(plan.id).version, 3);
  assert.equal(data.plans.get(plan.id).status, "PUBLISHED");
  assert.equal(data.revisions.get(plan.id).length, 3);
});

test("note-only DB workflow persists private notes and generic audit labels without public leakage", async () => {
  const { repository, data } = repositoryHarness();
  const realAdmin = { ...admin, previewMode: false };
  const realMember = { ...member, previewMode: false };
  const plan = await repository.createPointPlan(realAdmin, noteOnlyBody);
  assert.equal(plan.rationale, body.rationale);
  assert.equal(plan.entryCondition, "");
  assert.equal(plan.invalidationCondition, "");
  assert.equal(data.revisions.get(plan.id)[0].reason, "创建计划");

  const revised = await repository.updatePointPlan(realAdmin, plan.id, {
    ...noteOnlyBody,
    expectedVersion: 1,
    rationale: "REVISED_PRIVATE_NOTE",
  });
  assert.equal(revised.version, 2);
  assert.equal(data.revisions.get(plan.id)[1].reason, "发布更新");
  assert.equal(data.revisions.get(plan.id)[0].snapshot.rationale, body.rationale);

  const publicList = await repository.getPointList(realMember);
  const publicDetail = await repository.getPointDetail(realMember, plan.id);
  assert.equal(
    publicList.items[0].publicSummary,
    "点位计划详情仅向 VIP 会员开放。",
  );
  for (const payload of [publicList, publicDetail]) {
    const serialized = JSON.stringify(payload);
    for (const secret of [
      body.rationale,
      "REVISED_PRIVATE_NOTE",
      "rationale",
      "direction",
      "entryPrice",
      "stopLoss",
      "takeProfit",
    ])
      assert.ok(!serialized.includes(secret), secret);
  }

  const withdrawn = await repository.updatePointPlan(realAdmin, plan.id, {
    action: "withdraw",
    expectedVersion: 2,
  });
  assert.equal(withdrawn.status, "WITHDRAWN");
  assert.equal(data.revisions.get(plan.id)[2].reason, "撤回计划");
  assert.equal(
    data.revisions.get(plan.id)[2].snapshot.rationale,
    "REVISED_PRIVATE_NOTE",
  );
});

test("admin mutations reject non-admin callers before I/O and unsupported products fail closed", async () => {
  const harness = repositoryHarness();
  await assert.rejects(
    harness.repository.createPointPlan({ ...vip, previewMode: false }, body),
    /仅管理员/,
  );
  assert.deepEqual(harness.counts(), { databaseCalls: 0, providerCalls: 0 });
  await assert.rejects(
    harness.repository.createPointPlan(
      { ...admin, previewMode: false },
      { ...body, symbol: "FAKEUSDT", confirmedSymbol: "FAKEUSDT" },
    ),
    /当前可交易/,
  );
  assert.equal(harness.data.plans.size, 0);
});

test("draft product reconfirmation is enforced before provider calls or database writes", async () => {
  const harness = repositoryHarness();
  const realAdmin = { ...admin, previewMode: false };
  const initial = await harness.repository.createPointPlan(realAdmin, {
    ...body,
    action: "draft",
  });
  const providerCallsBefore = harness.counts().providerCalls;
  for (const confirmedSymbol of [undefined, "BTCUSDT"]) {
    await assert.rejects(
      harness.repository.updatePointPlan(realAdmin, initial.id, {
        ...body,
        action: "draft",
        symbol: "ETHUSDT",
        confirmedSymbol,
        expectedVersion: 1,
      }),
      /重新确认/,
    );
  }
  assert.equal(harness.counts().providerCalls, providerCallsBefore);
  assert.equal(harness.data.plans.get(initial.id).version, 1);
  assert.equal(harness.data.plans.get(initial.id).symbol, "BTCUSDT");
  assert.equal(harness.data.revisions.get(initial.id).length, 1);
  const revised = await harness.repository.updatePointPlan(
    realAdmin,
    initial.id,
    {
      ...body,
      action: "draft",
      symbol: "ETHUSDT",
      confirmedSymbol: "ETHUSDT",
      expectedVersion: 1,
    },
  );
  assert.equal(revised.instrument.symbol, "ETHUSDT");
  assert.equal(revised.version, 2);
  assert.equal(
    harness.data.revisions.get(initial.id)[0].snapshot.instrument.symbol,
    "BTCUSDT",
  );
});

test("initial null publication reference stays null when later revisions have fresh quotes", async () => {
  const { repository, data, setQuotePrice } = repositoryHarness();
  const realAdmin = { ...admin, previewMode: false };
  const initial = await repository.createPointPlan(realAdmin, body);
  assert.equal(initial.publishedReferencePrice, null);
  setQuotePrice("108");
  const revised = await repository.updatePointPlan(realAdmin, initial.id, {
    ...body,
    expectedVersion: 1,
    takeProfit: "130",
  });
  assert.equal(revised.publishedAt, initial.publishedAt);
  assert.equal(revised.publishedReferencePrice, null);
  assert.equal(
    data.plans.get(initial.id).snapshot.publishedReferencePrice,
    null,
  );
  assert.deepEqual(
    data.revisions
      .get(initial.id)
      .map((revision) => revision.snapshot.publishedReferencePrice),
    [null, null],
  );
});

test("first published reference survives new prices and quote failures across later revisions", async () => {
  const { repository, data, setQuotePrice } = repositoryHarness();
  const realAdmin = { ...admin, previewMode: false };
  const draft = await repository.createPointPlan(realAdmin, {
    ...body,
    action: "draft",
  });
  setQuotePrice("105");
  const initial = await repository.updatePointPlan(realAdmin, draft.id, {
    ...body,
    expectedVersion: 1,
  });
  assert.equal(initial.publishedReferencePrice, "105");
  setQuotePrice("108");
  const revised = await repository.updatePointPlan(realAdmin, draft.id, {
    ...body,
    expectedVersion: 2,
    takeProfit: "130",
  });
  assert.equal(revised.publishedReferencePrice, "105");
  setQuotePrice(null);
  const latest = await repository.updatePointPlan(realAdmin, draft.id, {
    ...body,
    expectedVersion: 3,
    takeProfit: "140",
  });
  assert.equal(latest.publishedReferencePrice, "105");
  assert.equal(latest.publishedAt, initial.publishedAt);
  assert.deepEqual(
    data.revisions
      .get(draft.id)
      .map((revision) => revision.snapshot.publishedReferencePrice),
    [null, "105", "105", "105"],
  );
});

function storeQueryFixture(harness, plan) {
  harness.data.plans.set(plan.id, {
    id: plan.id,
    symbol: plan.instrument.symbol,
    category: plan.instrument.category,
    status: plan.status,
    version: plan.version,
    snapshot: structuredClone(plan),
    publishedAt: plan.publishedAt ? new Date(plan.publishedAt) : null,
    validFrom: new Date(plan.validFrom),
    validUntil: new Date(plan.validUntil),
    createdAt: new Date(plan.createdAt),
    updatedAt: new Date(plan.updatedAt),
  });
}

function queryFixtures(harness, count = 40) {
  const templates = [...preview.createPointPreviewStore(now).plans.values()];
  return Array.from({ length: count }, (_, index) => {
    const timestamp = new Date(now - index * 60000).toISOString();
    const plan = {
      ...templates[index % templates.length],
      id: `persisted-${String(index).padStart(3, "0")}`,
      publishedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      rationale: "SECRET_RATIONALE",
    };
    storeQueryFixture(harness, plan);
    return plan;
  });
}

test("database preview and preview detail read at most the fixed three snapshots with no count or user filters", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness);
  const realMember = { ...member, previewMode: false };
  const response = await harness.repository.getPointList(realMember, {
    scope: "all",
    category: "EQUITY",
    direction: "SHORT",
    q: "SECRET",
    page: 100,
  });
  assert.deepEqual(
    response.items.map((plan) => plan.id),
    plans.slice(0, 3).map((plan) => plan.id),
  );
  assert.equal(response.total, 3);
  assert.ok(!JSON.stringify(response).includes("SECRET_RATIONALE"));
  assert.equal(harness.queries.length, 1);
  assert.equal(harness.queries[0].method, "findMany");
  assert.equal(harness.queries[0].args.take, 3);
  assert.equal(harness.queries[0].args.skip, undefined);
  assert.equal(harness.queries[0].args.where.OR, undefined);
  assert.equal(harness.queries[0].args.where.category, undefined);
  assert.equal(harness.queries[0].args.where.snapshot, undefined);
  assert.equal(
    await harness.repository.getPointDetail(realMember, plans[3].id),
    null,
  );
  assert.ok(
    harness.queries.every(
      (query) => query.method === "findMany" && query.args.take === 3,
    ),
  );
});

test("database VIP feed counts matching records and applies native take/skip, status/time/category/name filters", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness, 32);
  const realVip = { ...vip, previewMode: false };
  const page = await harness.repository.getPointList(realVip, {
    scope: "all",
    page: 2,
  });
  assert.equal(page.total, 32);
  assert.equal(page.page, 2);
  assert.deepEqual(
    page.items.map((plan) => plan.id),
    plans.slice(12, 24).map((plan) => plan.id),
  );
  assert.equal(harness.queries[0].method, "count");
  assert.equal(harness.queries[1].args.take, 12);
  assert.equal(harness.queries[1].args.skip, 12);
  const clamped = await harness.repository.getPointList(realVip, {
    scope: "all",
    page: 99,
  });
  assert.equal(clamped.page, 3);
  assert.equal(clamped.items.length, 8);
  storeQueryFixture(harness, {
    ...plans[1],
    status: "DRAFT",
    publishedAt: null,
  });
  storeQueryFixture(harness, { ...plans[2], status: "WITHDRAWN" });
  storeQueryFixture(harness, { ...plans[3], status: "CLOSED" });
  storeQueryFixture(harness, {
    ...plans[4],
    validUntil: new Date(now - 1).toISOString(),
  });
  storeQueryFixture(harness, {
    ...plans[5],
    validFrom: new Date(now + 86400000).toISOString(),
  });
  const active = await harness.repository.getPointList(realVip, {
    scope: "active",
  });
  assert.equal(active.total, 27);
  assert.ok(
    !active.items.some((plan) =>
      plans.slice(1, 6).some((excluded) => excluded.id === plan.id),
    ),
  );
  const named = await harness.repository.getPointList(realVip, {
    scope: "all",
    category: "EQUITY",
    q: "micron",
  });
  assert.equal(named.total, 8);
  assert.ok(named.items.every((plan) => plan.instrument.symbol === "MUUSDT"));
  assert.equal(
    (
      await harness.repository.getPointList(realVip, {
        scope: "all",
        q: "SECRET_RATIONALE",
      })
    ).total,
    0,
  );
  assert.ok(
    harness.queries
      .filter((query) => query.method === "findMany")
      .every((query) => query.args.take === 12),
  );
});

test("database detail fetches one ID, same-plan revision history and at most four related records", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness);
  const detail = await harness.repository.getPointDetail(
    { ...vip, previewMode: false },
    plans[0].id,
  );
  assert.equal(detail.plan.id, plans[0].id);
  assert.deepEqual(
    detail.related.map((plan) => plan.id),
    [4, 8, 12, 16].map((index) => plans[index].id),
  );
  assert.deepEqual(harness.queries[0].args.where, { id: plans[0].id });
  assert.equal(harness.queries[0].method, "findUnique");
  const relatedQuery = harness.queries.find(
    (query) => query.model === "pointPlan" && query.method === "findMany",
  );
  assert.equal(relatedQuery.args.take, 4);
  assert.equal(relatedQuery.args.where.symbol, "BTCUSDT");
  assert.deepEqual(relatedQuery.args.where.id, { not: plans[0].id });
  const historyQuery = harness.queries.find(
    (query) => query.model === "pointRevision",
  );
  assert.equal(historyQuery.args.where.planId, plans[0].id);
  assert.deepEqual(historyQuery.args.where.action.in, [
    "PUBLISHED",
    "WITHDRAWN",
    "CLOSED",
  ]);
  assert.equal(harness.queries.length, 3);
});

test("database direction uses JSON equality before count and pagination alongside name and time filters", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness, 64);
  storeQueryFixture(harness, {
    ...plans[3],
    validUntil: new Date(now - 1).toISOString(),
  });
  storeQueryFixture(harness, { ...plans[7], status: "CLOSED" });
  const options = {
    scope: "active",
    category: "EQUITY",
    direction: "SHORT",
    q: "intel",
    page: 2,
  };
  const result = await harness.repository.getPointList(
    { ...vip, previewMode: false },
    options,
  );
  assert.equal(result.total, 14);
  assert.equal(result.page, 2);
  assert.deepEqual(
    result.items.map((plan) => plan.id),
    [plans[59].id, plans[63].id],
  );
  const [countQuery, pageQuery] = harness.queries;
  assert.equal(countQuery.method, "count");
  assert.deepEqual(countQuery.args.where.snapshot, {
    path: ["direction"],
    equals: "SHORT",
  });
  assert.deepEqual(pageQuery.args.where, countQuery.args.where);
  assert.equal(pageQuery.args.skip, 12);
  assert.equal(pageQuery.args.take, 12);
  assert.equal(pageQuery.args.where.category, "EQUITY");
  assert.equal(pageQuery.args.where.status, "PUBLISHED");
  assert.equal(pageQuery.args.where.OR[1].snapshot.string_contains, "intel");
  const long = await harness.repository.getPointList(
    { ...vip, previewMode: false },
    {
      ...options,
      direction: "LONG",
      q: "micron",
    },
  );
  assert.equal(long.total, 16);
  assert.equal(long.items.length, 4);
  assert.ok(long.items.every((plan) => plan.direction === "LONG"));
});

test("HTTP list accepts exact LONG/SHORT direction and invalid direction defaults to all", async () => {
  const harness = repositoryHarness();
  queryFixtures(harness, 64);
  harness.setUser({ id: "signed-in", role: "USER", membershipTier: "VIP" });
  const route = harness.route("point");
  for (const [direction, total, expectedDirection] of [
    ["LONG", 48, "LONG"],
    ["SHORT", 16, "SHORT"],
    ["ALL", 64, null],
    ["short", 64, null],
    ["INVALID", 64, null],
    ["", 64, null],
  ]) {
    const request = new Request(
      `https://wise.example/api/point?scope=all&direction=${direction}`,
    );
    Object.defineProperty(request, "nextUrl", { value: new URL(request.url) });
    const response = await route.GET(request);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const result = await response.json();
    assert.equal(result.total, total, direction);
    if (expectedDirection)
      assert.ok(
        result.items.every((plan) => plan.direction === expectedDirection),
      );
  }
});

test("quote allowlist uses database-side symbol grouping, while admin retains every record", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness);
  storeQueryFixture(harness, {
    ...plans[0],
    id: "private-draft",
    status: "DRAFT",
    publishedAt: null,
    instrument: { ...plans[0].instrument, symbol: "ONLYDRAFTUSDT" },
  });
  const symbols = await harness.repository.getPointQuoteSymbols({
    ...vip,
    previewMode: false,
  });
  assert.deepEqual(symbols.sort(), [
    "BTCUSDT",
    "ETHUSDT",
    "INTCUSDT",
    "MUUSDT",
  ]);
  assert.equal(harness.queries.length, 1);
  assert.equal(harness.queries[0].method, "groupBy");
  assert.deepEqual(harness.queries[0].args.by, ["symbol"]);
  assert.equal(harness.queries[0].args.select, undefined);
  const managed = await harness.repository.listPointAdmin({
    ...admin,
    previewMode: false,
  });
  assert.equal(managed.items.length, 41);
  assert.ok(managed.items.some((plan) => plan.id === "private-draft"));
  assert.equal(harness.queries[1].args.take, undefined);
});

test("HTTP read routes never serialize VIP fields for MEMBERs and direct hidden IDs stay 404", async () => {
  const harness = repositoryHarness();
  const plans = queryFixtures(harness);
  const request = new Request(
    "https://wise.example/api/point?scope=all&q=SECRET&page=100&direction=SHORT",
  );
  Object.defineProperty(request, "nextUrl", { value: new URL(request.url) });
  const response = await harness.route("point").GET(request);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const result = await response.json();
  assert.equal(result.access, "preview");
  assert.deepEqual(
    result.items.map((item) => item.id),
    plans.slice(0, 3).map((item) => item.id),
  );
  for (const secret of [
    "entryPrice",
    "stopLoss",
    "takeProfit",
    "direction",
    "SECRET_RATIONALE",
    "revisions",
  ])
    assert.ok(!JSON.stringify(result).includes(secret), secret);
  const detailRoute = harness.route("point/[id]");
  const hidden = await detailRoute.GET(request, {
    params: Promise.resolve({ id: plans[3].id }),
  });
  assert.equal(hidden.status, 404);
  assert.equal(hidden.headers.get("cache-control"), "private, no-store");
  const allowed = await detailRoute.GET(request, {
    params: Promise.resolve({ id: plans[0].id }),
  });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).access, "preview");
});

test("HTTP admin routes reject ordinary users and CSRF before mutating persisted plans", async () => {
  const harness = repositoryHarness();
  const route = harness.route("admin/point");
  const request = (origin = "https://wise.example", content = body) =>
    new Request("https://wise.example/api/admin/point", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(content),
    });
  assert.equal((await route.GET()).status, 403);
  assert.equal((await route.POST(request())).status, 403);
  assert.equal(harness.data.plans.size, 0);
  assert.equal(harness.counts().providerCalls, 0);
  harness.setUser({
    id: "signed-in",
    role: "ADMIN",
    membershipTier: "VIP_PLUS",
  });
  const beforeCsrf = harness.counts();
  assert.equal((await route.POST(request("https://evil.example"))).status, 403);
  assert.deepEqual(harness.counts(), beforeCsrf);
  const published = await route.POST(request());
  assert.equal(published.status, 201);
  const { plan } = await published.json();
  const patch = harness.route("admin/point/[id]");
  const context = { params: Promise.resolve({ id: plan.id }) };
  const revised = await patch.PATCH(
    request("https://wise.example", {
      ...body,
      expectedVersion: 1,
      takeProfit: "130",
    }),
    context,
  );
  assert.equal(revised.status, 200);
  const conflict = await patch.PATCH(
    request("https://wise.example", {
      ...body,
      expectedVersion: 1,
      takeProfit: "140",
    }),
    context,
  );
  assert.equal(conflict.status, 409);
  assert.equal(harness.data.plans.get(plan.id).version, 2);
  assert.equal(harness.data.revisions.get(plan.id).length, 2);
  harness.setUser({ id: "signed-in", role: "USER", membershipTier: "VIP" });
  const denied = await patch.PATCH(
    request("https://wise.example", {
      action: "close",
      expectedVersion: 2,
      changeReason: "forbidden",
    }),
    context,
  );
  assert.equal(denied.status, 403);
  assert.equal(harness.data.plans.get(plan.id).status, "PUBLISHED");
});
