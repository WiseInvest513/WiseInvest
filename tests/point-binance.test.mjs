import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EventEmitter, getEventListeners } from "node:events";
import test from "node:test";
import {
  createBinancePointService,
  createBinancePointTransport,
  POINT_QUOTE_TTL,
  isPointBinanceSymbol,
} from "../lib/point/binance.ts";

const CATALOG_URL = "https://fapi.binance.com/fapi/v1/exchangeInfo";
const PROXY_ENV = { POINT_HTTPS_PROXY: "http://127.0.0.1:7897" };

function proxyHarness({
  status = 200,
  headers = { "content-type": "application/json" },
  chunks = [Buffer.from('{"symbols":[]}')],
  error = false,
  responseError = false,
  hang = false,
} = {}) {
  const calls = [];
  const request = (url, options, callback) => {
    const req = new EventEmitter();
    req.destroyed = false;
    req.destroy = () => { req.destroyed = true; };
    req.end = () => queueMicrotask(() => {
      if (error) { req.emit("error", new Error("socket failure")); return; }
      const res = new EventEmitter();
      Object.assign(res, { headers, statusCode: status, destroyed: false });
      res.destroy = () => { res.destroyed = true; };
      calls.at(-1).response = res;
      callback(res);
      if (hang) return;
      if (responseError) { res.emit("error", new Error("stream failure")); return; }
      chunks.forEach((chunk) => res.emit("data", chunk));
      res.emit("end");
    });
    calls.push({ url, options, req });
    return req;
  };
  return { request, calls };
}

test("Binance transport defaults to native fetch without silently choosing localhost", async () => {
  const calls = [];
  const transport = createBinancePointTransport({
    env: { ALL_PROXY: "socks5://127.0.0.1:7897" },
    fetch: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ symbols: [] });
    },
    request: () => { throw new Error("proxy must not be used"); },
  });
  const controller = new AbortController();
  const response = await transport(CATALOG_URL, {
    method: "GET", cache: "no-store", signal: controller.signal,
  });
  assert.deepEqual(await response.json(), { symbols: [] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.signal, controller.signal);
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
});

test("proxy transport honors explicit and standard environment selection, retaining TLS validation", async () => {
  const cases = [
    [PROXY_ENV, "http://127.0.0.1:7897/"],
    [{ https_proxy: "https://proxy.example:8443" }, "https://proxy.example:8443/"],
    [{ HTTPS_PROXY: "http://upper.example:8080" }, "http://upper.example:8080/"],
    [{ http_proxy: "http://lower.example:8080" }, "http://lower.example:8080/"],
    [{ HTTP_PROXY: "http://http.example:8080" }, "http://http.example:8080/"],
    [{ ...PROXY_ENV, HTTPS_PROXY: "http://ignored.example:8080" }, "http://127.0.0.1:7897/"],
  ];
  for (const [env, expected] of cases) {
    const h = proxyHarness();
    const transport = createBinancePointTransport({
      env, request: h.request,
      fetch: () => { throw new Error("native fetch must not be used"); },
    });
    const response = await transport(CATALOG_URL, { method: "GET" });
    assert.equal(response.status, 200);
    assert.equal(h.calls[0].options.agent.proxy.href, expected);
    assert.notEqual(h.calls[0].options.rejectUnauthorized, false);
    assert.notEqual(h.calls[0].options.agent.options.rejectUnauthorized, false);
    assert.equal(h.calls[0].options.headers["accept-encoding"], "identity");
  }
});

test("transport rejects unapproved origins, paths, queries and write methods before I/O", async () => {
  const transport = createBinancePointTransport({
    env: {}, fetch: () => { throw new Error("no network expected"); },
  });
  for (const url of [
    "http://fapi.binance.com/fapi/v1/exchangeInfo",
    "https://fapi.binance.com.evil.test/fapi/v1/exchangeInfo",
    "https://fapi.binance.com/fapi/v1/order",
    `${CATALOG_URL}?url=https://evil.test`,
    `${CATALOG_URL}#fragment`,
    "https://user:password@fapi.binance.com/fapi/v1/exchangeInfo",
  ]) await assert.rejects(transport(url, {}), /Unsupported Binance/);
  await assert.rejects(transport(CATALOG_URL, { method: "POST" }), /Unsupported Binance/);
  await assert.rejects(transport(CATALOG_URL, { body: "{}" }), /Unsupported Binance/);
});

