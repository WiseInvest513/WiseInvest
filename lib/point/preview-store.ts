import { PointError } from "./errors";
import type {
  PointInstrument,
  PointPlan,
  PointQuote,
  PointRevision,
  PointViewer,
} from "./types";

export interface PointPreviewStore {
  plans: Map<string, PointPlan>;
  revisions: Map<string, PointRevision[]>;
}

const demoPrices: Record<string, string> = {
  BTCUSDT: "100000",
  ETHUSDT: "4000",
  MUUSDT: "150",
  INTCUSDT: "25",
};

function assertPreviewEnvironment() {
  if (process.env.NODE_ENV === "production")
    throw new PointError(403, "生产环境不允许演示数据。");
}

export function getPointPreviewInstruments(): PointInstrument[] {
  assertPreviewEnvironment();
  return [
    ["BTCUSDT", "Bitcoin", "BTC", "CRYPTO"],
    ["ETHUSDT", "Ethereum", "ETH", "CRYPTO"],
    ["MUUSDT", "Micron 美光", "MU", "EQUITY"],
    ["INTCUSDT", "Intel 英特尔", "INTC", "EQUITY"],
  ].map(([symbol, name, baseAsset, category]) => ({
    provider: "BINANCE",
    market: "USD_M_FUTURES",
    symbol,
    name: `DEMO · ${name}`,
    category: category as PointInstrument["category"],
    contractType: "DEMO_PERPETUAL",
    baseAsset,
    quoteAsset: "USDT",
    marginAsset: "USDT",
    tickSize: "0.01",
    status: "TRADING",
    sourceUrl: null,
    verifiedAt: new Date().toISOString(),
  }));
}

export function getPointPreviewQuotes(symbols: string[]): PointQuote[] {
  assertPreviewEnvironment();
  return symbols.map((symbol) => ({
    symbol,
    price: demoPrices[symbol] ?? null,
    sourceTime: null,
    fetchedAt: null,
    status: demoPrices[symbol] ? "stale" : "unavailable",
    source: "BINANCE_USD_M_LAST_PRICE",
    message: "DEMO 演示价格，不是实时行情。",
  }));
}

export function createPointPreviewStore(now = Date.now()): PointPreviewStore {
  assertPreviewEnvironment();
  const plans = new Map<string, PointPlan>();
  const revisions = new Map<string, PointRevision[]>();
  const prices = [
    ["98000", "96000", "108000"],
    ["3900", "3750", "4400"],
    ["145", "138", "165"],
    ["26", "28", "22"],
  ];
  getPointPreviewInstruments().forEach((instrument, index) => {
    const timestamp = new Date(
      now - (index + 1) * 60 * 60 * 1000,
    ).toISOString();
    const plan: PointPlan = {
      id: `demo-${instrument.baseAsset.toLowerCase()}`,
      instrument,
      direction: index === 3 ? "SHORT" : "LONG",
      entryPrice: prices[index][0],
      entryLower: null,
      entryUpper: null,
      stopLoss: prices[index][1],
      takeProfit: prices[index][2],
      rationale:
        "DEMO 演示计划：仅用于验证会员权限、界面与修订流程，不代表真实观点或投资建议。",
      entryCondition: "DEMO：等待演示入场区间被确认；不要据此交易。",
      invalidationCondition: "DEMO：触及演示止损或到达有效期即失效。",
      publicSummary: "DEMO 演示数据，仅用于功能预览，不构成投资建议。",
      status: "PUBLISHED",
      version: 1,
      createdAt: timestamp,
      publishedAt: timestamp,
      updatedAt: timestamp,
      validFrom: timestamp,
      validUntil: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
      publishedReferencePrice: demoPrices[instrument.symbol],
    };
    plans.set(plan.id, plan);
    revisions.set(plan.id, [
      {
        id: `${plan.id}-v1`,
        planId: plan.id,
        version: 1,
        action: "PUBLISHED",
        reason: "DEMO 初始演示快照",
        createdAt: timestamp,
        snapshot: structuredClone(plan),
      },
    ]);
  });
  return { plans, revisions };
}

const previewGlobal = globalThis as typeof globalThis & {
  __wisePointPreviewStore?: PointPreviewStore;
};

export function getPointPreviewStore(viewer: PointViewer): PointPreviewStore {
  assertPreviewEnvironment();
  if (!viewer.previewMode)
    throw new PointError(403, "必须显式开启本地演示会话。");
  return (previewGlobal.__wisePointPreviewStore ??= createPointPreviewStore());
}

/** Synchronous compare-and-swap, no await between reading the current version and committing both records. */
export function commitPointPreviewRevision(
  store: PointPreviewStore,
  plan: PointPlan,
  revision: PointRevision,
  expectedVersion?: number,
) {
  assertPreviewEnvironment();
  const current = store.plans.get(plan.id);
  if (
    expectedVersion === undefined
      ? Boolean(current)
      : current?.version !== expectedVersion
  )
    throw new PointError(409, "该点位已被其他人更新，请刷新后重试。");
  if (
    revision.planId !== plan.id ||
    revision.version !== plan.version ||
    (store.revisions.get(plan.id) ?? []).some(
      (item) => item.version === plan.version,
    )
  )
    throw new PointError(409, "修订版本冲突。");
  store.plans.set(plan.id, structuredClone(plan));
  store.revisions.set(plan.id, [
    ...(store.revisions.get(plan.id) ?? []),
    structuredClone(revision),
  ]);
}
