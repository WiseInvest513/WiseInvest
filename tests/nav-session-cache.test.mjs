import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const compile = (path) => ts.transpileModule(
  readFileSync(new URL(path, import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const cacheSource = compile("../lib/auth/nav-session-client.ts");
const navbarSource = compile("../components/navbar.tsx");
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const session = (name = "Alice") => ({
  user: { name, image: `https://example.test/${name}.png`, email: "not-retained@example.test", role: "ADMIN" },
  expires: "2099-01-01T00:00:00.000Z",
});
const display = (name = "Alice") => ({ user: { name, image: `https://example.test/${name}.png` } });

// Execute the actual client module with deterministic time and transport. JSON
// remains deliverable after abort so the logout/account-switch race is real.
function harness({ broadcast = true } = {}) {
  let now = 1_000_000;
  let timerId = 0;
  const timers = new Map();
  const requests = [];
  const channels = [];
  const messages = [];
  const surface = () => {
    const listeners = new Map();
    return {
      listeners,
      addEventListener(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
      },
      removeEventListener(name, fn) {
        listeners.get(name)?.delete(fn);
        if (listeners.get(name)?.size === 0) listeners.delete(name);
      },
      fire(name) { for (const fn of listeners.get(name) ?? []) fn(); },
    };
  };
  const window = surface();
  const document = { ...surface(), hidden: false };
  for (const key of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(window, key, { get() { throw new Error("Persistent session storage is forbidden"); } });
  }
  class Channel {
    constructor(name) { this.name = name; this.listeners = new Set(); this.closed = false; channels.push(this); }
    addEventListener(_name, fn) { this.listeners.add(fn); }
    removeEventListener(_name, fn) { this.listeners.delete(fn); }
    postMessage(data) { messages.push(data); }
    close() { this.closed = true; }
  }
  const fetch = (url, init) => {
    const headers = deferred();
    const body = deferred();
    const request = { url, init, headers, body, jsonRead: false };
    requests.push(request);
    return headers.promise.then((status) => ({
      ok: status >= 200 && status < 300,
      status,
      json() { request.jsonRead = true; return body.promise; },
    }));
  };
  const setTimeout = (callback, delay) => {
    const id = ++timerId;
    timers.set(id, { at: now + delay, callback });
    return id;
  };
  const clearTimeout = (id) => timers.delete(id);
  const api = {};
  new Function("exports", "fetch", "window", "document", "BroadcastChannel", "Date", "setTimeout", "clearTimeout", cacheSource)(
    api, fetch, window, document, broadcast ? Channel : undefined,
    class extends Date { static now() { return now; } }, setTimeout, clearTimeout,
  );
  return {
    api, window, document, requests, channels, messages, timers,
    async flush() { for (let i = 0; i < 16; i++) await Promise.resolve(); },
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
    },
    finish(index, value = session(), status = 200) {
      requests[index].headers.resolve(status);
      requests[index].body.resolve(value);
    },
    broadcast(data = { event: "session", data: { trigger: "signout" } }) {
      for (const channel of channels) {
        if (!channel.closed) for (const fn of channel.listeners) fn({ data });
      }
    },
  };
}

test("route/remount consumers share one in-flight read and a 60-second display-only cache", async () => {
  const h = harness();
  const first = h.api.readNavSession();
  assert.equal(h.api.readNavSession(), first);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].url, "/api/auth/session");
  assert.equal(h.requests[0].init.cache, "no-store");
  h.finish(0);
  assert.deepEqual(await first, display());
  for (let i = 0; i < 10; i++) assert.deepEqual(await h.api.readNavSession(), display());
  h.advance(59_999);
  await h.api.readNavSession();
  assert.equal(h.requests.length, 1);
  h.advance(1);
  const fresh = h.api.readNavSession();
  assert.equal(h.requests.length, 2);
  h.finish(1, session("Bob"));
  assert.deepEqual(await fresh, display("Bob"));
  assert.equal(h.timers.size, 0);
});

test("signed-out null results are deduplicated without retaining session identifiers or permissions", async () => {
  const h = harness();
  const pending = h.api.readNavSession();
  h.finish(0, {});
  assert.equal(await pending, null);
  assert.equal(await h.api.readNavSession(), null);
  assert.equal(h.requests.length, 1);
});

test("server evaluation never fetches or retains a process-wide user session", async () => {
  const api = {};
  new Function("exports", "window", "fetch", cacheSource)(api, undefined, () => {
    throw new Error("Navbar display cache must never fetch on the server");
  });
  assert.equal(await api.readNavSession(), null);
  api.notifyNavSessionChanged();
});

