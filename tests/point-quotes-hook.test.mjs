import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as presentation from "../lib/point/presentation.ts";

const source = ts.transpileModule(
  readFileSync(new URL("../app/point/use-point-quotes.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
};
const quote = (price) => ({
  symbol: "BTCUSDT",
  price,
  sourceTime: new Date(Date.now() - 2000).toISOString(),
  fetchedAt: new Date(Date.now() - 1000).toISOString(),
  status: "fresh",
  source: "BINANCE_USD_M_LAST_PRICE",
});

// Run the actual hook and effect closures with React-compatible state/dependency
// semantics. Deferred JSON can still arrive after abort, as in the browser race.
function harness(initialOptions = {}) {
  let elapsed = 0;
  const started = Date.now();
  let options = { symbols: ["BTCUSDT"], enabled: true, ...initialOptions };
  let cursor = 0;
  let dirty = false;
  let output;
  let denied = 0;
  let timerId = 0;
  const slots = [];
  const effects = [];
  const requests = [];
  const timers = new Map();
  const listeners = new Map();
  const onDenied = () => denied++;
  const useState = (initial) => {
    const index = cursor++;
    if (!slots[index])
      slots[index] = {
        value: typeof initial === "function" ? initial() : initial,
      };
    return [slots[index].value, (value) => {
      const next = typeof value === "function" ? value(slots[index].value) : value;
      if (!Object.is(next, slots[index].value)) {
        slots[index].value = next;
        dirty = true;
      }
    }];
  };
  const useEffect = (effect, dependencies) => {
    const index = cursor++;
    if (!slots[index]?.dependencies?.every((value, i) => Object.is(value, dependencies[i])))
      effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { dependencies, cleanup: effect() };
      });
  };
  const addEventListener = (name, callback) => {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(callback);
  };
  const removeEventListener = (name, callback) => listeners.get(name)?.delete(callback);
  const timer = (callback, delay, interval = false) => {
    const id = ++timerId;
    timers.set(id, { callback, at: elapsed + delay, interval: interval ? delay : 0 });
    return id;
  };
  const localWindow = {
    setTimeout: timer,
    clearTimeout: (id) => timers.delete(id),
    setInterval: (callback, delay) => timer(callback, delay, true),
    clearInterval: (id) => timers.delete(id),
    addEventListener,
    removeEventListener,
  };
  const localDocument = { hidden: false, addEventListener, removeEventListener };
  const fetchMock = (url, init) => {
    const headers = deferred();
    const body = deferred();
    requests.push({ url, init, headers, body });
    return headers.promise;
  };
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", "window", "document", "fetch", "Date", source)(
    (name) => {
      if (name === "react") return { useState, useEffect };
      if (name === "@/lib/point/presentation") return presentation;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    loadedModule,
    loadedModule.exports,
    localWindow,
    localDocument,
    fetchMock,
    class extends Date { static now() { return started + elapsed; } },
  );
  function render() {
    cursor = 0;
    dirty = false;
    output = loadedModule.exports.usePointQuotes(
      options.symbols,
      options.enabled,
      onDenied,
      options.endpoint,
    );
    while (effects.length) effects.shift()();
  }
  async function flush() {
    for (let i = 0; i < 8; i++) {
      await Promise.resolve();
      if (dirty) render();
    }
  }
  const result = {
    requests,
    output: () => output,
    denied: () => denied,
    flush,
    document: localDocument,
    fire(name) {
      for (const callback of listeners.get(name) ?? []) callback();
    },
    advance(duration) {
      const target = elapsed + duration;
      let next;
      while ((next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]) && next[1].at <= target) {
        elapsed = next[1].at;
        if (next[1].interval) next[1].at += next[1].interval;
        else timers.delete(next[0]);
        next[1].callback();
      }
      elapsed = target;
    },
    update(next) {
      options = { ...options, ...next };
      render();
    },
    async respond(index, quotes, status = 200) {
      requests[index].headers.resolve({
        status,
        ok: status >= 200 && status < 300,
        json: () => requests[index].body.promise,
      });
      requests[index].body.resolve({ quotes });
      await flush();
    },
    async headers(index) {
      requests[index].headers.resolve({
        status: 200,
        ok: true,
        json: () => requests[index].body.promise,
      });
      await flush();
    },
    async body(index, quotes) {
      requests[index].body.resolve({ quotes });
      await flush();
    },
    unmount() {
      for (const slot of slots) slot.cleanup?.();
    },
  };
  render();
  return result;
}

