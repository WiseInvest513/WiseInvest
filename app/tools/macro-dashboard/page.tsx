"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MACRO_CONFIG } from "@/lib/constants/macro-data";
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from "recharts";

/**
 * Macro Dashboard Page
 * 宏观仪表板页面
 * 
 * Displays real-time macroeconomic indicators and market sentiment
 * 显示实时宏观经济指标和市场情绪
 */

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline?: number[]; // 7-day price data for sparkline
  isMock?: boolean; // 是否为模拟数据
  source?: string; // 数据来源
}

interface MacroDashboardState {
  tnx: MarketData | null;
  dxy: MarketData | null;
  vix: MarketData | null;
  gold: MarketData | null;
  btc: MarketData | null;
  isLoading: boolean;
  nyTime: string;
}

// Mock sparkline data generator (7 days)
function generateSparkline(basePrice: number, volatility: number = 0.02): number[] {
  const data: number[] = [];
  let current = basePrice;
  for (let i = 0; i < 7; i++) {
    const change = (Math.random() - 0.5) * volatility * 2;
    current = current * (1 + change);
    data.push(current);
  }
  return data;
}

export default function MacroDashboardPage() {
  const [state, setState] = useState<MacroDashboardState>({
    tnx: null,
    dxy: null,
    vix: null,
    gold: null,
    btc: null,
    isLoading: true,
    nyTime: "",
  });

  // Update NY Time
  useEffect(() => {
    const updateTime = () => {
      const nyTime = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setState((prev) => ({ ...prev, nyTime }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch market data from new macro API
  useEffect(() => {
    const fetchMarketData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // 使用新的 /api/macro 端点获取数据
        const response = await fetch('/api/macro');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch macro data');
        }

        // 转换 API 响应数据为组件状态格式
        const convertToMarketData = (apiData: any, symbol: string): MarketData | null => {
          if (!apiData || apiData.value === null || apiData.value === undefined) {
            return null;
          }

          return {
            symbol,
            price: apiData.value,
            change: apiData.change || 0,
            changePercent: apiData.changePercent || 0,
            sparkline: generateSparkline(apiData.value),
            isMock: false,
            source: apiData.source || 'Yahoo Finance',
          };
        };

        setState((prev) => ({
          ...prev,
          tnx: convertToMarketData(data.treasury10y, "TNX"),
          dxy: convertToMarketData(data.dxy, "DXY"),
          vix: convertToMarketData(data.vix, "VIX"),
          gold: convertToMarketData(data.gold, "GC=F"),
          btc: convertToMarketData(data.btc, "BTC"),
          isLoading: false,
        }));
      } catch (error) {
        console.error("[MacroDashboard] Failed to fetch market data:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchMarketData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine Risk On/Off based on 10Y Yield
  const getRiskStatus = (yieldValue: number | null) => {
    if (!yieldValue) return { label: "未知", color: "text-muted-foreground" };
    if (yieldValue > 4.5) return { label: "避险模式", color: "text-red-500" };
    if (yieldValue < 3.5) return { label: "风险偏好", color: "text-green-500" };
    return { label: "中性", color: "text-yellow-500" };
  };

  // VIX Fear/Greed interpretation
  const getVIXStatus = (vixValue: number | null) => {
    if (!vixValue) return { label: "未知", level: 0, color: "text-muted-foreground" };
    if (vixValue > 30) return { label: "极度恐惧", level: 90, color: "text-red-500" };
    if (vixValue > 20) return { label: "恐惧", level: 70, color: "text-orange-500" };
    if (vixValue > 15) return { label: "中性", level: 50, color: "text-yellow-500" };
    if (vixValue > 10) return { label: "贪婪", level: 30, color: "text-green-500" };
    return { label: "极度贪婪", level: 10, color: "text-emerald-500" };
  };

  const riskStatus = getRiskStatus(state.tnx?.price || null);
  const vixStatus = getVIXStatus(state.vix?.price || null);

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
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-serif font-bold">宏观指挥中心</CardTitle>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">纽约时间</div>
                <div className="text-2xl font-mono font-bold text-primary">{state.nyTime}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Section A: The "Big Three" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 10Y Treasury Yield */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  10年期国债收益率
                </div>
                {state.tnx && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.tnx.isMock 
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {state.tnx.isMock ? "模拟数据" : "实时数据"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading || !state.tnx ? (
                <div className="h-32 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-mono font-bold">
                      {state.tnx.price.toFixed(2)}%
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        state.tnx.changePercent > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {state.tnx.changePercent > 0 ? (
                        <TrendingUp className="w-5 h-5 inline" />
                      ) : (
                        <TrendingDown className="w-5 h-5 inline" />
                      )}
                      {Math.abs(state.tnx.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div className={`text-sm font-medium mb-4 ${riskStatus.color}`}>
                    {riskStatus.label}
                  </div>
                  {state.tnx.sparkline && (
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={state.tnx.sparkline.map((v, i) => ({ value: v, day: i }))}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={state.tnx.changePercent > 0 ? "#ef4444" : "#22c55e"}
                            fill={state.tnx.changePercent > 0 ? "#ef4444" : "#22c55e"}
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* DXY (Dollar Index) */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  美元指数 (DXY)
                </div>
                {state.dxy && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.dxy.isMock 
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {state.dxy.isMock ? "模拟数据" : "实时数据"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading || !state.dxy ? (
                <div className="h-32 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-mono font-bold">
                      {state.dxy.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        state.dxy.changePercent > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {state.dxy.changePercent > 0 ? (
                        <TrendingUp className="w-5 h-5 inline" />
                      ) : (
                        <TrendingDown className="w-5 h-5 inline" />
                      )}
                      {Math.abs(state.dxy.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    全球流动性指标
                  </div>
                  {state.dxy.sparkline && (
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={state.dxy.sparkline.map((v, i) => ({ value: v, day: i }))}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* BTC (Correlation Context) */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  比特币 (BTC)
                </div>
                {state.btc && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.btc.isMock 
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {state.btc.isMock ? "模拟数据" : "实时数据"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading || !state.btc ? (
                <div className="h-32 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-mono font-bold">
                      ${state.btc.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        state.btc.changePercent > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {state.btc.changePercent > 0 ? (
                        <TrendingUp className="w-5 h-5 inline" />
                      ) : (
                        <TrendingDown className="w-5 h-5 inline" />
                      )}
                      {Math.abs(state.btc.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    风险资产相关性
                  </div>
                  {state.btc.sparkline && (
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={state.btc.sparkline.map((v, i) => ({ value: v, day: i }))}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={state.btc.changePercent > 0 ? "#22c55e" : "#ef4444"}
                            fill={state.btc.changePercent > 0 ? "#22c55e" : "#ef4444"}
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section B: Market Mood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VIX Gauge */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  VIX 波动率指数
                </div>
                {state.vix && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.vix.isMock 
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {state.vix.isMock ? "模拟数据" : "实时数据"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading || !state.vix ? (
                <div className="h-48 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-mono font-bold">
                      {state.vix.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        state.vix.changePercent > 0 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {state.vix.changePercent > 0 ? (
                        <TrendingUp className="w-5 h-5 inline" />
                      ) : (
                        <TrendingDown className="w-5 h-5 inline" />
                      )}
                      {Math.abs(state.vix.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div className={`text-lg font-medium mb-4 ${vixStatus.color}`}>
                    {vixStatus.label}
                  </div>
                  {/* Fear/Greed Gauge */}
                  <div className="relative h-8 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                        vixStatus.level > 50 ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${vixStatus.level}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                      {vixStatus.level}% {vixStatus.level > 50 ? "恐惧" : "贪婪"}
                    </div>
                  </div>
                  {state.vix.sparkline && (
                    <div className="h-20 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={state.vix.sparkline.map((v, i) => ({ value: v, day: i }))}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Gold */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  黄金期货 (GC=F)
                </div>
                {state.gold && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    state.gold.isMock 
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" 
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {state.gold.isMock ? "模拟数据" : "实时数据"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading || !state.gold ? (
                <div className="h-48 bg-gray-700 dark:bg-gray-600 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-mono font-bold">
                      ${state.gold.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        state.gold.changePercent > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {state.gold.changePercent > 0 ? (
                        <TrendingUp className="w-5 h-5 inline" />
                      ) : (
                        <TrendingDown className="w-5 h-5 inline" />
                      )}
                      {Math.abs(state.gold.changePercent).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    避险资产 / 通胀代理
                  </div>
                  {state.gold.sparkline && (
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={state.gold.sparkline.map((v, i) => ({ value: v, day: i }))}>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#fbbf24"
                            fill="#fbbf24"
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section C: Policy & Economy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fed Rate */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg">联邦基金利率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-primary mb-2">
                {MACRO_CONFIG.fedRate}%
              </div>
              <div className="text-sm text-muted-foreground">
                当前目标利率
              </div>
            </CardContent>
          </Card>

          {/* CPI */}
          <Card className="backdrop-blur-xl border-border">
            <CardHeader>
              <CardTitle className="text-lg">消费者物价指数 (同比)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-amber-500 mb-2">
                {MACRO_CONFIG.cpi}%
              </div>
              <div className="text-sm text-muted-foreground">
                同比变化
              </div>
            </CardContent>
          </Card>

          {/* Wise Comment */}
          <Card className="backdrop-blur-xl border-border md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">智者评论</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground leading-relaxed">
                {MACRO_CONFIG.wiseComment}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                下次 FOMC 会议: {new Date(MACRO_CONFIG.nextFOMC).toLocaleDateString("zh-CN")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

