import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as presentation from "../lib/point/presentation.ts";

const require = createRequire(import.meta.url);
const NOW = Date.parse("2026-09-20T12:00:00Z");
const iso = (time) => new Date(time).toISOString();
const plan = (overrides = {}) => ({
  id: "note-test",
  instrument: {
    symbol: "BTCUSDT",
    baseAsset: "BTC",
    name: "Bitcoin",
    category: "CRYPTO",
    quoteAsset: "USDT",
  },
  status: "PUBLISHED",
  version: 2,
  direction: "LONG",
  entryPrice: "80000",
  entryLower: null,
  entryUpper: null,
  stopLoss: "79000",
  takeProfit: "85000",
  rationale: "PRIVATE_NOTE_ONLY",
  entryCondition: "",
  invalidationCondition: "",
  publicSummary: "PUBLIC_SUMMARY",
  createdAt: iso(NOW - 7200000),
  publishedAt: iso(NOW - 3600000),
  updatedAt: iso(NOW),
  validFrom: iso(NOW - 3600000),
  validUntil: iso(NOW + 3600000),
  publishedReferencePrice: null,
  ...overrides,
});

// Render the actual detail and shared components with React's server renderer.
// Only quotes and framework-specific imports are stubbed; no copied JSX.
const components = new Map();
function loadComponent(filename) {
  if (components.has(filename)) return components.get(filename);
  const compiled = ts.transpileModule(
    readFileSync(new URL(`../app/point/${filename}`, import.meta.url), "utf8"),
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
    if (name === "next/link") return { default: "a" };
    if (name === "@/lib/point/presentation") return presentation;
    if (name === "./components") return loadComponent("components.tsx");
    if (name === "./use-point-quotes")
      return { usePointQuotes: () => ({ quotes: {}, now: NOW }) };
    if (name.endsWith(".css"))
      return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
    return require(name);
  };
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loadedModule,
    loadedModule.exports,
  );
  components.set(filename, loadedModule.exports);
  return loadedModule.exports;
}
const { PointDetail } = loadComponent("point-detail.tsx");
const render = (initial) =>
  renderToStaticMarkup(createElement(PointDetail, { initial }));
const vip = (current, revisions = []) => ({
  access: "vip",
  plan: current,
  revisions,
  related: [],
  previewMode: false,
});
const revision = (snapshot) => ({
  id: "history-note-test",
  version: snapshot.version,
  action: "PUBLISHED",
  reason: "HISTORIC_REASON",
  createdAt: iso(NOW - 1800000),
  snapshot,
});

test("VIP note-only plans show one remark without empty legacy condition sections", () => {
  const current = plan();
  const html = render(vip(current));
  assert.match(html, /<h2>备注<\/h2><p>PRIVATE_NOTE_ONLY<\/p>/);
  assert.doesNotMatch(
    html,
    /为什么关注这里|什么情况下不再参考|观察条件：|失效条件：|补充条件|时间边界/,
  );
  assert.ok(html.includes(`有效至 ${presentation.pointTime(current.validUntil)}`));
  assert.ok(html.includes(`生效 ${presentation.pointTime(current.validFrom)}`));
  for (const level of ["80,000", "79,000", "85,000"])
    assert.ok(html.includes(level));
});

test("only nonempty legacy conditions are preserved in a closed secondary disclosure", () => {
  const current = plan({
    entryCondition: "PRIVATE_LEGACY_ENTRY",
    invalidationCondition: " \n ",
  });
  const html = render(vip(current));
  assert.match(html, /<details class="legacyConditions"><summary>/);
  assert.match(html, /补充条件（历史内容）/);
  assert.match(html, /观察条件：PRIVATE_LEGACY_ENTRY/);
  assert.doesNotMatch(html, /失效条件：|<details[^>]*open/);

  const invalidationOnly = render(
    vip(plan({ invalidationCondition: "PRIVATE_LEGACY_INVALIDATION" })),
  );
  assert.match(invalidationOnly, /失效条件：PRIVATE_LEGACY_INVALIDATION/);
  assert.doesNotMatch(invalidationOnly, /观察条件：/);
});

test("history retains version, levels, timestamps and remark without blank old labels", () => {
  const historic = plan({
    version: 1,
    rationale: "PRIVATE_HISTORIC_NOTE",
    entryPrice: "78000",
    stopLoss: "77000",
    takeProfit: "84000",
  });
  const record = revision(historic);
  const html = render(vip(plan(), [record]));
  assert.match(html, /V1 · 发布/);
  assert.match(html, /HISTORIC_REASON/);
  assert.match(html, /备注：PRIVATE_HISTORIC_NOTE/);
  for (const value of [
    "78,000",
    "77,000",
    "84,000",
    presentation.pointTime(record.createdAt),
    `生效：${presentation.pointTime(historic.validFrom)}`,
    `到期：${presentation.pointTime(historic.validUntil)}`,
  ])
    assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /观察条件：|失效条件：|补充条件|依据：/);
});

test("historic nonempty conditions remain available even when current plan is note-only", () => {
  const historic = plan({
    version: 1,
    rationale: "",
    entryCondition: "HISTORIC_ENTRY",
    invalidationCondition: "HISTORIC_INVALIDATION",
  });
  const html = render(vip(plan(), [revision(historic)]));
  assert.match(html, /观察条件：HISTORIC_ENTRY/);
  assert.match(html, /失效条件：HISTORIC_INVALIDATION/);
  assert.doesNotMatch(html, /<p>备注：<\/p>/);
  assert.equal((html.match(/class="legacyConditions"/g) || []).length, 1);
});

test("ordinary preview never reads private remarks, conditions or revisions", () => {
  const preview = {
    id: "note-test",
    symbol: "BTCUSDT",
    name: "Bitcoin",
    category: "CRYPTO",
    publicSummary: "PUBLIC_ONLY_SUMMARY",
    updatedAt: iso(NOW),
    validUntil: iso(NOW + 3600000),
  };
  for (const key of ["rationale", "entryCondition", "invalidationCondition"])
    Object.defineProperty(preview, key, {
      get() {
        throw new Error(`Preview read private ${key}`);
      },
    });
  const initial = { access: "preview", plan: preview, previewMode: false };
  Object.defineProperty(initial, "revisions", {
    get() {
      throw new Error("Preview read private revisions");
    },
  });
  const html = render(initial);
  assert.match(html, /PUBLIC_ONLY_SUMMARY/);
  assert.doesNotMatch(html, /PRIVATE_|观察备注|补充条件|备注：/);
});