test("quote hook keeps the existing public endpoint by default and batches exact symbols", async () => {
  const h = harness({ symbols: ["ETHUSDT", "BTCUSDT", "BTCUSDT"] });
  try {
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].url, "/api/point/quotes?symbols=BTCUSDT%2CETHUSDT");
    assert.equal(h.requests[0].init.cache, "no-store");
    await h.respond(0, [quote("80000")]);
    assert.equal(h.output().quotes.BTCUSDT.price, "80000");
  } finally {
    h.unmount();
  }
});

test("quote endpoint changes refresh identical symbols and immediately hide the previous source", async () => {
  const h = harness();
  try {
    await h.respond(0, [quote("100")]);
    h.update({ endpoint: "/api/admin/point/quotes" });
    assert.deepEqual(h.output().quotes, {});
    assert.equal(h.requests[1].url, "/api/admin/point/quotes?symbols=BTCUSDT");
    await h.respond(1, [quote("80000")]);
    assert.equal(h.output().quotes.BTCUSDT.price, "80000");
    h.update({ endpoint: "/api/point/quotes" });
    assert.deepEqual(h.output().quotes, {});
    assert.equal(h.requests[2].url, "/api/point/quotes?symbols=BTCUSDT");
  } finally {
    h.unmount();
  }
});

test("late JSON from an aborted quote source cannot overwrite the newly selected endpoint", async () => {
  const h = harness({ endpoint: "/api/admin/point/quotes" });
  try {
    await h.headers(0);
    h.update({ endpoint: "/api/point/quotes" });
    assert.equal(h.requests[0].init.signal.aborted, true);
    await h.respond(1, [quote("100")]);
    await h.body(0, [quote("80000")]);
    assert.equal(h.output().quotes.BTCUSDT.price, "100");
  } finally {
    h.unmount();
  }
});

test("a failed new endpoint never reveals prior-source prices and an auth denial clears quotes", async () => {
  const h = harness();
  try {
    await h.respond(0, [quote("100")]);
    h.update({ endpoint: "/api/admin/point/quotes" });
    await h.respond(1, [], 503);
    assert.deepEqual(h.output().quotes, {});
    h.update({ symbols: ["BTCUSDT", "ETHUSDT"] });
    await h.respond(2, [quote("80000")]);
    assert.equal(h.output().quotes.BTCUSDT.price, "80000");
    h.update({ symbols: ["BTCUSDT"] });
    await h.respond(3, [], 403);
    assert.deepEqual(h.output().quotes, {});
    assert.equal(h.denied(), 1);
  } finally {
    h.unmount();
  }
});

test("quote foreground events coalesce in flight and reuse a successful batch for one minute", async () => {
  const h = harness();
  try {
    h.fire("focus");
    h.fire("visibilitychange");
    assert.equal(h.requests.length, 1);
    await h.respond(0, [quote("100")]);
    h.fire("focus");
    h.fire("visibilitychange");
    assert.equal(h.requests.length, 1);
    h.advance(59_999);
    h.fire("focus");
    assert.equal(h.requests.length, 1);
    h.advance(1);
    h.fire("visibilitychange");
    h.fire("focus");
    assert.equal(h.requests.length, 2);
    await h.respond(1, [quote("101")]);
    assert.equal(h.output().quotes.BTCUSDT.price, "101");
    h.advance(239_000);
    h.fire("focus");
    await h.respond(2, [quote("102")]);
    h.advance(1_000);
    assert.equal(h.requests.length, 4, "five-minute poll bypasses the foreground TTL");
  } finally { h.unmount(); }
});

test("quote TTL does not keep an expired quote fresh or poll while hidden", async () => {
  const h = harness();
  try {
    await h.respond(0, [quote("100")]);
    h.document.hidden = true;
    h.advance(300_000);
    await h.flush();
    assert.equal(h.requests.length, 1);
    assert.equal(h.output().quotes.BTCUSDT.status, "stale");
    h.document.hidden = false;
    h.fire("visibilitychange");
    h.fire("focus");
    assert.equal(h.requests.length, 2);
  } finally { h.unmount(); }
});
