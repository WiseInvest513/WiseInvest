"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import {
  btcPriceHistory,
  btcHalvings,
  btcMilestones,
  btcEvents,
  type BTCPricePoint,
} from "@/lib/data-center";

// ─── WolfyXBT 4年周期阶段（正确定义）────────────────────────────────────────
// 牛市 = 熊市底部 → 下一个牛市高点（约1064天）
// 熊市 = 牛市高点 → 下一个熊市底部（约364-413天）
// 各周期关键日期：
//   底部: 2015-01-14 | 2018-12-15 | 2022-11-21
//   高点: 2013-11-30 | 2017-12-17 | 2021-11-10 | 2025-09-29
const wolfyPhases = [
  { x1: "2012-01-01",  x2: "2013-11-30", type: "bull" as const, daysLabel: "早期" },
  { x1: "2013-11-30",  x2: "2015-01-14", type: "bear" as const, daysLabel: "413天" },
  { x1: "2015-01-14",  x2: "2017-12-17", type: "bull" as const, daysLabel: "1068天" },
  { x1: "2017-12-17",  x2: "2018-12-15", type: "bear" as const, daysLabel: "363天" },
  { x1: "2018-12-15",  x2: "2021-11-10", type: "bull" as const, daysLabel: "1061天" },
  { x1: "2021-11-10",  x2: "2022-11-21", type: "bear" as const, daysLabel: "376天" },
  { x1: "2022-11-21",  x2: "2025-09-29", type: "bull" as const, daysLabel: "1042天" },
  { x1: "2025-09-29",  x2: "2026-12-31", type: "bear" as const, daysLabel: "~364天" },
];

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// ─── 工具 ────────────────────────────────────────────────────────
function fmtPrice(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v}`;
}

// ─── 自定义 Tooltip ───────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.value;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="text-slate-400 mb-1">{label}</div>
      {p != null && (
        <div className="font-bold text-amber-600 dark:text-amber-400">
          ${p.toLocaleString("en-US")}
        </div>
      )}
    </div>
  );
}

// ─── 减半日标签 ───────────────────────────────────────────────────
function HalvingLabel({
  viewBox,
  label,
}: {
  viewBox?: { x: number; y: number; height: number };
  label: string;
}) {
  if (!viewBox) return null;
  return (
    <g>
      <rect x={viewBox.x - 1} y={viewBox.y} width={46} height={30} rx={3} fill="#3b82f6" fillOpacity={0.9} />
      <text x={viewBox.x + 22} y={viewBox.y + 12} fontSize={9} fill="white" fontWeight={700} textAnchor="middle">
        减半日
      </text>
      <text x={viewBox.x + 22} y={viewBox.y + 24} fontSize={8} fill="white" fillOpacity={0.85} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

// ─── 牛熊标注（带天数） ────────────────────────────────────────────
function PhaseBgLabel({
  viewBox,
  label,
  daysLabel,
  type,
}: {
  viewBox?: { x: number; y: number; width: number; height: number };
  label: string;
  daysLabel: string;
  type: "bull" | "bear";
}) {
  if (!viewBox || viewBox.width < 40) return null;
  const cx = viewBox.x + viewBox.width * 0.5;
  const topY = viewBox.y + 28;
  const color = type === "bull" ? "#10b981" : "#ef4444";

  return (
    <g>
      {/* 边框 */}
      <rect
        x={viewBox.x + 1}
        y={viewBox.y + 1}
        width={viewBox.width - 2}
        height={viewBox.height - 2}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
        rx={2}
      />
      {/* 牛市/熊市 */}
      <text x={cx} y={topY} textAnchor="middle" fontSize={15} fontWeight={700} fill={color} fillOpacity={0.65}>
        {label}
      </text>
      {/* 天数标签（WolfyXBT模型值） */}
      <text x={cx} y={topY + 17} textAnchor="middle" fontSize={11} fill={color} fillOpacity={0.5} fontWeight={600}>
        {daysLabel}
      </text>
    </g>
  );
}

// ─── 里程碑/事件旋转标签 ──────────────────────────────────────────
function EventLineLabel({
  viewBox,
  label,
  color,
}: {
  viewBox?: { x: number; y: number; height: number };
  label: string;
  color: string;
}) {
  if (!viewBox) return null;
  return (
    <g transform={`translate(${viewBox.x}, ${viewBox.y + 8}) rotate(-90)`}>
      <text x={0} y={0} fontSize={8} fill={color} fontWeight={600} opacity={0.85} dominantBaseline="auto">
        {label}
      </text>
    </g>
  );
}

// ─── 主图表组件 ───────────────────────────────────────────────────
interface BTCChartProps {
  variant: "cycle" | "milestones" | "events";
  height?: number;
}

type ViewMode = "all" | "recent";

export default function BTCChart({ variant, height = 400 }: BTCChartProps) {
  const [priceData, setPriceData] = useState<BTCPricePoint[]>(btcPriceHistory);
  const [dataSource, setDataSource] = useState<"static" | "live">("static");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    fetch("/api/market/btc-history")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history) && d.history.length > 50) {
          setPriceData(d.history);
          setDataSource("live");
        }
      })
      .catch(() => {});
  }, []);

  // 根据视图模式过滤数据，并加入时间戳字段用于比例 X 轴
  const displayData = useMemo(() => {
    let data = priceData;
    if (viewMode === "recent") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      data = priceData.filter((p) => p.d >= cutoffStr);
    }
    return data.map((p) => ({ ...p, ts: new Date(p.d).getTime() }));
  }, [priceData, viewMode]);

  // 近2年动态 domain
  const recentDomain = useMemo(() => {
    if (viewMode !== "recent" || displayData.length === 0) return undefined;
    const prices = displayData.map((p) => p.p).filter((p) => p > 0);
    const minP = Math.floor(Math.min(...prices) * 0.92 / 1000) * 1000;
    const maxP = Math.ceil(Math.max(...prices) * 1.06 / 1000) * 1000;
    return [Math.max(0, minP), maxP] as [number, number];
  }, [viewMode, displayData]);

  const findNearest = (targetDate: string) =>
    priceData.reduce((prev, cur) =>
      Math.abs(new Date(cur.d).getTime() - new Date(targetDate).getTime()) <
      Math.abs(new Date(prev.d).getTime() - new Date(targetDate).getTime())
        ? cur : prev
    );

  const milestonePoints = btcMilestones.map((m) => ({
    ...(priceData.find((p) => p.d === m.date) ?? findNearest(m.date)),
    title: m.title,
    milestoneType: m.type,
  }));

  const eventPoints = btcEvents.map((e) => {
    const eDate = e.date.length <= 7 ? `${e.date}-01` : e.date;
    return { ...findNearest(eDate), title: e.title, eventType: e.type, impact: e.impact };
  });

  const dotColor: Record<string, string> = {
    genesis: "#64748b", first: "#f59e0b", bull: "#10b981", bear: "#ef4444", ath: "#8b5cf6",
    milestone: "#3b82f6", regulation: "#a855f7", hack: "#f97316", macro: "#eab308",
  };

  // 时间戳 X 轴格式化
  const xTickFormatter = viewMode === "recent"
    ? (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
    : (ts: number) => String(new Date(ts).getFullYear());

  // 固定年份刻度（避免重复）
  const yearTicks = useMemo(() => {
    if (displayData.length === 0) return [];
    const minYear = new Date(displayData[0].ts).getFullYear();
    const maxYear = new Date(displayData[displayData.length - 1].ts).getFullYear() + 1;
    const result: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      result.push(new Date(`${y}-01-01T00:00:00Z`).getTime());
    }
    return result;
  }, [displayData]);

  // 日期字符串转时间戳（用于 ReferenceArea/ReferenceLine）
  const toTs = (d: string) => new Date(d).getTime();

  const topBarHeight = 28;
  const chartHeight = height - topBarHeight;

  // cycle 变体使用 WolfyXBT 简化阶段，其他变体沿用原 btcPhases（简化版）
  const phasesToRender = wolfyPhases;

  return (
    <div style={{ width: "100%", height }}>
      {/* 视图切换 */}
      <div className="flex items-center gap-1 mb-1">
        {(["all", "recent"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              viewMode === mode
                ? "bg-amber-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {mode === "all" ? "全部历史" : "近2年"}
          </button>
        ))}
        {dataSource === "static" && (
          <span className="text-xs text-slate-400 ml-2">正在加载实时数据…</span>
        )}
        {dataSource === "live" && (
          <span className="text-xs text-slate-300 dark:text-slate-600 ml-2">实时数据</span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={displayData} margin={{ top: 24, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />

          {/* 牛熊阶段背景 + WolfyXBT 标注 */}
          {phasesToRender.map((phase, i) => (
            <ReferenceArea
              key={i}
              x1={toTs(phase.x1)}
              x2={toTs(phase.x2)}
              fill={phase.type === "bull" ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)"}
              ifOverflow="extendDomain"
              label={
                variant === "cycle"
                  ? <PhaseBgLabel
                      label={phase.type === "bull" ? "牛市" : "熊市"}
                      daysLabel={phase.daysLabel}
                      type={phase.type}
                    />
                  : undefined
              }
            />
          ))}

          {/* 减半垂直线 */}
          {btcHalvings.map((h) => (
            <ReferenceLine
              key={h.date}
              x={toTs(h.date)}
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={viewMode === "all" ? <HalvingLabel label={h.label} /> : undefined}
            />
          ))}

          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={yearTicks}
            tickFormatter={xTickFormatter}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          {viewMode === "all" ? (
            <YAxis
              scale="log"
              domain={[5, 130000]}
              ticks={[10, 100, 1000, 10000, 100000]}
              tickFormatter={fmtPrice}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
          ) : (
            <YAxis
              scale="linear"
              domain={recentDomain}
              tickFormatter={fmtPrice}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
          )}
          <Tooltip content={<CustomTooltip />} />

          {/* 价格面积 */}
          <Area
            type="monotone"
            dataKey="p"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="#f59e0b20"
            dot={false}
            activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          />

          {/* 里程碑竖线 */}
          {variant === "milestones" &&
            milestonePoints.map((mp, i) => {
              const color = dotColor[mp.milestoneType] ?? "#94a3b8";
              return (
                <ReferenceLine
                  key={`ms-${i}`}
                  x={mp.d}
                  stroke={color}
                  strokeWidth={1.2}
                  strokeDasharray="2 4"
                  label={<EventLineLabel label={mp.d.substring(0, 7)} color={color} />}
                />
              );
            })}

          {/* 事件竖线 */}
          {variant === "events" &&
            eventPoints.map((ep, i) => {
              const color = dotColor[ep.eventType] ?? "#94a3b8";
              return (
                <ReferenceLine
                  key={`ev-${i}`}
                  x={ep.d}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={<EventLineLabel label={ep.d.substring(0, 7)} color={color} />}
                />
              );
            })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
