import assert from "node:assert/strict";
import test from "node:test";
import {
  pointPrice,
  pointState,
  effectivePointQuote,
  entryLabel,
  pointTime,
} from "../lib/point/presentation.ts";

const NOW = Date.parse("2026-09-20T12:00:00.000Z");
const iso = (time) => new Date(time).toISOString();
const plan = (overrides) => ({
  status: "PUBLISHED",
  direction: "LONG",
  entryPrice: "100",
  entryLower: null,
  entryUpper: null,
  stopLoss: "90",
  takeProfit: "120",
  validFrom: iso(NOW - 3_600_000),
  validUntil: iso(NOW + 3_600_000),
  ...overrides,
});
const quote = (overrides) => ({
  symbol: "BTCUSDT",
  price: "100",
  status: "fresh",
  source: "BINANCE_USD_M_LAST_PRICE",
  sourceTime: iso(NOW - 2_000),
  fetchedAt: iso(NOW - 1_000),
  ...overrides,
});

test("price formatting preserves tiny and long decimals without float conversion", () => {
  assert.equal(pointPrice("0.0000000000001"), "0.0000000000001");
  assert.equal(
    pointPrice("67200.123456789012345678"),
    "67,200.123456789012345678",
  );
  assert.equal(
    pointPrice("9007199254740993.00000001"),
    "9,007,199,254,740,993.00000001",
  );
  assert.equal(pointPrice("151.2300"), "151.23");
  assert.equal(pointPrice("100000"), "100,000");
  assert.equal(pointPrice("0.0000"), "0");
  for (const value of [
    null,
    undefined,
    "",
    "NaN",
    "Infinity",
    "1e-12",
    "-1",
    "1,000",
    "1abc",
    " 1",
    "01",
  ])
    assert.equal(pointPrice(value), "—");
});

test("only valid chronological timestamps remain fresh; the five-minute boundary is stale", () => {
  assert.equal(effectivePointQuote(quote(), NOW).status, "fresh");
  assert.equal(
    effectivePointQuote(quote({ sourceTime: iso(NOW - 299_999) }), NOW).status,
    "fresh",
  );
  assert.equal(
    effectivePointQuote(quote({ sourceTime: iso(NOW - 300_000) }), NOW).status,
    "stale",
  );
  for (const overrides of [
    { sourceTime: "garbage" },
    { fetchedAt: "garbage" },
    { sourceTime: null },
    { fetchedAt: null },
    { sourceTime: iso(NOW + 1) },
    { fetchedAt: iso(NOW + 1) },
    { sourceTime: iso(NOW - 500), fetchedAt: iso(NOW - 1_000) },
  ]) {
    const result = effectivePointQuote(quote(overrides), NOW);
    assert.equal(result.status, "stale", JSON.stringify(overrides));
    assert.equal(pointState(plan(), result, NOW).label, "等待行情核验");
  }
  assert.equal(effectivePointQuote(quote(), NaN).status, "stale");
  assert.equal(effectivePointQuote(undefined, NOW), undefined);
});

test("failed/stale data is never upgraded, invalid prices never become a numerical zero", () => {
  const stale = quote({ status: "stale", message: "上游失败" });
  assert.equal(effectivePointQuote(stale, NOW).status, "stale");
  assert.equal(effectivePointQuote(stale, NOW).message, "上游失败");
  const demo = quote({
    status: "stale",
    sourceTime: null,
    fetchedAt: null,
    message: "DEMO 演示价格",
  });
  assert.equal(effectivePointQuote(demo, NOW).price, "100");
  assert.equal(effectivePointQuote(demo, NOW).status, "stale");
  assert.equal(pointState(plan(), demo, NOW).label, "等待行情核验");
  for (const price of ["0", "-1", "NaN", "1e2", "", null]) {
    assert.equal(effectivePointQuote(quote({ price }), NOW).price, null);
    assert.equal(
      effectivePointQuote(quote({ price }), NOW).status,
      "unavailable",
    );
  }
  assert.equal(
    effectivePointQuote(quote({ status: "unavailable" }), NOW).price,
    null,
  );
  assert.equal(
    effectivePointQuote(quote({ sourceTime: iso(NOW - 86_400_001) }), NOW)
      .status,
    "unavailable",
  );
});

test("effective quote normalization is pure and keeps independent source/fetch times", () => {
  const original = quote({ sourceTime: iso(NOW - 360_000) });
  const before = structuredClone(original);
  const result = effectivePointQuote(original, NOW);
  assert.deepEqual(original, before);
  assert.equal(result.sourceTime, before.sourceTime);
  assert.equal(result.fetchedAt, before.fetchedAt);
  assert.notEqual(result.sourceTime, result.fetchedAt);
  assert.equal(result.status, "stale");
});

