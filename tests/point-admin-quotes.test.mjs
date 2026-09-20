import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { isPointBinanceSymbol } from "../lib/point/binance.ts";
import { PointError, pointErrorResponse } from "../lib/point/errors.ts";

const source = ts.transpileModule(
  readFileSync(
    new URL("../app/api/admin/point/quotes/route.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const admin = {
  access: "vip",
  isAdmin: true,
  userId: "current-admin",
  previewMode: false,
};

function harness(initialViewer = admin) {
  let viewer = initialViewer;
  let authFailure;
  let providerFailure;
  let viewerCalls = 0;
  const providerCalls = [];
  const quotes = [
    {
      symbol: "BTCUSDT",
      price: "80123.45",
      sourceTime: "2026-09-20T12:00:00.000Z",
      fetchedAt: "2026-09-20T12:00:01.000Z",
      status: "fresh",
      source: "BINANCE_USD_M_LAST_PRICE",
    },
  ];
  const mocks = {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/point/auth": {
      getPointViewer: async () => {
        viewerCalls++;
        if (authFailure) throw authFailure;
        return viewer;
      },
    },
    "@/lib/point/binance": {
      isPointBinanceSymbol,
      getBinanceQuotes: async (...args) => {
        providerCalls.push(args);
        if (providerFailure) throw providerFailure;
        return quotes;
      },
    },
    "@/lib/point/errors": { pointErrorResponse },
  };
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => {
      assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency: ${name}`);
      return mocks[name];
    },
    loadedModule,
    loadedModule.exports,
  );
  return {
    route: loadedModule.exports,
    quotes,
    providerCalls,
    viewerCalls: () => viewerCalls,
    setViewer: (next) => (viewer = next),
    setAuthFailure: (error) => (authFailure = error),
    setProviderFailure: (error) => (providerFailure = error),
  };
}

function request(query = "symbols=BTCUSDT") {
  const value = new Request(`https://wise.example/api/admin/point/quotes?${query}`);
  Object.defineProperty(value, "nextUrl", { value: new URL(value.url) });
  return value;
}
function privateResponse(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("vary"), "Cookie, Authorization");
}

test("admin quotes reject anonymous, member, VIP and an admin without a user ID", async () => {
  for (const viewer of [
    { access: "preview", isAdmin: false, userId: null },
    { access: "preview", isAdmin: false, userId: "member" },
    { access: "vip", isAdmin: false, userId: "vip" },
    { access: "vip", isAdmin: true, userId: null },
    { access: "vip", isAdmin: true, userId: "" },
  ]) {
    const h = harness({ ...viewer, previewMode: false });
    const response = await h.route.GET(request());
    assert.equal(response.status, 403);
    privateResponse(response);
    assert.equal(h.providerCalls.length, 0);
    assert.equal(h.viewerCalls(), 1);
  }
});

test("admin quotes recheck current privileges on every request", async () => {
  const h = harness();
  assert.equal((await h.route.GET(request())).status, 200);
  h.setViewer({ ...admin, isAdmin: false });
  assert.equal((await h.route.GET(request())).status, 403);
  assert.equal(h.viewerCalls(), 2);
  assert.equal(h.providerCalls.length, 1);
});

test("admin quotes accept unpublished symbols, deduplicate and only call the fixed provider", async () => {
  const h = harness();
  const response = await h.route.GET(
    request("symbols=BTCUSDT,ONLYDRAFTUSDT,BTCUSDT&url=https://attacker.invalid/ticker"),
  );
  assert.equal(response.status, 200);
  privateResponse(response);
  assert.deepEqual(h.providerCalls, [[["BTCUSDT", "ONLYDRAFTUSDT"]]]);
  assert.deepEqual(await response.json(), { quotes: h.quotes });
  assert.equal(h.route.dynamic, "force-dynamic");
  assert.equal(h.route.runtime, "nodejs");
});

test("admin quotes use real provider data even when the plan store is in dev preview", async () => {
  const h = harness({ ...admin, previewMode: true });
  const response = await h.route.GET(request());
  assert.equal(response.status, 200);
  privateResponse(response);
  assert.deepEqual(h.providerCalls, [[["BTCUSDT"]]]);
  assert.deepEqual(await response.json(), { quotes: h.quotes });
});

test("admin quotes match public endpoint symbol and batch validation", async () => {
  const invalidQueries = [
    "symbols=BTCUSDT&symbols=ETHUSDT",
    "symbols=&symbols=BTCUSDT",
    "symbols=btcusdt",
    "symbols=BTCUSDT,",
    "symbols=BTCUSDT,,ETHUSDT",
    "symbols=A",
    `symbols=${"A".repeat(31)}`,
    `symbols=${encodeURIComponent("https://attacker.invalid")}`,
    `symbols=${encodeURIComponent("BTCUSDT/../../ticker")}`,
    "symbols=%20BTCUSDT",
    `symbols=${Array.from({ length: 51 }, (_, index) => `COIN${index}USDT`).join(",")}`,
  ];
  for (const query of invalidQueries) {
    const h = harness();
    const response = await h.route.GET(request(query));
    assert.equal(response.status, 400, query);
    privateResponse(response);
    assert.equal(h.providerCalls.length, 0, query);
  }
  const h = harness();
  const symbols = Array.from({ length: 50 }, (_, index) => `COIN${index}USDT`);
  assert.equal((await h.route.GET(request(`symbols=${symbols.join(",")}`))).status, 200);
  assert.deepEqual(h.providerCalls, [[symbols]]);
  for (const query of ["", "symbols="]) {
    assert.equal((await h.route.GET(request(query))).status, 200);
    assert.deepEqual(h.providerCalls.at(-1), [[]]);
  }
});

test("admin quote errors fail closed, retain privacy headers and hide internal details", async () => {
  for (const failAt of ["setAuthFailure", "setProviderFailure"]) {
    const h = harness();
    h[failAt](new Error("PRIVATE_PROVIDER_OR_AUTH_DETAIL"));
    const response = await h.route.GET(request());
    assert.equal(response.status, 503);
    privateResponse(response);
    assert.deepEqual(await response.json(), {
      message: "点位服务暂时不可用，请稍后重试。",
    });
    if (failAt === "setAuthFailure") assert.equal(h.providerCalls.length, 0);
  }
  const h = harness();
  h.setProviderFailure(new PointError(429, "请稍后再试。"));
  const response = await h.route.GET(request());
  assert.equal(response.status, 429);
  privateResponse(response);
  assert.deepEqual(await response.json(), { message: "请稍后再试。" });
});
