"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

interface FearGreedResponse {
  name: string;
  data: FearGreedData[];
  metadata: {
    error?: string;
  };
}

interface HistoricalData {
  label: string;
  value: number;
  classification: string;
}

// Gauge chart data
const gaugeData = [
  { name: "极度恐慌", value: 25, color: "#EF4444" }, // Red
  { name: "恐慌", value: 25, color: "#F97316" }, // Orange
  { name: "贪婪", value: 25, color: "#EAB308" }, // Yellow
  { name: "极度贪婪", value: 25, color: "#22C55E" }, // Green
];

export function FearGreedIndex() {
  const [currentData, setCurrentData] = useState<FearGreedData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current data
      const currentResponse = await fetch("https://api.alternative.me/fng/?limit=1");
      const currentJson: FearGreedResponse = await currentResponse.json();

      if (currentJson.metadata?.error) {
        throw new Error(currentJson.metadata.error);
      }

      if (currentJson.data && currentJson.data.length > 0) {
        setCurrentData(currentJson.data[0]);
      }

      // Fetch historical data (last 10 days)
      const historicalResponse = await fetch("https://api.alternative.me/fng/?limit=10");
      const historicalJson: FearGreedResponse = await historicalResponse.json();

      if (historicalJson.data && historicalJson.data.length > 0) {
        const historical: HistoricalData[] = [];
        const data = historicalJson.data;

        // Yesterday
        if (data.length > 1) {
          historical.push({
            label: "昨天",
            value: parseInt(data[1].value),
            classification: data[1].value_classification,
          });
        }

        // Last Week (7 days ago)
        if (data.length > 7) {
          historical.push({
            label: "一周前",
            value: parseInt(data[7].value),
            classification: data[7].value_classification,
          });
        }

        // Last Month (30 days ago, approximate with last available)
        if (data.length > 0) {
          const lastIndex = Math.min(29, data.length - 1);
          historical.push({
            label: "一月前",
            value: parseInt(data[lastIndex].value),
            classification: data[lastIndex].value_classification,
          });
        }

        setHistoricalData(historical);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取数据失败");
      console.error("Error fetching Fear & Greed Index:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentValue = currentData ? parseInt(currentData.value) : 0;
  const currentClassification = currentData?.value_classification || "未知";


  const getValueColor = (value: number) => {
    if (value <= 25) return "#EF4444"; // Red
    if (value <= 50) return "#F97316"; // Orange
    if (value <= 75) return "#EAB308"; // Yellow
    return "#22C55E"; // Green
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600">正在加载数据...</p>
      </div>
    );
  }

  if (error || !currentData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-600 mb-4">{error || "无法获取数据"}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Gauge Chart with CSS Needle */}
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-1 pt-2 px-0">
          <CardTitle className="text-center text-base">当前市场情绪</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 px-0">
          <div className="relative w-full flex justify-center" style={{ height: "240px" }}>
            {/* 1. The Recharts Background Gauge */}
            <div className="w-full h-full relative z-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    innerRadius={90}
                    outerRadius={115}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Central Text Overlay */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-32 h-32 bg-white rounded-full border-4 flex flex-col items-center justify-center shadow-lg z-10"
              style={{ borderColor: getValueColor(currentValue) }}
            >
              <span
                className="text-5xl font-bold font-heading"
                style={{ color: getValueColor(currentValue) }}
              >
                {currentValue}
              </span>
              <span className="text-xs text-slate-600 font-medium leading-tight">
                {currentClassification}
              </span>
            </div>
          </div>

          {/* Legend - Inline */}
          <div className="grid grid-cols-4 gap-1 mt-3">
            <div className="text-center">
              <div className="w-full h-1 bg-red-500 rounded mb-0.5"></div>
              <span className="text-[9px] text-slate-600 leading-tight">0-25<br/>极度恐慌</span>
            </div>
            <div className="text-center">
              <div className="w-full h-1 bg-orange-500 rounded mb-0.5"></div>
              <span className="text-[9px] text-slate-600 leading-tight">26-50<br/>恐慌</span>
            </div>
            <div className="text-center">
              <div className="w-full h-1 bg-yellow-500 rounded mb-0.5"></div>
              <span className="text-[9px] text-slate-600 leading-tight">51-75<br/>贪婪</span>
            </div>
            <div className="text-center">
              <div className="w-full h-1 bg-green-500 rounded mb-0.5"></div>
              <span className="text-[9px] text-slate-600 leading-tight">76-100<br/>极度贪婪</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout: History + Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Historical Comparison */}
        {historicalData.length > 0 && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-1 pt-2 px-0">
              <CardTitle className="text-sm">历史对比</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 pb-2 px-0">
              <div className="space-y-1.5">
                {historicalData.map((item, index) => {
                  const trend = index === 0 ? getTrendIcon(currentValue, item.value) : null;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-600">{item.label}</span>
                        {trend}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-lg font-bold"
                          style={{ color: getValueColor(item.value) }}
                        >
                          {item.value}
                        </span>
                        <span className="text-[9px] text-slate-500 w-12 text-right leading-tight">
                          {item.classification}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Strategy Section - Ultra Compact */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-1 pt-2 px-0">
            <CardTitle className="text-sm">指标解读</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-2 px-0">
            <p className="text-[10px] text-slate-700 leading-relaxed mb-2">
              恐慌贪婪指数基于波动性、市场动量、社交媒体热度等多维度数据计算。
            </p>

            <div className="space-y-1">
              <div className="flex items-start gap-1">
                <span className="text-xs">🔴</span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-900">极度恐慌 (0-25): </span>
                  <span className="text-[10px] text-slate-600"><strong className="text-red-600">分批建仓</strong></span>
                </div>
              </div>

              <div className="flex items-start gap-1">
                <span className="text-xs">🟠</span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-900">恐慌 (26-50): </span>
                  <span className="text-[10px] text-slate-600"><strong className="text-orange-600">定投策略</strong></span>
                </div>
              </div>

              <div className="flex items-start gap-1">
                <span className="text-xs">🟡</span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-900">中性 (51-75): </span>
                  <span className="text-[10px] text-slate-600"><strong className="text-yellow-600">谨慎观望</strong></span>
                </div>
              </div>

              <div className="flex items-start gap-1">
                <span className="text-xs">🟢</span>
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-900">极度贪婪 (75-100): </span>
                  <span className="text-[10px] text-slate-600"><strong className="text-green-600">分批止盈</strong></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button - Compact */}
      <div className="flex justify-center pt-0">
        <Button onClick={fetchData} variant="outline" size="sm" className="h-8 text-xs">
          <RefreshCw className="h-3 w-3 mr-1.5" />
          刷新数据
        </Button>
      </div>

      {/* Data Source */}
      <div className="text-center text-[9px] text-slate-400 pb-1">
        数据来源: Alternative.me
      </div>
    </div>
  );
}
