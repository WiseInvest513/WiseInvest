"use client";

import { useState, useMemo } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Scatter } from "recharts";
import { TrendingDown, TrendingUp, DollarSign, Lightbulb, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

// Calculate Impermanent Loss percentage
// Formula: IL% = (2 * sqrt(price_ratio) / (1 + price_ratio)) - 1
// Where price_ratio = Future Price / Entry Price
const calculateImpermanentLoss = (priceChangePercent: number): number => {
  // Convert percentage change to price ratio
  // e.g., +100% change = price_ratio of 2.0, -50% change = price_ratio of 0.5
  const priceRatio = 1 + priceChangePercent / 100;
  
  if (priceRatio <= 0) return -100; // Edge case
  
  // Calculate IL%
  const il = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;
  return il;
};

// Generate static data points for the reference curve
// Range: -90% to +500% (wider range for better visualization)
const generateCurveData = () => {
  const data: { priceChange: number; impermanentLoss: number }[] = [];
  
  // Generate from -90% to +500% with step of 5% for smooth curve
  for (let i = -90; i <= 500; i += 5) {
    const il = calculateImpermanentLoss(i);
    data.push({
      priceChange: i,
      impermanentLoss: il,
    });
  }
  
  return data;
};

export function ImpermanentLoss() {
  const [priceChange, setPriceChange] = useState(0); // Default: 0% (no change)
  const [initialInvestment, setInitialInvestment] = useState(1000);

  // Ensure priceChange is always a number
  const safePriceChange = typeof priceChange === 'number' ? priceChange : 0;

  // Calculate current IL
  const currentIL = useMemo(() => calculateImpermanentLoss(safePriceChange), [safePriceChange]);

  // Generate curve data
  const curveData = useMemo(() => generateCurveData(), []);

  // Calculate values
  const hodlValue = useMemo(() => {
    return initialInvestment * (1 + safePriceChange / 100);
  }, [initialInvestment, safePriceChange]);

  const lpValue = useMemo(() => {
    const ilMultiplier = 1 + currentIL / 100;
    return initialInvestment * (1 + safePriceChange / 100) * ilMultiplier;
  }, [initialInvestment, safePriceChange, currentIL]);

  const ilAmount = useMemo(() => {
    return lpValue - hodlValue;
  }, [lpValue, hodlValue]);

  // Find the current point on the curve
  const currentPoint = useMemo(() => {
    return {
      priceChange: safePriceChange,
      impermanentLoss: currentIL,
    };
  }, [safePriceChange, currentIL]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Wise Tip - Education Box */}
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 shadow-lg shadow-amber-500/10">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-amber-400 font-semibold text-base mb-1">Wise Tip</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  无常损失（Impermanent Loss）是持有代币在流动性池中与持有在钱包中的机会成本差异。
                  当价格偏离初始价格时，无常损失会增加。价格变化越大，无常损失越严重。
                  只有当价格回到初始价格时，无常损失才会消失（因此称为&ldquo;无常&rdquo;）。
                </p>
              </div>
            </div>
          </div>

          {/* Price Change Slider - Top Section */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="price-change" className="text-slate-300 text-base font-medium">
                  Token A 价格变化
                </Label>
                <span className="text-amber-400 font-bold text-2xl">
                  {safePriceChange > 0 ? "+" : ""}
                  {safePriceChange.toFixed(1)}%
                </span>
              </div>
              <Slider
                id="price-change"
                min={-90}
                max={500}
                step={0.5}
                value={safePriceChange}
                onValueChange={setPriceChange}
                className="slider-amber"
                style={{
                  background: `linear-gradient(to right, #334155 0%, #334155 ${((safePriceChange + 90) / (500 + 90)) * 100}%, #FF9F0A ${((safePriceChange + 90) / (500 + 90)) * 100}%, #FF9F0A 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>-90%</span>
                <span className="text-amber-400 font-semibold">0%</span>
                <span>+500%</span>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HODL Value */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-slate-300 text-base font-medium">如果持有 (HODL)</p>
              </div>
              <p className="text-green-400 font-bold text-3xl md:text-4xl mb-1">
                ${hodlValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 text-sm">
                初始: ${initialInvestment.toLocaleString()}
              </p>
            </div>

            {/* LP Value */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <p className="text-slate-300 text-base font-medium">如果提供流动性 (LP)</p>
              </div>
              <p className="text-slate-100 font-bold text-3xl md:text-4xl mb-1">
                ${lpValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 text-sm">
                初始: ${initialInvestment.toLocaleString()}
              </p>
            </div>

            {/* Impermanent Loss */}
            <div className={`bg-slate-900/40 backdrop-blur-xl border rounded-xl p-5 shadow-xl ${
              currentIL < 0
                ? "border-red-500/30"
                : "border-green-500/30"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-5 h-5 ${currentIL < 0 ? "text-red-400" : "text-green-400"}`} />
                <p className="text-slate-300 text-base font-medium">无常损失</p>
              </div>
              <p className={`font-bold text-3xl md:text-4xl mb-1 ${
                currentIL < 0 ? "text-red-400" : "text-green-400"
              }`}>
                {currentIL > 0 ? "+" : ""}
                {currentIL.toFixed(2)}%
              </p>
              <p className={`text-sm font-medium ${
                currentIL < 0 ? "text-red-400" : "text-green-400"
              }`}>
                ${ilAmount > 0 ? "+" : ""}
                {ilAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Visualization: Impermanent Loss Curve */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-6 shadow-xl">
            <h3 className="text-slate-300 font-semibold text-base mb-4">无常损失曲线</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={curveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    dataKey="priceChange"
                    domain={[-90, 500]}
                    stroke="#64748b"
                    fontSize={12}
                    tick={{ fill: "#cbd5e1" }}
                    tickFormatter={(value) => {
                      if (value === -90) return "-90%";
                      if (value === 0) return "0%";
                      if (value === 200) return "+200%";
                      if (value === 500) return "+500%";
                      return "";
                    }}
                    ticks={[-90, 0, 200, 500]}
                    label={{ value: "价格变化 (%)", position: "insideBottom", offset: -10, style: { textAnchor: "middle", fill: "#cbd5e1" } }}
                  />
                  <YAxis
                    type="number"
                    domain={[-60, 0]}
                    stroke="#64748b"
                    fontSize={12}
                    tick={{ fill: "#cbd5e1" }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    label={{ value: "无常损失 (%)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#cbd5e1" } }}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)}%`, "无常损失"] : ['', "无常损失"]}
                    labelFormatter={(label) => `价格变化: ${label > 0 ? "+" : ""}${label}%`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#cbd5e1",
                    }}
                    labelStyle={{ color: "#cbd5e1" }}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" opacity={0.5} />
                  <ReferenceLine x={0} stroke="#64748b" strokeDasharray="2 2" opacity={0.5} />
                  {/* Layer 1: Static Reference Curve - Fixed regardless of slider */}
                  <Line
                    type="monotone"
                    dataKey="impermanentLoss"
                    stroke="#525252"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  {/* Layer 2: Dynamic User Position - Large Glowing Amber Dot */}
                  <Scatter 
                    data={[currentPoint]} 
                    fill="#FF9F0A"
                    shape={(props: any) => {
                      const { cx, cy } = props;
                      if (!cx || !cy) return <g />;
                      return (
                        <g>
                          {/* Outer glow */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={14}
                            fill="#FF9F0A"
                            opacity={0.2}
                          />
                          {/* Middle glow */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={10}
                            fill="#FF9F0A"
                            opacity={0.4}
                          />
                          {/* Inner glow */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={8}
                            fill="#FF9F0A"
                            opacity={0.6}
                          />
                          {/* Main dot */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="#FF9F0A"
                            stroke="#0a0a0a"
                            strokeWidth={2}
                            filter="drop-shadow(0 0 8px rgba(255, 159, 10, 0.8))"
                          />
                        </g>
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Current Point Info */}
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">当前选择点</p>
                  <p className="text-lg font-bold text-amber-400">
                    价格变化: {safePriceChange > 0 ? "+" : ""}
                    {safePriceChange.toFixed(1)}% → 无常损失: {currentIL.toFixed(2)}%
                  </p>
                </div>
                {currentIL < 0 ? (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-green-400" />
                )}
              </div>
            </div>
          </div>

          {/* Initial Investment Input */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-5 shadow-xl">
            <Label htmlFor="investment" className="text-slate-300 text-base font-medium mb-3 block">
              初始投资金额 (USD)
            </Label>
            <Input
              id="investment"
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              placeholder="1000"
              min={0}
              className="bg-slate-800/70 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-amber-500/20 h-12 text-xl font-bold text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