test("malformed proxy configuration fails closed and never exposes credentials", async () => {
  for (const value of [
    "socks5://user:secret@proxy.example:1234",
    "http://user:secret@proxy.example/path",
    "http://user:secret@proxy.example/?key=secret",
    "not-a-url-secret",
  ]) {
    const transport = createBinancePointTransport({
      env: { POINT_HTTPS_PROXY: value },
      fetch: () => { throw new Error("native fallback must not run"); },
    });
    await assert.rejects(transport(CATALOG_URL, {}), (error) => {
      assert.equal(error.message, "Invalid Binance HTTPS proxy configuration");
      assert.ok(!error.message.includes("secret"));
      return true;
    });
  }
});

test("proxy keeps HTTP failure status and Retry-After without following redirects", async () => {
  for (const status of [302, 418, 429, 503]) {
    const h = proxyHarness({ status, headers: {
      "retry-after": "120", location: "https://evil.test", "set-cookie": ["a=1", "b=2"],
    } });
    const transport = createBinancePointTransport({ env: PROXY_ENV, request: h.request });
    const response = await transport(CATALOG_URL, {});
    assert.equal(response.status, status);
    assert.equal(response.headers.get("retry-after"), "120");
    assert.equal(h.calls.length, 1);
  }
});

test("native and proxy responses are bounded to 4 MiB", async () => {
  const oversized = Buffer.alloc(4 * 1024 * 1024 + 1, "x");
  const native = createBinancePointTransport({
    env: {}, fetch: async () => new Response(oversized),
  });
  await assert.rejects(native(CATALOG_URL, {}), /size limit/);
  const h = proxyHarness({ chunks: [oversized] });
  const proxied = createBinancePointTransport({ env: PROXY_ENV, request: h.request });
  await assert.rejects(proxied(CATALOG_URL, {}), /size limit/);
  assert.equal(h.calls[0].req.destroyed, true);
  assert.equal(h.calls[0].response.destroyed, true);
});

test("proxy request and response stream errors fail safely", async () => {
  for (const failure of [{ error: true }, { responseError: true }]) {
    const h = proxyHarness(failure);
    const transport = createBinancePointTransport({ env: PROXY_ENV, request: h.request });
    await assert.rejects(transport(CATALOG_URL, {}), /Binance proxy request failed/);
    assert.equal(h.calls[0].req.destroyed, true);
  }
});

test("proxy aborts promptly, destroys request/response and removes abort listener", async () => {
  const h = proxyHarness({ hang: true });
  const transport = createBinancePointTransport({ env: PROXY_ENV, request: h.request });
  const controller = new AbortController();
  const promise = transport(CATALOG_URL, { signal: controller.signal });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(h.calls[0].options.agent.connectOpts.signal, controller.signal);
  controller.abort();
  await assert.rejects(promise, { name: "AbortError" });
  assert.equal(h.calls[0].req.destroyed, true);
  assert.equal(h.calls[0].response.destroyed, true);
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
  await assert.rejects(transport(CATALOG_URL, { signal: controller.signal }), { name: "AbortError" });
  assert.equal(h.calls.length, 1, "already aborted signals never reach network");
});

test("service timeout also covers a proxy response that never completes", async () => {
  const h = proxyHarness({ hang: true });
  const service = createBinancePointService({
    fetch: createBinancePointTransport({ env: PROXY_ENV, request: h.request }),
    timeoutMs: 5,
  });
  assert.equal((await service.searchBinanceInstruments("BTC")).unavailable, true);
  assert.equal(h.calls[0].req.destroyed, true);
  assert.equal(h.calls[0].response.destroyed, true);
});

