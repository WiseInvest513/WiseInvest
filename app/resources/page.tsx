"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bitcoin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Minus,
  Shield,
  Zap,
  Info,
  Activity,
} from "lucide-react";
import {
  btcCycles,
  btcMilestones,
  btcEvents,
  mag7Info,
  etfReferences,
  valuationSignals,
  CYCLE4,
  type EventType,
} from "@/lib/data-center";
import type { StockData } from "@/app/api/market/stocks/route";
import BTCChart from "@/components/info-center/BTCChart";
import {
  MarketCapChart,
  PEChart,
  MarginsChart,
  YearChangeChart,
  RevenueChart,
} from "@/components/info-center/StocksCharts";
import {
  ETFReturnChart,
  ETFExpenseChart,
  ValuationGauges,
} from "@/components/info-center/IndexCharts";

// ─── 工具函数 ────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined, dec = 2): string {
  if (n == null) return "—";
  return n.toFixed(dec);
}
function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function fmtPct(n: number | null | undefined, suffix = "%"): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}${suffix}`;
}
function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "刚刚更新";
  if (mins < 60) return `${mins} 分钟前更新`;
  return `${Math.floor(mins / 60)} 小时前更新`;
}

// ─── 颜色配置 ────────────────────────────────────────────────────────────────
const eventColors: Record<EventType, { badge: string; dot: string; bg: string }> = {
  bull:       { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  bear:       { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",               dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-950/30" },
  hack:       { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",   dot: "bg-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/30" },
  regulation: { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",   dot: "bg-purple-500",  bg: "bg-purple-50 dark:bg-purple-950/30" },
  macro:      { badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",   dot: "bg-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  milestone:  { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",           dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30" },
};
const eventLabels: Record<EventType, string> = {
  bull: "牛市", bear: "熊市", hack: "安全", regulation: "监管", macro: "宏观", milestone: "里程碑",
};
const milestoneColors = {
  genesis: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  first:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  bull:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  bear:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ath:     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

// ─── BTC 周期概况 ─────────────────────────────────────────────────────────────
interface BTCData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChangePercent7d: number;
  priceChangePercent30d: number;
  priceChangePercent1y: number;
  marketCap: number;
  dominance: number;
  volume24h: number;
  circulatingSupply: number;
  ath: number;
  athDate: string;
  updatedAt: number;
  stale?: boolean;
}

function BTCCycleTab() {
  const [data, setData] = useState<BTCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const r = await fetch("/api/market/btc");
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 周期计算
  const now = new Date();
  const halvingMs = CYCLE4.halvingDate.getTime();
  const daysSinceHalving = Math.floor((now.getTime() - halvingMs) / 86400000);
  const topMs = CYCLE4.knownTopDate.getTime();
  const daysSinceTop = Math.floor((now.getTime() - topMs) / 86400000);
  const nextHalvingMs = CYCLE4.nextHalvingEst.getTime();
  const daysToNextHalving = Math.max(0, Math.floor((nextHalvingMs - now.getTime()) / 86400000));
  const cycleProgress = Math.min(100, (daysSinceHalving / CYCLE4.cycleDays) * 100);

  // 当前阶段判断（基于 WolfyXBT 四年周期理论）
  // 减半后 0-180天: 牛市初期 | 180-534天: 牛市中后期 | 顶后>60天: 熊市
  let phaseLabel = "牛市初期";
  let phaseColor = "text-emerald-600 dark:text-emerald-400";
  if (daysSinceTop > 60) {
    phaseLabel = daysSinceTop > 200 ? "熊市中期" : "熊市初期 / 过渡期";
    phaseColor = "text-red-500 dark:text-red-400";
  } else if (daysSinceHalving > 400) {
    phaseLabel = "牛市后期 / 顶部区";
    phaseColor = "text-orange-500 dark:text-orange-400";
  } else if (daysSinceHalving > 180) {
    phaseLabel = "牛市中期";
    phaseColor = "text-amber-500 dark:text-amber-400";
  }

  const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 px-4 py-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-base font-bold text-slate-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );

  const PctBadge = ({ v }: { v: number | null | undefined }) => {
    if (v == null) return <span className="text-slate-400">—</span>;
    const pos = v >= 0;
    return <span className={pos ? "text-emerald-500" : "text-red-500"}>{fmtPct(v)}</span>;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch">

      {/* 左栏：图表 + 文字分析 */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* 价格历史图 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">BTC 价格历史（对数坐标）· 牛熊阶段 · 减半标记</h3>
          <BTCChart variant="cycle" height={650} />
        </div>

        {/* 四年周期分析 */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-0.5">第四次减半周期进度</h3>
              <p className="text-xs text-slate-400">减半日：2024-04-20 &nbsp;·&nbsp; 当前周期：第 <span className="font-medium text-slate-600 dark:text-slate-300">{daysSinceHalving}</span> 天（共约 1,460 天）</p>
            </div>
            <span className={`text-sm font-semibold ${phaseColor}`}>{phaseLabel}</span>
          </div>

          {/* 进度条 */}
          <div className="relative mb-5">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
            <div className="absolute top-0 h-3 w-0.5 bg-emerald-400 dark:bg-emerald-500" style={{ left: `${(527/1460)*100}%` }} />
            <div
              className="absolute -top-0.5 w-4 h-4 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full shadow-md transition-all duration-700"
              style={{ left: `calc(${cycleProgress}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mb-4">
            <span>减半 2024-04-20</span>
            <span className="text-emerald-500">↑ 实际顶部（527天 $123k）</span>
            <span>预计下次减半 ~2028-03</span>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-medium">WolfyXBT 四年周期理论：</span>前三次减半后约 367-548 天出现周期高点，高点后约 363-411 天到达熊市底部。第四周期实际顶部为减半后第 527 天（2025-09-29，$123,513）。WolfyXBT预测534天/$126k，实际误差不足3%。当前处于减半后 {daysSinceHalving} 天，仅供参考，不构成投资建议。
            </p>
          </div>
        </div>
      </div>

      {/* 右栏：实时数据 + 历史表格 */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-4">

        {/* 实时数据 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">实时概况</h3>
            <div className="flex items-center gap-2">
              {data && <span className="text-xs text-slate-400">{timeAgo(data.updatedAt)}</span>}
              {data?.stale && <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />延迟</span>}
              <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> API 速率限制，请稍后重试
            </div>
          )}

          {loading && !data && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          )}

          {data && (
            <div className="space-y-1.5">
              {[
                { label: "当前价格", value: `$${data.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sub: fmtPct(data.priceChangePercent24h), subColor: data.priceChangePercent24h >= 0 ? "text-emerald-500" : "text-red-500" },
                { label: "市值", value: fmtPrice(data.marketCap) },
                { label: "BTC 主导率", value: `${fmt(data.dominance, 1)}%` },
                { label: "24h 交易量", value: fmtPrice(data.volume24h) },
                { label: "流通供应量", value: `${(data.circulatingSupply / 1e6).toFixed(2)}M / 21M` },
                { label: "历史最高价", value: `$${data.ath.toLocaleString()}` },
              ].map(({ label, value, sub, subColor }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {value}
                    {sub && <span className={`ml-1.5 font-medium ${subColor}`}>{sub}</span>}
                  </span>
                </div>
              ))}
              <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1">
                {[["7日", data.priceChangePercent7d], ["30日", data.priceChangePercent30d], ["1年", data.priceChangePercent1y]].map(([label, v]) => (
                  <div key={label as string} className="flex items-center gap-1 text-xs text-slate-400">
                    <span>{label}</span>
                    <PctBadge v={v as number} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 周期进度卡片 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">本周期进度</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs text-slate-400 mb-1">距第4次减半</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{daysSinceHalving} 天</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs text-slate-400 mb-1">距实际高点</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{daysSinceTop} 天</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs text-slate-400 mb-1">周期完成度</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{cycleProgress.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs text-slate-400 mb-1">距下次减半</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{daysToNextHalving} 天</div>
            </div>
          </div>
        </div>

        {/* 历史减半数据卡片 */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">历次减半周期</h3>
          <div className="space-y-2">
            {btcCycles.map((c) => (
              <div key={c.cycleNum} className={`rounded-lg p-3 ${c.cycleNum === 4 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50" : "bg-slate-50 dark:bg-slate-800/60"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">第 {c.cycleNum} 次减半</span>
                  <span className="text-xs font-mono text-slate-400">{c.halvingDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="text-xs text-slate-400">减半价 <span className="text-slate-700 dark:text-slate-200 font-medium">${c.halvingPrice.toLocaleString()}</span></div>
                  <div className="text-xs text-slate-400">高点价 <span className={`font-medium ${c.cycleNum === 4 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>${c.bullTopPrice.toLocaleString()}</span></div>
                  <div className="text-xs text-slate-400">高点日 <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{c.bullTopDate || "进行中"}</span></div>
                  <div className="text-xs text-slate-400">天数 <span className="text-slate-700 dark:text-slate-200 font-medium">{c.bullDays > 0 ? `${c.bullDays}天` : "—"}</span></div>
                  <div className="text-xs text-slate-400">奖励 <span className="text-slate-600 dark:text-slate-300">{c.rewardBefore}→{c.rewardAfter} BTC</span></div>
                  <div className="text-xs text-slate-400">涨幅 <span className="font-semibold text-violet-600 dark:text-violet-400">{c.gainFromBottom}</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">* 第4周期高点：2025-09-29 $123,513（Yahoo Finance）</p>
        </div>
      </div>
    </div>
  );
}

// ─── BTC 价格历史 ─────────────────────────────────────────────────────────────
function BTCMilestonesTab() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">价格里程碑</h2>
        <p className="text-sm text-slate-400">从创世到 $108k，每个关键价格背后的故事</p>
      </div>
      {/* 里程碑图表 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">历史价格曲线 · 关键里程碑标注</h3>
        <BTCChart variant="milestones" height={380} />
        <p className="text-xs text-slate-400 mt-2">竖线标注各里程碑时间点，悬停查看价格</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {btcMilestones.map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${milestoneColors[m.type]}`}>
                {m.type === "ath" ? "历史高点" : m.type === "bear" ? "熊市底" : m.type === "bull" ? "牛市" : m.type === "genesis" ? "创世" : "首次"}
              </span>
              <span className="text-xs text-slate-400 font-mono">{m.date}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">{m.price}</div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{m.title}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BTC 重大事件 ─────────────────────────────────────────────────────────────
function BTCEventsTab() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">重大事件分析</h2>
        <p className="text-sm text-slate-400">每次大涨大跌背后的真实原因</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(Object.keys(eventLabels) as EventType[]).map((t) => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventColors[t].badge}`}>{eventLabels[t]}</span>
          ))}
        </div>
      </div>
      {/* 事件图表 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">历史价格曲线 · 重大事件标注</h3>
        <BTCChart variant="events" height={380} />
        <p className="text-xs text-slate-400 mt-2">竖线对应各重大事件时间点，颜色区分事件类型</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {btcEvents.map((e, i) => {
          const c = eventColors[e.type];
          return (
            <div key={i} className={`rounded-xl border p-4 ${c.bg} border-slate-200 dark:border-slate-700/50`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>{eventLabels[e.type]}</span>
                <span className="text-xs text-slate-400 font-mono">{e.date}</span>
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{e.title}</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" />{e.impact}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{e.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 美股七巨头 数据快照 ──────────────────────────────────────────────────────
function StocksDataTab() {
  const [stocks, setStocks] = useState<StockData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const r = await fetch("/api/market/stocks");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setStocks(d.stocks);
      setUpdatedAt(d.updatedAt);
      setStale(!!d.stale);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const Row = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className={`flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${highlight ? "font-medium" : ""}`}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs ${highlight ? "text-slate-900 dark:text-white font-semibold" : "text-slate-600 dark:text-slate-300"}`}>{value}</span>
    </div>
  );

  const PctCell = ({ v }: { v: number | null }) => {
    if (v == null) return <span className="text-slate-400 text-xs">—</span>;
    return <span className={`text-xs font-medium ${v >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(v)}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">美股七巨头数据快照</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {updatedAt ? timeAgo(updatedAt) : "加载中..."}
            {stale && " · 数据可能延迟"}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> 股票数据加载失败，可能是 Yahoo Finance API 限制，请稍后重试
        </div>
      )}

      {loading && !stocks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(7)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      )}

      {/* 图表对比 */}
      {stocks && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
              <MarketCapChart stocks={stocks} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
              <PEChart stocks={stocks} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
              <MarginsChart stocks={stocks} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
              <YearChangeChart stocks={stocks} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <RevenueChart stocks={stocks} />
          </div>
        </div>
      )}

      {stocks && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stocks.map((s) => {
            const info = mag7Info.find(m => m.ticker === s.ticker);
            const priceUp = s.priceChangePercent >= 0;
            return (
              <div key={s.ticker} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 flex flex-col gap-3">
                {/* 头部 */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info?.emoji ?? "📈"}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{s.ticker}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{info?.sector}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900 dark:text-white">${s.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                    <div className={`text-xs font-medium ${priceUp ? "text-emerald-500" : "text-red-500"}`}>
                      {priceUp ? "▲" : "▼"} {Math.abs(s.priceChange).toFixed(2)} ({Math.abs(s.priceChangePercent).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* 核心估值 */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    ["市值", fmtPrice(s.marketCap)],
                    ["PE", s.pe ? `${s.pe.toFixed(1)}x` : "—"],
                    ["远期PE", s.forwardPE ? `${s.forwardPE.toFixed(1)}x` : "—"],
                    ["EPS", s.eps ? `$${s.eps.toFixed(2)}` : "—"],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5 text-center">
                      <div className="text-xs text-slate-400 mb-0.5">{l}</div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{v}</div>
                    </div>
                  ))}
                </div>

                {/* 财务指标 */}
                <div className="space-y-0">
                  <Row label="营收（年）" value={fmtPrice(s.revenue)} highlight />
                  <Row label="营收增速" value={<PctCell v={s.revenueGrowth} />} />
                  <Row label="毛利率" value={s.grossMargin ? `${s.grossMargin.toFixed(1)}%` : "—"} />
                  <Row label="净利率" value={s.netMargin ? `${s.netMargin.toFixed(1)}%` : "—"} />
                  <Row label="ROE（净资产收益）" value={s.roe ? `${s.roe.toFixed(1)}%` : "—"} />
                  <Row label="自由现金流" value={fmtPrice(s.freeCashflow)} />
                  <Row label="Beta（市场相关性）" value={s.beta ? s.beta.toFixed(2) : "—"} />
                  <Row label="52周高/低" value={s.week52High && s.week52Low ? `$${s.week52High.toFixed(0)} / $${s.week52Low.toFixed(0)}` : "—"} />
                  <Row label="52周涨跌" value={<PctCell v={s.week52ChangePercent} />} />
                  <Row label="分析师目标价" value={s.targetPrice ? `$${s.targetPrice.toFixed(0)}` : "—"} />
                  {s.dividendYield && <Row label="股息率" value={`${s.dividendYield.toFixed(2)}%`} />}
                  <Row label="市净率（P/B）" value={s.priceToBook ? `${s.priceToBook.toFixed(1)}x` : "—"} />
                </div>

                {/* 叙事 */}
                {info && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{info.coreNarrative}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 美股七巨头 市场解读 ──────────────────────────────────────────────────────
function StocksNarrativeTab() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">七巨头深度解读</h2>
        <p className="text-sm text-slate-400">护城河、核心叙事、主要风险一览</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {mag7Info.map((m) => (
          <div key={m.ticker} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{m.emoji}</span>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{m.ticker} · {m.name}</div>
                <div className="text-xs text-slate-400">{m.sector}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3" />核心叙事</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.coreNarrative}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><Shield className="w-3 h-3" />护城河</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.moat}</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />主要风险</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.risk}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 指数：ETF 参考 ───────────────────────────────────────────────────────────
function ETFTab() {
  const catColors: Record<string, string> = {
    "美股大盘": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "科技成长": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    "全市场":   "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    "高股息":   "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    "债券":     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "黄金/商品":"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    "国际发达": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    "新兴市场": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  };
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">ETF 参考手册</h2>
            <p className="text-sm text-slate-400">核心 ETF 的费率、特点与适用场景</p>
          </div>
          <a href="https://www.wise-etf.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline">
            Wise ETF <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
      {/* ETF 图表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <ETFReturnChart />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
          <ETFExpenseChart />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {etfReferences.map((etf) => (
          <div key={etf.ticker} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{etf.ticker}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${catColors[etf.category] ?? "bg-slate-100 text-slate-600"}`}>{etf.category}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{etf.name}</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{etf.description}</p>
            <div className="flex flex-wrap gap-3">
              <div className="text-xs"><span className="text-slate-400">追踪：</span><span className="text-slate-600 dark:text-slate-300 font-medium">{etf.tracks}</span></div>
              <div className="text-xs"><span className="text-slate-400">费率：</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{etf.expenseRatio}</span></div>
              <div className="text-xs"><span className="text-slate-400">发行：</span><span className="text-slate-600 dark:text-slate-300">{etf.provider}</span></div>
              <div className="text-xs"><span className="text-slate-400">近10年年化：</span><span className="text-violet-600 dark:text-violet-400 font-medium">{etf.annualReturn10y}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 指数：估值参考 ───────────────────────────────────────────────────────────
function ValuationTab() {
  const signalColors = {
    green:  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500" },
    yellow: { bg: "bg-amber-50 dark:bg-amber-950/30",    border: "border-amber-200 dark:border-amber-800/50",    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",    dot: "bg-amber-500" },
    red:    { bg: "bg-red-50 dark:bg-red-950/30",        border: "border-red-200 dark:border-red-800/50",        badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",            dot: "bg-red-500" },
  };
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">估值参考体系</h2>
        <p className="text-sm text-slate-400">判断市场高估/低估的核心指标，当前信号一览</p>
      </div>
      {/* 估值仪表盘 + 增长模拟 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 mb-1">
        <ValuationGauges />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {valuationSignals.map((v, i) => {
          const c = signalColors[v.signal];
          return (
            <div key={i} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{v.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${c.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{v.signalText}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{v.description}</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-lg bg-white/60 dark:bg-slate-900/60 p-2">
                  <div className="text-xs text-slate-400 mb-0.5">当前读数</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{v.currentReading}</div>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-slate-900/60 p-2">
                  <div className="text-xs text-slate-400 mb-0.5">历史均值</div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{v.historicalAvg}</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.note}</p>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            估值指标仅作为长期配置参考，不适用于短期择时。高估值可以维持很长时间，低估值也可以继续下跌。建议结合自身风险承受力和投资周期做决策。
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 模块配置 ─────────────────────────────────────────────────────────────────
type ModuleId = "btc" | "stocks" | "index";
type SectionId = string;

const modules = [
  {
    id: "btc" as ModuleId,
    label: "比特币",
    icon: <Bitcoin className="w-4 h-4" />,
    sections: [
      { id: "cycle", label: "周期概况" },
      { id: "milestones", label: "价格里程碑" },
      { id: "events", label: "重大事件" },
    ],
  },
  {
    id: "stocks" as ModuleId,
    label: "美股七巨头",
    icon: <BarChart3 className="w-4 h-4" />,
    sections: [
      { id: "data", label: "数据快照" },
      { id: "narrative", label: "深度解读" },
    ],
  },
  {
    id: "index" as ModuleId,
    label: "指数基金",
    icon: <TrendingUp className="w-4 h-4" />,
    sections: [
      { id: "etf", label: "ETF 参考" },
      { id: "valuation", label: "估值参考" },
    ],
  },
];

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function InfoCenterPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("btc");
  const [activeSection, setActiveSection] = useState<SectionId>("cycle");

  const currentModule = modules.find((m) => m.id === activeModule)!;

  const handleModuleChange = (id: ModuleId) => {
    setActiveModule(id);
    setActiveSection(modules.find((m) => m.id === id)!.sections[0].id);
  };

  const renderContent = () => {
    if (activeModule === "btc") {
      if (activeSection === "cycle")      return <BTCCycleTab />;
      if (activeSection === "milestones") return <BTCMilestonesTab />;
      if (activeSection === "events")     return <BTCEventsTab />;
    }
    if (activeModule === "stocks") {
      if (activeSection === "data")      return <StocksDataTab />;
      if (activeSection === "narrative") return <StocksNarrativeTab />;
    }
    if (activeModule === "index") {
      if (activeSection === "etf")       return <ETFTab />;
      if (activeSection === "valuation") return <ValuationTab />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative dot-grid dot-grid-subtle">
      {/* 全宽顶部标题栏 */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="px-4 sm:px-8 py-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">核心数据</h1>
          <p className="text-xs text-slate-400 mt-0.5">比特币 · 美股七巨头 · 指数基金 — 实时数据 + 深度叙事</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* 左侧固定边栏 */}
        <aside className="w-52 flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {modules.map((mod) => (
              <div key={mod.id}>
                <button
                  onClick={() => handleModuleChange(mod.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeModule === mod.id
                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {mod.icon}
                  <span>{mod.label}</span>
                </button>
                {activeModule === mod.id && (
                  <div className="ml-4 mt-1 border-l-2 border-amber-200 dark:border-amber-800/60 pl-3 space-y-0.5">
                    {mod.sections.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          activeSection === sec.id
                            ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/60 dark:bg-amber-900/20"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* 主内容区（可滚动） */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 移动端顶部 Tab 导航 */}
          <div className="md:hidden flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {modules.map((mod) => (
                <button key={mod.id} onClick={() => handleModuleChange(mod.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeModule === mod.id
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {mod.icon}{mod.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentModule.sections.map((sec) => (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    activeSection === sec.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* 内容滚动区 */}
          <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
