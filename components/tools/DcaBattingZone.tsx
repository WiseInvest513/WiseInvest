"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingDown,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SymbolKey = "BTC" | "ETH" | "QQQ";
type ZoneStatus = "regular" | "batting" | "deep";

interface ChartPoint {
  date: string;
  close: number;
  rollingHigh: number;
  drawdown: number;
}

interface ZoneData {
  symbol: SymbolKey;
  name: string;
  proxyLabel: string;
  source: string;
  sourceUrl: string;
  quoteCurrency: "USD" | "USDT";
  asOf: string;
  currentPrice: number;
  high52Week: number;
  high52WeekDate: string;
  drawdown: number;
  distanceToBattingZone: number;
  status: ZoneStatus;
  points: ChartPoint[];
  stale?: boolean;
}

const products: Array<{
  symbol: SymbolKey;
  label: string;
}> = [
  { symbol: "BTC", label: "比特币" },
  { symbol: "ETH", label: "以太坊" },
  { symbol: "QQQ", label: "纳斯达克 100" },
];

const statusContent = {
  regular: {
    label: "常规定投",
    headline: "还没有进入击球区",
    description: "按原有频率继续，不因为接近高点而停投；备用资金继续等待。",
    accent: "#10b981",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    panel:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white dark:border-emerald-900 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-900",
    Icon: ShieldCheck,
  },
  batting: {
    label: "进入击球区",
    headline: "回撤已超过 10%",
    description: "基础定投照常。如果事先留有增量资金，可以开始执行预设的分批计划。",
    accent: "#f59e0b",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    panel:
      "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-white dark:border-amber-800 dark:from-amber-950 dark:via-slate-900 dark:to-slate-900",
    Icon: Target,
  },
  deep: {
    label: "深度击球区",
    headline: "回撤已超过 20%",
    description: "空间变大，波动也会变大。仍然分批执行，不把“跌得多”误认为“已经见底”。",
    accent: "#f97316",
    badge:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    panel:
      "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white dark:border-orange-800 dark:from-orange-950 dark:via-slate-900 dark:to-slate-900",
    Icon: TrendingDown,
  },
} satisfies Record<
  ZoneStatus,
  {
    label: string;
    headline: string;
    description: string;
    accent: string;
    badge: string;
    panel: string;
    Icon: typeof Target;
  }
>;

const rules: Array<{
  status: ZoneStatus;
  range: string;
  title: string;
  action: string;
}> = [
  {
    status: "regular",
    range: "回撤小于 10%",
    title: "常规定投",
    action: "按原计划继续；不要为了等回撤长期停投。",
  },
  {
    status: "batting",
    range: "回撤 10%–20%",
    title: "进入击球区",
    action: "备用资金可以启动，但仍拆成多次投入。",
  },
  {
    status: "deep",
    range: "回撤达到 20%",
    title: "深度击球区",
    action: "保留现金安全垫，避免一次打满和使用杠杆。",
  },
];

