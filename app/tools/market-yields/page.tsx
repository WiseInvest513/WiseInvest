"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Market Yields Page
 * 资产收益率页面
 * 
 * 显示主要资产的多时间框架收益率
 */

interface YieldData {
  symbol: string;
  name: string;
  type: "index" | "crypto";
  currentPrice: number;
  yields: {
    "3M": number | null;
    "6M": number | null;
    YTD: number | null;
    "1Y": number | null;
    "3Y": number | null;
    "5Y": number | null;
  };
  historicalPrices: {
    "3M": number | null;
    "6M": number | null;
    YTD: number | null;
    "1Y": number | null;
    "3Y": number | null;
    "5Y": number | null;
  };
}

interface ChartDataPoint {
  period: string;
  [key: string]: string | number;
}

export default function MarketYieldsPage() {
  const [data, setData] = useState<YieldData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"1Y">("1Y");

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/market-yields");
        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();
        if (result.data) {
          setData(result.data);
          // 默认选择前3个资产用于图表
          const defaultSelected = result.data
            .slice(0, 3)
            .map((d: YieldData) => d.symbol);
          setSelectedAssets(new Set(defaultSelected));
        }
      } catch (error) {
        console.error("Failed to fetch market yields:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 排序数据
  const sortedData = [...data].sort((a, b) => {
    const aYield = a.yields[sortBy] ?? -Infinity;
    const bYield = b.yields[sortBy] ?? -Infinity;
    return bYield - aYield;
  });

  // 生成图表数据（归一化到0%起点）
  const chartData: ChartDataPoint[] = [];
  const periods = ["3M", "6M", "YTD", "1Y", "3Y", "5Y"];

  periods.forEach((period) => {
    const point: ChartDataPoint = { period };
    sortedData.forEach((asset) => {
      if (selectedAssets.has(asset.symbol)) {
        const yieldValue = asset.yields[period as keyof typeof asset.yields];
        point[asset.symbol] = yieldValue !== null ? yieldValue : 0;
      }
    });
    chartData.push(point);
  });

  // 切换资产选择
  const toggleAsset = (symbol: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedAssets(newSelected);
  };

  // 格式化收益率
  const formatYield = (yieldValue: number | null): string => {
    if (yieldValue === null) return "N/A";
    const sign = yieldValue >= 0 ? "+" : "";
    return `${sign}${yieldValue.toFixed(2)}%`;
  };

  // 获取收益率颜色
  const getYieldColor = (yieldValue: number | null): string => {
    if (yieldValue === null) return "text-muted-foreground";
    return yieldValue >= 0 ? "text-green-500" : "text-red-500";
  };

  // 获取排名徽章
  const getRankBadge = (index: number): string => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  // 图表颜色配置
  const chartColors = [
    "#3b82f6", // Blue
    "#22c55e", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
  ];

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
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-serif font-bold">
              资产收益率追踪
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              主要资产的多时间框架收益率对比
            </p>
          </CardHeader>
        </Card>

        {/* Performance Matrix Table */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>收益率矩阵</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">排名</th>
                      <th className="text-left p-3 font-semibold">资产</th>
                      <th className="text-right p-3 font-semibold">当前价格</th>
                      <th className="text-right p-3 font-semibold">3个月</th>
                      <th className="text-right p-3 font-semibold">6个月</th>
                      <th className="text-right p-3 font-semibold">年初至今</th>
                      <th className="text-right p-3 font-semibold">1年</th>
                      <th className="text-right p-3 font-semibold">3年</th>
                      <th className="text-right p-3 font-semibold">5年</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((asset, index) => (
                      <tr
                        key={asset.symbol}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              #{index + 1}
                            </span>
                            {getRankBadge(index) && (
                              <span className="text-xl">{getRankBadge(index)}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{asset.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {asset.type === "index" ? "指数" : "加密货币"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {asset.currentPrice.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`p-3 text-right font-mono ${getYieldColor(asset.yields["3M"])}`}>
                          {formatYield(asset.yields["3M"])}
                        </td>
                        <td className={`p-3 text-right font-mono ${getYieldColor(asset.yields["6M"])}`}>
                          {formatYield(asset.yields["6M"])}
                        </td>
                        <td className={`p-3 text-right font-mono ${getYieldColor(asset.yields.YTD)}`}>
                          {formatYield(asset.yields.YTD)}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${getYieldColor(asset.yields["1Y"])}`}>
                          {formatYield(asset.yields["1Y"])}
                        </td>
                        <td className={`p-3 text-right font-mono ${getYieldColor(asset.yields["3Y"])}`}>
                          {formatYield(asset.yields["3Y"])}
                        </td>
                        <td className={`p-3 text-right font-mono ${getYieldColor(asset.yields["5Y"])}`}>
                          {formatYield(asset.yields["5Y"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparative Trend Chart */}
        <Card className="backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle>收益率趋势对比</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              归一化到0%起点，便于比较不同资产的增长幅度
            </p>
          </CardHeader>
          <CardContent>
            {/* Asset Selection Toggles */}
            <div className="mb-6 flex flex-wrap gap-2">
              {sortedData.map((asset, index) => (
                <button
                  key={asset.symbol}
                  onClick={() => toggleAsset(asset.symbol)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedAssets.has(asset.symbol)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            {isLoading ? (
              <div className="h-96 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                      dataKey="period"
                      stroke="currentColor"
                      tick={{ fill: "currentColor" }}
                    />
                    <YAxis
                      stroke="currentColor"
                      tick={{ fill: "currentColor" }}
                      label={{
                        value: "收益率 (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "currentColor" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => `${value?.toFixed(2)}%`}
                    />
                    <Legend />
                    {sortedData.map((asset, index) => {
                      if (!selectedAssets.has(asset.symbol)) return null;
                      return (
                        <Line
                          key={asset.symbol}
                          type="monotone"
                          dataKey={asset.symbol}
                          name={asset.name}
                          stroke={chartColors[index % chartColors.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

