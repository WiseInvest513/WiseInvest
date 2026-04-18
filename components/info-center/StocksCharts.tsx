"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import type { StockData } from "@/app/api/market/stocks/route";
import { mag7Info } from "@/lib/data-center";

function fmt(n: number | null, dec = 1) {
  return n == null ? 0 : +n.toFixed(dec);
}
function fmtB(n: number | null) {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  return `$${n}`;
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#06b6d4", "#ef4444"];

interface Props { stocks: StockData[] }

// ─── 市值对比 ────────────────────────────────────────────────────
export function MarketCapChart({ stocks }: Props) {
  const data = [...stocks]
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .map((s, i) => ({
      ticker: s.ticker,
      value: s.marketCap ? +(s.marketCap / 1e12).toFixed(2) : 0,
      color: COLORS[stocks.findIndex(x => x.ticker === s.ticker)],
      info: mag7Info.find(m => m.ticker === s.ticker),
    }));

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">市值对比（万亿美元）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 60, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `$${v}T`} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip formatter={(v) => [`$${v}T`, "市值"]} labelStyle={{ fontSize: 11 }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => `$${v}T`} style={{ fontSize: 10, fill: "#94a3b8" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── PE 对比 ─────────────────────────────────────────────────────
export function PEChart({ stocks }: Props) {
  const data = stocks.map((s, i) => ({
    ticker: s.ticker,
    pe: fmt(s.pe),
    fpe: fmt(s.forwardPE),
    color: COLORS[i],
  })).filter(d => d.pe > 0 || d.fpe > 0);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">市盈率对比（PE / 远期PE）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}x`} />
          <Tooltip formatter={(v, name) => [`${v}x`, (name as string) === "pe" ? "当前PE" : "远期PE"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="pe" name="当前PE" radius={[3, 3, 0, 0]} fillOpacity={0.9}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
          <Bar dataKey="fpe" name="远期PE" radius={[3, 3, 0, 0]} fillOpacity={0.45}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 利润率对比 ───────────────────────────────────────────────────
export function MarginsChart({ stocks }: Props) {
  const data = stocks.map((s, i) => ({
    ticker: s.ticker,
    gross: fmt(s.grossMargin),
    net: fmt(s.netMargin),
    roe: Math.min(fmt(s.roe), 200), // cap ROE at 200% for display
    color: COLORS[i],
  }));

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">盈利能力对比（毛利率 / 净利率 / ROE）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v, name) => [`${v}%`, (name as string) === "gross" ? "毛利率" : (name as string) === "net" ? "净利率" : "ROE"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="gross" name="毛利率" radius={[3, 3, 0, 0]} fill="#10b981" fillOpacity={0.7} />
          <Bar dataKey="net" name="净利率" radius={[3, 3, 0, 0]} fill="#3b82f6" fillOpacity={0.8} />
          <Bar dataKey="roe" name="ROE" radius={[3, 3, 0, 0]} fill="#8b5cf6" fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 52周涨跌 ─────────────────────────────────────────────────────
export function YearChangeChart({ stocks }: Props) {
  const data = stocks.map((s, i) => ({
    ticker: s.ticker,
    change: fmt(s.week52ChangePercent),
    color: (s.week52ChangePercent ?? 0) >= 0 ? "#10b981" : "#ef4444",
  })).sort((a, b) => b.change - a.change);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">52周价格涨跌幅 (%)</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => { const n = v as number; return [`${n > 0 ? "+" : ""}${n}%`, "52周涨跌"]; }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
          <Bar dataKey="change" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
            <LabelList dataKey="change" position="top" formatter={(v: unknown) => { const n = v as number; return `${n > 0 ? "+" : ""}${n}%`; }} style={{ fontSize: 9, fill: "#94a3b8" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 营收 + 增速 ──────────────────────────────────────────────────
export function RevenueChart({ stocks }: Props) {
  const data = stocks.map((s, i) => ({
    ticker: s.ticker,
    revenue: s.revenue ? +(s.revenue / 1e9).toFixed(0) : 0,
    growth: fmt(s.revenueGrowth),
    color: COLORS[i],
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">年营收（$B）及增速（%）</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} />
          <YAxis yAxisId="growth" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(v, name) => {
              const n = v as number;
              const nm = name as string;
              return [nm === "revenue" ? `$${n}B` : `${n > 0 ? "+" : ""}${n}%`, nm === "revenue" ? "年营收" : "增速"];
            }}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <Bar yAxisId="rev" dataKey="revenue" name="revenue" radius={[3, 3, 0, 0]} fillOpacity={0.85}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
          <Bar yAxisId="growth" dataKey="growth" name="growth" radius={[3, 3, 0, 0]} fill="#f59e0b" fillOpacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
