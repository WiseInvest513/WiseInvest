import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as presentation from "../lib/point/presentation.ts";

const NOW = Date.parse("2026-09-20T12:00:00Z");
const plan = (version = 1) => ({
  id: "race-test",
  instrument: {
    symbol: "BTCUSDT",
    baseAsset: "BTC",
    name: "Bitcoin",
    category: "CRYPTO",
    quoteAsset: "USDT",
  },
  status: "PUBLISHED",
  version,
  direction: "LONG",
  entryPrice: String(80000 + version),
  entryLower: null,
  entryUpper: null,
  stopLoss: "79000",
  takeProfit: "85000",
  publicSummary: "公开摘要",
  rationale: `PRIVATE_RATIONALE_V${version}`,
  entryCondition: "PRIVATE_ENTRY_CONDITION",
  invalidationCondition: "PRIVATE_INVALIDATION",
  createdAt: new Date(NOW - 7200000).toISOString(),
  publishedAt: new Date(NOW - 3600000).toISOString(),
  updatedAt: new Date(NOW + version).toISOString(),
  validFrom: new Date(NOW - 3600000).toISOString(),
  validUntil: new Date(NOW + 3600000).toISOString(),
  publishedReferencePrice: null,
});
const preview = {
  id: "race-test",
  symbol: "BTCUSDT",
  name: "Bitcoin",
  category: "CRYPTO",
  publicSummary: "PUBLIC_ONLY_SUMMARY",
  publishedAt: new Date(NOW - 3600000).toISOString(),
  updatedAt: new Date(NOW).toISOString(),
  validUntil: new Date(NOW + 3600000).toISOString(),
};

function responseFor(kind, access = "vip", version = 1) {
  if (kind === "list") {
    return {
      access,
      items: [access === "vip" ? plan(version) : preview],
      total: 1,
      page: 1,
      pageSize: access === "vip" ? 12 : 3,
      previewMode: true,
    };
  }
  return access === "vip"
    ? {
        access,
        plan: plan(version),
        revisions: [],
        related: [],
        previewMode: true,
      }
    : { access, plan: preview, previewMode: true };
}

