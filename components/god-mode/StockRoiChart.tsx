"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { AssetYieldData } from "@/lib/mock/god-mode-data";

interface StockRoiChartProps {
  data: AssetYieldData[];
  title: string;
  description?: string;
}

// 股票颜色映射
const stockColors: Record<string, { stroke: string; gradient: string }> = {
  AAPL: { stroke: "#A8A8A8", gradient: "colorAapl" },
  MSFT: { stroke: "#F25022", gradient: "colorMsft" },
  GOOGL: { stroke: "#4285F4", gradient: "colorGoogl" },
  AMZN: { stroke: "#FF9900", gradient: "colorAmzn" },
  META: { stroke: "#0081FB", gradient: "colorMeta" },
  TSLA: { stroke: "#E31937", gradient: "colorTsla" },
  NVDA: { stroke: "#76B900", gradient: "colorNvda" },
  // 默认颜色
  default: { stroke: "#FF9F0A", gradient: "colorDefault" },
};

/**
 * Stock ROI Chart Component
 * 美股收益率曲线图组件
 * 
 * 将多时间框架的收益率数据转换为曲线图展示
 */
export function StockRoiChart({ data, title, description }: StockRoiChartProps) {
  // 转换数据格式为图表所需格式
  const chartData = useMemo(() => {
    const timeframes = [
      { key: "m3", label: "3个月", months: 3 },
      { key: "m6", label: "6个月", months: 6 },
      { key: "y1", label: "1年", months: 12 },
      { key: "y3", label: "3年", months: 36 },
      { key: "y5", label: "5年", months: 60 },
    ];

    return timeframes.map((tf) => {
      const dataPoint: Record<string, string | number> = {
        timeframe: tf.label,
        months: tf.months,
      };

      data.forEach((asset) => {
        const value = asset.changes[tf.key as keyof typeof asset.changes];
        dataPoint[asset.symbol] = value !== null ? value : 0;
      });

      return dataPoint;
    });
  }, [data]);

  // 计算 Y 轴范围（确保 0 在合理位置，上下区域清晰）
  const yAxisDomain = useMemo(() => {
    const allValues = data.flatMap((asset) => [
      asset.changes.m3,
      asset.changes.m6,
      asset.changes.y1,
      asset.changes.y3,
      asset.changes.y5,
    ]);
    const max = Math.max(...allValues.filter((v) => v !== null));
    const min = Math.min(...allValues.filter((v) => v !== null));

    // 如果数据都是正数或都是负数，确保包含 0
    if (min >= 0) {
      // 都是正数，从 0 开始
      const padding = Math.max(max * 0.1, 10);
      return [0, Math.ceil(max + padding)];
    } else if (max <= 0) {
      // 都是负数，到 0 结束
      const padding = Math.max(Math.abs(min) * 0.1, 10);
      return [Math.floor(min - padding), 0];
    } else {
      // 有正有负，确保 0 在中间位置
      const maxAbs = Math.max(Math.abs(max), Math.abs(min));
      const padding = Math.max(maxAbs * 0.1, 10);
      // 确保 0 在可见范围内，并且上下对称
      const domainMin = Math.min(-maxAbs * 1.1, min - padding);
      const domainMax = Math.max(maxAbs * 1.1, max + padding);
      return [Math.floor(domainMin), Math.ceil(domainMax)];
    }
  }, [data]);

  // 自定义 Tooltip（参考 dca-investment 的样式）
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-400 mb-2 font-mono">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const asset = data.find((a) => a.symbol === entry.dataKey);
              const value = entry.value as number;
              const color = stockColors[entry.dataKey]?.stroke || stockColors.default.stroke;
              return (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-300">
                    {asset?.name || entry.dataKey}:
                  </span>
                  <span
                    style={{ color: color }}
                    className="font-bold"
                  >
                    {value >= 0 ? "+" : ""}
                    {value.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-4 flex-wrap">
        {data.map((asset) => {
          const color = stockColors[asset.symbol] || stockColors.default;
          return (
            <div key={asset.symbol} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color.stroke }}
              />
              <span className="text-xs text-muted-foreground">{asset.name}</span>
            </div>
          );
        })}
      </div>

      <div className="h-[calc(100vh-360px)] min-h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              {/* 为每个股票定义渐变色 */}
              {data.map((asset) => {
                const color = stockColors[asset.symbol] || stockColors.default;
                return (
                  <linearGradient
                    key={asset.symbol}
                    id={color.gradient}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color.stroke} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={color.stroke} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
              horizontal={true}
            />
            <XAxis
              dataKey="timeframe"
              stroke="#888"
              tick={{ fontSize: 12, fill: "#888" }}
              height={40}
            />
            <YAxis
              stroke="#888"
              tick={{ fontSize: 12, fill: "#888" }}
              tickFormatter={(value) => {
                // 明确标注 0%
                if (Math.abs(value) < 0.01) return "0%";
                return `${value}%`;
              }}
              domain={yAxisDomain}
              width={60}
            />
            {/* 明确的 0% 基准线（参考 dca-investment 样式，更粗更明显） */}
            <ReferenceLine
              y={0}
              stroke="#666"
              strokeWidth={2.5}
              strokeDasharray=""
              label={{
                value: "0%",
                position: "right",
                fill: "#666",
                fontSize: 12,
                fontWeight: "bold"
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.map((asset) => {
              const color = stockColors[asset.symbol] || stockColors.default;
              return (
                <Area
                  key={asset.symbol}
                  type="monotone"
                  dataKey={asset.symbol}
                  stroke={color.stroke}
                  strokeWidth={2.5}
                  fill={`url(#${color.gradient})`}
                  name={asset.name}
                  dot={false}
                  activeDot={{ r: 8, fill: color.stroke, stroke: "#fff", strokeWidth: 2 }}
                  baseLine={0}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