const START = Date.parse("2026-09-20T10:00:00.000Z");
const instrument = (symbol, overrides = {}) => ({
  symbol,
  baseAsset: symbol.replace(/USDT$/, ""),
  quoteAsset: "USDT",
  marginAsset: "USDT",
  contractType: "PERPETUAL",
  status: "TRADING",
  underlyingType: "COIN",
  pricePrecision: 8,
  filters: [{ filterType: "PRICE_FILTER", tickSize: "0.10" }],
  ...overrides,
});
const fixtures = [
  instrument("BTCUSDT"),
  instrument("ETHUSDT"),
  instrument("MUUSDT", {
    contractType: "TRADIFI_PERPETUAL",
    underlyingType: "TRADIFI",
    underlyingSubType: ["STOCK"],
  }),
  instrument("INTCUSDT", {
    contractType: "TRADIFI_PERPETUAL",
    underlyingType: "TRADIFI",
  }),
  instrument("UNKNOWNUSDT", { underlyingType: "STOCK" }),
  instrument("XAUUSDT", {
    contractType: "TRADIFI_PERPETUAL",
    underlyingType: "COMMODITY",
  }),
  instrument("HALTEDUSDT", { status: "PENDING_TRADING" }),
  instrument("QUARTERUSDT", { contractType: "CURRENT_QUARTER" }),
];

function harness() {
  let time = START;
  let exchange = fixtures;
  let prices = [
    {
      symbol: "BTCUSDT",
      price: "67200.123456789012345678",
      time: START - 10_000,
    },
    { symbol: "MUUSDT", price: "151.2300", time: START - 1_000 },
  ];
  let status = 200;
  let retryAfter = null;
  const calls = [];
  const service = createBinancePointService({
    now: () => time,
    fetch: async (url, init) => {
      calls.push({ url, init });
      assert.equal(init.method, "GET");
      assert.equal(init.cache, "no-store");
      assert.ok(init.signal);
      if (status !== 200)
        return new Response("{}", {
          status,
          headers: retryAfter ? { "retry-after": retryAfter } : {},
        });
      return Response.json(
        url.endsWith("/exchangeInfo") ? { symbols: exchange } : prices,
      );
    },
  });
  return {
    service,
    calls,
    setTime: (value) => (time = value),
    setExchange: (value) => (exchange = value),
    setPrices: (value) => (prices = value),
    setStatus: (value, retry = null) => {
      status = value;
      retryAfter = retry;
    },
  };
}

test("verified stock names enrich actual perpetual catalog; unknown names stay explicitly unverified", async () => {
  const h = harness();
  const result = await h.service.searchBinanceInstruments("", "EQUITY");
  assert.equal(result.unavailable, false);
  assert.deepEqual(
    result.items.map((i) => i.symbol),
    ["INTCUSDT", "MUUSDT", "UNKNOWNUSDT"],
  );
  assert.match(result.items.find((i) => i.symbol === "MUUSDT").name, /Micron/);
  assert.match(
    result.items.find((i) => i.symbol === "INTCUSDT").sourceUrl,
    /d592f6ba/,
  );
  assert.equal(
    result.items.find((i) => i.symbol === "UNKNOWNUSDT").name,
    "UNKNOWN（全称待核验）",
  );
  const all = await h.service.searchBinanceInstruments("");
  assert.equal(all.items.find((i) => i.symbol === "XAUUSDT").category, "OTHER");
  assert.equal(
    all.items.some(
      (i) => i.symbol === "QUARTERUSDT" || i.symbol === "HALTEDUSDT",
    ),
    false,
  );
  assert.equal(
    (await h.service.getBinanceInstrument("BTCUSDT")).tickSize,
    "0.10",
    "PRICE_FILTER, never pricePrecision",
  );
  assert.equal(h.calls.length, 1);
});

test("registered names never invent missing symbols and lookup revalidates trading status", async () => {
  const h = harness();
  h.setExchange([instrument("BTCUSDT")]);
  await assert.rejects(h.service.getBinanceInstrument("MUUSDT"), {
    code: "UNSUPPORTED_INSTRUMENT",
  });
  await h.service.getBinanceInstrument("BTCUSDT");
  h.setTime(START + 60_001);
  h.setExchange([instrument("BTCUSDT", { status: "BREAK" })]);
  await assert.rejects(h.service.getBinanceInstrument("BTCUSDT"), {
    code: "UNSUPPORTED_INSTRUMENT",
  });
  assert.equal(h.calls.length, 2);
});