function formatPrice(value: number, currency: "USD" | "USDT") {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
  return currency === "USDT" ? `${formatted} USDT` : `$${formatted}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function DrawdownTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  currency: "USD" | "USDT";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="min-w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {formatDate(point.date)}
      </p>
      <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
        回撤 {point.drawdown.toFixed(2)}%
      </p>
      <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <p>收盘价：{formatPrice(point.close, currency)}</p>
        <p>当时 52 周高点：{formatPrice(point.rollingHigh, currency)}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="正在获取产品行情">
      <div className="h-52 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-[360px] animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
    </div>
  );
}

export function DcaBattingZone() {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolKey>("BTC");
  const [dataBySymbol, setDataBySymbol] = useState<
    Partial<Record<SymbolKey, ZoneData>>
  >({});
  const [loadingSymbol, setLoadingSymbol] = useState<SymbolKey | null>("BTC");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (symbol: SymbolKey, force = false) => {
    setLoadingSymbol(symbol);
    setError(null);

    try {
      const response = await fetch(
        `/api/market/dca-zone?symbol=${symbol}${force ? `&refresh=${Date.now()}` : ""}`
      );
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || "行情暂时不可用");
      }

      setDataBySymbol((current) => ({ ...current, [symbol]: body }));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "行情暂时不可用"
      );
    } finally {
      setLoadingSymbol((current) => (current === symbol ? null : current));
    }
  }, []);

  useEffect(() => {
    if (!dataBySymbol[selectedSymbol]) {
      void loadData(selectedSymbol);
    }
  }, [dataBySymbol, loadData, selectedSymbol]);

  const data = dataBySymbol[selectedSymbol];
  const meta = data ? statusContent[data.status] : null;
  const chartDomain = useMemo<[number, number]>(() => {
    if (!data?.points.length) return [-25, 0];
    const minimum = Math.min(...data.points.map((point) => point.drawdown));
    const lower = Math.max(-60, Math.min(-25, Math.floor((minimum - 2) / 5) * 5));
    return [lower, 0];
  }, [data]);
  const yTicks = useMemo(
    () => [...new Set([chartDomain[0], -20, -10, 0])].sort((a, b) => a - b),
    [chartDomain]
  );

  const handleSelect = (symbol: SymbolKey) => {
    setSelectedSymbol(symbol);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
        <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800 md:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                <Target className="h-4 w-4" />
                Long-term Investing
              </div>
              <h1 className="mt-2 font-serif text-3xl font-black text-slate-950 dark:text-white md:text-4xl">
                DCA
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 md:text-base">
                BTC、ETH、QQQ 三个产品，一个规则：基础定投不停，回撤到线后再判断是否启用备用资金。
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              日线自动更新
            </div>
          </div>
        </div>

        <div className="p-4 md:p-7">
          <div
            className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-700 dark:bg-slate-800"
            role="tablist"
            aria-label="选择定投产品"
          >
            {products.map((product) => {
              const selected = selectedSymbol === product.symbol;
              return (
                <button
                  key={product.symbol}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleSelect(product.symbol)}
                  className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    selected
                      ? "bg-slate-950 text-white shadow-md ring-1 ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <span className="font-black tracking-wide">{product.symbol}</span>
                  <span className="ml-1 hidden text-xs font-medium opacity-70 sm:inline">
                    · {product.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6" aria-live="polite">
            {loadingSymbol === selectedSymbol && !data ? (
              <LoadingState />
            ) : error && !data ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-950">
                <AlertTriangle className="h-9 w-9 text-amber-500" />
                <h2 className="mt-3 font-bold text-slate-900 dark:text-white">
                  暂时没有拿到行情
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {error}。规则说明仍可在下方查看。
                </p>
                <button
                  type="button"
                  onClick={() => void loadData(selectedSymbol, true)}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  重新获取
                </button>
              </div>
            ) : data && meta ? (
              <div className="space-y-6">
                <div className={`rounded-3xl border p-5 md:p-7 ${meta.panel}`}>
                  <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
                    <div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${meta.badge}`}
                      >
                        <meta.Icon className="h-4 w-4" />
                        {meta.label}
                      </span>
                      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {data.name} · {data.proxyLabel}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white md:text-3xl">
                        {meta.headline}
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                        {meta.description}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          基础定投：始终开启
                        </span>
                        <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
                          数据截至 {formatDate(data.asOf)}
                        </span>
                        {data.stale && (
                          <span className="rounded-full bg-amber-100 px-3 py-1.5 font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            当前为缓存数据
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          当前距 52 周高点
                        </p>
                        <p
                          className="mt-1 text-4xl font-black tracking-tight"
                          style={{ color: meta.accent }}
                        >
                          {data.drawdown.toFixed(2)}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          最新收盘
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                          {formatPrice(data.currentPrice, data.quoteCurrency)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          52 周最高收盘
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                          {formatPrice(data.high52Week, data.quoteCurrency)}
                        </p>
                      </div>
                      <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          距离 -10% 击球线
                        </p>
                        <p className="mt-1 font-bold text-slate-900 dark:text-white">
                          {data.distanceToBattingZone === 0
                            ? "已经进入区间"
                            : `还差 ${data.distanceToBattingZone.toFixed(2)} 个百分点`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-950 md:p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        近 52 周回撤曲线
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        曲线跌破 -10% 进入击球区；跌破 -20% 进入深度击球区。
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      以每日收盘价计算
                    </span>
                  </div>

                  <div
                    className="h-[300px] w-full md:h-[370px]"
                    role="img"
                    aria-label={`${data.name}近52周回撤曲线，当前回撤${data.drawdown.toFixed(2)}%，状态为${meta.label}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.points}
                        margin={{ top: 16, right: 12, left: -8, bottom: 4 }}
                      >
                        <defs>
                          <linearGradient id="dcaDrawdownFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={meta.accent} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={meta.accent} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <ReferenceArea
                          y1={-10}
                          y2={0}
                          fill="#94a3b8"
                          fillOpacity={0.08}
                        />
                        <ReferenceArea
                          y1={-20}
                          y2={-10}
                          fill="#f59e0b"
                          fillOpacity={0.16}
                        />
                        <ReferenceArea
                          y1={chartDomain[0]}
                          y2={-20}
                          fill="#f97316"
                          fillOpacity={0.14}
                        />
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                        />
                        <XAxis
                          dataKey="date"
                          minTickGap={46}
                          tickFormatter={(value: string) => value.slice(5).replace("-", "/")}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={chartDomain}
                          ticks={yTicks}
                          tickFormatter={(value: number) => `${value}%`}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                        />
                        <Tooltip
                          content={<DrawdownTooltip currency={data.quoteCurrency} />}
                        />
                        <ReferenceLine
                          y={-10}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          strokeDasharray="6 5"
                          label={{
                            value: "击球线 -10%",
                            position: "insideTopRight",
                            fill: "#d97706",
                            fontSize: 11,
                          }}
                        />
                        <ReferenceLine
                          y={-20}
                          stroke="#f97316"
                          strokeWidth={1.5}
                          strokeDasharray="6 5"
                          label={{
                            value: "深度线 -20%",
                            position: "insideTopRight",
                            fill: "#ea580c",
                            fontSize: 11,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="drawdown"
                          name="回撤"
                          stroke={meta.accent}
                          strokeWidth={2.5}
                          fill="url(#dcaDrawdownFill)"
                          isAnimationActive={false}
                          activeDot={{ r: 5, strokeWidth: 2, fill: meta.accent }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="定投击球区规则">
        {rules.map((rule) => {
          const active = data?.status === rule.status;
          const ruleMeta = statusContent[rule.status];
          return (
            <article
              key={rule.status}
              className={`rounded-2xl border p-5 transition-colors ${
                active
                  ? `${ruleMeta.panel} ring-2 ring-amber-400/50`
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {rule.range}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                    {rule.title}
                  </h3>
                </div>
                {active && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black text-white">
                    当前
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {rule.action}
              </p>
            </article>
          );
        })}
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer list-none font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-white">
          <span className="flex items-center justify-between gap-4">
            这个规则怎么算？
            <span className="text-xl text-slate-400 transition-transform group-open:rotate-45">＋</span>
          </span>
        </summary>
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>
            每个产品都用“最新日线收盘价 ÷ 过去 52 周最高日线收盘价 − 1”计算回撤。QQQ 按 252 个交易日计算，BTC 与 ETH 按 365 个自然日计算；10% 和 20% 只是回撤分区，不是对底部的预测。
          </p>
          <p>
            QQQ 作为纳斯达克 100 的可投资代理；BTC 与 ETH 使用 OKX 的 USDT 日线。不同产品、交易所与数据口径之间可能存在少量差异。
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            {data && (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400"
              >
                行情来源：{data.source}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href="https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400"
            >
              Investor.gov：定投说明
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.finra.org/investors/insights/key-terms-tough-times-vocabulary-stressed-markets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-400"
            >
              FINRA：10% / 20% 区间
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </details>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          击球区不是抄底信号，也不预测反弹。产品进入区间后仍可能继续下跌；定投不能保证盈利，也不能避免亏损。请先保留应急资金，并按自己的风险承受能力执行。
        </p>
      </div>
    </div>
  );
}
