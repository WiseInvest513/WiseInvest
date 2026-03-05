"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  LabelList,
} from "recharts";
import {
  ASSET_GROWTH_DATA,
  ASSET_LABELS,
  ASSET_COLORS_LIGHT,
  ASSET_COLORS_DARK,
  ASSET_ORDER,
} from "@/lib/asset-growth-data";

const DATA_LEN = ASSET_GROWTH_DATA.length;

// 交替上下位置，避免 2008/2011 等相邻标签重叠
const REFERENCE_YEARS = [
  { year: 1974, label: "黄金飙升", position: "top" as const },
  { year: 1980, label: "通胀高峰", position: "bottom" as const },
  { year: 1987, label: "黑色星期一", position: "top" as const },
  { year: 2000, label: "互联网泡沫", position: "bottom" as const },
  { year: 2008, label: "金融危机", position: "top" as const },
  { year: 2011, label: "欧债危机", position: "bottom" as const },
  { year: 2020, label: "疫情", position: "top" as const },
  { year: 2022, label: "加息熊市", position: "bottom" as const },
];

function CustomTooltip({
  active,
  label,
  assetColors,
}: any) {
  if (!active || !label) return null;
  const yearData = ASSET_GROWTH_DATA.find((d) => d.year === label);
  if (!yearData) return null;
  const parts = ASSET_ORDER.map(
    (key) => `${ASSET_LABELS[key]}: $${yearData[key]?.toLocaleString() ?? "—"}`
  );
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3 shadow-xl">
      <div className="mb-2 font-semibold text-foreground">{label} 年</div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {parts.map((part, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: assetColors[ASSET_ORDER[i]] }}
            />
            {part}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderInlineLabel(assetKey: string, assetColors: Record<string, string>) {
  return (props: any) => {
    const { x, y, index } = props;
    if (index !== DATA_LEN - 1) return null;
    const color = assetColors[assetKey];
    const label = ASSET_LABELS[assetKey];
    return (
      <text
        x={x + 8}
        y={y}
        fill={color}
        textAnchor="start"
        fontSize={12}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight={500}
      >
        {label}
      </text>
    );
  };
}

export default function AssetGrowthPage() {
  const { resolvedTheme } = useTheme();
  const [scale, setScale] = useState<"log" | "linear">("log");

  const isDark = resolvedTheme === "dark";
  const assetColors = isDark ? ASSET_COLORS_DARK : ASSET_COLORS_LIGHT;
  const stocksColor = assetColors.stocks;
  const goldColor = assetColors.gold;

  const yDomain = scale === "log" ? [80, 50000] : [0, 50000] as [number, number];
  const yScale = scale === "log" ? "log" : "linear";
  const baseValue = scale === "log" ? 80 : 0;

  const chartMuted = isDark ? "rgba(148,163,184,0.5)" : "rgba(0,0,0,0.5)";
  const chartGrid = isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.1)";
  const chartRefLine = isDark ? "rgba(148,163,184,0.2)" : "rgba(0,0,0,0.08)";
  const chartRefLabel = isDark ? "rgba(148,163,184,0.6)" : "rgba(0,0,0,0.45)";
  const chartCursor = isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.1)";
  const activeDotStroke = isDark ? "#0f172a" : "#fff";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Header */}
        <Card className="border-border bg-background">
          <CardHeader className="text-left">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  100 美元按资产类别划分的增长情况
                </CardTitle>
                <p className="text-base text-muted-foreground mt-1.5 font-semibold">
                  1965–2025 年，100 美元投资于不同资产类别的增长对比
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Chart */}
        <Card className="border-border bg-background">
          <CardHeader className="text-left">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  资产增长曲线
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1.5 font-semibold">
                  横轴为年份，纵轴为对应资产的价值（美元），对数刻度
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-semibold">纵轴：</span>
                <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                  <button
                    onClick={() => setScale("log")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      scale === "log"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    对数
                  </button>
                  <button
                    onClick={() => setScale("linear")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      scale === "linear"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    线性
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[calc(100vh-320px)] min-h-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={ASSET_GROWTH_DATA}
                  margin={{ top: 20, right: 140, left: 8, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="fillStocks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stocksColor} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={stocksColor} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={goldColor} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={goldColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={chartGrid}
                    vertical={true}
                    horizontal={true}
                  />
                  {REFERENCE_YEARS.map(({ year, label, position }) => (
                    <ReferenceLine
                      key={year}
                      x={year}
                      stroke={chartRefLine}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    >
                      <Label
                        value={`${year}: ${label}`}
                        position={position}
                        fill={chartRefLabel}
                        fontSize={10}
                        fontFamily="system-ui, sans-serif"
                      />
                    </ReferenceLine>
                  ))}
                  <XAxis
                    dataKey="year"
                    stroke={chartMuted}
                    tick={{ fontSize: 11, fill: chartMuted, fontFamily: "system-ui, sans-serif" }}
                    ticks={[1965, 1975, 1985, 1995, 2005, 2015, 2025]}
                    height={36}
                  />
                  <YAxis
                    stroke={chartMuted}
                    tick={{
                      fontSize: 11,
                      fill: chartMuted,
                      fontFamily: "system-ui, sans-serif",
                      textAnchor: "end",
                    }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    width={52}
                    scale={yScale === "log" ? "log" : "linear"}
                    domain={yDomain}
                    tickMargin={8}
                    ticks={scale === "log" ? [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000] : undefined}
                  />
                  <Tooltip
                    content={<CustomTooltip assetColors={assetColors} />}
                    cursor={{ stroke: chartCursor }}
                  />
                  <Area
                    type="monotone"
                    dataKey="stocks"
                    stroke="none"
                    fill="url(#fillStocks)"
                    baseValue={baseValue}
                  />
                  <Area
                    type="monotone"
                    dataKey="gold"
                    stroke="none"
                    fill="url(#fillGold)"
                    baseValue={baseValue}
                  />
                  <Line
                    type="monotone"
                    dataKey="stocks"
                    stroke={stocksColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: activeDotStroke }}
                    connectNulls
                  >
                    <LabelList content={renderInlineLabel("stocks", assetColors)} />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="gold"
                    stroke={goldColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: activeDotStroke }}
                    connectNulls
                  >
                    <LabelList content={renderInlineLabel("gold", assetColors)} />
                  </Line>
                  {(["corporateBonds", "governmentBonds", "realEstate", "cash"] as const).map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={assetColors[key]}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: activeDotStroke }}
                      connectNulls
                    >
                      <LabelList content={renderInlineLabel(key, assetColors)} />
                    </Line>
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