test("parallel batch queries deduplicate, preserve decimal string and distinguish source/fetch time", async () => {
  const h = harness();
  const [first, second] = await Promise.all([
    h.service.getBinanceQuotes(["MUUSDT", "BTCUSDT"]),
    h.service.getBinanceQuotes(["BTCUSDT", "ETHUSDT"]),
  ]);
  assert.equal(
    h.calls.filter((c) => c.url.endsWith("/exchangeInfo")).length,
    1,
  );
  assert.equal(
    h.calls.filter((c) => c.url.endsWith("/fapi/v2/ticker/price")).length,
    1,
  );
  assert.deepEqual(
    first.map((q) => q.symbol),
    ["MUUSDT", "BTCUSDT"],
  );
  assert.equal(first[1].price, "67200.123456789012345678");
  assert.equal(first[1].sourceTime, new Date(START - 10_000).toISOString());
  assert.equal(first[1].fetchedAt, new Date(START).toISOString());
  assert.equal(
    first[0].status,
    "fresh",
    "equity perpetual quotes work on this Sunday; no US equity session inference",
  );
  assert.equal(second[1].status, "unavailable");
  assert.equal(second[1].price, null);
  h.setTime(START + 30_000);
  await h.service.getBinanceQuotes(["BTCUSDT"]);
  assert.equal(h.calls.length, 2);
});

test("old source timestamps are stale even on a freshly fetched response", async () => {
  const h = harness();
  h.setPrices([
    { symbol: "BTCUSDT", price: "1.0100", time: START - POINT_QUOTE_TTL - 1 },
  ]);
  const [quote] = await h.service.getBinanceQuotes(["BTCUSDT"]);
  assert.equal(quote.status, "stale");
  assert.equal(quote.price, "1.0100");
  assert.equal(quote.fetchedAt, new Date(START).toISOString());
});

test("cached quote expires on source age even before server refresh interval", async () => {
  const h = harness();
  await h.service.getBinanceQuotes(["BTCUSDT"]);
  h.setTime(START + POINT_QUOTE_TTL - 5_000);
  assert.equal(
    (await h.service.getBinanceQuotes(["BTCUSDT"]))[0].status,
    "stale",
  );
  assert.equal(h.calls.length, 2);
});

test("source outage retains old timestamps and price as stale, never creates a price", async () => {
  const h = harness();
  await h.service.getBinanceQuotes(["BTCUSDT"]);
  h.setTime(START + POINT_QUOTE_TTL + 1);
  h.setStatus(503);
  const [cached, absent] = await h.service.getBinanceQuotes([
    "BTCUSDT",
    "ETHUSDT",
  ]);
  assert.equal(cached.status, "stale");
  assert.equal(cached.fetchedAt, new Date(START).toISOString());
  assert.equal(absent.status, "unavailable");
  assert.equal(absent.price, null);
  const count = h.calls.length;
  await h.service.getBinanceQuotes(["BTCUSDT"]);
  assert.equal(
    h.calls.length,
    count,
    "failed upstream request has retry backoff",
  );
  h.setTime(START + 25 * 60 * 60_000);
  assert.equal((await h.service.getBinanceQuotes(["BTCUSDT"]))[0].price, null);
});

test("fresh catalog outage is unavailable and never serves a mock or stale instrument picker", async () => {
  const h = harness();
  await h.service.searchBinanceInstruments("BTC");
  h.setTime(START + 16 * 60_000);
  h.setStatus(500);
  const result = await h.service.searchBinanceInstruments("BTC");
  assert.deepEqual(result.items, []);
  assert.equal(result.unavailable, true);
  await assert.rejects(h.service.getBinanceInstrument("BTCUSDT"), {
    code: "UPSTREAM_UNAVAILABLE",
  });
});

