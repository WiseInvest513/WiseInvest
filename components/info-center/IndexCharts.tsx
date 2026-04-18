"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, LineChart, Line, Legend,
} from "recharts";
import { etfReferences, valuationSignals } from "@/lib/data-center";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f97316", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

// ─── ETF 年化回报对比 ─────────────────────────────────────────────
export function ETFReturnChart() {
  const data = etfReferences.map((e, i) => ({
    ticker: e.ticker,
    return: parseFloat(e.annualReturn10y.replace(/[^0-9.]/g, "").split("-")[0]) || 0,
    category: e.category,
    color: COLORS[i],
  })).sort((a, b) => b.return - a.return);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">近10年年化回报对比（参考值）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 50, top: 0, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(v) => [`${v}%`, "年化回报"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="return" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
            <LabelList dataKey="return" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 10, fill: "#94a3b8" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── ETF 费率对比 ─────────────────────────────────────────────────
export function ETFExpenseChart() {
  const data = etfReferences.map((e, i) => ({
    ticker: e.ticker,
    expense: parseFloat(e.expenseRatio.replace("%", "")),
    category: e.category,
    color: COLORS[i],
  })).sort((a, b) => a.expense - b.expense); // 从低到高

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">年费率对比（越低越好）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 55, top: 0, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} domain={[0, 0.5]} />
          <YAxis type="category" dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(v) => [`${v}%`, "年费率"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="expense" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.expense <= 0.05 ? "#10b981" : d.expense <= 0.1 ? "#f59e0b" : "#ef4444"} fillOpacity={0.8} />)}
            <LabelList dataKey="expense" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 10, fill: "#94a3b8" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-1">绿色 ≤0.05% | 橙色 ≤0.1% | 红色 &gt;0.1%</p>
    </div>
  );
}

// ─── 估值信号仪表盘 ───────────────────────────────────────────────
const signalConfig = {
  green:  { label: "低估/正常", color: "#10b981", barColor: "#10b981", pct: 25 },
  yellow: { label: "中性偏贵", color: "#f59e0b", barColor: "#f59e0b", pct: 65 },
  red:    { label: "偏贵/高估", color: "#ef4444", barColor: "#ef4444", pct: 88 },
};

export function ValuationGauges() {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">当前市场估值信号</h4>
      <div className="space-y-4">
        {valuationSignals.map((v, i) => {
          const cfg = signalConfig[v.signal];
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{v.name}</span>
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{v.signalText}</span>
              </div>
              {/* 进度条式仪表 */}
              <div className="relative h-3 bg-gradient-to-r from-emerald-200 via-yellow-200 to-red-300 dark:from-emerald-900/40 dark:via-yellow-900/40 dark:to-red-900/40 rounded-full overflow-hidden">
                <div
                  className="absolute top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow"
                  style={{ left: `calc(${cfg.pct}% - 5px)`, backgroundColor: cfg.color }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>低估</span>
                <span className="text-xs text-slate-500">{v.currentReading}</span>
                <span>高估</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* 假设增长图：$10k 投入 VOO/QQQ/SCHD 10年对比 */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">假设：$10,000 定投10年增长模拟</h4>
        <ETFGrowthSimulation />
      </div>
    </div>
  );
}

function ETFGrowthSimulation() {
  // 模拟 10 年按年化回报的增长
  const etfs = [
    { ticker: "QQQ", annual: 0.18, color: "#8b5cf6" },
    { ticker: "VOO", annual: 0.13, color: "#3b82f6" },
    { ticker: "SCHD", annual: 0.11, color: "#f97316" },
    { ticker: "VEA", annual: 0.055, color: "#06b6d4" },
    { ticker: "BND", annual: 0.02, color: "#10b981" },
  ];
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const data = years.map((y) => {
    const point: Record<string, number> = { year: y };
    etfs.forEach((e) => {
      point[e.ticker] = Math.round(10000 * Math.pow(1 + e.annual, y));
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `第${v}年`} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
        <Tooltip formatter={(v, name) => [`$${(v as number).toLocaleString()}`, name as string]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {etfs.map((e) => (
          <Line key={e.ticker} type="monotone" dataKey={e.ticker} stroke={e.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