const compiled = Object.fromEntries(
  ["list", "detail"].map((kind) => [
    kind,
    ts.transpileModule(
      readFileSync(
        new URL(`../app/point/point-${kind}.tsx`, import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
  ]),
);

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const text = (node) => {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(text).join("");
  if (typeof node === "object") return text(node.props?.children);
  return String(node);
};
const find = (node, predicate) => {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return undefined;
  }
  return predicate(node) ? node : find(node.props?.children, predicate);
};

/** Runs the real component functions and effect closures, with deterministic React
 * state/effect dependency semantics and a transport that can deliver a JSON body
 * after abort. No copied refresh algorithm or source-pattern-only assertions. */
function harness(kind, initial = responseFor(kind), initialLoadedAt = 0) {
  let elapsed = 0;
  let timerId = 0;
  let cursor = 0;
  let dirty = false;
  let mounted = true;
  let tree;
  let writesAfterUnmount = 0;
  let denyQuotes;
  const slots = [];
  const pendingEffects = [];
  const timers = new Map();
  const requests = [];
  const listeners = { window: new Map(), document: new Map() };
  const same = (a, b) =>
    a &&
    b &&
    a.length === b.length &&
    a.every((value, i) => Object.is(value, b[i]));
  const useState = (initial) => {
    const index = cursor++;
    if (!slots[index]) {
      const slot = {
        type: "state",
        value: typeof initial === "function" ? initial() : initial,
      };
      slot.set = (next) => {
        if (!mounted) writesAfterUnmount++;
        const value = typeof next === "function" ? next(slot.value) : next;
        if (!Object.is(value, slot.value)) {
          slot.value = value;
          dirty = true;
        }
      };
      slots[index] = slot;
    }
    return [slots[index].value, slots[index].set];
  };
  const useCallback = (callback, deps) => {
    const index = cursor++;
    if (!same(slots[index]?.deps, deps))
      slots[index] = { type: "callback", deps, callback };
    return slots[index].callback;
  };
  const useRef = (value) => {
    const index = cursor++;
    if (!slots[index]) slots[index] = { current: value };
    return slots[index];
  };
  const useEffect = (effect, deps) => {
    const index = cursor++;
    if (!same(slots[index]?.deps, deps)) {
      pendingEffects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { type: "effect", deps, cleanup: effect() };
      });
    }
  };
  const schedule = (callback, delay, interval = false) => {
    const id = ++timerId;
    timers.set(id, {
      callback,
      at: elapsed + delay,
      interval: interval ? delay : 0,
    });
    return id;
  };
  const events = (target) => ({
    hidden: false,
    addEventListener(name, callback) {
      if (!listeners[target].has(name)) listeners[target].set(name, new Set());
      listeners[target].get(name).add(callback);
    },
    removeEventListener(name, callback) {
      listeners[target].get(name)?.delete(callback);
      if (listeners[target].get(name)?.size === 0)
        listeners[target].delete(name);
    },
  });
  const localWindow = events("window");
  const localDocument = events("document");
  const fetchMock = (url, init) => {
    const headers = deferred();
    const body = deferred();
    const request = {
      url,
      signal: init.signal,
      headers,
      body,
      responded: false,
      jsonRead: false,
    };
    requests.push(request);
    init.signal.addEventListener(
      "abort",
      () => {
        if (!request.responded)
          headers.reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
    return headers.promise;
  };
  const module = { exports: {} };
  const requireMock = (name) => {
    if (name === "react")
      return { useState, useCallback, useEffect, useRef, Fragment: "fragment" };
    if (name === "react/jsx-runtime")
      return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
    if (name === "next/link") return { default: "a" };
    if (name === "lucide-react" || name === "./components")
      return new Proxy({}, { get: (_target, key) => String(key) });
    if (name === "@/lib/point/presentation") return presentation;
    if (name === "./use-point-quotes")
      return { usePointQuotes: (_symbols, _enabled, onDenied) => {
        denyQuotes = onDenied;
        return { quotes: {}, now: NOW + elapsed };
      } };
    if (name.endsWith(".css"))
      return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
    throw new Error(`Unexpected module: ${name}`);
  };
  new Function(
    "require",
    "module",
    "exports",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "window",
    "document",
    "fetch",
    "Date",
    compiled[kind],
  )(
    requireMock,
    module,
    module.exports,
    (callback, delay) => schedule(callback, delay),
    (id) => timers.delete(id),
    (callback, delay) => schedule(callback, delay, true),
    (id) => timers.delete(id),
    localWindow,
    localDocument,
    fetchMock,
    class extends Date { static now() { return NOW + elapsed; } },
  );
  const Component =
    module.exports[kind === "list" ? "PointList" : "PointDetail"];
  const props = { initial, isAdmin: false, initialLoadedAt };
  const render = () => {
    cursor = 0;
    dirty = false;
    tree = Component(props);
    for (const effect of pendingEffects.splice(0)) effect();
  };
  render();
  const flush = async () => {
    for (let i = 0; i < 12; i++) {
      await Promise.resolve();
      if (mounted && dirty) render();
    }
  };
  return {
    requests,
    timers,
    listeners,
    document: localDocument,
    flush,
    data: () => slots[0].value,
    denyQuotes: () => denyQuotes(),
    text: () => text(tree),
    control: (label, type = "button") =>
      find(
        tree,
        (node) =>
          node.type === type &&
          (node.props?.["aria-label"] === label || text(node) === label),
      ),
    click(label) {
      const button = this.control(label);
      assert.ok(button, `the real component should expose ${label}`);
      assert.notEqual(button.props.disabled, true, `${label} should be enabled`);
      button.props.onClick();
    },
    input(label, value) {
      const input = this.control(label, "input");
      assert.ok(input, `the real component should expose ${label}`);
      input.props.onChange({ target: { value } });
    },
    busy: () =>
      find(tree, (node) => Object.hasOwn(node.props ?? {}, "aria-busy"))?.props[
        "aria-busy"
      ],
    writesAfterUnmount: () => writesAfterUnmount,
    fire(name, target = name === "visibilitychange" ? "document" : "window") {
      for (const callback of listeners[target].get(name) ?? []) callback();
    },
    headers(index, status = 200) {
      const request = requests[index];
      request.responded = true;
      request.headers.resolve({
        status,
        ok: status >= 200 && status < 300,
        json: () => {
          request.jsonRead = true;
          return request.body.promise;
        },
      });
    },
    body(index, value) {
      requests[index].body.resolve(value);
    },
    advance(duration) {
      const target = elapsed + duration;
      let next;
      while (
        (next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]) &&
        next[1].at <= target
      ) {
        elapsed = next[1].at;
        if (next[1].interval) next[1].at += next[1].interval;
        else timers.delete(next[0]);
        next[1].callback();
      }
      elapsed = target;
    },
    retry() {
      const button = find(
        tree,
        (node) => node.type === "button" && text(node) === "重试",
      );
      assert.ok(button, "the real component should expose retry after failure");
      button.props.onClick();
    },
    cleanup() {
      mounted = false;
      for (const slot of slots) if (slot.type === "effect") slot.cleanup?.();
    },
  };
}

const paramsFor = (h) =>
  Object.fromEntries(
    new URL(h.requests.at(-1).url, "http://localhost").searchParams,
  );
async function completeList(h, overrides = {}) {
  const index = h.requests.length - 1;
  h.headers(index);
  h.body(index, {
    ...responseFor("list"),
    page: Number(paramsFor(h).page),
    ...overrides,
  });
  await h.flush();
}

test("list: direction buttons send ALL, LONG, and SHORT and expose their selected state", async () => {
  const h = harness("list");
  await completeList(h);
  assert.equal(paramsFor(h).direction, "ALL");
  assert.equal(h.control("全部方向").props["aria-pressed"], true);
  for (const [label, direction] of [
    ["只看做多", "LONG"],
    ["只看做空", "SHORT"],
    ["全部方向", "ALL"],
  ]) {
    const previous = h.requests.length;
    h.click(label);
    await h.flush();
    assert.equal(h.requests.length, previous + 1);
    assert.equal(paramsFor(h).direction, direction);
    assert.equal(paramsFor(h).page, "1");
    for (const candidate of ["全部方向", "只看做多", "只看做空"])
      assert.equal(
        h.control(candidate).props["aria-pressed"],
        candidate === label,
      );
    await completeList(h);
  }
  h.cleanup();
  await h.flush();
});

test("list: changing direction from a later page restarts at page one", async () => {
  const h = harness("list");
  await completeList(h, { total: 36 });
  h.advance(300);
  await h.flush();
  h.click("下一页");
  await h.flush();
  assert.equal(paramsFor(h).page, "2");
  await completeList(h, { total: 36 });
  assert.equal(h.data().page, 2);
  h.click("只看做空");
  await h.flush();
  assert.deepEqual(paramsFor(h), {
    scope: "active",
    category: "ALL",
    direction: "SHORT",
    q: "",
    page: "1",
  });
  await completeList(h);
  assert.equal(h.data().page, 1);
  assert.equal(h.control("上一页").props.disabled, true);
  h.cleanup();
  await h.flush();
});

test("list: direction composes with history, market, and debounced search; clear filters resets all three", async () => {
  const h = harness("list");
  await completeList(h);
  for (const label of ["全部与历史", "美股合约", "只看做多"]) {
    h.click(label);
    await h.flush();
    await completeList(h);
  }
  h.input("搜索产品代码或名称", "MU");
  await h.flush();
  const beforeSearch = h.requests.length;
  h.advance(299);
  await h.flush();
  assert.equal(h.requests.length, beforeSearch);
  h.advance(1);
  await h.flush();
  assert.deepEqual(paramsFor(h), {
    scope: "all",
    category: "EQUITY",
    direction: "LONG",
    q: "MU",
    page: "1",
  });
  await completeList(h, { items: [], total: 0 });
  assert.match(h.text(), /没有匹配的观察记录/);
  h.click("清除筛选");
  await h.flush();
  assert.deepEqual(paramsFor(h), {
    scope: "all",
    category: "ALL",
    direction: "ALL",
    q: "",
    page: "1",
  });
  assert.equal(h.control("搜索产品代码或名称", "input").props.value, "");
  assert.equal(h.control("全部").props["aria-pressed"], true);
  assert.equal(h.control("全部方向").props["aria-pressed"], true);
  await completeList(h);
  assert.doesNotMatch(h.text(), /没有匹配的观察记录/);
  h.cleanup();
  await h.flush();
});

test("list: a direction-only empty result offers a working clear-filters control", async () => {
  const h = harness("list");
  await completeList(h);
  h.click("只看做空");
  await h.flush();
  await completeList(h, { items: [], total: 0 });
  assert.match(h.text(), /没有匹配的观察记录/);
  h.click("清除筛选");
  await h.flush();
  assert.equal(paramsFor(h).direction, "ALL");
  await completeList(h);
  assert.equal(h.control("清除筛选"), undefined);
  h.cleanup();
  await h.flush();
});

test("list: the mobile market select preserves direction and restarts pagination", async () => {
  const h = harness("list");
  await completeList(h, { total: 36 });
  h.advance(300);
  await h.flush();
  h.click("只看做空");
  await h.flush();
  await completeList(h, { total: 36 });
  h.click("下一页");
  await h.flush();
  await completeList(h, { total: 36 });
  assert.equal(h.data().page, 2);
  const select = h.control("筛选市场类型", "select");
  assert.ok(select, "the real component should expose the mobile market select");
  select.props.onChange({ target: { value: "EQUITY" } });
  await h.flush();
  assert.deepEqual(paramsFor(h), {
    scope: "active",
    category: "EQUITY",
    direction: "SHORT",
    q: "",
    page: "1",
  });
  assert.equal(h.control("筛选市场类型", "select").props.value, "EQUITY");
  assert.equal(h.control("美股合约").props["aria-pressed"], true);
  assert.equal(h.control("只看做空").props["aria-pressed"], true);
  await completeList(h);
  h.cleanup();
  await h.flush();
});

test("list: ordinary preview never exposes direction controls, including after VIP downgrade", async () => {
  for (const initialAccess of ["preview", "vip"]) {
    const h = harness("list", responseFor("list", initialAccess));
    if (initialAccess === "vip") {
      await completeList(h);
      h.click("只看做空");
      await h.flush();
    }
    await completeList(h, responseFor("list", "preview"));
    for (const label of ["全部方向", "只看做多", "只看做空"])
      assert.equal(h.control(label), undefined);
    assert.match(h.text(), /PUBLIC_ONLY_SUMMARY/);
    assert.doesNotMatch(h.text(), /做多观察|做空观察|PRIVATE_/);
    h.cleanup();
    await h.flush();
  }
});

for (const kind of ["list", "detail"]) {
  test(`${kind}: fresh SSR skips hydration reads and foreground bursts coalesce without delaying the five-minute poll`, async () => {
    const h = harness(kind, responseFor(kind), NOW);
    await h.flush();
    assert.equal(h.requests.length, 0);
    h.fire("focus");
    h.fire("visibilitychange");
    assert.equal(h.requests.length, 0);
    h.advance(60_000);
    h.fire("focus");
    h.fire("visibilitychange");
    h.fire("focus");
    assert.equal(h.requests.length, 1, "only one foreground request may be in flight");
    assert.equal(h.requests[0].signal.aborted, false);
    h.headers(0);
    h.body(0, responseFor(kind, "vip", 2));
    await h.flush();
    h.fire("focus");
    h.fire("visibilitychange");
    assert.equal(h.requests.length, 1, "recent success survives repeated refocus events");
    h.advance(239_000);
    h.fire("focus");
    h.headers(1);
    h.body(1, responseFor(kind, "vip", 3));
    await h.flush();
    h.advance(1_000);
    assert.equal(h.requests.length, 3, "scheduled poll is not postponed by foreground TTL");
    h.cleanup();
    await h.flush();
  });

  test(`${kind}: a stale SSR payload refreshes immediately`, async () => {
    const h = harness(kind, responseFor(kind), NOW - 60_000);
    assert.equal(h.requests.length, 1);
    h.cleanup();
    await h.flush();
  });

  test(`${kind}: quote authorization denial bypasses the fresh-SSR TTL and immediately hides private content`, async () => {
    const h = harness(kind, responseFor(kind), NOW);
    h.denyQuotes();
    await h.flush();
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(h.text(), /PRIVATE_|80,00[123]|79,000|85,000/);
    h.headers(0);
    h.body(0, responseFor(kind, "preview"));
    await h.flush();
    assert.equal(h.data().access, "preview");
    h.cleanup();
    await h.flush();
  });

  test(`${kind}: a delayed old JSON response cannot overwrite a newer version`, async () => {
    const h = harness(kind);
    h.headers(0);
    await h.flush();
    assert.equal(h.requests[0].jsonRead, true);
    h.advance(15_000);
    h.fire("focus");
    assert.equal(h.requests[0].signal.aborted, true);
    h.headers(1);
    h.body(1, responseFor(kind, "vip", 2));
    await h.flush();
    assert.deepEqual(h.data(), responseFor(kind, "vip", 2));
    h.body(0, responseFor(kind, "vip", 1));
    await h.flush();
    assert.deepEqual(h.data(), responseFor(kind, "vip", 2));
    if (kind === "list") assert.equal(h.busy(), false);
    h.cleanup();
    await h.flush();
    assert.equal(h.timers.size, 0);
  });

  for (const denial of ["preview", 403]) {
    test(`${kind}: late VIP JSON cannot restore private content after ${denial} downgrade`, async () => {
      const h = harness(kind);
      h.headers(0);
      await h.flush();
      h.advance(15_000);
      h.fire("focus");
      h.headers(1, denial === 403 ? 403 : 200);
      if (denial === "preview") h.body(1, responseFor(kind, "preview"));
      await h.flush();
      const denied = structuredClone(h.data());
      if (kind === "detail" && denial === 403) assert.equal(denied, null);
      else assert.equal(denied.access, "preview");
      h.body(0, responseFor(kind, "vip", 3));
      await h.flush();
      assert.deepEqual(h.data(), denied);
      assert.doesNotMatch(h.text(), /PRIVATE_|80,00[123]|79,000|85,000/);
      h.cleanup();
      await h.flush();
      assert.equal(h.timers.size, 0);
    });
  }

  test(`${kind}: a 15-second timeout exits loading and the retry control can recover`, async () => {
    const h = harness(kind);
    await h.flush();
    h.advance(15_000);
    await h.flush();
    assert.equal(h.requests[0].signal.aborted, true);
    assert.match(h.text(), /暂时无法/);
    if (kind === "list") assert.equal(h.busy(), false);
    h.retry();
    await h.flush();
    assert.equal(h.requests.length, 2);
    h.headers(1);
    h.body(1, responseFor(kind, "vip", 2));
    await h.flush();
    assert.deepEqual(h.data(), responseFor(kind, "vip", 2));
    assert.doesNotMatch(h.text(), /暂时无法/);
    if (kind === "list") assert.equal(h.busy(), false);
    h.cleanup();
    await h.flush();
    assert.equal(h.timers.size, 0);
  });

  test(`${kind}: hidden pages skip refresh and visible pages retain the five-minute interval`, async () => {
    const h = harness(kind);
    h.headers(0);
    h.body(0, responseFor(kind));
    await h.flush();
    h.document.hidden = true;
    h.advance(300_000);
    h.fire("focus");
    await h.flush();
    assert.equal(h.requests.length, 1);
    h.document.hidden = false;
    h.fire("visibilitychange");
    assert.equal(h.requests.length, 2);
    h.headers(1);
    h.body(1, responseFor(kind, "vip", 2));
    await h.flush();
    h.advance(300_000);
    assert.equal(h.requests.length, 3);
    h.cleanup();
    await h.flush();
    assert.equal(h.requests[2].signal.aborted, true);
    assert.equal(h.timers.size, 0);
    assert.equal(h.listeners.window.size, 0);
    assert.equal(h.listeners.document.size, 0);
    assert.equal(h.writesAfterUnmount(), 0);
  });

  test(`${kind}: unmount aborts and late parsed data cannot write state or leak listeners`, async () => {
    const h = harness(kind);
    h.headers(0);
    await h.flush();
    h.cleanup();
    const previous = structuredClone(h.data());
    assert.equal(h.requests[0].signal.aborted, true);
    h.body(0, responseFor(kind, "vip", 9));
    await h.flush();
    assert.deepEqual(h.data(), previous);
    assert.equal(h.writesAfterUnmount(), 0);
    assert.equal(h.listeners.window.size, 0);
    assert.equal(h.listeners.document.size, 0);
    assert.equal(h.timers.size, 0);
  });
}