test("HTTP 200 with an unusable catalog backs off exponentially until validated recovery", async () => {
  for (const unusable of [[], [{ symbol: "BTCUSDT" }]]) {
    const h = harness();
    h.setExchange(unusable);
    assert.equal(
      (await h.service.searchBinanceInstruments("BTC")).unavailable,
      true,
    );
    await h.service.searchBinanceInstruments("BTC");
    assert.equal(
      h.calls.length,
      1,
      "invalid JSON shape must not cause request storms",
    );
    h.setTime(START + 5_000);
    await h.service.searchBinanceInstruments("BTC");
    assert.equal(h.calls.length, 2);
    h.setExchange(fixtures);
    h.setTime(START + 14_999);
    assert.equal(
      (await h.service.searchBinanceInstruments("BTC")).unavailable,
      true,
    );
    assert.equal(
      h.calls.length,
      2,
      "a second malformed payload preserves the larger retry window",
    );
    h.setTime(START + 15_000);
    assert.equal(
      (await h.service.searchBinanceInstruments("BTC")).unavailable,
      false,
    );
    assert.equal(h.calls.length, 3);

    h.setTime(START + 16 * 60_000);
    h.setExchange(unusable);
    await h.service.searchBinanceInstruments("BTC");
    h.setExchange(fixtures);
    h.setTime(START + 16 * 60_000 + 5_000);
    assert.equal(
      (await h.service.searchBinanceInstruments("BTC")).unavailable,
      false,
      "a validated recovery resets failure count",
    );
  }
});

test("unusable ticker batches retain prior data and can recover after backoff, not five minutes", async () => {
  for (const unusable of [
    [],
    {},
    [{ symbol: "BTCUSDT", price: "NaN", time: START }],
  ]) {
    const h = harness();
    const [original] = await h.service.getBinanceQuotes(["BTCUSDT"]);
    const failedAt = START + POINT_QUOTE_TTL + 1;
    h.setTime(failedAt);
    h.setPrices(unusable);
    const [failed] = await h.service.getBinanceQuotes(["BTCUSDT"]);
    assert.equal(failed.status, "stale");
    assert.equal(failed.price, original.price);
    assert.equal(failed.sourceTime, original.sourceTime);
    assert.equal(failed.fetchedAt, original.fetchedAt);
    const attempts = h.calls.length;
    await h.service.getBinanceQuotes(["BTCUSDT"]);
    assert.equal(h.calls.length, attempts);
    h.setTime(failedAt + 5_000);
    h.setPrices([
      { symbol: "BTCUSDT", price: "68000.01", time: failedAt + 4_000 },
    ]);
    const [recovered] = await h.service.getBinanceQuotes(["BTCUSDT"]);
    assert.equal(recovered.status, "fresh");
    assert.equal(recovered.price, "68000.01");
    assert.equal(h.calls.length, attempts + 1);
  }
});

test("duplicate ticker rows cannot roll back a newer row within the same response", async () => {
  const h = harness();
  h.setPrices([
    { symbol: "BTCUSDT", price: "68000", time: START - 1_000 },
    { symbol: "BTCUSDT", price: "67000", time: START - 10_000 },
  ]);
  const [result] = await h.service.getBinanceQuotes(["BTCUSDT"]);
  assert.equal(result.price, "68000");
  assert.equal(result.sourceTime, new Date(START - 1_000).toISOString());
});

test("missing/regressing rows retain only a clearly stale last value", async () => {
  const h = harness();
  await h.service.getBinanceQuotes(["BTCUSDT", "MUUSDT"]);
  h.setTime(START + POINT_QUOTE_TTL + 1);
  h.setPrices([{ symbol: "BTCUSDT", price: "3", time: START - 20_000 }]);
  const result = await h.service.getBinanceQuotes(["BTCUSDT", "MUUSDT"]);
  assert.ok(result.every((q) => q.status === "stale"));
  assert.equal(result[0].price, "67200.123456789012345678");
  assert.equal(result[1].price, "151.2300");
});

test("future, invalid, nonpositive and older-than-a-day prices are unavailable", async () => {
  for (const entry of [
    { price: "3.14", time: START + 1 },
    { price: "3.14", time: "1789900000000" },
    { price: "NaN", time: START },
    { price: "0.00", time: START },
    { price: 123, time: START },
    { price: "-1", time: START },
    { price: "1e3", time: START },
    { price: "1.0", time: START - 25 * 60 * 60_000 },
  ]) {
    const h = harness();
    h.setPrices([{ symbol: "BTCUSDT", ...entry }]);
    const [q] = await h.service.getBinanceQuotes(["BTCUSDT"]);
    assert.equal(q.status, "unavailable", JSON.stringify(entry));
    assert.equal(q.price, null);
  }
});