for (const failure of ["http", "network", "json", "shape"]) {
  test(`${failure} errors reject, clear the old display, and retry after a short failure throttle`, async () => {
    const h = harness();
    const values = [];
    const unsubscribe = h.api.subscribeNavSession((value) => values.push(value));
    const initial = h.api.readNavSession();
    h.finish(0);
    await initial;
    h.advance(60_000);
    const failed = h.api.readNavSession();
    const rejection = assert.rejects(failed);
    if (failure === "http") h.finish(1, null, 503);
    if (failure === "network") h.requests[1].headers.reject(new Error("offline"));
    if (failure === "json") {
      h.requests[1].headers.resolve(200);
      await h.flush();
      h.requests[1].body.reject(new Error("invalid JSON"));
    }
    if (failure === "shape") h.finish(1, { user: "invalid" });
    await rejection;
    assert.equal(values.at(-1), null);
    await assert.rejects(h.api.readNavSession());
    h.window.fire("focus");
    h.document.fire("visibilitychange");
    assert.equal(h.requests.length, 2, "failure is not cached as a successful signed-out session or retried on every event");
    h.advance(5_000);
    const recovered = h.api.readNavSession();
    h.finish(2, session("Bob"));
    assert.deepEqual(await recovered, display("Bob"));
    unsubscribe();
  });
}

test("focus and visibility bursts coalesce, skip hidden tabs, and clean up shared listeners", async () => {
  const h = harness();
  const offA = h.api.subscribeNavSession(() => {});
  const offB = h.api.subscribeNavSession(() => {});
  assert.equal(h.window.listeners.get("focus").size, 1);
  assert.equal(h.channels.length, 1);
  assert.equal(h.channels[0].name, "next-auth");
  const initial = h.api.readNavSession();
  h.finish(0);
  await initial;
  h.window.fire("focus");
  h.document.fire("visibilitychange");
  assert.equal(h.requests.length, 1);
  h.advance(60_000);
  h.document.hidden = true;
  h.window.fire("focus");
  h.document.fire("visibilitychange");
  assert.equal(h.requests.length, 1);
  h.document.hidden = false;
  h.document.fire("visibilitychange");
  h.window.fire("focus");
  h.document.fire("visibilitychange");
  assert.equal(h.requests.length, 2);
  h.finish(1);
  await h.flush();
  offA();
  assert.equal(h.window.listeners.size, 1);
  offB();
  assert.equal(h.window.listeners.size, 0);
  assert.equal(h.document.listeners.size, 0);
  assert.equal(h.channels[0].closed, true);
});

test("NextAuth signout clears the avatar immediately and late pre-logout JSON cannot restore it", async () => {
  const h = harness();
  const values = [];
  const unsubscribe = h.api.subscribeNavSession((value) => values.push(value));
  const initial = h.api.readNavSession();
  h.finish(0);
  await initial;
  h.advance(60_000);
  const old = h.api.readNavSession();
  const oldRejected = assert.rejects(old);
  h.requests[1].headers.resolve(200);
  await h.flush();
  assert.equal(h.requests[1].jsonRead, true);
  h.broadcast();
  assert.equal(h.requests[1].init.signal.aborted, true);
  assert.equal(values.at(-1), null);
  assert.equal(h.requests.length, 3);
  h.finish(2, null);
  await h.flush();
  h.requests[1].body.resolve(session("OldUser"));
  await oldRejected;
  assert.equal(await h.api.readNavSession(), null);
  assert.equal(values.at(-1), null);
  assert.equal(h.timers.size, 0);
  unsubscribe();
});

test("password login, account switch and profile updates bypass the TTL and broadcast no PII", async () => {
  const h = harness();
  const values = [];
  const unsubscribe = h.api.subscribeNavSession((value) => values.push(value));
  const initial = h.api.readNavSession();
  h.finish(0, null);
  await initial;
  for (const [index, name] of ["Alice", "Bob", "Renamed"].entries()) {
    h.api.notifyNavSessionChanged();
    assert.equal(values.at(-1), null);
    assert.equal(h.requests.length, index + 2);
    // The callbackUrl route transition reuses the immediately started read.
    const routeRead = h.api.readNavSession();
    h.finish(index + 1, session(name));
    assert.deepEqual(await routeRead, display(name));
    assert.deepEqual(values.at(-1), display(name));
  }
  assert.equal(h.messages.length, 3);
  assert.deepEqual(h.messages[0], { event: "session", data: { trigger: "wise-account-update" } });
  unsubscribe();
});

