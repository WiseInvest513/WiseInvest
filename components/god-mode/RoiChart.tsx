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
import { AssetYieldData } from "@/lib/mock/god-mode-data";

interface RoiChartProps {
  data: AssetYieldData[];
  title: string;
  description?: string;
  selectedSymbols?: string[]; // 选中的资产符号列表，如果为空则显示全部
  showTooltip?: boolean; // 是否显示 tooltip，默认 true
}

// 资产颜色映射
const assetColors: Record<string, { stroke: string; gradient: string }> = {
  // 加密货币
  BTC: { stroke: "#F7931A", gradient: "colorBtc" },
  ETH: { stroke: "#627EEA", gradient: "colorEth" },
  BNB: { stroke: "#F3BA2F", gradient: "colorBnb" },
  OKB: { stroke: "#000000", gradient: "colorOkb" },
  SOL: { stroke: "#14F195", gradient: "colorSol" },
  // 指数
  VOO: { stroke: "#06B6D4", gradient: "colorVoo" },
  QQQ: { stroke: "#6366F1", gradient: "colorQqq" },
  DIA: { stroke: "#14B8A6", gradient: "colorDia" },
  VGT: { stroke: "#EC4899", gradient: "colorVgt" },
  SH000001: { stroke: "#EF4444", gradient: "colorSh000001" },
  // 默认颜色
  default: { stroke: "#FF9F0A", gradient: "colorDefault" },
};

/**
 * ROI Chart Component
 * 收益率曲线图组件
 * 
 * 将多时间框架的收益率数据转换为曲线图展示
 */
export function RoiChart({ data, title, description, selectedSymbols, showTooltip = true }: RoiChartProps) {
  // 根据选中的符号过滤数据
  const filteredData = useMemo(() => {
    if (!selectedSymbols || selectedSymbols.length === 0) {
      return data;
    }
    return data.filter(asset => selectedSymbols.includes(asset.symbol));
  }, [data, selectedSymbols]);

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

      filteredData.forEach((asset) => {
        const value = asset.changes[tf.key as keyof typeof asset.changes];
        dataPoint[asset.symbol] = value !== null ? value : 0;
      });

      return dataPoint;
    });
  }, [filteredData]);

  // 计算 Y 轴范围（参考 dca-investment，确保 0 在合理位置，上下区域清晰）
  const yAxisDomain = useMemo(() => {
    const allValues = filteredData.flatMap((asset) => [
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
  }, [filteredData]);

  // 自定义 Tooltip（参考 dca-investment 的样式）
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-gray-400 mb-2 font-mono">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const asset = filteredData.find((a) => a.symbol === entry.dataKey);
              const value = entry.value as number;
              const color = assetColors[entry.dataKey]?.stroke || assetColors.default.stroke;
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

  // 调试：检查数据
  console.log('[RoiChart] 渲染数据:', {
    dataLength: data.length,
    filteredDataLength: filteredData.length,
    chartDataLength: chartData.length,
    chartData: chartData,
    selectedSymbols,
    title,
  });

  return (
    <div className="w-full">
      {/* Legend */}
      {title && (
        <div className="flex items-center justify-end gap-4 mb-4">
          {filteredData.map((asset) => {
            const color = assetColors[asset.symbol] || assetColors.default;
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
      )}

      <div 
        className={title ? "h-[calc(100vh-360px)] min-h-[500px]" : "w-full"} 
        style={title ? {} : { height: '450px', minHeight: '450px', position: 'relative', width: '100%' }}
      >
        {chartData.length > 0 && filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={450}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: showTooltip ? 20 : 40 }}
          >
            <defs>
              {/* 为每个资产定义渐变色 */}
              {filteredData.map((asset) => {
                const color = assetColors[asset.symbol] || assetColors.default;
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
              height={showTooltip ? 40 : 60}
              angle={showTooltip ? 0 : -45}
              textAnchor={showTooltip ? "middle" : "end"}
              dy={showTooltip ? 0 : 10}
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
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {filteredData.map((asset) => {
              const color = assetColors[asset.symbol] || assetColors.default;
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
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