test("429 Retry-After protects both endpoints until the server-directed retry time", async () => {
  const h = harness();
  h.setStatus(429, "120");
  assert.equal(
    (await h.service.searchBinanceInstruments("BTC")).unavailable,
    true,
  );
  h.setTime(START + 61_000);
  h.setStatus(200);
  assert.equal(
    (await h.service.searchBinanceInstruments("BTC")).unavailable,
    true,
  );
  assert.equal(h.calls.length, 1);
  h.setTime(START + 120_001);
  assert.equal(
    (await h.service.searchBinanceInstruments("BTC")).unavailable,
    false,
  );
  assert.equal(h.calls.length, 2);
});

test("symbol injection and oversized batches are rejected before any source request", async () => {
  const h = harness();
  for (const bad of [
    "btcusdt",
    "BTCUSDT&symbol=ETHUSDT",
    "../price",
    " BTCUSDT",
    "BTC_USDT",
    "MU",
    "",
  ]) {
    if (bad === "MU") {
      await assert.rejects(h.service.getBinanceInstrument(bad), {
        code: "UNSUPPORTED_INSTRUMENT",
      });
      continue;
    }
    assert.equal(isPointBinanceSymbol(bad), false);
    await assert.rejects(h.service.getBinanceQuotes([bad]), {
      code: "INVALID_SYMBOL",
    });
    await assert.rejects(h.service.getBinanceInstrument(bad), {
      code: "INVALID_SYMBOL",
    });
  }
  const before = h.calls.length;
  await assert.rejects(h.service.getBinanceQuotes(Array(51).fill("BTCUSDT")), {
    code: "INVALID_SYMBOL",
  });
  assert.equal(h.calls.length, before);
});

test("network abort bounds request duration and exposes unavailable state", async () => {
  const service = createBinancePointService({
    timeoutMs: 5,
    fetch: async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      }),
  });
  assert.equal((await service.searchBinanceInstruments("")).unavailable, true);
});

test("unsupported/absent symbols do not query the price endpoint", async () => {
  const h = harness();
  const result = await h.service.getBinanceQuotes([
    "HALTEDUSDT",
    "QUARTERUSDT",
    "NOTLISTEDUSDT",
  ]);
  assert.ok(
    result.every(
      (quote) => quote.price === null && quote.status === "unavailable",
    ),
  );
  assert.equal(h.calls.length, 1);
  assert.ok(h.calls[0].url.endsWith("/exchangeInfo"));
});

test("clock regression cannot mark cached source data fresh", async () => {
  const h = harness();
  await h.service.getBinanceQuotes(["BTCUSDT"]);
  h.setTime(START - 1_000);
  h.setStatus(503);
  const [quote] = await h.service.getBinanceQuotes(["BTCUSDT"]);
  assert.equal(quote.status, "unavailable");
  assert.equal(quote.price, null);
});

test("route contracts keep source access authenticated, allowlisted and private", () => {
  const read = (file) =>
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const quotes = read("app/api/point/quotes/route.ts");
  const instruments = read("app/api/admin/point/instruments/route.ts");
  assert.match(quotes, /viewer\.access !== "vip"/);
  assert.match(quotes, /getPointQuoteSymbols\(viewer\)/);
  assert.match(quotes, /symbols\.some\(symbol => !allowed\.has\(symbol\)\)/);
  assert.match(quotes, /symbols\.length > 50/);
  assert.match(quotes, /quotes, previewMode: viewer\.previewMode/);
  assert.match(instruments, /!viewer\.isAdmin \|\| !viewer\.userId/);
  for (const source of [quotes, instruments]) {
    assert.match(source, /private, no-store, max-age=0/);
    assert.match(source, /Vary: "Cookie, Authorization"/);
    assert.match(
      source,
      /viewer\.previewMode && process\.env\.NODE_ENV !== "production"/,
    );
    assert.ok(
      source.indexOf("await getPointViewer()") <
        source.indexOf("request.nextUrl.searchParams"),
    );
  }
});