test("late previous-account data cannot overwrite a successful new-account refresh", async () => {
  const h = harness();
  const values = [];
  const unsubscribe = h.api.subscribeNavSession((value) => values.push(value));
  const old = h.api.readNavSession();
  const oldRejected = assert.rejects(old);
  h.requests[0].headers.resolve(200);
  await h.flush();
  h.api.notifyNavSessionChanged();
  h.finish(1, session("NewAccount"));
  await h.flush();
  h.requests[0].body.resolve(session("OldAccount"));
  await oldRejected;
  await h.flush();
  assert.deepEqual(values.at(-1), display("NewAccount"));
  assert.deepEqual(await h.api.readNavSession(), display("NewAccount"));
  assert.equal(h.requests.length, 2);
  assert.equal(h.timers.size, 0);
  unsubscribe();
});

test("hidden cross-tab auth changes invalidate immediately and revalidate on becoming visible", async () => {
  const h = harness();
  const values = [];
  const unsubscribe = h.api.subscribeNavSession((value) => values.push(value));
  const initial = h.api.readNavSession();
  h.finish(0);
  await initial;
  h.document.hidden = true;
  h.broadcast({ event: "session", data: { trigger: "getSession" } });
  assert.equal(values.at(-1), null);
  assert.equal(h.requests.length, 1);
  h.document.hidden = false;
  h.document.fire("visibilitychange");
  assert.equal(h.requests.length, 2);
  h.finish(1, session("NewAccount"));
  await h.flush();
  assert.deepEqual(values.at(-1), display("NewAccount"));
  unsubscribe();
});

test("same-tab auth changes still work without BroadcastChannel", async () => {
  const h = harness({ broadcast: false });
  const unsubscribe = h.api.subscribeNavSession(() => {});
  const initial = h.api.readNavSession();
  h.finish(0, null);
  await initial;
  h.api.notifyNavSessionChanged();
  h.finish(1);
  await h.flush();
  assert.deepEqual(await h.api.readNavSession(), display());
  unsubscribe();
});

test("timeout rejects a hung session read and a later retry can recover", async () => {
  const h = harness();
  const hung = h.api.readNavSession();
  const rejected = assert.rejects(hung);
  h.advance(15_000);
  await rejected;
  assert.equal(h.requests[0].init.signal.aborted, true);
  h.advance(5_000);
  const retry = h.api.readNavSession();
  h.finish(1);
  assert.deepEqual(await retry, display());
  h.finish(0, session("TooLate"));
  await h.flush();
  assert.deepEqual(await h.api.readNavSession(), display());
  assert.equal(h.timers.size, 0);
});

test("the real Navbar does not fetch while hidden on /admin/point and route navigation reuses the cache", async () => {
  const h = harness();
  let pathname = "/admin/point";
  let cursor = 0;
  const slots = [];
  const effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: initial };
      return [slots[index].value, (value) => { slots[index].value = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || !deps.every((value, i) => Object.is(value, previous.deps[i]))) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const require = (name) => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
    if (name === "next/navigation") return { usePathname: () => pathname };
    if (name === "@/lib/auth/nav-session-client") return h.api;
    if (name === "@/lib/utils") return { cn: (...args) => args.filter(Boolean).join(" ") };
    return new Proxy({}, { get: (_target, key) => key });
  };
  const exports = {};
  new Function("exports", "require", "window", "document", navbarSource)(exports, require, h.window, h.document);
  const render = (route) => {
    pathname = route;
    cursor = 0;
    const tree = exports.Navbar();
    for (const effect of effects.splice(0)) effect();
    return tree;
  };
  assert.equal(render("/admin/point"), null);
  h.window.fire("focus");
  assert.equal(h.requests.length, 0);
  render("/articles");
  assert.equal(h.requests.length, 1);
  render("/point");
  assert.equal(h.requests.length, 1);
  h.finish(0);
  await h.flush();
  render("/account");
  assert.equal(h.requests.length, 1);
  render("/admin/point/new");
  h.advance(60_000);
  h.window.fire("focus");
  h.document.fire("visibilitychange");
  h.api.notifyNavSessionChanged();
  assert.equal(h.requests.length, 1);
  render("/");
  assert.equal(h.requests.length, 2);
  h.finish(1);
  await h.flush();
  for (const slot of slots) slot.cleanup?.();
  assert.equal(h.window.listeners.size, 0);
  assert.equal(h.document.listeners.size, 0);
});
