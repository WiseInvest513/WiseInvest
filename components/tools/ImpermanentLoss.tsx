"use client";

import { useState, useMemo } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter } from "recharts";
import { TrendingDown, TrendingUp, DollarSign, Lightbulb, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

/**
 * Calculate Impermanent Loss for a 50/50 liquidity pool
 * Formula: IL% = 2 * (sqrt(priceRatio) / (1 + priceRatio)) - 1
 * Where priceRatio = (1 + priceChangeA/100) / (1 + priceChangeB/100)
 */
const calculateImpermanentLoss = (priceChangeA: number, priceChangeB: number): number => {
  // Calculate price ratio
  const priceA = 1 + priceChangeA / 100;
  const priceB = 1 + priceChangeB / 100;
  
  // Avoid division by zero
  if (priceB <= 0) return -100;
  
  const priceRatio = priceA / priceB;
  
  // Avoid invalid sqrt
  if (priceRatio <= 0) return -100;
  
  // Calculate IL% using standard 50/50 pool formula
  const ilPercent = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;
  
  return ilPercent;
};

/**
 * Generate curve data for visualization
 * X-axis: Price Ratio Change (priceRatio - 1) * 100
 * Y-axis: Impermanent Loss %
 * 
 * The curve shows IL for different price ratios when Token B is fixed at 0% change
 * This provides a reference curve. The actual IL depends on both tokens' price changes.
 */
const generateCurveData = () => {
  const data: { priceRatioChange: number; impermanentLoss: number }[] = [];
  
  // Generate price ratios from 0.1 to 10 (equivalent to -90% to +900% price ratio change)
  // This represents the price ratio when Token B is fixed (0% change)
  for (let ratio = 0.1; ratio <= 10; ratio += 0.05) {
    // For reference curve: assume Token B is fixed (0% change)
    // So priceChangeA corresponds to the ratio, priceChangeB = 0
    const priceChangeA = (ratio - 1) * 100;
    const priceChangeB = 0;
    
    const il = calculateImpermanentLoss(priceChangeA, priceChangeB);
    const priceRatioChange = (ratio - 1) * 100; // Convert to percentage change
    
    data.push({
      priceRatioChange,
      impermanentLoss: il,
    });
  }
  
  return data;
};

export function ImpermanentLoss() {
  // State Management
  const [initialInvestment, setInitialInvestment] = useState(1000);
  const [priceChangeA, setPriceChangeA] = useState(0); // Token A price change (%)
  const [priceChangeB, setPriceChangeB] = useState(0); // Token B price change (%)

  // Ensure values are numbers
  const safePriceChangeA = typeof priceChangeA === 'number' ? priceChangeA : 0;
  const safePriceChangeB = typeof priceChangeB === 'number' ? priceChangeB : 0;
  const safeInvestment = typeof initialInvestment === 'number' && initialInvestment > 0 ? initialInvestment : 1000;

  // Calculate Impermanent Loss %
  const impermanentLossPercent = useMemo(() => {
    return calculateImpermanentLoss(safePriceChangeA, safePriceChangeB);
  }, [safePriceChangeA, safePriceChangeB]);

  // Calculate HODL Value (if holding tokens separately)
  const holdValue = useMemo(() => {
    return safeInvestment * (0.5 * (1 + safePriceChangeA / 100) + 0.5 * (1 + safePriceChangeB / 100));
  }, [safeInvestment, safePriceChangeA, safePriceChangeB]);

  // Calculate LP Value (value in liquidity pool)
  const lpValue = useMemo(() => {
    return holdValue * (1 + impermanentLossPercent / 100);
  }, [holdValue, impermanentLossPercent]);

  // Calculate Loss Value (difference)
  const lossValue = useMemo(() => {
    return lpValue - holdValue;
  }, [lpValue, holdValue]);

  // Calculate Price Ratio for chart
  const priceRatio = useMemo(() => {
    const priceA = 1 + safePriceChangeA / 100;
    const priceB = 1 + safePriceChangeB / 100;
    return priceB > 0 ? priceA / priceB : 1;
  }, [safePriceChangeA, safePriceChangeB]);

  const priceRatioChange = useMemo(() => {
    return (priceRatio - 1) * 100;
  }, [priceRatio]);

  // Generate curve data
  const curveData = useMemo(() => generateCurveData(), []);

  // Find current point on curve
  // Note: The reference curve assumes Token B is fixed at 0%
  // The current point shows the actual IL based on both tokens' price changes
  const currentPoint = useMemo(() => {
    // Ensure values are within chart domain
    const x = Math.max(-90, Math.min(900, priceRatioChange));
    const y = Math.max(-60, Math.min(0, impermanentLossPercent));
    
    return {
      priceRatioChange: x,
      impermanentLoss: y,
    };
  }, [priceRatioChange, impermanentLossPercent]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Education Box */}
          <Card className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-amber-400 font-semibold text-base mb-1">Wise Tip</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    无常损失（Impermanent Loss）是流动性提供者在价格偏离初始价格时面临的损失。
                    在 50/50 流动性池中，当两种代币的价格变化不同时，会产生无常损失。
                    只有当价格比率回到初始状态时，无常损失才会消失（因此称为"无常"）。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initial Investment Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">初始投资金额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  value={safeInvestment}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setInitialInvestment(value);
                    }
                  }}
                  placeholder="1000"
                  min={0}
                  step={100}
                  className="text-xl font-semibold"
                />
                <span className="text-muted-foreground">USD</span>
              </div>
            </CardContent>
          </Card>

          {/* Token A Price Change Control */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Token A 价格变化</CardTitle>
                <span className="text-2xl font-bold text-primary">
                  {safePriceChangeA > 0 ? "+" : ""}
                  {safePriceChangeA.toFixed(1)}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  min={-90}
                  max={500}
                  step={0.5}
                  value={safePriceChangeA}
                  onValueChange={(value) => setPriceChangeA(value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={safePriceChangeA}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= -90 && value <= 500) {
                      setPriceChangeA(value);
                    }
                  }}
                  min={-90}
                  max={500}
                  step={0.5}
                  className="w-24 text-center"
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-90%</span>
                <span className="text-primary font-semibold">0%</span>
                <span>+500%</span>
              </div>
            </CardContent>
          </Card>

          {/* Token B Price Change Control */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Token B 价格变化</CardTitle>
                <span className="text-2xl font-bold text-primary">
                  {safePriceChangeB > 0 ? "+" : ""}
                  {safePriceChangeB.toFixed(1)}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Slider
                  min={-90}
                  max={500}
                  step={0.5}
                  value={safePriceChangeB}
                  onValueChange={(value) => setPriceChangeB(value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={safePriceChangeB}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= -90 && value <= 500) {
                      setPriceChangeB(value);
                    }
                  }}
                  min={-90}
                  max={500}
                  step={0.5}
                  className="w-24 text-center"
                />
                <span className="text-muted-foreground w-8">%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-90%</span>
                <span className="text-primary font-semibold">0%</span>
                <span>+500%</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HODL Value Card */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-base">如果持有 (HODL)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-green-500 font-bold text-3xl md:text-4xl mb-2">
                  ${holdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-muted-foreground text-sm">
                  初始: ${safeInvestment.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* LP Value Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">如果提供流动性 (LP)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-3xl md:text-4xl mb-2">
                  ${lpValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-muted-foreground text-sm">
                  初始: ${safeInvestment.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Impermanent Loss Card */}
            <Card className={lossValue < 0 ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${lossValue < 0 ? "text-red-500" : "text-green-500"}`} />
                  <CardTitle className="text-base">无常损失</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`font-bold text-3xl md:text-4xl mb-2 ${lossValue < 0 ? "text-red-500" : "text-green-500"}`}>
                  {impermanentLossPercent > 0 ? "+" : ""}
                  {impermanentLossPercent.toFixed(2)}%
                </p>
                <p className={`text-sm font-medium ${lossValue < 0 ? "text-red-500" : "text-green-500"}`}>
                  {lossValue > 0 ? "+" : ""}
                  ${lossValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Impermanent Loss Curve Visualization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">无常损失曲线</CardTitle>
                <p className="text-xs text-muted-foreground">
                  参考曲线：Token B 固定为 0% 时的 IL 曲线
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={curveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      dataKey="priceRatioChange"
                      domain={[-90, 900]}
                      className="stroke-muted-foreground"
                      fontSize={12}
                      tick={{ fill: "currentColor" }}
                      tickFormatter={(value) => {
                        if (value === -90) return "-90%";
                        if (value === 0) return "0%";
                        if (value === 200) return "+200%";
                        if (value === 500) return "+500%";
                        if (value === 900) return "+900%";
                        return "";
                      }}
                      ticks={[-90, 0, 200, 500, 900]}
                      label={{ 
                        value: "价格比率变化 (%)", 
                        position: "insideBottom", 
                        offset: -10, 
                        style: { textAnchor: "middle", fill: "currentColor" } 
                      }}
                    />
                    <YAxis
                      type="number"
                      domain={[-60, 0]}
                      className="stroke-muted-foreground"
                      fontSize={12}
                      tick={{ fill: "currentColor" }}
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      label={{ 
                        value: "无常损失 (%)", 
                        angle: -90, 
                        position: "insideLeft", 
                        style: { textAnchor: "middle", fill: "currentColor" } 
                      }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => 
                        value !== undefined ? [`${value.toFixed(2)}%`, "无常损失"] : ['', "无常损失"]
                      }
                      labelFormatter={(label) => `价格比率变化: ${label > 0 ? "+" : ""}${label.toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <ReferenceLine y={0} className="stroke-muted-foreground" strokeDasharray="2 2" opacity={0.5} />
                    <ReferenceLine x={0} className="stroke-muted-foreground" strokeDasharray="2 2" opacity={0.5} />
                    {/* Reference Curve */}
                    <Line
                      type="monotone"
                      dataKey="impermanentLoss"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                    {/* Current Point - Dynamic marker that moves with user input */}
                    <Scatter 
                      data={[currentPoint]}
                      dataKey="impermanentLoss"
                      name="当前点"
                      fill="hsl(var(--primary))"
                      xAxisId={0}
                      yAxisId={0}
                      shape={(props: any) => {
                        const { cx, cy, payload } = props;
                        // Only render if coordinates are valid
                        if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) {
                          return <g />;
                        }
                        return (
                          <g>
                            {/* Outer glow */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={14}
                              fill="hsl(var(--primary))"
                              opacity={0.2}
                            />
                            {/* Middle glow */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={10}
                              fill="hsl(var(--primary))"
                              opacity={0.4}
                            />
                            {/* Inner glow */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={8}
                              fill="hsl(var(--primary))"
                              opacity={0.6}
                            />
                            {/* Main dot */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill="hsl(var(--primary))"
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          </g>
                        );
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Current Point Info */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">当前选择点</p>
                    <p className="text-lg font-bold text-primary">
                      价格比率变化: {priceRatioChange > 0 ? "+" : ""}
                      {priceRatioChange.toFixed(1)}% → 无常损失: {impermanentLossPercent.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Token A: {safePriceChangeA > 0 ? "+" : ""}{safePriceChangeA.toFixed(1)}% | 
                      Token B: {safePriceChangeB > 0 ? "+" : ""}{safePriceChangeB.toFixed(1)}%
                    </p>
                  </div>
                  {lossValue < 0 ? (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
