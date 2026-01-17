"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Skull, ShieldCheck, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type TradingMode = "long" | "short";

const MAINTENANCE_MARGIN_RATE = 0.005; // 0.5% default maintenance margin rate

interface CalculationResult {
  liquidationPrice: number;
  distanceToLiquidation: number; // Percentage
  riskLevel: "extreme" | "high" | "safe";
  isValid: boolean;
  errorMessage: string;
}

export function LiquidationCalculator() {
  const [mode, setMode] = useState<TradingMode>("long");
  const [entryPrice, setEntryPrice] = useState(50000);
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState(10000);

  const calculation = useMemo<CalculationResult>(() => {
    // Validation
    if (entryPrice <= 0) {
      return {
        liquidationPrice: 0,
        distanceToLiquidation: 0,
        riskLevel: "safe",
        isValid: false,
        errorMessage: "开仓价格必须大于 0",
      };
    }

    if (leverage < 1 || leverage > 125) {
      return {
        liquidationPrice: 0,
        distanceToLiquidation: 0,
        riskLevel: "safe",
        isValid: false,
        errorMessage: "杠杆倍数必须在 1x - 125x 之间",
      };
    }

    // Calculate liquidation price
    let liquidationPrice: number;

    if (mode === "long") {
      // Long Liquidation: EntryPrice * (1 - (1 / Leverage) + MaintenanceMarginRate)
      liquidationPrice = entryPrice * (1 - (1 / leverage) + MAINTENANCE_MARGIN_RATE);
    } else {
      // Short Liquidation: EntryPrice * (1 + (1 / Leverage) - MaintenanceMarginRate)
      liquidationPrice = entryPrice * (1 + (1 / leverage) - MAINTENANCE_MARGIN_RATE);
    }

    // Calculate distance to liquidation (percentage)
    const priceDiff = Math.abs(entryPrice - liquidationPrice);
    const distanceToLiquidation = (priceDiff / entryPrice) * 100;

    // Determine risk level
    let riskLevel: "extreme" | "high" | "safe";
    if (distanceToLiquidation < 5) {
      riskLevel = "extreme";
    } else if (distanceToLiquidation < 20) {
      riskLevel = "high";
    } else {
      riskLevel = "safe";
    }

    return {
      liquidationPrice,
      distanceToLiquidation,
      riskLevel,
      isValid: true,
      errorMessage: "",
    };
  }, [mode, entryPrice, leverage]);

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const modeColor = mode === "long" ? "green" : "red";
  const modeBg = mode === "long"
    ? "bg-green-50 dark:bg-green-900/20"
    : "bg-red-50 dark:bg-red-900/20";
  const modeBorder = mode === "long"
    ? "border-green-200 dark:border-green-800"
    : "border-red-200 dark:border-red-800";

  const riskColors = {
    extreme: {
      bg: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500",
      badge: "bg-red-500 text-white",
    },
    high: {
      bg: "bg-orange-500",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500",
      badge: "bg-orange-500 text-white",
    },
    safe: {
      bg: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500",
      badge: "bg-green-500 text-white",
    },
  };

  const riskConfig = riskColors[calculation.riskLevel];

  return (
    <div className="space-y-6">
      {/* Trading Mode Tabs */}
      <Card className={`${modeBg} ${modeBorder} border-2`}>
        <CardContent className="p-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as TradingMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="long" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                做多 (Long)
              </TabsTrigger>
              <TabsTrigger value="short" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                做空 (Short)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                交易参数
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entry Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="entry" className="flex items-center gap-2">
                    {mode === "long" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    开仓价格
                  </Label>
                  <span className={`text-xl font-bold ${mode === "long" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatNumber(entryPrice, 2)}
                  </span>
                </div>
                <Input
                  id="entry"
                  type="number"
                  min={0}
                  step={0.01}
                  value={entryPrice}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setEntryPrice(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Leverage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="leverage" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    杠杆倍数
                  </Label>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {leverage}x
                  </span>
                </div>
                <div className="space-y-2">
                  <Slider
                    id="leverage"
                    min={1}
                    max={125}
                    step={1}
                    value={leverage}
                    onValueChange={(value) => setLeverage(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1x</span>
                    <span>125x</span>
                  </div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={125}
                  step={1}
                  value={leverage}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(125, parseInt(e.target.value) || 1));
                    setLeverage(val);
                  }}
                  className="text-center font-semibold"
                />
              </div>

              {/* Margin (Optional Display) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="margin" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    保证金 (CNY)
                  </Label>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatCurrency(margin)}
                  </span>
                </div>
                <Input
                  id="margin"
                  type="number"
                  min={0}
                  step={1000}
                  value={margin}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setMargin(val);
                  }}
                  className="text-center font-semibold"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  💡 保证金用于计算仓位价值，不影响爆仓价格计算
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <Card className={`${modeBg} ${modeBorder} border-2 shadow-xl`}>
            <CardContent className="p-8">
              {calculation.isValid ? (
                <div className="space-y-6">
                  {/* Main Result: Liquidation Price */}
                  <div className="text-center space-y-2">
                    <p className="text-sm uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                      爆仓价格
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <Skull className={`h-8 w-8 ${riskConfig.text}`} />
                      <span className={`text-6xl md:text-7xl font-black ${riskConfig.text} drop-shadow-lg`}>
                        {formatNumber(calculation.liquidationPrice, 2)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {mode === "long" 
                        ? "价格跌至此价位将被强制平仓" 
                        : "价格涨至此价位将被强制平仓"}
                    </p>
                  </div>

                  {/* Risk Level Badge */}
                  <div className="flex justify-center">
                    <Badge className={`${riskConfig.badge} px-4 py-2 text-base font-bold ${
                      calculation.riskLevel === "extreme" ? "animate-pulse" : ""
                    }`}>
                      {calculation.riskLevel === "extreme" && (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      )}
                      {calculation.riskLevel === "extreme" && "极度危险"}
                      {calculation.riskLevel === "high" && "高风险"}
                      {calculation.riskLevel === "safe" && "相对安全"}
                    </Badge>
                  </div>

                  {/* Distance to Liquidation */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          距离爆仓
                        </span>
                        <span className={`text-2xl font-black ${riskConfig.text}`}>
                          {formatNumber(calculation.distanceToLiquidation, 2)}%
                        </span>
                      </div>

                      {/* Visual Meter */}
                      <div className="relative h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`absolute left-0 top-0 h-full ${riskConfig.bg} transition-all duration-500 flex items-center justify-end pr-2`}
                          style={{
                            width: `${Math.min(100, (calculation.distanceToLiquidation / 20) * 100)}%`,
                          }}
                        >
                          {calculation.distanceToLiquidation < 20 && (
                            <span className="text-xs font-bold text-white">
                              {formatNumber(calculation.distanceToLiquidation, 1)}%
                            </span>
                          )}
                        </div>
                        {calculation.distanceToLiquidation >= 20 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {formatNumber(calculation.distanceToLiquidation, 1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Price Range Display */}
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className={`p-4 rounded-xl border-2 ${
                          mode === "long" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            开仓价格
                          </p>
                          <p className={`text-xl font-black ${
                            mode === "long" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {formatNumber(entryPrice, 2)}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border-2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                            爆仓价格
                          </p>
                          <p className="text-xl font-black text-slate-900 dark:text-slate-50">
                            {formatNumber(calculation.liquidationPrice, 2)}
                          </p>
                        </div>
                      </div>

                      {/* Price Difference */}
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          💡 <strong>价格差：</strong>
                        </p>
                        <p className="text-sm font-mono text-slate-900 dark:text-slate-50">
                          {formatNumber(Math.abs(entryPrice - calculation.liquidationPrice), 2)} (
                          {formatNumber(calculation.distanceToLiquidation, 2)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Message for Extreme Risk */}
                  {calculation.riskLevel === "extreme" && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                            极度危险警告
                          </p>
                          <p className="text-xs text-red-800 dark:text-red-200">
                            您的仓位距离爆仓仅 {formatNumber(calculation.distanceToLiquidation, 2)}%，任何小幅波动都可能导致强制平仓。强烈建议降低杠杆或增加保证金。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    参数错误
                  </h3>
                  <p className="text-red-600 dark:text-red-400">
                    {calculation.errorMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

