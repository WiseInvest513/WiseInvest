"use client";

import { useState, useMemo } from "react";
import { Percent, TrendingUp, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CompoundingFrequency = {
  label: string;
  value: number;
  description: string;
};

const frequencies: CompoundingFrequency[] = [
  { label: "每日复利", value: 365, description: "DeFi/Crypto 常见" },
  { label: "每周复利", value: 52, description: "Weekly" },
  { label: "每月复利", value: 12, description: "银行常见" },
  { label: "每年复利", value: 1, description: "Yearly" },
];

// Calculate APY from APR
// Formula: APY = (1 + r/n)^n - 1
// Where r = APR (as decimal), n = compounding frequency
const calculateAPY = (apr: number, frequency: number): number => {
  if (apr <= 0 || frequency <= 0) return 0;
  
  const r = apr / 100; // Convert percentage to decimal
  const apy = (Math.pow(1 + r / frequency, frequency) - 1) * 100;
  
  return apy;
};

export function ApyCalculator() {
  const [apr, setApr] = useState(10); // Default: 10% APR
  const [selectedFrequency, setSelectedFrequency] = useState(365); // Default: Daily

  // Calculate APY
  const apy = useMemo(() => {
    return calculateAPY(apr, selectedFrequency);
  }, [apr, selectedFrequency]);

  // Calculate hidden profit (difference between APY and APR)
  const hiddenProfit = useMemo(() => {
    return apy - apr;
  }, [apy, apr]);

  // Get selected frequency label
  const selectedFrequencyLabel = frequencies.find(
    (f) => f.value === selectedFrequency
  )?.label || "每日复利";

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            计算参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* APR Input */}
          <div className="space-y-2">
            <Label htmlFor="apr">APR 年化利率 (%)</Label>
            <div className="relative">
              <Input
                id="apr"
                type="number"
                value={apr}
                onChange={(e) => setApr(Number(e.target.value))}
                placeholder="10"
                min={0}
                max={1000}
                step={0.1}
                className="pr-8"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500">
              输入年化利率（APR），例如：10 表示 10%
            </p>
          </div>

          {/* Compounding Frequency Selection */}
          <div className="space-y-2">
            <Label>复利频率</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {frequencies.map((freq) => {
                const isSelected = selectedFrequency === freq.value;
                return (
                  <button
                    key={freq.value}
                    onClick={() => setSelectedFrequency(freq.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-yellow-400 bg-yellow-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">
                      {freq.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {freq.description}
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-xs font-medium text-yellow-700">
                        ✓ 已选择
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            计算结果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* APY Display - HUGE */}
          <div className="text-center py-8">
            <p className="text-sm text-slate-600 mb-2 uppercase tracking-wider">
              实际年化收益率 (APY)
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl font-black text-yellow-500">
                {apy.toFixed(2)}
              </span>
              <span className="text-3xl font-bold text-slate-700">%</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              基于 {selectedFrequencyLabel} 计算
            </p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* APR */}
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">标称利率 (APR)</p>
              <p className="text-2xl font-bold text-slate-900">
                {apr.toFixed(2)}%
              </p>
            </div>

            {/* Hidden Profit */}
            <div className={`p-4 rounded-lg border-2 ${
              hiddenProfit > 0
                ? "bg-green-50 border-green-200"
                : "bg-slate-50 border-slate-200"
            }`}>
              <p className="text-sm text-slate-600 mb-1">复利额外收益</p>
              <p className={`text-2xl font-bold ${
                hiddenProfit > 0 ? "text-green-600" : "text-slate-600"
              }`}>
                {hiddenProfit > 0 ? "+" : ""}
                {hiddenProfit.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Explanation */}
          {hiddenProfit > 0 && (
            <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="text-sm text-yellow-900 leading-relaxed">
                <strong>💡 复利的力量：</strong>
                由于复利效应，您实际获得的年化收益率（APY）为{" "}
                <strong className="text-yellow-700">{apy.toFixed(2)}%</strong>，
                比标称利率（APR）{" "}
                <strong className="text-yellow-700">{apr.toFixed(2)}%</strong> 高出{" "}
                <strong className="text-yellow-700">{hiddenProfit.toFixed(2)}%</strong>！
                复利频率越高，实际收益越大。
              </p>
            </div>
          )}

          {/* Formula Display */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-mono text-slate-600 mb-2">
              计算公式: APY = (1 + APR/n)ⁿ - 1
            </p>
            <p className="text-xs text-slate-500">
              其中 n = {selectedFrequency}（{selectedFrequencyLabel}）
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