test("lifecycle and validity are evaluated before quote-based observations", () => {
  for (const [status, label] of [
    ["DRAFT", "未发布"],
    ["WITHDRAWN", "已撤回"],
    ["CLOSED", "已结束"],
  ]) {
    assert.equal(pointState(plan({ status }), undefined, NOW).label, label);
  }
  assert.equal(
    pointState(plan({ validUntil: iso(NOW) }), quote(), NOW).label,
    "已过期",
  );
  assert.equal(
    pointState(plan({ validFrom: iso(NOW + 1) }), quote(), NOW).label,
    "尚未生效",
  );
  assert.equal(
    pointState(plan({ validFrom: iso(NOW) }), quote(), NOW).label,
    "处于观察参考位",
  );
  assert.equal(
    pointState(plan({ validUntil: "broken" }), quote(), NOW).label,
    "等待计划核验",
  );
  assert.equal(
    pointState(
      plan({ validFrom: iso(NOW + 10), validUntil: iso(NOW) }),
      quote(),
      NOW,
    ).label,
    "等待计划核验",
  );
  assert.equal(
    pointState(plan(), quote({ sourceTime: iso(NOW - 360_000) }), NOW).label,
    "等待行情核验",
  );
});

test("long/short observations use inclusive ranges and do not imply execution", () => {
  const range = plan({ entryLower: "99.50", entryUpper: "100.50" });
  for (const price of ["99.50", "100", "100.5000"])
    assert.equal(
      pointState(range, quote({ price }), NOW).label,
      "处于观察参考位",
    );
  assert.equal(
    pointState(range, quote({ price: "101" }), NOW).label,
    "等待观察机会",
  );
  assert.equal(
    pointState(range, quote({ price: "99" }), NOW).label,
    "已越过观察参考",
  );
  const stopped = pointState(range, quote({ price: "90" }), NOW);
  assert.equal(stopped.label, "越过失效参考");
  assert.match(stopped.description, /不代表实际止损成交/);
  const short = plan({
    direction: "SHORT",
    stopLoss: "110",
    takeProfit: "80",
    entryLower: "99.5",
    entryUpper: "100.5",
  });
  assert.equal(
    pointState(short, quote({ price: "99" }), NOW).label,
    "等待观察机会",
  );
  assert.equal(
    pointState(short, quote({ price: "101" }), NOW).label,
    "已越过观察参考",
  );
  assert.equal(
    pointState(short, quote({ price: "110" }), NOW).label,
    "越过失效参考",
  );
  assert.equal(
    pointState(range, quote({ price: "150" }), NOW).label,
    "等待观察机会",
    "a sampled target-crossing never implies take-profit execution",
  );
  assert.equal(
    pointState(plan({ entryLower: "101", entryUpper: "99" }), quote(), NOW)
      .label,
    "等待计划核验",
  );
  assert.equal(
    pointState(plan({ stopLoss: "NaN" }), quote(), NOW).label,
    "等待计划核验",
  );
});

test("decimal comparisons distinguish values that IEEE-754 would round together", () => {
  const precise = plan({
    entryPrice: "100000000000.00000001",
    stopLoss: "99999999999.99999999",
    takeProfit: "100000000001",
  });
  assert.equal(
    pointState(precise, quote({ price: "100000000000.00000002" }), NOW).label,
    "等待观察机会",
  );
  assert.equal(
    pointState(precise, quote({ price: "100000000000.00000000" }), NOW).label,
    "已越过观察参考",
  );
  assert.equal(
    pointState(precise, quote({ price: "100000000000.00000001" }), NOW).label,
    "处于观察参考位",
  );
  const tiny = plan({
    entryPrice: "0.0000000000002",
    stopLoss: "0.0000000000001",
    takeProfit: "0.0000000000003",
  });
  assert.equal(
    pointState(tiny, quote({ price: "0.00000000000015" }), NOW).label,
    "已越过观察参考",
  );
});

test("entry labels preserve exact ranges and time labels stay in Beijing timezone", () => {
  assert.equal(
    entryLabel(plan({ entryPrice: "1000.00000001" })),
    "≈ 1,000.00000001",
  );
  assert.equal(
    entryLabel(plan({ entryLower: "999.90", entryUpper: "1000.00000001" })),
    "999.9 – 1,000.00000001",
  );
  assert.match(pointTime(iso(NOW)), /20:00/);
  assert.equal(pointTime("garbage"), "—");
});
