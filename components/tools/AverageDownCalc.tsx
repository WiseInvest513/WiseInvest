"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ChartDataPoint {
  investment: number;
  marketPrice: number;
  avgPrice: number;
}

export function AverageDownCalc() {
  const [originalQty, setOriginalQty] = useState(0.5);
  const [originalPrice, setOriginalPrice] = useState(68000);
  const [marketPrice, setMarketPrice] = useState(58000);
  const [newInvestment, setNewInvestment] = useState(10000);

  // Calculate new average price and break-even
  const calculations = useMemo(() => {
    if (marketPrice <= 0 || newInvestment < 0) {
      return {
        newQty: 0,
        totalCost: originalPrice * originalQty,
        totalQty: originalQty,
        newAvgPrice: originalPrice,
        breakEvenMove: 0,
        isAveragingUp: false,
      };
    }

    const newQty = newInvestment / marketPrice;
    const totalCost = originalPrice * originalQty + newInvestment;
    const totalQty = originalQty + newQty;
    const newAvgPrice = totalCost / totalQty;
    const breakEvenMove = ((newAvgPrice - marketPrice) / marketPrice) * 100;
    const isAveragingUp = marketPrice > originalPrice;

    return {
      newQty,
      totalCost,
      totalQty,
      newAvgPrice,
      breakEvenMove,
      isAveragingUp,
    };
  }, [originalQty, originalPrice, marketPrice, newInvestment]);

  // Generate chart data
  const chartData = useMemo(() => {
    const maxInvestment = Math.max(newInvestment * 2, 100000);
    const dataPoints: ChartDataPoint[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const investment = (maxInvestment / steps) * i;
      if (marketPrice > 0) {
        const newQty = investment / marketPrice;
        const totalCost = originalPrice * originalQty + investment;
        const totalQty = originalQty + newQty;
        const avgPrice = totalCost / totalQty;

        dataPoints.push({
          investment: Math.round(investment),
          marketPrice: marketPrice,
          avgPrice: Math.round(avgPrice),
        });
      }
    }

    return dataPoints;
  }, [originalQty, originalPrice, marketPrice, newInvestment]);

  // Find current position in chart data
  const currentIndex = useMemo(() => {
    return chartData.findIndex((point) => point.investment >= newInvestment);
  }, [chartData, newInvestment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 4) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const isVictory = calculations.breakEvenMove < 5 && calculations.breakEvenMove > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回工具列表
          </Link>
        </div>

        {/* Main Content Container with Background */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
              {calculations.isAveragingUp ? "加仓计算器" : "补仓计算器"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              计算在更低价格买入更多资产后的新平均价格
            </p>
          </div>

          {/* Main Content - Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column - Inputs */}
            <div className="space-y-6 flex flex-col">
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">投资详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Owned Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="originalQty" className="text-slate-700 dark:text-slate-300">
                    当前持有数量
                  </Label>
                  <Input
                    id="originalQty"
                    type="number"
                    value={originalQty}
                    onChange={(e) => setOriginalQty(parseFloat(e.target.value) || 0)}
                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    step="0.01"
                  />
                </div>

                {/* Original Average Price */}
                <div className="space-y-2">
                  <Label htmlFor="originalPrice" className="text-slate-700 dark:text-slate-300">
                    原始平均价格
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-7"
                      step="100"
                    />
                  </div>
                </div>

                {/* Current Market Price */}
                <div className="space-y-2">
                  <Label htmlFor="marketPrice" className="text-slate-700 dark:text-slate-300">
                    当前市场价格
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                    <Input
                      id="marketPrice"
                      type="number"
                      value={marketPrice}
                      onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-7"
                      step="100"
                    />
                  </div>
                </div>

                {/* Magic Slider - New Investment Amount */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-slate-700 dark:text-slate-300 text-lg font-semibold">
                      如果我增加...
                    </Label>
                    <span className="text-amber-400 font-bold text-xl">
                      {formatCurrency(newInvestment)}
                    </span>
                  </div>
                  <Slider
                    value={newInvestment}
                    onValueChange={setNewInvestment}
                    min={0}
                    max={100000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>$0</span>
                    <span>$100,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Results */}
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">计算结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">新增数量</p>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">{formatNumber(calculations.newQty)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">总数量</p>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">{formatNumber(calculations.totalQty)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">总成本</p>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">{formatCurrency(calculations.totalCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Right Column - Visualization */}
            <div className="space-y-6 flex flex-col">
            {/* Big Metric Cards */}
            <div className="grid grid-cols-1 gap-4">
              {/* New Average Price - Large Gold Card */}
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/20 dark:to-amber-600/20 border-amber-300 dark:border-amber-500/30 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <p className="text-slate-700 dark:text-slate-300 text-lg font-medium">新平均价格</p>
                  </div>
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-5xl md:text-6xl mb-2 drop-shadow-[0_0_8px_rgba(255,159,10,0.5)]">
                    {formatCurrency(calculations.newAvgPrice)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">您的新成本基础</p>
                </CardContent>
              </Card>

              {/* To Break Even - Green Badge */}
              <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 text-lg font-medium mb-2">回本需要</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        价格只需上涨{" "}
                        <span className="text-green-700 dark:text-green-300">
                          +{Math.abs(calculations.breakEvenMove).toFixed(2)}%
                        </span>
                      </p>
                    </div>
                    {calculations.breakEvenMove < 0 ? (
                      <TrendingDown className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  {isVictory && (
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/30 rounded-lg flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-green-700 dark:text-green-300 font-semibold">胜利在望！🚀</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dynamic Chart */}
            <Card className="bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">平均价格曲线</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="investment"
                      stroke="#64748b"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: number | undefined, name: string | undefined) => {
                        if (value === undefined) return ['', name || ''];
                        if (name === "marketPrice") {
                          return [formatCurrency(value), "市场价格"];
                        }
                        return [formatCurrency(value), "您的平均价格"];
                      }}
                      labelFormatter={(value) => `投资金额：${formatCurrency(value)}`}
                    />
                    {/* Market Price Line - Dotted */}
                    <Line
                      type="monotone"
                      dataKey="marketPrice"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="marketPrice"
                    />
                    {/* Your Average Price Line - Curve */}
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#FF9F0A"
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isCurrent = payload.investment === chartData[currentIndex]?.investment;
                        if (!isCurrent) return null;
                        return (
                          <g>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={8}
                              fill="#FF9F0A"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          </g>
                        );
                      }}
                      name="avgPrice"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-amber-500 dark:bg-amber-400"></div>
                    <span className="text-slate-600 dark:text-slate-400">您的平均价格</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-slate-400 dark:bg-slate-500 border-dashed border-t-2"></div>
                    <span className="text-slate-600 dark:text-slate-400">市场价格（底部）</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
